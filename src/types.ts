import * as estree from 'estree';

export interface ModuleInfo {
  vars: VarInfo[]
  typedefs: TypeDefInfo[]
  functions: FunctionInfo[]
  interfaces: []
  enums: EnumInfo[]
  classes: ClassInfo[]
  classIndex: Record<string, ClassInfo>
}

export interface VarInfo {
  name: string,
  type: any,
  isStatic: boolean,
  comment: estree.Comment,
};

export interface ClassInfo {
  name: string
  type: 'ClassType' | 'InterfaceType' | null
  cstr: any
  parents: string[]
  templates: string[]
  methods: FunctionInfo[]
  props: VarInfo[]
  comment: estree.Comment
}

export interface FunctionInfo {
  name: string,
  type: any,
  templates: string[],
  isStatic: boolean,
  comment: estree.Comment
};

export interface EnumInfo {
  name: string,
  type: any,
  keys: any[],
  original: any,
  comment: estree.Comment
}

export interface TypeDefInfo {
  name: string,
  type: string,
  comment: estree.Comment
}