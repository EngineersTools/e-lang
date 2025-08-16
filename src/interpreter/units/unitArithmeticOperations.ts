import {
  ConversionDeclaration,
  DimensionDeclaration,
  ELangProgram,
  MeasurementLiteral,
  StatementBlock,
  UnitDeclaration,
} from "../../language/generated/ast.js";
import {
  createComplexUnitFamilyType,
  isComplexUnitFamilyType,
  isMeasurementType,
} from "../../language/type-system/descriptions.js";
import { inferType } from "../../language/type-system/infer.js";
import { RunnerContext } from "../RunnerContext.js";

export function createUnitDeclaration(
  program: ELangProgram,
  name: string,
  longName?: string,
  description?: string
): UnitDeclaration {
  return {
    $container: program,
    $type: "UnitDeclaration",
    name,
    longName,
    description,
  };
}

export function createUnitFamilyDeclaration(
  program: ELangProgram,
  name: string,
  exported = false,
  description?: string
): DimensionDeclaration {
  return {
    $container: program,
    $type: "DimensionDeclaration",
    export: exported,
    name,
    description,
    units: [],
    conversions: [],
  };
}

export function addUnitDeclarationToUnitFamilyDeclaration(
  unitDeclaration: UnitDeclaration,
  unitFamily: DimensionDeclaration
) {
  unitFamily.units.push(unitDeclaration);
}

export function addConversionDeclarationToUnitFamilyDeclaration(
  unitConversion: ConversionDeclaration,
  unitFamily: DimensionDeclaration
) {
  unitFamily.conversions.push(unitConversion);
}

export function addUnitFamilyDeclarationToProgram(
  unitFamilyDeclaration: DimensionDeclaration,
  program: ELangProgram
) {
  program.statements.push(unitFamilyDeclaration);
}

export function addUnitFamilyDeclarationToStatementBlock(
  unitFamilyDeclaration: DimensionDeclaration,
  block: StatementBlock
) {
  block.statements.push(unitFamilyDeclaration);
}

export async function multiplyMeasurements(
  left: MeasurementLiteral,
  right: MeasurementLiteral,
  context: RunnerContext
): Promise<MeasurementLiteral> {
  const leftType = inferType(left, context.typeEnvironment);
  const rightType = inferType(right, context.typeEnvironment);

  if (isMeasurementType(leftType) && isMeasurementType(rightType)) {
    const resultValue = left.value.value * right.value.value;

    const leftFamilyTypes = isComplexUnitFamilyType(leftType.unitFamilyType)
      ? leftType.unitFamilyType.unitFamilies
      : [leftType.unitFamilyType];

    const rightFamilyTypes = isComplexUnitFamilyType(rightType.unitFamilyType)
      ? rightType.unitFamilyType.unitFamilies
      : [rightType.unitFamilyType];

    const resultUnitFamilyType = createComplexUnitFamilyType([
      ...leftFamilyTypes,
      ...rightFamilyTypes,
    ]);

    console.log(
      "resultUnitFamilyType",
      resultUnitFamilyType.unitFamilies.map((f) => f.unitTypes)
    );

    return {
      ...right,
      value: resultValue,
      unit: {
        ...right.unit,
        unitFamily: resultUnitFamilyType,
      },
    } as unknown as MeasurementLiteral;
  }

  return left;
}
