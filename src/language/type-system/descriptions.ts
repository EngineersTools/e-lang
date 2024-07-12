/**
 * This modulde contains all the type descriptions
 * used in the type system of the e-lang language.
 */

import { AstNode } from "langium";

export type TypeDescription =
  | BooleanType
  | EmptyListType
  | ErrorType
  | FormulaType
  | IntersectionType
  | LambdaType
  | ListType
  | MeasurementType
  | ModelMemberType
  | ModelType
  | NumberType
  | NullType
  | ParameterType
  | ProcedureType
  | TextType
  | UnionType
  | UnitConversionType
  | UnitFamilyType
  | UnitType;

// STRING
export interface TextType {
  readonly $type: "text";
}

export function createTextType(): TextType {
  return {
    $type: "text",
  };
}

export function isTextType(item: TypeDescription): item is TextType {
  return item.$type === "text";
}

// NUMBER
export interface NumberType {
  readonly $type: "number";
}

export function createNumberType(): NumberType {
  return {
    $type: "number",
  };
}

export function isNumberType(item: TypeDescription): item is NumberType {
  return item.$type === "number";
}

// BOOLEAN
export interface BooleanType {
  readonly $type: "boolean";
}

export function createBooleanType(): BooleanType {
  return {
    $type: "boolean",
  };
}

export function isBooleanType(item: TypeDescription): item is BooleanType {
  return item.$type === "boolean";
}

// NULL
export interface NullType {
  readonly $type: "null";
}

export function createNullType(): NullType {
  return {
    $type: "null",
  };
}

export function isNullType(item: TypeDescription): item is NullType {
  return item.$type === "null";
}

// MEASUREMENT
export interface MeasurementType {
  readonly $type: "measurement";
  readonly unitFamilyType: UnitFamilyType;
}

export function createMeasurementType(
  unitFamilyType: UnitFamilyType
): MeasurementType {
  return {
    $type: "measurement",
    unitFamilyType,
  };
}

export function isMeasurementType(
  item: TypeDescription
): item is MeasurementType {
  return item.$type === "measurement";
}

// UNIT CONVERSION
export interface UnitConversionType {
  readonly $type: "unitConversion";
  readonly from: UnitType;
  readonly to: UnitType;
  readonly conversionType: FormulaType | LambdaType;
}

export function createUnitConversionType(
  from: UnitType,
  to: UnitType,
  conversionType: FormulaType | LambdaType
): UnitConversionType {
  return {
    $type: "unitConversion",
    from,
    to,
    conversionType,
  };
}

export function isUnitConversionType(
  item: TypeDescription
): item is UnitConversionType {
  return item.$type === "unitConversion";
}

// UNIT FAMILY
export interface UnitFamilyType {
  readonly $type: "unitFamily";
  readonly name: string;
  readonly unitTypes?: UnitType[];
  readonly conversionTypes?: UnitConversionType[];
}

export function createUnitFamilyType(
  name: string,
  unitTypes?: UnitType[],
  conversionTypes?: UnitConversionType[]
): UnitFamilyType {
  return {
    $type: "unitFamily",
    name,
    unitTypes,
    conversionTypes,
  };
}

export function isUnitFamilyType(
  item: TypeDescription
): item is UnitFamilyType {
  return item.$type === "unitFamily";
}

// UNIT
export interface UnitType {
  readonly $type: "unit";
  readonly unitName: string;
  readonly unitFamilyType?: UnitFamilyType;
  readonly unitDescription?: string;
  readonly unitLongName?: string;
}

export function createUnitType(
  unitName: string,
  unitDescription?: string,
  unitLongName?: string,
  unitFamilyType?: UnitFamilyType
): UnitType {
  return {
    $type: "unit",
    unitName,
    unitFamilyType,
    unitDescription,
    unitLongName,
  };
}

export function isUnitType(item: TypeDescription): item is UnitType {
  return item.$type === "unit";
}

// MODEL
export interface ModelMemberType {
  readonly $type: "modelMember";
  readonly name: string;
  readonly typeDesc: TypeDescription;
  readonly optional?: boolean;
}

export function createModelMemberType(
  name: string,
  typeDesc: TypeDescription,
  optional?: boolean
): ModelMemberType {
  return {
    $type: "modelMember",
    name,
    typeDesc,
    optional,
  };
}

export function isModelMemberType(
  item: TypeDescription
): item is ModelMemberType {
  return item.$type === "modelMember";
}

export type ModelTypeSource = "declaration" | "value";

export interface ModelType {
  readonly $type: "model";
  readonly $source: ModelTypeSource;
  readonly memberTypes: ModelMemberType[];
  readonly parentTypes?: ModelType[];
  readonly modelName?: string;
}

export function createModelTypeDescription(
  source: ModelTypeSource,
  memberTypes: ModelMemberType[],
  parentTypes?: ModelType[],
  modelName?: string
): ModelType {
  return {
    $type: "model",
    $source: source,
    memberTypes,
    parentTypes,
    modelName
  };
}

export function isModelType(item: TypeDescription): item is ModelType {
  return item.$type === "model";
}

// PARAMETER
export interface ParameterType {
  readonly $type: "parameter";
  readonly name: string;
  readonly typeDescription: TypeDescription;
}

export function createParameterType(
  name: string,
  type: TypeDescription
): ParameterType {
  return {
    $type: "parameter",
    name,
    typeDescription: type,
  };
}

export function isParameterType(item: TypeDescription): item is ParameterType {
  return item.$type === "parameter";
}

// FORMULA
export interface FormulaType {
  readonly $type: "formula";
  readonly returnType: TypeDescription;
  readonly parameterTypes?: ParameterType[];
}

export function createFormulaType(
  returnType: TypeDescription,
  parameterTypes?: ParameterType[]
): FormulaType {
  return {
    $type: "formula",
    returnType,
    parameterTypes,
  };
}

export function isFormulaType(item: TypeDescription): item is FormulaType {
  return item.$type === "formula";
}

export function isFormulaTypeWithParameters(
  item: TypeDescription
): item is FormulaType {
  return isFormulaType(item) && item.parameterTypes !== undefined;
}

// PROCEDURE
export interface ProcedureType {
  readonly $type: "procedure";
  readonly returnType?: TypeDescription;
  readonly parameters?: ParameterType[];
}

export function createProcedureType(
  returnType?: TypeDescription,
  parameters?: ParameterType[]
): ProcedureType {
  return {
    $type: "procedure",
    parameters,
    returnType,
  };
}

export function isProcedureType(item: TypeDescription): item is ProcedureType {
  return item.$type === "procedure";
}

export function isProcedureTypeWithReturnType(
  item: TypeDescription
): item is ProcedureType {
  return isProcedureType(item) && item.returnType !== undefined;
}

export function isProcedureTypeWithParameters(
  item: TypeDescription
): item is ProcedureType {
  return isProcedureType(item) && item.parameters !== undefined;
}

export function isProcedureTypeWithReturnTypeAndParameters(
  item: TypeDescription
): item is ProcedureType {
  return (
    isProcedureTypeWithReturnType(item) && isProcedureTypeWithParameters(item)
  );
}

export function isProcedureTypeWithoutReturnTypeWithParameters(
  item: TypeDescription
): item is ProcedureType {
  return (
    !isProcedureTypeWithReturnType(item) && isProcedureTypeWithParameters(item)
  );
}

export function isProcedureTypeWithReturnTypeWithoutParameters(
  item: TypeDescription
): item is ProcedureType {
  return (
    isProcedureTypeWithReturnType(item) && !isProcedureTypeWithParameters(item)
  );
}

// LAMBDA
export interface LambdaType {
  readonly $type: "lambda";
  readonly returnType?: TypeDescription;
  readonly parameters?: ParameterType[];
}

export function createLambdaType(
  returnType?: TypeDescription,
  parameters?: ParameterType[]
): LambdaType {
  return {
    $type: "lambda",
    returnType,
    parameters,
  };
}

export function isLambdaType(item: TypeDescription): item is LambdaType {
  return item.$type === "lambda";
}

export function isLambdaTypeWithReturnType(
  item: TypeDescription
): item is LambdaType {
  return isLambdaType(item) && item.returnType !== undefined;
}

export function isLambdaTypeWithParameters(
  item: TypeDescription
): item is LambdaType {
  return isLambdaType(item) && item.parameters !== undefined;
}

export function isLambdaTypeWithReturnTypeAndParameters(
  item: TypeDescription
): item is LambdaType {
  return isLambdaTypeWithReturnType(item) && isLambdaTypeWithParameters(item);
}

export function isLambdaTypeWithoutReturnTypeWithParameters(
  item: TypeDescription
): item is LambdaType {
  return !isLambdaTypeWithReturnType(item) && isLambdaTypeWithParameters(item);
}

export function isLambdaTypeWithReturnTypeWithoutParameters(
  item: TypeDescription
): item is LambdaType {
  return isLambdaTypeWithReturnType(item) && !isLambdaTypeWithParameters(item);
}

// LIST
export interface EmptyListType {
  readonly $type: "emptyList";
}

export function createEmptyListType(): EmptyListType {
  return {
    $type: "emptyList",
  };
}

export function isEmtpyListType(item: TypeDescription): item is EmptyListType {
  return item.$type === "emptyList";
}

export interface ListType {
  readonly $type: "list";
  readonly itemType: TypeDescription;
}

export function createListType(itemType: TypeDescription): ListType {
  return {
    $type: "list",
    itemType,
  };
}

export function isListType(item: TypeDescription): item is ListType {
  return item.$type === "list";
}

// ERROR
export interface ErrorType {
  readonly $type: "error";
  readonly source?: AstNode;
  readonly message: string;
}

export function createErrorType(message: string, source?: AstNode): ErrorType {
  return {
    $type: "error",
    message,
    source,
  };
}

export function isErrorType(item: TypeDescription): item is ErrorType {
  return item.$type === "error";
}

// UNION TYPE
export interface UnionType {
  readonly $type: "unionType";
  readonly types: TypeDescription[];
}

export function createUnionType(...types: TypeDescription[]): UnionType {
  return {
    $type: "unionType",
    types: Array.from(new Set(types.sort())),
  };
}

export function isUnionType(item: TypeDescription): item is UnionType {
  return item.$type === "unionType";
}

// UNION INTERSECTION
export interface IntersectionType {
  readonly $type: "intersectionType";
  readonly types: TypeDescription[];
}

export function createIntersectionType(
  ...types: TypeDescription[]
): IntersectionType {
  return {
    $type: "intersectionType",
    types: Array.from(new Set(types.sort())),
  };
}

export function isIntersectionType(
  item: TypeDescription
): item is IntersectionType {
  return item.$type === "intersectionType";
}
