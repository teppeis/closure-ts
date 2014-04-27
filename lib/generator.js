'use strict';

var doctrine = require('doctrine');
var esprima = require('esprima');
var estraverse = require('estraverse');
var Syntax = estraverse.Syntax;

function generate(code) {
  var ast = esprima.parse(code, {
    comment: true,
    attachComment: true,
    loc: true
  });
  var declarations = {};
  ast.body.forEach(function(statement) {
    try {
      parseStatement(statement, declarations);
    } catch (e) {
      console.error(statement);
      throw e;
    }
  });
  return outputDeclarationFile(declarations);
}

function parseStatement(statement, declarations) {
  var comments = statement.leadingComments;
  if (!comments || !comments.length) {
    return;
  }
  comments = comments.filter(function(comment) {
    return comment.type === 'Block' && comment.value.charAt(0) === '*';
  });
  var comment = comments[comments.length - 1];
  if (!comment) {
    return;
  }

  if (statement.type === Syntax.IfStatement ||
      statement.type === Syntax.TryStatement) {
    // TODO: ignore top level IfStatement or TryStatement now.
    return;
  }

  var doc = doctrine.parse(comment.value, {
    unwrap: true,
    tags: [
      'param',
      'enum',
      'return',
      'private',
      'type',
      'template',
      'typedef',
      'constructor',
      'interface',
      'extends',
      'override'
    ]
  });
  // console.log(doc.tags);

  if (isPrivate(doc.tags)) {
    return;
  }

  var fullname = getFullName(statement);
  if (!fullname) {
    return;
  }
  var root = fullname[0];
  if (root !== 'goog' && root !== 'proto2' && root !== 'osapi' && root !== 'svgpan') {
    return;
  }
  var name = fullname.pop();
  var className = null;
  var isStatic = false;
  var isClass = isClassDeclaration(statement, doc.tags);
  var isInterface = isInterfaceDeclaration(statement, doc.tags);
  var enumTag = getEnumTag(doc.tags);
  if (fullname[fullname.length - 1] === 'prototype') {
    if (isEmptyOverride(doc, statement)) {
      return;
    }
    // consume 'prototype'
    fullname.pop();
    className = fullname.pop();
  } else if (isStaticMember(fullname, declarations)) {
    if (!isClass && !isInterface && !enumTag) {
      className = fullname.pop();
      isStatic = true;
    }
  }
  var moduleName = fullname.join('.');

  if (moduleName === 'goog.global') {
    return;
  }

  var moduleInfo = declarations[moduleName];
  var classInfo;
  if (moduleInfo) {
    classInfo = moduleInfo.classIndex[className];
  }
  if (className && !classInfo) {
    // the class is private
    return;
  }
  if (!moduleInfo) {
    moduleInfo = declarations[moduleName] = {
      vars: [],
      functions: [],
      interfaces: [],
      enums: [],
      classes: [],
      classIndex: {}
    };
  }

  if (isClass || isInterface) {
    classInfo = {
      name: name,
      type: isClass ? 'ClassType' : isInterface ? 'InterfaceType' : null,
      cstr: getClassConstructorAnnotation(doc.tags),
      parent: getParentClass(doc.tags),
      templates: getTemplates(doc.tags),
      methods: [],
      props: [],
      comment: comment
    };
    moduleInfo.classes.push(classInfo);
    moduleInfo.classIndex[name] = classInfo;
    return;
  }

  if (isFunctionDeclaration(statement, doc.tags)) {
    var functionInfo = {
      name: name,
      type: getFunctionAnnotation(doc.tags),
      templates: getTemplates(doc.tags),
      isStatic: isStatic,
      comment: comment
    };

    if (className) {
      classInfo.methods.push(functionInfo);
    } else {
      moduleInfo.functions.push(functionInfo);
    }
    return;
  }

  if (enumTag) {
    moduleInfo.enums.push({
      name: name,
      type: getTsType(enumTag.type),
      keys: getEnumKeys(statement),
      original: getOriginalEnum(statement),
      comment: comment
    });
    return;
  }

  var typedefTag = getTypedefTag(doc.tags);
  if (typedefTag) {
    moduleInfo.interfaces.push({
      name: name,
      members: getInterfaceMembersFromTypedef(typedefTag.type),
      comment: comment
    });
    return;
  }

  var varInfo = {
    name: name,
    type: getTypeAnnotation(doc.tags, statement),
    isStatic: isStatic,
    comment: comment
  };
  if (className) {
    moduleInfo.classIndex[className].props.push(varInfo);
  } else {
    moduleInfo.vars.push(varInfo);
  }
}

function isStaticMember(fullname, declarations) {
  var className = fullname[fullname.length - 1];
  var moduleName = fullname.slice(0, -1).join('.');
  var moduleInfo = declarations[moduleName];
  if (moduleInfo && moduleInfo.classIndex[className]) {
    // InterfaceType doesn't have static members.
    return moduleInfo.classIndex[className].type === 'ClassType';
  }
  return false;
}

function getInterfaceMembersFromTypedef(type) {
  if (type.type === 'RecordType') {
    return type.fields.map(function(field) {
      return field.key + ': ' + getTsType(field.value);
    });
  }
  return [];
}

function isPrivate(tags) {
  return tags.some(function(tag) {
    return tag.title === 'private';
  });
}

function isEmptyOverride(doc, statement) {
  var tags = doc.tags;
  var hasOverride = false;
  var hasDescription = !!doc.description;
  var hasType = false;
  tags.forEach(function(tag) {
    var title = tag.title;
    hasOverride = hasOverride || title === 'override';
    hasDescription = hasDescription || (tag.description && tag.description !== '*');
    hasType = hasType || title === 'param' || title === 'return' ||
      title === 'this' || title === 'type' || title === 'template';
  });

  if (hasOverride && !hasType) {
    return !(hasDescription && isAssignement(statement));
  }

  return false;
}

function getEnumTag(tags) {
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].title === 'enum') {
      return tags[i];
    }
  }
  return null;
}

function getTypedefTag(tags) {
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].title === 'typedef') {
      return tags[i];
    }
  }
  return null;
}

function getEnumKeys(statement) {
  if (statement.expression.right.type !== 'ObjectExpression') {
    return [];
  }
  return statement.expression.right.properties.map(function(property) {
    var key = property.key;
    switch (key.type) {
      case 'Identifier':
        return key.name;
      case 'Literal':
        return key.raw;
      default:
        throw new Error('getEnumKeys(): Unexpected key:' + key.type);
    }
  });
}

function getOriginalEnum(statement) {
  var right = statement.expression.right;
  if (right.type === 'Identifier' || right.type === 'MemberExpression') {
    return getMemberExpressionNameList(right).join('.');
  }
  return null;
}

function getTsType(type, opt_isChildOfTypeApplication) {
  if (!type) {
    // no type property if doctrine fails to parse type.
    return 'any';
  }

  // TODO: use doctrine.Styntax
  switch (type.type) {
    case 'NameExpression':
      var typeName = renameReservedModuleName(type.name);
      if (isTsGenericType(type.name) && !opt_isChildOfTypeApplication) {
        return typeName + '<any>';
      }
      return typeName;
    case 'AllLiteral':
    case 'NullableLiteral':
      return 'any';
    case 'VoidLiteral':
    case 'NullLiteral':
    case 'UndefinedLiteral':
      return 'void';
    case 'OptionalType':
      return getTsType(type.expression);
    case 'NullableType':
    case 'NonNullableType':
      // Every types in TypeScript is a nullable.
      // There is not any non-nullables.
      return getTsType(type.expression);
    case 'UnionType':
      // TODO: Now just select a first element.
      return getTsType(type.elements[0]);
    case 'RestType':
      var expression = type.expression;
      if (expression.type === 'ArrayType' && expression.elements.length === 1) {
        // TODO: Only in function type
        expression = expression.elements[0];
      }
      return getTsType(expression) + '[]';
    case 'TypeApplication':
      var baseType = getTsType(type.expression, true);
      if (isTsNonGenericType(baseType)) {
        return baseType;
      }
      return baseType + '<' + type.applications.map(function(app) {
        return getTsType(app);
      }).join(', ') + '>';
    case 'FunctionType':
      var params = type.params.map(function(paramType, index) {
        return {
          type: getTsType(paramType),
          name: getArgName('arg' + index, paramType)
        };
      });
      return toFunctionTypeString(params, getTsType(type.result));
    case 'RecordType':
      return toRecordTypeString(type);
    default:
      throw new Error('Unexpected type: ' + type.type);
  }
}

function isTsNonGenericType(name) {
  var nonGenericTypes = {
    'Object': true
  };
  return (name in nonGenericTypes);
}

function isTsGenericType(name) {
  var genericTypes = {
    'Array': true,
    'Set': true,
    'Map': true,
    'WeakMap': true,
    'NodeListOf': true,
    'goog.async.Deferred': true,
    'goog.events.EventHandler': true
  };
  return (name in genericTypes);
}

function getArgName(name, type) {
  if (isReservedWord(name)) {
    name += '_';
  }

  if (!type) {
    return name;
  }

  switch (type.type) {
    case 'OptionalType':
      return name + '?';
    case 'RestType':
      return '...' + name;
    default:
      return name;
  }
}

function isReservedWord(name) {
  return name === 'class';
}

function getFunctionAnnotation(tags, opt_ignoreReturn, opt_ignoreTemplate) {
  var params = [];
  var returns = null;

  tags.forEach(function(tag) {
    switch (tag.title) {
      case 'param':
        params.push({type: getTsType(tag.type), name: getArgName(tag.name, tag.type)});
        break;
      case 'return':
        if (!opt_ignoreReturn) {
          returns = getTsType(tag.type);
        }
        break;
      default:
        break;
    }
  });

  returns = returns || 'void';
  var args = toFunctionArgsString(params);
  if (opt_ignoreReturn) {
    return args;
  }
  return args + ': ' + returns;
}

function getTemplateString(templates) {
  if (templates && templates.length > 0) {
    return '<' + templates.join(', ') + '>';
  } else {
    return '';
  }
}

function getTemplates(tags) {
  var templates = [];
  tags.some(function(tag) {
    if (tag.title === 'template') {
      templates = tag.description.split(',').map(function(t) {return t.trim();});
      return true;
    }
  });
  return templates;
}

function getClassConstructorAnnotation(tags) {
  return getFunctionAnnotation(tags, true, true);
}

function getParentClass(tags) {
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].title === 'extends') {
      return getTsType(tags[i].type);
    }
  }
  return null;
}

function getTypeAnnotation(tags, statement) {
  var type = {
    enum: null,
    type: null
  };

  tags.forEach(function(tag) {
    switch (tag.title) {
      case 'enum':
        type.enum = {type: getTsType(tag.type)};
        break;
      case 'type':
        type.type = {type: getTsType(tag.type)};
        break;
    }
  });

  if (type.type) {
    return type.type.type;
  } else if (isAssignement(statement)) {
    return 'any';
  } else {
    console.error(tags);
    throw new Error('Unsupported type annotations.');
  }
}

function toRecordTypeString(tag) {
  return '{' + tag.fields.map(function(field) {
    return field.key + ': ' + getTsType(field.value);
  }).join('; ') + '}';
}

function toFunctionTypeString(params, ret) {
  var args = toFunctionArgsString(params);
  var returns = ret ? ret : 'void';
  return args + ' => ' + returns;
}

function toFunctionArgsString(params) {
  return '(' + params.map(function(param) {
    return param.name + ': ' + param.type;
  }).join(', ') + ')';
}

function isAssignement(statement) {
  return statement.type === Syntax.ExpressionStatement &&
    statement.expression.type === Syntax.AssignmentExpression;
}

function isFunctionDeclaration(statement, tags) {
  var isFunction = tags.some(function(tag) {
    return tag.title === 'param' || tag.title === 'return';
  });

  if (isFunction) {
    return true;
  }

  if (isAssignement(statement)) {
    return statement.expression.right.type === Syntax.FunctionExpression;
  }

  var isNotFunction = tags.some(function(tag) {
    switch (tag.title) {
      case 'const':
      case 'constructor':
      case 'define':
      case 'dict':
      case 'enum':
      case 'extends':
      case 'implements':
      case 'interface':
      case 'struct':
      case 'type':
      case 'typedef':
        return true;
      default:
        return false;
    }
  });
  return !isNotFunction;
}

function isClassDeclaration(statement, tags) {
  return tags.some(function(tag) {
    return tag.title === 'constructor';
  });
}

function isInterfaceDeclaration(statement, tags) {
  return tags.some(function(tag) {
    return tag.title === 'interface';
  });
}

function getFullName(statement) {
  switch (statement.type) {
    case Syntax.ExpressionStatement:
      return getFullNameFromExpressionStatement(statement);
    case Syntax.FunctionDeclaration:
      // function declarations should not be exported.
      return null;
    case Syntax.VariableDeclaration:
      return getFullNameFromVariableDeclaration(statement);
    default:
      throw new Error('Unexpected statement');
  }
}

function getFullNameFromVariableDeclaration(statement) {
  // No variable declarations in Closure Library
  return null;
}

/**
 * @param {Object} statement
 * @return {Array.<string>|null}
 */
function getFullNameFromExpressionStatement(statement) {
  var expression = statement.expression;
  var targetExpression;
  switch (expression.type) {
    case Syntax.AssignmentExpression:
      targetExpression = expression.left;
      break;
    case Syntax.MemberExpression:
      targetExpression = expression;
      break;
    case Syntax.CallExpression:
      // Like: @fileoverview => goog.provide('foo')
      return null;
    default:
      console.error(statement);
      throw new Error('Unexpected expression: ' + expression.type);
  }

  return getMemberExpressionNameList(targetExpression);
}

/**
 * @param {Object} expression
 * @return {Array.<string>|null} null if the expression includes a literal.
 */
function getMemberExpressionNameList(expression) {
  var fullname = [];
  estraverse.traverse(expression, {
    enter: function(node, parent) {
      if (node.computed || node.type === Syntax.Literal) {
        fullname = null;
        this.break();
      }
    },
    leave: function(node, parent) {
      if (node.type === Syntax.Identifier) {
        fullname.push(node.name);
      }
    }
  });
  return fullname;
}

function outputDeclarationFile(declarations) {
  var output = [];
  for (var name in declarations) {
    output.push(outputModule(declarations[name], name));
  }
  var outputString = output.filter(function(str) {return !!str;}).join('\n\n');
  if (outputString) {
    outputString += '\n';
  }
  return outputString;
}

function renameReservedModuleName(name) {
  return name.replace(/^goog\.string(?=$|\.)/, 'goog.string$');
}

function outputModule(moduleDeclaration, name) {
  name = renameReservedModuleName(name);
  var output = ['declare module ' + name + ' {'];
  var indent = '    ';
  // TODO: keep original order
  output.push(moduleDeclaration.enums.map(outputEnumDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.interfaces.map(outputInterfaceDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.classes.map(outputClassDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.vars.map(outputVarDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.functions.map(outputFunctionDeclaration.bind(null, indent)).join('\n'));
  output.push('}');
  return output.filter(function(section) {return !!section;}).join('\n');
}

function outputEnumDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  if (declare.original) {
    // just copy
    output.push('export interface ' + declare.name + ' extends ' + declare.original + ' {}');
  } else {
    output.push('export interface ' + declare.name + ' {');
    declare.keys.forEach(function(key) {
      output.push('    ' + key + ': ' + declare.type + ';');
    });
    output.push('}');
  }
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputVarDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('export var ' + declare.name + ': ' + declare.type + ';');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputFunctionDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('export function ' + declare.name + getTemplateString(declare.templates) + declare.type + ';');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputInterfaceDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('export interface ' + declare.name + ' {');
  declare.members.forEach(function(member) {
    output.push('    ' + member + ';');
  });
  output.push('}');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputClassDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  if (declare.type === 'ClassType') {
    output.push('export class ' + declare.name + getTemplateString(declare.templates) + (declare.parent ? ' extends ' + declare.parent : '') + ' {');
    output.push('    constructor' + declare.cstr + ';');
  } else if (declare.type === 'InterfaceType') {
    output.push('export interface ' + declare.name + (declare.parent ? ' extends ' + declare.parent : '') + ' {');
  }
  declare.props.forEach(function(prop) {
    output.push('    ');
    output.push(('    /*' + prop.comment.value + '*/').split('\n').join('\n    ' + indent));
    output.push('    ' + (prop.isStatic ? 'static ' : '') + prop.name + ': ' + prop.type + ';');
  });
  declare.methods.forEach(function(method) {
    output.push('    ');
    output.push(('    /*' + method.comment.value + '*/').split('\n').join('\n    ' + indent));
    output.push('    ' + (method.isStatic ? 'static ' : '') + method.name + getTemplateString(method.templates) + method.type + ';');
  });
  output.push('}');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

module.exports = {
  generate: generate
};
