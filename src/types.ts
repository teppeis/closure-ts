import * as estree from 'estree';

export interface ModuleInfo {
  vars: VarInfo[];
  typedefs: TypeDefInfo[];
  functions: FunctionInfo[];
  interfaces: [];
  enums: EnumInfo[];
  classes: ClassInfo[];
  classIndex: Record<string, ClassInfo>;
}

interface InfoBase {
  name: string;
  type: string;
  comment: estree.Comment;
}

export interface VarInfo extends InfoBase {
  isStatic: boolean;
}

export interface ClassInfo extends InfoBase {
  type: 'ClassType' | 'InterfaceType';
  cstr: any;
  parents: string[];
  templates: string[];
  methods: FunctionInfo[];
  props: VarInfo[];
}

export interface FunctionInfo extends InfoBase {
  templates: string[];
  isStatic: boolean;
}

export interface EnumInfo extends InfoBase {
  keys: string[];
  original: string | null;
}

export interface TypeDefInfo extends InfoBase {}
