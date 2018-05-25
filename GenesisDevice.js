var _ = require('lodash')
  , fmt = require('util').format
  ;


function GenesisDevice() {
  this.variables = {};
  this.resources = {};
  this.providers = {};
  this.data = {};
  this.outputs = {};
  this.backends = {};
}


GenesisDevice.prototype.addVariable = function(name, defn, comment) {
  if (name in this.variables) {
    throw new Error('Already added a variable called "%s".', name);
  }
  this.variables[name] = {
    definition: defn,
    name: name,
    comment: comment,
  };
};


GenesisDevice.prototype.addResource = function(type, name, defn, comment) {
  this.resources[type] = this.resources[type] || {};
  if (name in this.resources[type]) {
    throw new Error(fmt(
        'Already added a "%s" resource called "%s".', type, name));
  }
  this.resources[type][name] = {
    type: type,
    definition: defn,
    name: name,
    comment: comment,
  };
};


GenesisDevice.prototype.addProvider = function(name, defn, comment) {
  if (name in this.providers) {
    throw new Error(fmt(
        'Already added a provider called "%s".', name));
  }
  this.providers[name] = {
    definition: defn,
    name: name,
    comment: comment,
  };
};


GenesisDevice.prototype.addData = function(type, name, definition, comment) {
  if (name in this.data) {
    throw new Error(fmt(
        'Already added data called "%s".', name));
  }
  this.data[name] = {
    definition,
    name,
    comment,
    type,
  };
};


GenesisDevice.prototype.addOutput = function(name, defn, comment) {
  if (name in this.outputs) {
    throw new Error(fmt(
        'Already added an output called "%s".', name));
  }
  this.outputs[name] = {
    definition: defn,
    name: name,
    comment: comment,
  };
};


GenesisDevice.prototype.addBackend = function(name, defn, comment) {
  if (name in this.backends) {
    throw new Error(fmt(
        'Already added a backend called "%s".', name));
  }
  this.backends[name] = {
    definition: defn,
    name: name,
    comment: comment,
  };
};


GenesisDevice.prototype.toString = function() {
  //
  // Render variables.
  //
  var variablesStr = _.map(this.variables, function(varDef, varName) {
    var commentStr = renderComment(varDef.comment, 0);
    var defnStr = renderDefinition(varDef.definition, 2).join('\n');
    var varStr = _.filter([
      commentStr,
      fmt('variable "%s" {', varName),
      defnStr,
      '}',
    ]).join('\n') + '\n\n';
    return varStr;
  }).join('\n');

  //
  // Render data.
  //
  var dataStr = _.map(this.data, function(dataDef, dataName) {
    var commentStr = renderComment(dataDef.comment, 0);
    var defnStr = renderDefinition(dataDef.definition, 2).join('\n');
    return _.filter([
      commentStr,
      fmt('data "%s" "%s" {', dataDef.type, dataName),
      defnStr,
      '}',
    ]).join('\n') + '\n\n';
  }).join('\n');

  //
  // Render providers.
  //
  var providersStr = _.map(this.providers, function(provDef, provName) {
    var commentStr = renderComment(provDef.comment, 0);
    var defnStr = renderDefinition(provDef.definition, 2).join('\n');
    return _.filter([
      commentStr,
      fmt('provider "%s" {', provName),
      defnStr,
      '}',
    ]).join('\n') + '\n\n';
  }).join('\n');

  //
  // Render resources.
  //
  var resourcesStr = _.map(this.resources, function(typeMap, typeName) {
    return _.map(typeMap, function(resource, resourceName) {
      var commentStr = renderComment(resource.comment, 0);
      var defnStr = renderDefinition(resource.definition, 2).join('\n');
      return _.filter([
        commentStr,
        fmt('resource "%s" "%s" {', typeName, resourceName),
        defnStr,
        '}',
      ]).join('\n') + '\n\n';
    }).join('\n');
  }).join('\n');

  //
  // Render outputs.
  //
  var outputsStr = _.map(this.outputs, function(outDef, outName) {
    var commentStr = renderComment(outDef.comment, 0);
    var defnStr = renderDefinition(outDef.definition, 2).join('\n');
    return _.filter([
      commentStr,
      fmt('output "%s" {', outName),
      defnStr,
      '}',
    ]).join('\n') + '\n\n';
  }).join('\n');

  //
  // Render backends.
  //
  var backendsStr = _.map(this.backends, function(backDef, backName) {
    var commentStr = renderComment(backDef.comment, 0);
    var defnStr = renderDefinition(backDef.definition, 4).join('\n');
    return _.filter([
      commentStr,
      'terraform {',
      fmt('  backend "%s" {', backName),
      defnStr,
      '  }',
      '}',
    ]).join('\n') + '\n\n';
  }).join('\n')


  return [
    variablesStr,
    backendsStr,
    providersStr,
    dataStr,
    resourcesStr,
    outputsStr,
  ].join('\n') + '\n';
};


function renderComment(comment, indent) {
  indent = indent || 0;
  var indentStr = Array(indent + 1).join(' ');
  var commentStr = _.map(comment, function(line) {
    return indentStr + '# ' + line;
  }).join('\n');
  if (commentStr) {
    commentStr = fmt(indentStr + '#\n%s\n' + indentStr + '#', commentStr);
  }
  return commentStr;
}


function renderDefinition(defn, indent) {
  indent = indent || 0;
  var indentStr = Array(indent + 1).join(' ');
  var longestKeyLength = _.max(_.map(_.keys(defn), _.size)) || 0;
  return _.map(defn, function(val, key) {
    if (key === '$inlines') {
      return renderInlines(val);
    } else {
      var lhs = indentStr + _.padEnd(key, longestKeyLength) + ' = ';
      var rhs = renderDefinitionRhs(val, indent, key);
      return lhs + rhs;
    }
  });

  function renderInlines(val) {
    return _.map(val, function(pair) {
      return [
        '',
        indentStr + pair[0] + ' {',
        renderDefinition(pair[1], indent + 2).join('\n'),
        indentStr + '}',
      ].join('\n');
    }).join('\n');
  }

  function renderDefinitionRhs(val, indent) {
    if (_.isUndefined(val)) {
      throw new Error('Undefined value.');
    }
    if (_.isBoolean(val)) {
      return val.toString();
    }
    if (_.isInteger(val)) {
      return val;
    }
    if (_.isString(val)) {
      return fmt('"%s"', val.replace(/"/gm, '\\"'));
    }
    if (_.isArray(val)) {
      return '[' + _.map(val, function(elem) {
        return fmt('"%s"', elem.replace(/"/gm, '\\"'));
      }).join(', ') + ']';
    }
    if (_.isObject(val)) {
      var rhsLines = renderDefinition(val, indent + 2);
      var rhsStr = rhsLines.join('\n');
      return '{\n' + rhsStr + '\n' + indentStr + '}';
    }
  }
}


module.exports = GenesisDevice;
