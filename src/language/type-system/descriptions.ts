/**
 * This modulde contains all the type descriptions
 * used in the type system of the elang language.
 */

import { AstNode } from "langium";
import {
  BooleanLiteral,
  MeasurementLiteral,
  ModelDeclaration,
  ModelValue,
  NullLiteral,
  NumberLiteral,
  ParameterDeclaration,
  StringLiteral,
  TypeReference,
  UnitDeclaration,
  UnitFamilyDeclaration,
} from "../generated/ast.js";
import { inferTypeRef } from "./infer.js";
import { getCircularReplacer } from "../helpers.js";

export type TypeDescription =
  | TextType
  | NumberType
  | BooleanType
  | NullType
  | MeasurementType
  | ModelType
  | FormulaType
  | ProcedureType
  | LambdaType
  | UnitFamilyType
  | UnitType
  | ListType
  | ErrorType;

// STRING
export interface TextType {
  readonly $type: "text";
  readonly literal?: StringLiteral;
}

export function createTextType(literal?: StringLiteral): TextType {
  return {
    $type: "text",
    literal,
  };
}

export function isTextType(item: TypeDescription): item is TextType {
  return item.$type === "text";
}

// NUMBER
export interface NumberType {
  readonly $type: "number";
  readonly literal?: NumberLiteral;
}

export function createNumberType(literal?: NumberLiteral): NumberType {
  return {
    $type: "number",
    literal,
  };
}

export function isNumberType(item: TypeDescription): item is NumberType {
  return item.$type === "number";
}

// BOOLEAN
export interface BooleanType {
  readonly $type: "boolean";
  readonly literal?: BooleanLiteral;
}

export function createBooleanType(literal?: BooleanLiteral): BooleanType {
  return {
    $type: "boolean",
    literal,
  };
}

export function isBooleanType(item: TypeDescription): item is BooleanType {
  return item.$type === "boolean";
}

// NULL
export interface NullType {
  readonly $type: "null";
  readonly literal?: NullLiteral;
}

export function createNullType(literal?: NullLiteral): NullType {
  return {
    $type: "null",
    literal,
  };
}

export function isNullType(item: TypeDescription): item is NullType {
  return item.$type === "null";
}

// MEASUREMENT
export interface MeasurementType {
  readonly $type: "measurement";
  readonly literal?: MeasurementLiteral;
}

export function createMeasurementType(
  literal?: MeasurementLiteral
): MeasurementType {
  return {
    $type: "measurement",
    literal,
  };
}

export function isMeasurementType(
  item: TypeDescription
): item is MeasurementType {
  return item.$type === "measurement";
}

// UNIT FAMILY
export interface UnitFamilyType {
  readonly $type: "unitFamily";
  readonly declaration: UnitFamilyDeclaration;
}

export function createUnitFamilyType(
  declaration: UnitFamilyDeclaration
): UnitFamilyType {
  return {
    $type: "unitFamily",
    declaration,
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
  readonly declaration: UnitDeclaration;
}

export function createUnitType(declaration: UnitDeclaration): UnitType {
  return {
    $type: "unit",
    declaration,
  };
}

export function isUnitType(item: TypeDescription): item is UnitType {
  return item.$type === "unit";
}

// MODEL
export interface ModelType {
  readonly $type: "model";
  readonly declaration?: ModelDeclaration;
  readonly value?: ModelValue;
}

export function createModelType(declaration: ModelDeclaration): ModelType {
  return {
    $type: "model",
    declaration,
  };
}

export function createModelTypeFromValue(modelValue: ModelValue): ModelType {
  return {
    $type: "model",
    value: modelValue,
  };
}

export function isModelType(item: TypeDescription): item is ModelType {
  return item.$type === "model";
}

// FORMULA
export interface FormulaType {
  readonly $type: "formula";
  readonly returnType: TypeDescription;
  readonly parameters?: ParameterDeclaration[];
}

export function createFormulaType(
  returnType: TypeDescription,
  parameters?: ParameterDeclaration[]
): FormulaType {
  return {
    $type: "formula",
    parameters,
    returnType,
  };
}

export function isFormulaType(item: TypeDescription): item is FormulaType {
  return item.$type === "formula";
}

// PROCEDURE
export interface ProcedureType {
  readonly $type: "procedure";
  readonly parameters?: ParameterDeclaration[];
  readonly returnType?: TypeDescription;
}

export function createProcedureType(
  returnType?: TypeDescription,
  parameters?: ParameterDeclaration[]
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

// LAMBDA
export interface LambdaType {
  readonly $type: "lambda";
  readonly parameters?: ParameterDeclaration[];
  readonly returnType?: TypeDescription;
}

export function createLambdaType(
  returnType?: TypeDescription,
  parameters?: ParameterDeclaration[]
): LambdaType {
  return {
    $type: "lambda",
    parameters,
    returnType,
  };
}

export function isLambdaType(item: TypeDescription): item is LambdaType {
  return item.$type === "lambda";
}

// LIST
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

// TYPE REFERENCE TO TYPE DESCRIPTION
export function typeReferenceToTypeDescription(
  typeRef: TypeReference
): TypeDescription {
  return inferTypeRef(typeRef);
}

// TO STRING
export function typeToString(item: TypeDescription): string {
  if (isModelType(item)) {
    return (
      item.declaration?.name ??
      JSON.stringify(item.value, getCircularReplacer())
    );
  } else if (
    isFormulaType(item) ||
    isProcedureType(item) ||
    isLambdaType(item)
  ) {
    if (item.parameters) {
      const params = item.parameters
        .map((e) => {
          if (e.type)
            return `${e.name}: ${typeToString(
              typeReferenceToTypeDescription(e.type)
            )}`;
          else return `${e.name}`;
        })
        .join(", ");

      if (item.returnType)
        return `(${params}) => ${typeToString(item.returnType)}`;
      else return `(${params})`;
    }
  }

  return item.$type;
}
