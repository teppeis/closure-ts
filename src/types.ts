import * as estree from 'estree';

export interface ModuleInfo {
  vars: VarInfo[];
  typedefs: TypedefInfo[];
  functions: FunctionInfo[];
  enums: EnumInfo[];
  classes: ClassInfo[];
  classIndex: Record<string, ClassInfo>;
}

export interface InfoBase {
  name: string;
  type: string;
  kind: string;
  comment: estree.Comment;
}

export interface VarInfo extends InfoBase {
  kind: 'VarInfo';
  isStatic: boolean;
}

export interface ClassInfo extends InfoBase {
  kind: 'ClassInfo';
  type: 'ClassType' | 'InterfaceType';
  cstr: string;
  parents: string[];
  templates: string[];
  methods: FunctionInfo[];
  props: VarInfo[];
}

export interface FunctionInfo extends InfoBase {
  kind: 'FunctionInfo';
  templates: string[];
  isStatic: boolean;
}

export interface EnumInfo extends InfoBase {
  kind: 'EnumInfo';
  keys: string[];
  original: string | null;
}

export interface TypedefInfo extends InfoBase {
  kind: 'TypedefInfo';
}

export type Info = VarInfo | ClassInfo | FunctionInfo | EnumInfo | TypedefInfo;

export interface PakcageInfo {
  provides: string[];
  requires: string[];
  items: Record<string, Info>;
}
