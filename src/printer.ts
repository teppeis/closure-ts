import intersection from 'lodash/intersection';
import {renameToId, renameReservedModuleName} from './util';
import {
  ModuleInfo,
  TypedefInfo,
  EnumInfo,
  VarInfo,
  FunctionInfo,
  ClassInfo,
  InfoBase,
  PakcageInfo,
  Info,
} from './types';
import difference from 'lodash/difference';

const INDENT = '  ';

function trimEmptyLines(code: string): string {
  return code.replace(/^\s*$/gm, '');
}

export function outputPackage(pkg: PakcageInfo): {name: string; code: string}[] {
  const nonProvidedItemNames = difference(Object.keys(pkg.items), pkg.provides);
  return pkg.provides.map(name => {
    const code: string[] = [];
    code.push(outputModuleStart(pkg, name));
    const info = pkg.items[name];
    if (info) {
      switch (info.kind) {
        case 'ClassInfo':
          code.push(outputClassDeclaration(INDENT, info));
          break;
        case 'FunctionInfo':
          code.push(outputFunctionDeclaration(INDENT, info, true));
          break;
        default:
          throw new Error();
      }
    }
    const memberPattern = new RegExp(`^${name.replace(/\./g, '\\.')}\\.[^.]+$`);
    const members = nonProvidedItemNames
      .filter(name => memberPattern.test(name))
      .map(name => pkg.items[name]);
    if (members.length > 0) {
      outputModuleMembers(name, members, code, INDENT);
    }
    code.push(outputModuleEnd(pkg, name));
    return {name, code: trimEmptyLines(code.join('\n'))};
  });
}

function outputModuleMembers(
  name: string,
  members: Info[],
  code: string[],
  indent: string = INDENT
) {
  code.push(`${indent}namespace ${renameToId(name)} {`);
  members.forEach(member => {
    if (member.kind === 'FunctionInfo') {
      code.push(outputFunctionDeclaration(`${indent}${INDENT}`, member));
    }
  });
  code.push(`${indent}}`);
  code.push('');
}

export default function outputDeclarations(
  declarations: Record<string, ModuleInfo>,
  provides: string[]
): string {
  return '';
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
  const resolvedName = renameReservedModuleName(name);
  return `${indent}function require(name: '${name}'): typeof ${resolvedName};`;
}

/**
 * start `declare module` and `import` dependencies
 */
function outputModuleStart(pkg: PakcageInfo, name: string): string {
  const code = [`declare module 'goog:${name}' {`];
  pkg.provides
    .concat(pkg.requires)
    .filter(provide => provide !== name)
    .forEach(provide => {
      code.push(`${INDENT}import ${renameToId(provide)} from 'goog:${provide}';`);
    });
  return code.join('\n');
}

/**
 * export and end `declare module`
 */
function outputModuleEnd(pkg: PakcageInfo, name: string): string {
  const code = [`${INDENT}export default ${renameToId(name)};`];
  code.push('}');
  return code.join('\n');
}

function outputTypedefDeclaration(indent: string, declare: TypedefInfo): string {
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

function outputFunctionDeclaration(
  indent: string,
  declare: FunctionInfo,
  isProvided = false
): string {
  const output = `/*${declare.comment.value}*/`.split('\n');
  const name = isProvided ? renameToId(declare.name) : declare.name.split('.').pop();
  output.push(`function ${name}${getTemplateString(declare.templates)}${declare.type};`);
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function outputClassDeclaration(indent: string, declare: ClassInfo): string {
  const output = `/*${declare.comment.value}*/`.split('\n');
  let extend = '';
  if (declare.parents.length > 0) {
    extend = ` extends ${declare.parents.map(renameToId).join(', ')}`;
  }
  if (declare.type === 'ClassType') {
    output.push(
      `class ${renameToId(declare.name)}${getTemplateString(declare.templates)}${extend} {`
    );
    output.push(`${INDENT}constructor${declare.cstr};`);
  } else if (declare.type === 'InterfaceType') {
    output.push(`interface ${declare.name}${getTemplateString(declare.templates)}${extend} {`);
  }
  declare.props.forEach(prop => {
    output.push(`${INDENT}`);
    output.push(`${INDENT}/*${prop.comment.value}*/`.split('\n').join(`\n${indent}${INDENT}`));
    output.push(`${INDENT}${prop.isStatic ? 'static ' : ''}${prop.name}: ${prop.type};`);
  });
  declare.methods.forEach(method => {
    output.push(`${INDENT}`);
    output.push(`${INDENT}/*${method.comment.value}*/`.split('\n').join(`\n${indent}${INDENT}`));
    output.push(
      `${INDENT}${method.isStatic ? 'static ' : ''}${method.name}${getTemplateString(
        method.templates
      )}${method.type};`
    );
  });
  output.push('}');
  output.push('');
  return `\n${output.map(line => indent + line).join('\n')}`;
}

function getTemplateString(templates: string[]): string {
  if (templates && templates.length > 0) {
    return `<${templates.join(', ')}>`;
  } else {
    return '';
  }
}
