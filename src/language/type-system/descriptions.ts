/**
 * This module contains all the type descriptions
 * used in the type system of the e-lang language.
 */
import { AstNode } from "langium";
import { areEqual, sortBy } from "../../utils/array.functions.js";
import { ModelDeclaration } from "../generated/ast.js";

export type ELangType =
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
  | ComplexUnitFamilyType
  | UnitType;

export function equalsType(left: ELangType, right: ELangType): boolean {
  if (isUnionType(left) && isUnionType(right)) {
    return areEqual(
      left.types.map((t) => getTypeName(t)).sort(),
      right.types.map((t) => getTypeName(t)).sort()
    );
  } else if (isUnionType(left) || isUnionType(right)) {
    if (isUnionType(left)) {
      return left.types.map((t) => getTypeName(t)).includes(getTypeName(right));
    } else if (isUnionType(right)) {
      return right.types.map((t) => getTypeName(t)).includes(getTypeName(left));
    } else {
      return false;
    }
  } else if (isModelType(left) && isModelType(right)) {
    return modelTypesAreEqual(left, right) === true;
  }

  return getTypeName(left) === getTypeName(right);
}

export function modelTypesAreEqual(
  left: ModelType,
  right: ModelType
): boolean | ErrorType {
  const errors: ErrorType[] = [];

  if (left.$source === "declaration" && right.$source === "declaration") {
    return left.modelName === right.modelName;
  } else if (left.$source === "value" && right.$source === "value") {
    const haveSameNumberOfMembers =
      left.memberTypes.length === right.memberTypes.length;

    if (!haveSameNumberOfMembers)
      errors.push(
        createErrorType(
          "Model types do not have the same number of members",
          right.modelDeclaration
        )
      );

    const allLeftMembersIncludedInRightMembers = left.memberTypes.map((m) =>
      right.memberTypes.map((n) => n.name).includes(m.name)
    );

    if (!allLeftMembersIncludedInRightMembers.reduce((p, c) => p && c, true))
      errors.push(
        createErrorType(
          `Model '${getTypeName(
            left
          )}' does not include all the members in '${getTypeName(right)}'`,
          right.modelDeclaration
        )
      );

    const allLeftMembersAreOfSameTypeAsRightMembers = left.memberTypes.map(
      (lm) => {
        const rightMemberType = right.memberTypes.find(
          (rm) => rm.name === lm.name
        );

        if (rightMemberType) {
          const membersAreEqual = equalsType(
            lm.typeDesc,
            rightMemberType.typeDesc
          );
          if (!membersAreEqual)
            errors.push(
              createErrorType(
                `Member '${rightMemberType.name}' is not of the same type as '${lm.name}'`,
                right.modelDeclaration
              )
            );
          return membersAreEqual;
        } else {
          return false;
        }
      }
    );

    if (
      !allLeftMembersAreOfSameTypeAsRightMembers.reduce((p, c) => p && c, true)
    )
      errors.push(
        createErrorType(
          `Model '${getTypeName(
            left
          )}' does not have the same type as '${getTypeName(right)}'`,
          right.modelDeclaration
        )
      );

    if (
      haveSameNumberOfMembers &&
      allLeftMembersIncludedInRightMembers.reduce((p, c) => p && c, true) &&
      allLeftMembersAreOfSameTypeAsRightMembers.reduce((p, c) => p && c, true)
    ) {
      return true;
    } else {
      return createErrorType(
        errors.map((e) => e.message).join(" ,"),
        right.modelDeclaration
      );
    }
  } else if (
    (left.$source === "declaration" && right.$source === "value") ||
    (left.$source === "value" && right.$source === "declaration")
  ) {
    const declaration = left.$source === "declaration" ? left : right;
    const value = left.$source === "value" ? left : right;

    const mandatoryMembers = declaration.memberTypes.filter((m) => !m.optional);
    const optionalMembers = declaration.memberTypes.filter((m) => m.optional);

    const allMandatoryMembersIncludedInValueMembers = mandatoryMembers.map(
      (m) => value.memberTypes.map((n) => n.name).includes(m.name)
    );

    if (
      !allMandatoryMembersIncludedInValueMembers.reduce((p, c) => p && c, true)
    )
      errors.push(
        createErrorType(
          `Model '${getTypeName(
            value
          )}' does not include all the mandatory members in '${getTypeName(
            declaration
          )}'`,
          value.modelDeclaration
        )
      );

    const allMandatoryMembersAreOfSameTypeAsValueMembers = mandatoryMembers.map(
      (m) => {
        const valueMemberType = value.memberTypes.find(
          (rm) => rm.name === m.name
        );

        if (valueMemberType) {
          const membersAreEqual = equalsType(
            m.typeDesc,
            valueMemberType.typeDesc
          );
          if (!membersAreEqual)
            errors.push(
              createErrorType(
                `Member '${valueMemberType.name}: ${getTypeName(
                  valueMemberType.typeDesc
                )}' is not of the same type as '${m.name}: ${getTypeName(
                  m.typeDesc
                )}'`,
                value.modelDeclaration
              )
            );
          return membersAreEqual;
        } else {
          return false;
        }
      }
    );

    const allOptionalMembersAreOfSameTypeAsValueMembers = optionalMembers.map(
      (m) => {
        const valueMemberType = value.memberTypes.find(
          (rm) => rm.name === m.name
        );

        if (valueMemberType) {
          const membersAreEqual = equalsType(
            m.typeDesc,
            valueMemberType.typeDesc
          );

          errors.push(
            createErrorType(
              `Member '${valueMemberType.name}: ${getTypeName(
                valueMemberType.typeDesc
              )}' is not of the same type as '${m.name}: ${getTypeName(
                m.typeDesc
              )}'`,
              value.modelDeclaration
            )
          );

          return membersAreEqual;
        } else {
          return true;
        }
      }
    );

    if (
      allMandatoryMembersIncludedInValueMembers.reduce(
        (p, c) => p && c,
        true
      ) &&
      allMandatoryMembersAreOfSameTypeAsValueMembers.reduce(
        (p, c) => p && c,
        true
      ) &&
      allOptionalMembersAreOfSameTypeAsValueMembers.reduce(
        (p, c) => p && c,
        true
      )
    ) {
      return true;
    } else {
      return createErrorType(
        errors.map((e) => e.message).join(", "),
        right.modelDeclaration
      );
    }
  }

  return false;
}

export function getTypeName(
  elangType: ELangType,
  notation: ComplexUnitNameNotation = "NegativeExponent"
): string {
  if (elangType === undefined || isNullType(elangType)) {
    return "null";
  } else if (isFormulaType(elangType)) {
    return `(${
      elangType.parameterTypes?.map((p) => getTypeName(p)).join(",") ?? ""
    }) => ${getTypeName(elangType.returnType)}`;
  } else if (isLambdaType(elangType)) {
    return `(${
      elangType.parameters
        ?.map((p) => `${getTypeName(p)}${p.isOptional ? "?" : ""}`)
        .join(",") ?? ""
    }) => ${elangType.returnType ? getTypeName(elangType.returnType) : "void"}`;
  } else if (isParameterType(elangType)) {
    return getTypeName(elangType.typeDescription);
  } else if (isUnionType(elangType)) {
    return elangType.types.map((t) => getTypeName(t)).join(" or ");
  } else if (isMeasurementType(elangType)) {
    return `number_[${getTypeName(elangType.unitFamilyType)}]`;
  } else if (isUnitFamilyType(elangType)) {
    return elangType.exponent !== undefined && elangType.exponent === 1
      ? elangType.name
      : `${elangType.name}^${elangType.exponent}`;
  } else if (isComplexUnitFamilyType(elangType)) {
    return getComplexUnitFamilyTypeName(elangType.unitFamilies, notation);
  } else if (isModelType(elangType)) {
    return (
      elangType.modelName ??
      `{${elangType.memberTypes.map((m) => m.name).join(",")}}`
    );
  } else if (isUnitConversionType(elangType)) {
    return `${getTypeName(elangType.from)} -> ${getTypeName(elangType.to)}`;
  }

  return elangType.$type;
}

export type ComplexUnitNameNotation = "NegativeExponent" | "Division";

export function getComplexUnitFamilyTypeName(
  unitFamilies: UnitFamilyType[],
  notation: ComplexUnitNameNotation = "NegativeExponent"
): string {
  if (notation === "NegativeExponent") {
    return sortBy(unitFamilies, "name")
      .map((uf) => getTypeName(uf))
      .join("*");
  } else {
    const numerator = getComplexUnitFamilyTypeName(
      unitFamilies.filter((uf) => uf.exponent > 0)
    );
    const denominator = getComplexUnitFamilyTypeName(
      unitFamilies
        .filter((uf) => uf.exponent < 0)
        .map((uf) => invertUnitFamily(uf))
    );
    return `${numerator}/${denominator}`;
  }
}

/**
 * Collects all similar unit families and merges them into
 * one with the correct exponent value
 * @param unitFamilies the unit families to merge
 * @returns An array of unique {@link UnitFamilyType}
 */
export function reduceUnitFamilies(
  unitFamilies: UnitFamilyType[]
): UnitFamilyType[] {
  const output: UnitFamilyType[] = [];

  for (let i = 0; i < unitFamilies.length; i++) {
    const uf = unitFamilies[i];
    const index = output.findIndex((o) => o.name === uf.name);

    if (index === -1) {
      output.push(uf);
    } else {
      const currentExponent = output[index].exponent;
      output[index] = createUnitFamilyType(
        uf.name,
        uf.unitTypes,
        uf.conversionTypes,
        uf.exponent + currentExponent
      );
    }
  }

  return output;
}

// ELANG TEXT TYPE
export interface TextType {
  readonly $type: "text";
}

export function createTextType(): TextType {
  return {
    $type: "text",
  };
}

export function isTextType(item: ELangType): item is TextType {
  return item.$type === "text";
}

// ELANG NUMBER TYPE
export interface NumberType {
  readonly $type: "number";
}

export function createNumberType(): NumberType {
  return {
    $type: "number",
  };
}

export function isNumberType(item: ELangType): item is NumberType {
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

export function isBooleanType(item: ELangType): item is BooleanType {
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

export function isNullType(item: ELangType): item is NullType {
  return item.$type === "null";
}

// MEASUREMENT
export interface MeasurementType {
  readonly $type: "measurement";
  readonly unitFamilyType: UnitFamilyType | ComplexUnitFamilyType;
}

export function createMeasurementType(
  unitFamilyType: UnitFamilyType | ComplexUnitFamilyType
): MeasurementType {
  return {
    $type: "measurement",
    unitFamilyType,
  };
}

export function isMeasurementType(item: ELangType): item is MeasurementType {
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
  item: ELangType
): item is UnitConversionType {
  return item.$type === "unitConversion";
}

// UNIT FAMILY
export interface UnitFamilyType {
  readonly $type: "unitFamily";
  readonly name: string;
  readonly unitTypes?: UnitType[];
  readonly conversionTypes?: UnitConversionType[];
  readonly exponent: number;
}

export interface ComplexUnitFamilyType {
  readonly $type: "complexUnitFamily";
  readonly name: string;
  readonly unitFamilies: UnitFamilyType[];
}

export function createUnitFamilyType(
  name: string,
  unitTypes?: UnitType[],
  conversionTypes?: UnitConversionType[],
  exponent = 1
): UnitFamilyType {
  return {
    $type: "unitFamily",
    name,
    unitTypes,
    conversionTypes,
    exponent,
  };
}

export function createComplexUnitFamilyType(
  unitFamilies: UnitFamilyType[]
): ComplexUnitFamilyType {
  const name = getComplexUnitFamilyTypeName(unitFamilies);
  const reducedUnitFamilies = reduceUnitFamilies(unitFamilies);

  return {
    $type: "complexUnitFamily",
    name,
    unitFamilies: reducedUnitFamilies,
  };
}

export function isUnitFamilyType(item: ELangType): item is UnitFamilyType {
  return item.$type === "unitFamily";
}

export function isComplexUnitFamilyType(
  item: ELangType
): item is ComplexUnitFamilyType {
  return item.$type === "complexUnitFamily";
}

export function invertUnitFamily(unitFamily: UnitFamilyType): UnitFamilyType {
  return createUnitFamilyType(
    unitFamily.name,
    unitFamily.unitTypes,
    unitFamily.conversionTypes,
    -unitFamily.exponent
  );
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

export function isUnitType(item: ELangType): item is UnitType {
  return item.$type === "unit";
}

// MODEL
export interface ModelMemberType {
  readonly $type: "modelMember";
  readonly name: string;
  readonly typeDesc: ELangType;
  readonly optional?: boolean;
}

export function createModelMemberType(
  name: string,
  typeDesc: ELangType,
  optional?: boolean
): ModelMemberType {
  return {
    $type: "modelMember",
    name,
    typeDesc,
    optional,
  };
}

export function isModelMemberType(item: ELangType): item is ModelMemberType {
  return item.$type === "modelMember";
}

export type ModelTypeSource = "declaration" | "value";

export interface ModelType {
  readonly $type: "model";
  readonly $source: ModelTypeSource;
  readonly memberTypes: ModelMemberType[];
  readonly parentTypes?: ModelType[];
  readonly modelName?: string;
  readonly modelDeclaration?: ModelDeclaration;
}

export function createModelTypeDescription(
  source: ModelTypeSource,
  memberTypes: ModelMemberType[],
  parentTypes?: ModelType[],
  modelName?: string,
  modelDeclaration?: ModelDeclaration
): ModelType {
  return {
    $type: "model",
    $source: source,
    memberTypes,
    parentTypes,
    modelName,
    modelDeclaration,
  };
}

export function isModelType(item: ELangType): item is ModelType {
  return item.$type === "model";
}

// PARAMETER
export interface ParameterType {
  readonly $type: "parameter";
  readonly name: string;
  readonly isOptional: boolean;
  readonly typeDescription: ELangType;
}

export function createParameterType(
  name: string,
  isOptional: boolean,
  type: ELangType
): ParameterType {
  return {
    $type: "parameter",
    name,
    isOptional,
    typeDescription: type,
  };
}

export function isParameterType(item: ELangType): item is ParameterType {
  return item.$type === "parameter";
}

// FORMULA
export interface FormulaType {
  readonly $type: "formula";
  readonly returnType: ELangType;
  readonly parameterTypes?: ParameterType[];
}

export function createFormulaType(
  returnType: ELangType,
  parameterTypes?: ParameterType[]
): FormulaType {
  return {
    $type: "formula",
    returnType,
    parameterTypes,
  };
}

export function isFormulaType(item: ELangType): item is FormulaType {
  return item.$type === "formula";
}

export function isFormulaTypeWithParameters(
  item: ELangType
): item is FormulaType {
  return isFormulaType(item) && item.parameterTypes !== undefined;
}

// PROCEDURE
export interface ProcedureType {
  readonly $type: "procedure";
  readonly returnType?: ELangType;
  readonly parameters?: ParameterType[];
}

export function createProcedureType(
  returnType?: ELangType,
  parameters?: ParameterType[]
): ProcedureType {
  return {
    $type: "procedure",
    parameters,
    returnType,
  };
}

export function isProcedureType(item: ELangType): item is ProcedureType {
  return item.$type === "procedure";
}

export function isProcedureTypeWithReturnType(
  item: ELangType
): item is ProcedureType {
  return isProcedureType(item) && item.returnType !== undefined;
}

export function isProcedureTypeWithParameters(
  item: ELangType
): item is ProcedureType {
  return isProcedureType(item) && item.parameters !== undefined;
}

export function isProcedureTypeWithReturnTypeAndParameters(
  item: ELangType
): item is ProcedureType {
  return (
    isProcedureTypeWithReturnType(item) && isProcedureTypeWithParameters(item)
  );
}

export function isProcedureTypeWithoutReturnTypeWithParameters(
  item: ELangType
): item is ProcedureType {
  return (
    !isProcedureTypeWithReturnType(item) && isProcedureTypeWithParameters(item)
  );
}

export function isProcedureTypeWithReturnTypeWithoutParameters(
  item: ELangType
): item is ProcedureType {
  return (
    isProcedureTypeWithReturnType(item) && !isProcedureTypeWithParameters(item)
  );
}

// LAMBDA
export interface LambdaType {
  readonly $type: "lambda";
  readonly returnType?: ELangType;
  readonly parameters?: ParameterType[];
}

export function createLambdaType(
  returnType?: ELangType,
  parameters?: ParameterType[]
): LambdaType {
  return {
    $type: "lambda",
    returnType,
    parameters,
  };
}

export function isLambdaType(item: ELangType): item is LambdaType {
  return item.$type === "lambda";
}

export function isLambdaTypeWithReturnType(
  item: ELangType
): item is LambdaType {
  return isLambdaType(item) && item.returnType !== undefined;
}

export function isLambdaTypeWithParameters(
  item: ELangType
): item is LambdaType {
  return isLambdaType(item) && item.parameters !== undefined;
}

export function isLambdaTypeWithReturnTypeAndParameters(
  item: ELangType
): item is LambdaType {
  return isLambdaTypeWithReturnType(item) && isLambdaTypeWithParameters(item);
}

export function isLambdaTypeWithoutReturnTypeWithParameters(
  item: ELangType
): item is LambdaType {
  return !isLambdaTypeWithReturnType(item) && isLambdaTypeWithParameters(item);
}

export function isLambdaTypeWithReturnTypeWithoutParameters(
  item: ELangType
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

export function isEmptyListType(item: ELangType): item is EmptyListType {
  return item.$type === "emptyList";
}

export interface ListType {
  readonly $type: "list";
  readonly itemType: ELangType;
}

export function createListType(itemType: ELangType): ListType {
  return {
    $type: "list",
    itemType,
  };
}

export function isListType(item: ELangType): item is ListType {
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

export function isErrorType(item: ELangType): item is ErrorType {
  return item.$type === "error";
}

// UNION TYPE
export interface UnionType {
  readonly $type: "unionType";
  readonly types: ELangType[];
}

export function createUnionType(...types: ELangType[]): UnionType {
  return {
    $type: "unionType",
    types: Array.from(new Set(types.sort())),
  };
}

export function isUnionType(item: ELangType): item is UnionType {
  return item.$type === "unionType";
}

// UNION INTERSECTION
export interface IntersectionType {
  readonly $type: "intersectionType";
  readonly types: ELangType[];
}

export function createIntersectionType(
  ...types: ELangType[]
): IntersectionType {
  return {
    $type: "intersectionType",
    types: Array.from(new Set(types.sort())),
  };
}

export function isIntersectionType(item: ELangType): item is IntersectionType {
  return item.$type === "intersectionType";
}
