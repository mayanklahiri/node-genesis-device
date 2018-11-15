/**
 * Utility functions for dealing with Hashicorp Configuration Language 1.x;
 */

const {
  keys,
  map,
  max,
  first,
  filter,
  isUndefined,
  isBoolean,
  isObject,
  isInteger,
  isString,
  isArray,
  orderBy,
  padEnd,
  size,
} = require('lodash');

/**
 * @param {?string} comment Comment string to format.
 * @param {?number} indent Indentation for comment.
 * @return {string} Formatted comment.
 */
exports.renderComment = function renderComment(comment, indent) {
  indent = indent || 0;
  const indentStr = Array(indent + 1).join(' ');
  if (!comment) return null;
  if (!isArray(comment)) {
    comment = [comment];
  }
  let commentStr = map(comment, (line) => `${indentStr}# ${line}`).join('\n');
  if (commentStr) {
    commentStr = `#
${commentStr}
#`;
  }
  return commentStr;
};

exports.renderDefinition = function renderDefinition(defn, indent) {
  indent = indent || 0;
  const indentStr = Array(indent + 1).join(' ');
  const longestKeyLength = max(map(keys(defn), size)) || 0;
  let keyOrder = orderBy(keys(defn));
  if (defn['$inlines']) {
    keyOrder = filter(keyOrder, (key) => key !== '$inlines');
    keyOrder.push('$inlines');
  }
  return map(keyOrder, (key) => {
    const val = defn[key];
    if (key === '$inlines') {
      return renderInlines(val, indent);
    } else {
      const lhs = `${indentStr}${padEnd(key, longestKeyLength)} = `;
      const rhs = renderDefinitionRhs(val, indent, key);
      return lhs + rhs;
    }
  }).join('\n');
};

/**
 * Renders inline values.
 * @private
 * @param {*} val
 * @param {*} indent
 * @return {string} Rendered inlines.
 */
function renderInlines(val, indent) {
  const indentStr = Array(indent + 1).join(' ');
  return '\n' + map(orderBy(val, first), (pair) =>
    [
      `${indentStr}${pair[0]} {
${exports.renderDefinition(pair[1], indent + 2)}
${indentStr}}`,
    ].join('\n')
  ).join('\n\n');
}

/**
 * Render the right-hand side of a definition.
 * @param {*} val Value to render
 * @param {?number} indent Number of spaces to indent.
 * @return {string} Rendered RHS.
 */
function renderDefinitionRhs(val, indent) {
  indent = indent || 0;
  const indentStr = Array(indent + 1).join(' ');

  if (isUndefined(val)) {
    throw new Error('Undefined value in definition RHS.');
  }
  if (isBoolean(val)) {
    return val.toString();
  }
  if (isInteger(val)) {
    return val;
  }
  if (isString(val)) {
    return JSON.stringify(val);
  }
  if (isArray(val)) {
    return ['[', map(val, (elem) => `${indentStr}  ${JSON.stringify(elem)}`).join(',\n'), `${indentStr}]`].join('\n');
  }
  if (isObject(val)) {
    const rhsLines = exports.renderDefinition(val, indent + 2);
    const rhsStr = rhsLines;
    return `{
${rhsStr}
${indentStr}}`;
  }
}
