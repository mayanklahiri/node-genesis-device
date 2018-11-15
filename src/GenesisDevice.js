const {keys, map, orderBy, filter} = require('lodash');
const {renderComment, renderDefinition} = require('./HCL');

/**
 * Javascript representation of a Terraform source file that can be used to generate
 * a human-readable Terraform source file.
 */
class GenesisDevice {
  /**
   * @param {?string} outputHeader Optional text to add to the top of generated
   * source files (e.g., auto-generation warnings).
   */
  constructor(outputHeader) {
    this.variables = {};
    this.resources = {};
    this.providers = {};
    this.data = {};
    this.outputs = {};
    this.locals = {};
    this.outputHeader = outputHeader || '';
  }

  /**
   * Adds a Terraform variable to the source tree.
   * @param {string} name Name of variable.
   * @param {object} definition Variable definition fields.
   * @param {?string} comment Optional comment to add to generated code.
   */
  addVariable(name, definition, comment) {
    const {variables} = this;
    if (name in variables) {
      throw new Error(`Already added variable "${name}".`);
    }
    variables[name] = {
      name,
      definition,
      comment,
    };
  }

  /**
   * Adds a Terraform resource to the source tree.
   * @param {string} type Resource type.
   * @param {string} name Name of resource.
   * @param {object} definition Resource definition fields.
   * @param {?string} comment Optional comment to add to generated code.
   */
  addResource(type, name, definition, comment) {
    const {resources} = this;
    resources[type] = resources[type] || {};
    if (name in resources[type]) {
      throw new Error(`Already added a ${type} resource called "${name}".`);
    }
    resources[type][name] = {
      type,
      name,
      definition,
      comment,
    };
  }

  /**
   * Adds a Terraform provider section to the source tree.
   * @param {string} name Name of provider.
   * @param {object} definition Provider definition fields.
   * @param {?string} comment Optional comment to add to generated code.
   */
  addProvider(name, definition, comment) {
    const {providers} = this;
    if (name in providers) {
      throw new Error(`Already added a provider resource called "${name}".`);
    }
    providers[name] = {
      name,
      definition,
      comment,
    };
  }

  /**
   * Adds a data resource to the source tree.
   * @param {string} type Resource type.
   * @param {string} name Name of data resource.
   * @param {object} definition Data resource definition fields.
   * @param {?string} comment Optional comment to add to generated code.
   */
  addData(type, name, definition, comment) {
    const {data} = this;
    data[type] = data[type] || {};
    if (name in data[type]) {
      throw new Error(`Already added a ${type} data resource called "${name}".`);
    }
    data[type][name] = {
      name,
      definition,
      comment,
    };
  }

  /**
   * Adds an output resource to the source tree.
   * @param {string} name Name of output resource.
   * @param {object} definition Output resource definition fields.
   * @param {?string} comment Optional comment to add to generated code.
   */
  addOutput(name, definition, comment) {
    const {outputs} = this;
    if (name in outputs) {
      throw new Error(`Already added an output resource called "${name}".`);
    }
    outputs[name] = {
      definition,
      name,
      comment,
    };
  }

  /**
   * Add a local resource to the source tree.
   * @param {string} name Name of localresource.
   * @param {object} definition Localresource definition fields.
   * @param {?string} comment Optional comment to add to generated code.
   */
  addLocal(name, definition, comment) {
    const {locals} = this;
    if (name in locals) {
      throw new Error(`Already added a local resource called "${name}".`);
    }
    locals[name] = {
      definition,
      name,
      comment,
    };
  }

  /**
   * Terraform generation function.
   * @return {string} Terraform source generated from internal representation.
   */
  toString() {
    return filter([
      this.outputHeader,
      this.renderProviders(),
      this.renderVariables(),
      this.renderData(),
      this.renderResources(),
      this.renderOutputs(),
    ]).join('\n');
  }

  /**
   * Renders variables.
   * @private
   * @return {string} Rendered representation of variables.
   */
  renderVariables() {
    const {variables} = this;
    return this.baseRenderUntyped('variable', variables);
  }

  /**
   * Renders providers.
   * @private
   * @return {string} Rendered representation of providers.
   */
  renderProviders() {
    const {providers} = this;
    return this.baseRenderUntyped('provider', providers);
  }

  /**
   * Renders outputs.
   * @private
   * @return {string} Rendered representation of outputs.
   */
  renderOutputs() {
    const {outputs} = this;
    return this.baseRenderUntyped('output', outputs);
  }

  /**
   * Renders untyped resources, like variables, outputs, and providers.
   * @private
   * @param {string} sectionType
   * @param {object} valueMap
   * @return {string} Rendered representation.
   */
  baseRenderUntyped(sectionType, valueMap) {
    const order = orderBy(keys(valueMap));
    return map(order, (key) => {
      const value = valueMap[key];
      const commentStr = renderComment(value.comment);
      const defnStr = renderDefinition(value.definition, 2);
      return filter([commentStr, `${sectionType} "${key}" {\n${defnStr}\n}\n`]).join('\n');
    }).join('\n');
  }

  /**
   * Renders data.
   * @private
   * @return {string} Rendered representation of data resources.
   */
  renderData() {
    const {data} = this;
    return this.baseRenderTyped('data', data);
  }

  /**
   * Renders resources.
   * @private
   * @return {string} Rendered representation of resources.
   */
  renderResources() {
    const {resources} = this;
    return this.baseRenderTyped('resource', resources);
  }

  /**
   * Renders typed resources, like resources and data.
   * @private
   * @param {string} sectionType
   * @param {object} typedValueMap
   * @return {string} Rendered representation.
   */
  baseRenderTyped(sectionType, typedValueMap) {
    const typeOrder = orderBy(keys(typedValueMap));
    return map(typeOrder, (resourceType) => {
      const order = orderBy(keys(typedValueMap[resourceType]));
      return map(order, (resourceName) => {
        const value = typedValueMap[resourceType][resourceName];
        const commentStr = renderComment(value.comment);
        const defnStr = renderDefinition(value.definition, 2);
        return filter([commentStr, `${sectionType} "${resourceType}" "${resourceName}" {\n${defnStr}\n}\n`]).join('\n');
      }).join('\n');
    }).join('\n');
  }
}

module.exports = GenesisDevice;
