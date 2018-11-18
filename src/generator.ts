import doctrine from '@teppeis/doctrine';
import {parseScript} from 'esprima';
import estraverse from 'estraverse';
import * as estree from 'estree';
import deepEqual from 'deep-equal';
import espurify from 'espurify';
import printer from './printer';
import * as util from './util';
import {ClassInfo, EnumInfo, FunctionInfo, ModuleInfo, TypeDefInfo, VarInfo} from './types';

const Syntax = estraverse.Syntax;

export function generate(code: string): string {
  const ast = parseScript(code, {
    comment: true,
    attachComment: true,
    loc: true,
  });
  const declarations: Record<string, ModuleInfo> = {};
  const provides: string[] = [];
  ast.body.forEach(statement => {
    try {
      parseStatement(statement, declarations, provides);
    } catch (e) {
      console.error(statement);
      throw e;
    }
  });
  return printer(declarations, provides);
}

function parseStatement(
  statement: estree.Statement | estree.ModuleDeclaration,
  declarations: Record<string, ModuleInfo>,
  provides: string[]
): void {
  if (statement.type === Syntax.IfStatement || statement.type === Syntax.TryStatement) {
    // TODO: ignore top level IfStatement or TryStatement now.
    return;
  }

  if (extractProvide(statement, provides)) {
    return;
  }

  let comments = statement.leadingComments;
  if (!comments || !comments.length) {
    return;
  }
  comments = comments.filter(
    comment => comment.type === 'Block' && comment.value.charAt(0) === '*'
  );
  const comment = comments[comments.length - 1];
  if (!comment) {
    return;
  }

  const doc = doctrine.parse(comment.value, {
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
      'record',
      'extends',
      'override',
    ],
  });
  // console.log(doc.tags);

  const typedefTag = getTypedefTag(doc.tags);
  let isClass = isClassDeclaration(statement, doc.tags);
  let isInterface = isInterfaceDeclaration(statement, doc.tags);
  const enumTag = getEnumTag(doc.tags);
  if (isPrivate(doc.tags)) {
    if (isClass) {
      isClass = false;
      isInterface = true;
    } else if (!typedefTag && !enumTag) {
      return;
    }
  }

  const fullname = getFullName(statement);
  if (!fullname) {
    return;
  }
  const root = fullname[0];
  if (root !== 'goog' && root !== 'proto2' && root !== 'osapi' && root !== 'svgpan') {
    return;
  }
  if (isToIgnore(fullname.join('.'))) {
    return;
  }
  const name = popOrThrow(fullname);
  let className: string | null = null;
  let isStatic = false;
  if (fullname[fullname.length - 1] === 'prototype') {
    if (isEmptyOverride(doc, statement)) {
      return;
    }
    // consume 'prototype'
    fullname.pop();
    className = popOrThrow(fullname);
  } else if (isStaticMember(fullname, declarations)) {
    if (!isClass && !isInterface && !enumTag && !typedefTag) {
      className = popOrThrow(fullname);
      isStatic = true;
    }
  }
  const moduleName = fullname.join('.');

  if (moduleName === 'goog.global') {
    return;
  }

  let moduleInfo: ModuleInfo = declarations[moduleName];
  if (!moduleInfo) {
    moduleInfo = declarations[moduleName] = {
      vars: [],
      typedefs: [],
      functions: [],
      interfaces: [],
      enums: [],
      classes: [],
      classIndex: {},
    };
  }

  let classInfo: ClassInfo | null = null;
  if (moduleInfo && className) {
    classInfo = moduleInfo.classIndex[className];
  }
  if (className && !classInfo) {
    // the class is private
    return;
  }

  if (isClass || isInterface) {
    classInfo = {
      name,
      type: isClass ? 'ClassType' : 'InterfaceType',
      cstr: getClassConstructorAnnotation(doc.tags),
      parents: getParentClasses(doc.tags),
      templates: getTemplates(doc.tags),
      methods: [],
      props: [],
      comment: comment,
    };
    moduleInfo.classes.push(classInfo);
    moduleInfo.classIndex[name] = classInfo;
    return;
  }

  if (isFunctionDeclaration(statement, doc.tags)) {
    const functionInfo: FunctionInfo = {
      name,
      type: getFunctionAnnotation(doc.tags),
      templates: getTemplates(doc.tags),
      isStatic: isStatic,
      comment: comment,
    };

    if (className && classInfo) {
      classInfo.methods.push(functionInfo);
    } else {
      moduleInfo.functions.push(functionInfo);
    }
    return;
  }

  if (enumTag) {
    if (statement.type !== Syntax.ExpressionStatement) {
      throw new Error('ExpressionStatement are expected: ' + statement.type);
    }
    moduleInfo.enums.push({
      name: name,
      type: getTsType(enumTag.type),
      keys: getEnumKeys(statement),
      original: getOriginalEnum(statement),
      comment: comment,
    });
    return;
  }

  if (typedefTag) {
    moduleInfo.typedefs.push({
      name: name,
      type: getTsType(typedefTag.type),
      comment: comment,
    });
    return;
  }

  const varInfo = {
    name: name,
    type: getTypeAnnotation(doc.tags, statement),
    isStatic: isStatic,
    comment: comment,
  };
  if (className) {
    moduleInfo.classIndex[className].props.push(varInfo);
  } else {
    moduleInfo.vars.push(varInfo);
  }
}

function popOrThrow<T>(array: T[]): T {
  const lastItem = array.pop();
  if (lastItem === undefined) {
    throw new Error('pop failed: array is empty unexpectedly');
  }
  return lastItem;
}

function extractProvide(
  statement: estree.Statement | estree.ModuleDeclaration,
  provides: string[]
): boolean {
  if (
    statement.type === Syntax.ExpressionStatement &&
    statement.expression.type === Syntax.CallExpression
  ) {
    const callExp = statement.expression;
    const firstArg = callExp.arguments[0];
    if (
      firstArg &&
      firstArg.type === Syntax.Literal &&
      deepEqual(espurify(callExp.callee), {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'Identifier',
          name: 'goog',
        },
        property: {
          type: 'Identifier',
          name: 'provide',
        },
      })
    ) {
      if (typeof firstArg.value !== 'string') {
        throw new Error('Unexpected value: ' + firstArg.value);
      }
      provides.push(firstArg.value!);
      return true;
    }
  }
  return false;
}

function isToIgnore(name: string): boolean {
  const ignoreList = {
    'goog.debug.LogManager': true,
    'goog.net.BrowserChannel.LogSaver': true,
    'goog.net.cookies.MAX_COOKIE_LENGTH': true,
    'goog.ui.AbstractSpellChecker.prototype.getHandler': true,
  };
  return name in ignoreList;
}

function isStaticMember(fullname: string[], declarations: Record<string, ModuleInfo>): boolean {
  const className = fullname[fullname.length - 1];
  const moduleName = fullname.slice(0, -1).join('.');
  const moduleInfo = declarations[moduleName];
  if (moduleInfo && moduleInfo.classIndex[className]) {
    // InterfaceType doesn't have static members.
    return moduleInfo.classIndex[className].type === 'ClassType';
  }
  return false;
}

function isPrivate(tags: doctrine.Tag[]): boolean {
  return tags.some(tag => tag.title === 'private');
}

function isEmptyOverride(
  doc: doctrine.Annotation,
  statement: estree.Statement | estree.ModuleDeclaration
): boolean {
  const tags = doc.tags;
  let hasOverride = false;
  let hasDescription = !!doc.description;
  let hasType = false;
  tags.forEach(tag => {
    const title = tag.title;
    hasOverride = hasOverride || title === 'override';
    hasDescription = hasDescription || (!!tag.description && tag.description !== '*');
    hasType =
      hasType ||
      title === 'param' ||
      title === 'return' ||
      title === 'this' ||
      title === 'type' ||
      title === 'template';
  });

  if (hasOverride && !hasType) {
    // return !(hasDescription && isAssignement(statement));
    return true;
  }

  return false;
}

function getEnumTag(tags: doctrine.Tag[]): doctrine.Tag | null {
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].title === 'enum') {
      return tags[i];
    }
  }
  return null;
}

function getTypedefTag(tags: doctrine.Tag[]): doctrine.Tag | null {
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].title === 'typedef') {
      return tags[i];
    }
  }
  return null;
}

/**
 * `foo.Bar = {A: 'a', B: 'b'}` => ['A', 'B']
 */
function getEnumKeys(statement: estree.ExpressionStatement): string[] {
  if (statement.expression.type !== Syntax.AssignmentExpression) {
    throw new Error('AssignmentExpression are expected: ' + statement.expression.type);
  }
  if (statement.expression.right.type !== 'ObjectExpression') {
    return [];
  }
  return statement.expression.right.properties.map(property => {
    const key = property.key;
    switch (key.type) {
      case 'Identifier':
        return key.name;
      case 'Literal':
        if (!key.raw) {
          throw new Error('Unexpected literal raw: ' + key.raw);
        }
        return key.raw;
      default:
        throw new Error(`getEnumKeys(): Unexpected key: ${key.type}`);
    }
  });
}

/**
 * `goog.Foo = goog.Bar` => `goog.Bar`
 */
function getOriginalEnum(statement: estree.ExpressionStatement): string | null {
  if (statement.expression.type !== Syntax.AssignmentExpression) {
    throw new Error('AssignmentExpression are expected: ' + statement.expression.type);
  }
  const right = statement.expression.right;
  if (right.type === 'Identifier' || right.type === 'MemberExpression') {
    return getMemberExpressionNameListNoLiteral(right).join('.');
  }
  return null;
}

interface GetTsTypeOptions {
  isChildOfTypeApplication?: boolean;
  isUnionTypeMember?: boolean;
  isRestType?: boolean;
}

function getTsType(type: doctrine.Type | null | undefined, opts?: GetTsTypeOptions): string {
  opts = opts || {};
  if (!type) {
    // no type property if doctrine fails to parse type.
    return 'any';
  }

  /* eslint-disable no-case-declarations */
  // TODO: use doctrine.Styntax
  switch (type.type) {
    case 'NameExpression':
      let typeName = util.renameReservedModuleName(type.name);
      typeName = replaceTypeName(typeName, opts);
      const paramNum = getTsGenericTypeParamNum(type.name);
      if (paramNum && !opts.isChildOfTypeApplication) {
        const typeParams: string[] = [];
        for (let i = 0; i < paramNum; i++) {
          typeParams.push('any');
        }
        return `${typeName}<${typeParams.join(', ')}>`;
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
      return getTsType(type.expression, opts);
    case 'UnionType':
      let union = type.elements.map(el => getTsType(el, {isUnionTypeMember: true})).join('|');
      if (opts.isRestType) {
        union = `(${union})`;
      }
      return union;
    case 'RestType':
      return `${getTsType(type.expression, {isRestType: true})}[]`;
    case 'TypeApplication':
      return getTypeApplicationString(type);
    case 'FunctionType':
      const params = type.params.map((paramType, index) => ({
        type: getTsType(paramType),
        name: getArgName(`arg${index}`, paramType),
      }));
      return toFunctionTypeString(params, getTsType(type.result), opts);
    case 'RecordType':
      return toRecordTypeString(type);
    default:
      throw new Error(`Unexpected type: ${type.type}`);
  }
  /* eslint-enable no-case-declarations */
}

function getTypeApplicationString(type: doctrine.type.TypeApplication): string {
  const baseType = getTsType(type.expression, {isChildOfTypeApplication: true});
  if (baseType === 'Object') {
    return getObjectTypeApplicationString(type.applications);
  } else if (isNotTsGenericType(baseType)) {
    return baseType;
  }
  const paramStrList = type.applications.map(app => getTsType(app));
  const paramNum = getTsGenericTypeParamNum(baseType);
  if (paramStrList.length < paramNum) {
    const diff = paramNum - paramStrList.length;
    for (let i = 0; i < diff; i++) {
      paramStrList.push('any');
    }
  }
  return `${baseType}<${paramStrList.join(', ')}>`;
}

function getObjectTypeApplicationString(applications: doctrine.Type[]): string {
  let indexType = 'string';
  let valueType;
  if (applications.length === 1) {
    valueType = getTsType(applications[0]);
  } else if (applications.length === 2) {
    indexType = getTsType(applications[0]);
    valueType = getTsType(applications[1]);
  } else {
    throw new Error(`Object cannot accept type application lenght: ${applications.length}`);
  }

  if (indexType !== 'string' && indexType !== 'number') {
    indexType = 'string';
  }
  return `{[index: ${indexType}]: ${valueType}}`;
}

function isNotTsGenericType(name: string): boolean {
  const nonGenericTypes = {
    Object: true,
    // TODO: Iterator and ArrayLike has a type parameter implicitly.
    'goog.iter.Iterable': true,
    'goog.array.ArrayLike': true,
  };
  return name in nonGenericTypes;
}

function getTsGenericTypeParamNum(name: string): number {
  const genericTypes: Record<string, number> = {
    Array: 1,
    IThenable: 1,
    Map: 2,
    NodeListOf: 1,
    Set: 1,
    WeakMap: 2,
    'goog.Promise': 2,
    'goog.Thenable': 1,
    'goog.async.Deferred': 1,
    'goog.dom.TagName': 1,
    'goog.events.EventHandler': 1,
    'goog.events.EventId': 1,
    'goog.iter.Iterator': 1,
    'goog.structs.Heap': 2,
    'goog.structs.Map': 2,
    'goog.structs.Pool': 1,
    'goog.structs.PriorityPool': 1,
    'goog.structs.Set': 1,
    'goog.structs.TreeNode': 2,
  };
  return genericTypes[name] || 0;
}

function getArgName(name: string, type: doctrine.Type | null | undefined): string {
  if (isReservedWord(name)) {
    name += '_';
  }

  if (!type) {
    return name;
  }

  switch (type.type) {
    case 'OptionalType':
      return `${name}?`;
    case 'RestType':
      return `...${name}`;
    default:
      return name;
  }
}

function isReservedWord(name: string): boolean {
  return name === 'class';
}

function getFunctionAnnotation(
  tags: doctrine.Tag[],
  opt_ignoreReturn?: boolean,
  opt_ignoreTemplate?: boolean
): string {
  const params: {type: any; name: string}[] = [];
  let returns = '';

  tags.forEach(tag => {
    switch (tag.title) {
      case 'param':
        if (!tag.name) {
          throw new Error('tag.name of param is undefined: ' + tag.name);
        }
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
  const args = toFunctionArgsString(params);
  if (opt_ignoreReturn) {
    return args;
  }
  return `${args}: ${returns}`;
}

function getTemplates(tags: doctrine.Tag[]): string[] {
  let templates: string[] = [];
  tags.some(tag => {
    if (tag.title === 'template') {
      templates = tag.description!.split(',').map(t => t.trim());
      return true;
    }
    return false;
  });
  return templates;
}

function getClassConstructorAnnotation(tags: doctrine.Tag[]): string {
  return getFunctionAnnotation(tags, true, true);
}

function getParentClasses(tags: doctrine.Tag[]): string[] {
  return tags.filter(tag => tag.title === 'extends').map(tag => getTsType(tag.type));
}

function getTypeAnnotation(
  tags: doctrine.Tag[],
  statement: estree.Statement | estree.ModuleDeclaration
): string {
  const typeTag = tags.find(tag => tag.title === 'type');
  if (typeTag) {
    return getTsType(typeTag.type);
  } else if (isAssignement(statement)) {
    return 'any';
  } else {
    console.error(tags);
    throw new Error('Unsupported type annotations.');
  }
}

function toRecordTypeString(tag: doctrine.type.RecordType): string {
  return `{${tag.fields.map(field => `${field.key}: ${getTsType(field.value)}`).join('; ')}}`;
}

function toFunctionTypeString(
  params: {type: string; name: string}[],
  ret: string,
  opts?: GetTsTypeOptions
): string {
  opts = opts || {};
  const args = toFunctionArgsString(params);
  const returns = ret ? ret : 'void';
  let str = `${args} => ${returns}`;
  if (opts.isUnionTypeMember) {
    str = `(${str})`;
  }
  return str;
}

function toFunctionArgsString(params: {type: string; name: string}[]): string {
  return `(${params.map(param => `${param.name}: ${param.type}`).join(', ')})`;
}

/**
 * `foo = bar;`
 */
interface AssignmentStatement extends estree.ExpressionStatement {
  expression: estree.AssignmentExpression;
}

function isAssignement(
  statement: estree.Statement | estree.ModuleDeclaration
): statement is AssignmentStatement {
  return (
    statement.type === Syntax.ExpressionStatement &&
    statement.expression.type === Syntax.AssignmentExpression
  );
}

function isFunctionDeclaration(
  statement: estree.Statement | estree.ModuleDeclaration,
  tags: doctrine.Tag[]
): boolean {
  const isFunction = tags.some(tag => tag.title === 'param' || tag.title === 'return');

  if (isFunction) {
    return true;
  }

  if (isAssignement(statement)) {
    if (statement.expression.right.type === Syntax.FunctionExpression) {
      return true;
    } else if (statement.expression.right.type === Syntax.MemberExpression) {
      const right = getMemberExpressionNameListNoLiteral(statement.expression.right).join('.');
      switch (right) {
        case 'goog.abstractMethod':
        case 'goog.nullFunction':
        case 'goog.functions.TRUE':
        case 'goog.functions.FALSE':
        case 'goog.functions.NULL':
          return true;
        default:
        // ignore
      }
    }
    return false;
  }

  const isNotFunction = tags.some(tag => {
    switch (tag.title) {
      case 'const':
      case 'constructor':
      case 'define':
      case 'dict':
      case 'enum':
      case 'extends':
      case 'implements':
      case 'interface':
      case 'record':
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

function isClassDeclaration(
  statement: estree.Statement | estree.ModuleDeclaration,
  tags: doctrine.Tag[]
): boolean {
  return tags.some(tag => tag.title === 'constructor');
}

function isInterfaceDeclaration(
  statement: estree.Statement | estree.ModuleDeclaration,
  tags: doctrine.Tag[]
): boolean {
  return tags.some(tag => tag.title === 'interface' || tag.title === 'record');
}

function getFullName(statement: estree.Statement | estree.ModuleDeclaration): string[] | null {
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

function getFullNameFromVariableDeclaration(statement: estree.VariableDeclaration) {
  // No variable declarations in Closure Library
  return null;
}

/**
 * @param {Object} statement
 * @return {Array<string>|null}
 */
function getFullNameFromExpressionStatement(
  statement: estree.ExpressionStatement
): string[] | null {
  const expression = statement.expression;
  let targetExpression: estree.MemberExpression | estree.Identifier;
  switch (expression.type) {
    case Syntax.AssignmentExpression:
      if (
        expression.left.type !== Syntax.MemberExpression &&
        expression.left.type !== Syntax.Identifier
      ) {
        throw new Error(`Unexpected expression: ${expression.left.type}`);
      }
      targetExpression = expression.left;
      break;
    case Syntax.MemberExpression:
      targetExpression = expression;
      break;
    case Syntax.CallExpression:
      // ex: @fileoverview befores goog.provide('foo')
      return null;
    default:
      console.error(statement);
      throw new Error(`Unexpected expression: ${expression.type}`);
  }

  return getMemberExpressionNameList(targetExpression);
}

function getMemberExpressionNameListNoLiteral(
  expression: estree.MemberExpression | estree.Identifier
): string[] {
  const nameList = getMemberExpressionNameList(expression);
  if (!nameList) {
    console.error(expression);
    throw new Error('The expressoin includes a literal unexpectedly');
  }
  return nameList;
}

/**
 * @param {Object} expression
 * @return {Array.<string>|null} null if the expression includes a literal.
 */
function getMemberExpressionNameList(
  expression: estree.MemberExpression | estree.Identifier
): string[] | null {
  const fullname: string[] = [];
  let includeLiteral = false;
  estraverse.traverse(expression, {
    enter(node, parent) {
      if ((node.type === 'MemberExpression' && node.computed) || node.type === Syntax.Literal) {
        includeLiteral = true;
        this.break();
      }
    },
    leave(node, parent) {
      if (node.type === Syntax.Identifier) {
        fullname.push(node.name);
      }
    },
  });
  if (includeLiteral) {
    return null;
  }
  return fullname;
}

function replaceTypeName(name: string, opts: GetTsTypeOptions): string {
  const map = {
    EventTarget: 'goog.globalEventTarget',
    WebWorker: 'Worker',
    // TODO: goog.Thenable and Thenable is confusing, Thenable is renamed to _Thenable temporarily.
    Thenable: '_Thenable',
    // deprecated: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem
    HTMLMenuItemElement: 'HTMLElement',
    // deprecated: https://developer.mozilla.org/en-US/docs/Web/API/HTMLIsIndexElement
    HTMLIsIndexElement: 'HTMLElement',
  };
  const genericsMap = {
    NodeList: 'NodeListOf',
  };
  if (opts.isChildOfTypeApplication && name in genericsMap) {
    return genericsMap[name];
  } else if (name in map) {
    return map[name];
  } else {
    return name;
  }
}
