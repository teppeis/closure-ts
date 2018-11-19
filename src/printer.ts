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
import prettier from 'prettier';
import {stringify} from 'querystring';

export class PackagePrinter {
  constructor(private pkg: PakcageInfo) {}

  /**
   * Output d.ts source for each provide
   */
  output(): Map<string, string> {
    const provides = this.pkg.provides.map(
      name => [name, new ModulePrinter(this.pkg, name).output()] as [string, string]
    );
    return new Map<string, string>(provides);
  }
}

class ModulePrinter {
  private code: string[] = [];
  private members: Info[] | null = null;
  constructor(private pkg: PakcageInfo, private name: string) {}

  /**
   * Output d.ts source for the provide
   */
  output(): string {
    this.code = [];
    this.outputModuleStart();
    this.outputProvided();
    this.outputModuleMembers();
    this.outputModuleEnd();
    return prettier.format(this.code.join('\n'), {parser: 'typescript'});
  }

  /**
   * Start `declare module` and `import` dependencies
   */
  private outputModuleStart(): void {
    this.code.push(`declare module 'goog:${this.name}' {`);
    this.pkg.provides
      .concat(this.pkg.requires)
      .filter(provide => provide !== this.name)
      .forEach(provide => {
        this.code.push(`import ${renameToId(provide)} from 'goog:${provide}';`);
      });
  }

  /**
   * `export` the provide and end `declare module`
   */
  private outputModuleEnd(): void {
    this.code.push(`export default ${renameToId(this.name)};`);
    this.code.push('}');
  }

  private outputModuleMembers(): void {
    const members = this.getModuleMembers();
    if (!members.length) {
      return;
    }
    this.code.push(`namespace ${renameToId(this.name)} {`);
    members.forEach(member => {
      switch (member.kind) {
        case 'FunctionInfo':
          this.outputFunctionDeclaration(member);
          break;
        default:
        // ignore
      }
    });
    this.code.push(`}`);
  }

  private getModuleMembers(): Info[] {
    if (this.members) {
      return this.members;
    }
    const nonProvidedItemNames = difference(Object.keys(this.pkg.items), this.pkg.provides);
    const memberPattern = new RegExp(`^${this.name.replace(/\./g, '\\.')}\\.[^.]+$`);
    this.members = nonProvidedItemNames
      .filter(name => memberPattern.test(name))
      .map(name => this.pkg.items[name]);
    return this.members;
  }

  private outputProvided(): void {
    const info = this.pkg.items[this.name];
    if (info) {
      switch (info.kind) {
        case 'ClassInfo':
          this.outputClassDeclaration(info);
          break;
        case 'FunctionInfo':
          this.outputFunctionDeclaration(info, true);
          break;
        default:
          throw new Error();
      }
    }
  }

  private outputFunctionDeclaration(declare: FunctionInfo, isProvided = false): void {
    this.code.push(`/*${declare.comment.value}*/`);
    const name = isProvided ? renameToId(declare.name) : declare.name.split('.').pop();
    this.code.push(`function ${name}${this.getTemplateString(declare.templates)}${declare.type};`);
  }

  private outputClassDeclaration(declare: ClassInfo): void {
    this.code.push(`/*${declare.comment.value}*/`);
    let extend = '';
    if (declare.parents.length > 0) {
      if (declare.parents.length > 1) {
        throw new Error('TypeScript does NOT allow multiple inheritance: ' + this.name);
      }
      extend = ` extends ${renameToId(declare.parents[0])}`;
    }
    if (declare.type === 'ClassType') {
      this.code.push(
        `class ${renameToId(declare.name)}${this.getTemplateString(declare.templates)}${extend} {`
      );
      this.code.push(`constructor${declare.cstr};`);
    } else if (declare.type === 'InterfaceType') {
      this.code.push(
        `interface ${declare.name}${this.getTemplateString(declare.templates)}${extend} {`
      );
    }
    declare.props.forEach(prop => {
      this.code.push(`/*${prop.comment.value}*/`);
      this.code.push(`${prop.isStatic ? 'static ' : ''}${prop.name}: ${prop.type};`);
    });
    declare.methods.forEach(method => {
      this.code.push(`/*${method.comment.value}*/`);
      this.code.push(
        `${method.isStatic ? 'static ' : ''}${method.name}${this.getTemplateString(
          method.templates
        )}${method.type};`
      );
    });
    this.code.push('}');
  }

  private getTemplateString(templates: string[]): string {
    if (templates && templates.length > 0) {
      return `<${templates.join(', ')}>`;
    } else {
      return '';
    }
  }
}

export default function outputDeclarations(
  declarations: Record<string, ModuleInfo>,
  provides: string[]
): string {
  return '';
}
