'use strict';

const util = require('./util');
const _ = require('lodash');

function outputDeclarations(declarations, provides) {
  const output = [];
  output.push(outputProvides(declarations, provides));
  for (const name in declarations) {
    output.push(outputModule(declarations[name], name));
  }
  let outputString = output.filter(str => !!str).join('\n\n');
  if (outputString) {
    outputString += '\n';
  }
  return outputString;
}

function outputProvides(declarations, provided) {
  if (!provided.length) {
    return '';
  }
  let provides = [];
  for (var moduleName in declarations) {
    const module = declarations[moduleName];
    const appendModule = function(item) {
      return `${moduleName}.${item.name}`;
    };
    if (module.vars.length > 0 || module.functions.length > 0) {
      provides.push(moduleName);
    }

    provides = provides.concat(module.enums.map(appendModule));
    provides = provides.concat(
      module.classes.filter(c => c.type === 'ClassType').map(appendModule)
    );
  }
  provides = _.intersection(provides, provided);
  if (!provides.length) {
    return '';
  }
  const output = ['declare module goog {'];
  const indent = '    ';
  output.push(provides.map(outputProvide.bind(null, indent)).join('\n'));
  output.push('}');
  return output.join('\n');
}

function outputProvide(indent, name) {
  const resolvedName = util.renameReservedModuleName(name);
  return `${indent}function require(name: '${name}'): typeof ${resolvedName};`;
}

function outputModule(moduleDeclaration, name) {
  name = util.renameReservedModuleName(name);
  const output = [`declare module ${name} {`];
  const indent = '    ';
  // TODO: keep original order
  output.push(moduleDeclaration.enums.map(outputEnumDeclaration.bind(null, indent)).join('\n'));
  output.push(
    moduleDeclaration.typedefs.map(outputTypedefDeclaration.bind(null, indent)).join('\n')
  );
  output.push(
    moduleDeclaration.interfaces.map(outputInterfaceDeclaration.bind(null, indent)).join('\n')
  );
  output.push(moduleDeclaration.classes.map(outputClassDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.vars.map(outputVarDeclaration.bind(null, indent)).join('\n'));
  output.push(
    moduleDeclaration.functions.map(outputFunctionDeclaration.bind(null, indent)).join('\n')
  );
  output.push('}');
  return output.filter(section => !!section).join('\n');
}

function outputTypedefDeclaration(indent, declare) {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`type ${declare.name} = ${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputEnumDeclaration(indent, declare) {
  const output = `/*${declare.comment.value}*/`.split('\n');
  if (declare.original) {
    // just copy
    output.push(`export import ${declare.name} = ${declare.original};`);
  } else {
    output.push(`type ${declare.name} = ${declare.type};`);
    output.push(`var ${declare.name}: {`);
    declare.keys.forEach(key => {
      output.push(`    ${key}: ${declare.name};`);
    });
    output.push('};');
  }
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputVarDeclaration(indent, declare) {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`var ${declare.name}: ${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputFunctionDeclaration(indent, declare) {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`function ${declare.name}${getTemplateString(declare.templates)}${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputInterfaceDeclaration(indent, declare) {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`interface ${declare.name} {`);
  declare.members.forEach(member => {
    output.push(`    ${member};`);
  });
  output.push('}');
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputClassDeclaration(indent, declare) {
  const output = `/*${declare.comment.value}*/`.split('\n');
  let extend = '';
  if (declare.parents.length > 0) {
    extend = ` extends ${declare.parents.join(', ')}`;
  }
  if (declare.type === 'ClassType') {
    output.push(`class ${declare.name}${getTemplateString(declare.templates)}${extend} {`);
    output.push(`    constructor${declare.cstr};`);
  } else if (declare.type === 'InterfaceType') {
    output.push(`interface ${declare.name}${getTemplateString(declare.templates)}${extend} {`);
  }
  declare.props.forEach(prop => {
    output.push('    ');
    output.push(`    /*${prop.comment.value}*/`.split('\n').join(`\n    ${indent}`));
    output.push(`    ${prop.isStatic ? 'static ' : ''}${prop.name}: ${prop.type};`);
  });
  declare.methods.forEach(method => {
    output.push('    ');
    output.push(`    /*${method.comment.value}*/`.split('\n').join(`\n    ${indent}`));
    output.push(
      `    ${method.isStatic ? 'static ' : ''}${method.name}${getTemplateString(method.templates)}${
        method.type
      };`
    );
  });
  output.push('}');
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function getTemplateString(templates) {
  if (templates && templates.length > 0) {
    return `<${templates.join(', ')}>`;
  } else {
    return '';
  }
}

module.exports = outputDeclarations;