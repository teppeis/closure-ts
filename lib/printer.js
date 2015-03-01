var util = require('./util');

function outputDeclarations(declarations, provides) {
  var output = [];
  output.push(outputProvides(provides));
  for (var name in declarations) {
    output.push(outputModule(declarations[name], name));
  }
  var outputString = output.filter(function(str) {return !!str;}).join('\n\n');
  if (outputString) {
    outputString += '\n';
  }
  return outputString;
}

function outputProvides(provides) {
  if (!provides.length) {
    return '';
  }
  var output = ['declare module goog {'];
  var indent = '    ';
  output.push(provides.map(outputProvide.bind(null, indent)).join('\n'));
  output.push('}');
  return output.join('\n');
}

function outputProvide(indent, name) {
  return indent + 'function require(name: \'' + name + '\'): typeof ' + name + ';';
}

function outputModule(moduleDeclaration, name) {
  name = util.renameReservedModuleName(name);
  var output = ['declare module ' + name + ' {'];
  var indent = '    ';
  // TODO: keep original order
  output.push(moduleDeclaration.enums.map(outputEnumDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.typedefs.map(outputTypedefDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.interfaces.map(outputInterfaceDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.classes.map(outputClassDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.vars.map(outputVarDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.functions.map(outputFunctionDeclaration.bind(null, indent)).join('\n'));
  output.push('}');
  return output.filter(function(section) {return !!section;}).join('\n');
}

function outputTypedefDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('type ' + declare.name + ' = ' + declare.type + ';');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputEnumDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  if (declare.original) {
    // just copy
    output.push('export import ' + declare.name + ' = ' + declare.original + ';');
  } else {
    output.push('type ' + declare.name + ' = ' + declare.type + ';');
    output.push('var ' + declare.name + ': {');
    declare.keys.forEach(function(key) {
      output.push('    ' + key + ': ' + declare.name + ';');
    });
    output.push('};');
  }
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputVarDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('var ' + declare.name + ': ' + declare.type + ';');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputFunctionDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('function ' + declare.name + getTemplateString(declare.templates) + declare.type + ';');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputInterfaceDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  output.push('interface ' + declare.name + ' {');
  declare.members.forEach(function(member) {
    output.push('    ' + member + ';');
  });
  output.push('}');
  return '\n' + output.map(function(line) {return indent + line;}).join('\n');
}

function outputClassDeclaration(indent, declare) {
  var output = ('/*' + declare.comment.value + '*/').split('\n');
  var extend = '';
  if (declare.parents.length > 0) {
    extend = ' extends ' + declare.parents.join(', ');
  }
  if (declare.type === 'ClassType') {
    output.push('class ' + declare.name + getTemplateString(declare.templates) + extend + ' {');
    output.push('    constructor' + declare.cstr + ';');
  } else if (declare.type === 'InterfaceType') {
    output.push('interface ' + declare.name + getTemplateString(declare.templates) + extend + ' {');
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

function getTemplateString(templates) {
  if (templates && templates.length > 0) {
    return '<' + templates.join(', ') + '>';
  } else {
    return '';
  }
}


module.exports = outputDeclarations;
