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
    parseStatement(statement, declarations);
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
  var doc = doctrine.parse(comment.value, {
    unwrap: true,
    tags: [
      'param',
      'enum',
      'return',
      'private',
      'type',
      'template',
      'typedef'
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
  var name = fullname.pop();
  var moduleName = fullname.join('.');

  var moduleInfo = declarations[moduleName];
  if (!moduleInfo) {
    moduleInfo = declarations[moduleName] = {
      vars: [],
      functions: [],
      interfaces: [],
      enums: []
    };
  }

  if (isFunctionAssignement(statement)) {
    moduleInfo.functions.push({
      name: name,
      type: getFunctionAnnotation(doc.tags, statement),
      comment: comment
    });
    return;
  }

  var enumTag = getEnumTag(doc.tags);
  if (enumTag) {
    moduleInfo.enums.push({
      name: name,
      type: getTsType(enumTag.type),
      keys: getEnumKeys(statement),
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

  try {
    moduleInfo.vars.push({
      name: name,
      type: getTypeAnnotation(doc.tags, statement),
      comment: comment
    });
  } catch (e) {
    console.error(statement);
    throw e;
  }
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
  return statement.expression.right.properties.map(function(property) {
    return property.key.name;
  });
}

function getTsType(type, opt_isChildOfTypeApplication) {
  if (!type) {
    // no type property if doctrine fails to parse type.
    return 'any';
  }

  // TODO: use doctrine.Styntax
  switch (type.type) {
    case 'NameExpression':
      if (isTsGenericType(type.name) && !opt_isChildOfTypeApplication) {
        return type.name + '<any>';
      }
      return type.name;
    case 'AllLiteral':
    case 'NullableLiteral':
      return 'any';
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
      return getTsType(type.expression) + '[]';
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
          name: 'arg' + index
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
    'NodeListOf': true
  };
  return (name in genericTypes);
}

function getArgName(tag) {
  if (!tag.type) {
    return tag.name;
  }

  switch (tag.type.type) {
    case 'OptionalType':
      return tag.name + '?';
    case 'RestType':
      return '...' + tag.name;
    default:
      return tag.name;
  }
}

function getFunctionAnnotation(tags, statement) {
  var params = [];
  var returns = null;
  var templates = [];

  tags.forEach(function(tag) {
    switch (tag.title) {
      case 'param':
        params.push({type: getTsType(tag.type), name: getArgName(tag)});
        break;
      case 'return':
        returns = getTsType(tag.type);
        break;
      case 'template':
        templates = templates.concat(tag.description.split(',').map(function(t) {return t.trim();}));
        break;
    }
  });

  returns = returns || 'void';
  var template = '';
  if (templates.length > 0) {
    template = '<' + templates.join(', ') + '>';
  }
  return template + toFunctionArgsString(params) + ': ' + returns;
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

function isFunctionAssignement(statement) {
  return isAssignement(statement) &&
    statement.expression.right.type === Syntax.FunctionExpression;
}

function getFullName(statement) {
  switch (statement.type) {
    case Syntax.ExpressionStatement:
      return getFullNameFromExpressionStatement(statement);
    case Syntax.FunctionDeclaration:
      return getFullNameFromFunctionDeclaration(statement);
    case Syntax.VariableDeclaration:
      return getFullNameFromVariableDeclaration(statement);
    default:
      throw new Error('Unexpected statement');
  }
}

function getFullNameFromFunctionDeclaration(statement) {
  console.error(statement);
  throw new Error('TODO: getFullNameFromFunctionDeclaration');
}

function getFullNameFromVariableDeclaration(statement) {
  // No variable declarations in Closure Library
  return null;
}

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

  var fullname = [];
  var error = false;
  estraverse.traverse(targetExpression, {
    enter: function(node, parent) {
      if (node.computed || node.type === Syntax.Literal) {
        error = true;
        this.break();
      }
    },
    leave: function(node, parent) {
      if (node.type === Syntax.Identifier) {
        fullname.push(node.name);
      }
    }
  });

  if (error) {
    throw new Error('');
  }

  return fullname;
}

function outputDeclarationFile(declarations) {
  var output = [];
  for (var name in declarations) {
    output.push(outputModule(declarations[name], name));
  }
  return output.filter(function(str) {return !!str;}).join('\n\n');
}

function outputModule(moduleDeclaration, name) {
  var output = ['declare module ' + name + ' {'];
  var indent = '    ';
  // TODO: keep original order
  output.push(moduleDeclaration.enums.map(outputEnumDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.interfaces.map(outputInterfaceDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.vars.map(outputVarDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.functions.map(outputFunctionDeclaration.bind(null, indent)).join('\n'));
  output.push('}');
  return output.filter(function(section) {return !!section;}).join('\n');
}

function outputEnumDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('export interface ' + declare.name + ' {');
  declare.keys.forEach(function(key) {
    output.push('    ' + key + ': ' + declare.type + ';');
  });
  output.push('}');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputVarDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('export var ' + declare.name + ': ' + declare.type + ';');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputFunctionDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('export function ' + declare.name + declare.type + ';');
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

module.exports = {
  generate: generate
};
