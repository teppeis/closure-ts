import intersection from 'lodash/intersection';
import * as util from './util';
import {
  ModuleInfo,
  TypeDefInfo,
  EnumInfo,
  VarInfo,
  FunctionInfo,
  ClassInfo,
  InfoBase,
} from './types';

export default function outputDeclarations(
  declarations: Record<string, ModuleInfo>,
  provides: string[]
): string {
  const output: string[] = [];
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

function outputProvides(declarations: Record<string, ModuleInfo>, provided: string[]): string {
  if (!provided.length) {
    return '';
  }
  let provides: string[] = [];
  for (const moduleName in declarations) {
    const module = declarations[moduleName];
    const appendModule = (item: InfoBase) => `${moduleName}.${item.name}`;
    if (module.vars.length > 0 || module.functions.length > 0) {
      provides.push(moduleName);
    }

    provides = provides.concat(module.enums.map(appendModule));
    provides = provides.concat(
      module.classes.filter(c => c.type === 'ClassType').map(appendModule)
    );
  }
  provides = intersection(provides, provided);
  if (!provides.length) {
    return '';
  }
  const output = ['declare module goog {'];
  const indent = '    ';
  output.push(provides.map(outputProvide.bind(null, indent)).join('\n'));
  output.push('}');
  return output.join('\n');
}

function outputProvide(indent: string, name: string): string {
  const resolvedName = util.renameReservedModuleName(name);
  return `${indent}function require(name: '${name}'): typeof ${resolvedName};`;
}

function outputModule(moduleDeclaration: ModuleInfo, name: string): string {
  name = util.renameReservedModuleName(name);
  const output = [`declare module ${name} {`];
  const indent = '    ';
  // TODO: keep original order
  output.push(moduleDeclaration.enums.map(outputEnumDeclaration.bind(null, indent)).join('\n'));
  output.push(
    moduleDeclaration.typedefs.map(outputTypedefDeclaration.bind(null, indent)).join('\n')
  );
  output.push(moduleDeclaration.classes.map(outputClassDeclaration.bind(null, indent)).join('\n'));
  output.push(moduleDeclaration.vars.map(outputVarDeclaration.bind(null, indent)).join('\n'));
  output.push(
    moduleDeclaration.functions.map(outputFunctionDeclaration.bind(null, indent)).join('\n')
  );
  output.push('}');
  return output.filter(section => !!section).join('\n');
}

function outputTypedefDeclaration(indent: string, declare: TypeDefInfo): string {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`type ${declare.name} = ${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputEnumDeclaration(indent: string, declare: EnumInfo): string {
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

function outputVarDeclaration(indent: string, declare: VarInfo): string {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`var ${declare.name}: ${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputFunctionDeclaration(indent: string, declare: FunctionInfo): string {
  const output = `/*${declare.comment.value}*/`.split('\n');
  output.push(`function ${declare.name}${getTemplateString(declare.templates)}${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputClassDeclaration(indent: string, declare: ClassInfo): string {
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

function getTemplateString(templates: string[]): string {
  if (templates && templates.length > 0) {
    return `<${templates.join(', ')}>`;
  } else {
    return '';
  }
}
