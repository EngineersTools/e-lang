import { AstNode } from "langium";
import {
  BinaryExpression,
  ConstantDeclaration,
  ConversionDeclaration,
  Expression,
  LambdaDeclaration,
  LambdaType,
  ListValue,
  MeasurementLiteral,
  MeasurementType,
  ModelMemberAssignment,
  ModelValue,
  ParameterDeclaration,
  PropertyDeclaration,
  TypeReference,
  UnitConversionExpression,
  UnitDeclaration,
  UnitFamilyDeclaration,
  isBinaryExpression,
  isBooleanLiteral,
  isConstantDeclaration,
  isConversionDeclaration,
  isExpression,
  isLambdaDeclaration,
  isLambdaType,
  isListValue,
  isMeasurementLiteral,
  isMeasurementType,
  isModelDeclaration,
  isModelMemberAssignment,
  isModelMemberCall,
  isModelValue,
  isNullLiteral,
  isNumberLiteral,
  isParameterDeclaration,
  isPropertyDeclaration,
  isStringLiteral,
  isTypeReference,
  isTypeUnion,
  isUnaryExpression,
  isUnitConversionExpression,
  isUnitDeclaration,
  isUnitFamilyDeclaration,
} from "../generated/ast.js";
import { TypeEnvironment } from "./TypeEnvironment.class.js";
import {
  FormulaType,
  ModelMemberType,
  ParameterType,
  TypeDescription,
  UnitConversionType,
  UnitType,
  LambdaType as LambdaTypeDescription,
  createBooleanType,
  createErrorType,
  createLambdaType,
  createListType,
  createModelMemberType,
  createModelType,
  createNumberType,
  createParameterType,
  createTextType,
  createUnionType,
  createUnitConversionType,
  createUnitFamilyType,
  createUnitType,
  createMeasurementType,
  UnitFamilyType,
  createNullType,
  createEmptyListType,
  isTextType,
  isNumberType,
} from "./descriptions.js";

export function inferType(
  node: AstNode | undefined,
  env: TypeEnvironment
): TypeDescription {
  let type: TypeDescription | undefined;

  if (!node) {
    return createErrorType("Could not infer type for undefined", node);
  }

  if (isConstantDeclaration(node)) {
    type = inferConstantDeclaration(node, env);
  } else if (isTypeReference(node)) {
    type = inferTypeReference(node, env);
  } else if (isExpression(node)) {
    type = inferExpression(node, env);
  } else if (isParameterDeclaration(node)) {
    type = inferParameterDeclaration(node, env);
  } else if (isPropertyDeclaration(node)) {
    type = inferPropertyDeclaration(node, env);
  } else if (isUnitFamilyDeclaration(node)) {
    type = inferUnitFamily(node, env);
  } else if (isUnitDeclaration(node)) {
    type = inferUnit(node);
  } else if (isConversionDeclaration(node)) {
    type = inferUnitConversion(node, env);
  } else if (isUnitConversionExpression(node)) {
    type = inferUnitConversionExpression(node, env);
  } else if (isLambdaType(node)) {
    type = inferLambda(node, env);
  } else if (isLambdaDeclaration(node)) {
    type = inferLambda(node, env);
  }

  if (!type) {
    type = createErrorType("Could not infer type for " + node.$type, node);
  }

  return type;
}

export function inferConstantDeclaration(
  node: ConstantDeclaration,
  env: TypeEnvironment
): TypeDescription {
  if (node.type) {
    return inferType(node.type, env);
  } else if (node.value) {
    return inferType(node.value, env);
  } else {
    return createErrorType(
      "The type of this variable cannot be inferred. Assign a type or a value to it.",
      node
    );
  }
}

export function inferTypeReference(
  typeRef: TypeReference,
  env: TypeEnvironment
): TypeDescription {
  let resolvedType!: TypeDescription;

  if (typeRef.type) {
    resolvedType = inferPrimitive(typeRef);
  } else if (isTypeUnion(typeRef)) {
    resolvedType = createUnionType(
      inferType(typeRef.left, env),
      inferType(typeRef.right, env)
    );
  } else if (isLambdaType(typeRef)) {
    resolvedType = inferLambda(typeRef, env);
  } else if (
    typeRef.model &&
    typeRef.model.ref &&
    isModelDeclaration(typeRef.model.ref)
  ) {
    const memberTypes = typeRef.model.ref.properties.map((member) =>
      inferType(member, env)
    ) as ModelMemberType[];
    resolvedType = createModelType("declaration", memberTypes);
  } else if (isMeasurementType(typeRef)) {
    resolvedType = inferMeasurement(typeRef, env);
  } else {
    resolvedType = createErrorType(
      "Could not infer type for this type reference",
      typeRef
    );
  }

  if (typeRef.array) {
    return createListType(resolvedType);
  }

  return resolvedType;
}

export function inferPrimitive(typeRef: TypeReference): TypeDescription {
  if (typeRef.type === "number") {
    return createNumberType();
  } else if (typeRef.type === "text") {
    return createTextType();
  } else if (typeRef.type === "boolean") {
    return createBooleanType();
  } else {
    return createErrorType("Could not infer primitive type", typeRef);
  }
}

export function inferLambda(
  expr: LambdaDeclaration | LambdaType,
  env: TypeEnvironment
): TypeDescription {
  if (expr.returnType) {
    if (expr.parameters && expr.parameters.length > 0) {
      return createLambdaType(
        inferType(expr.returnType, env),
        expr.parameters.map((param) =>
          inferType(param.type, env)
        ) as ParameterType[]
      );
    } else {
      return createLambdaType(inferType(expr.returnType, env));
    }
  } else {
    return createLambdaType();
  }
}

export function inferParameterDeclaration(
  expr: ParameterDeclaration,
  env: TypeEnvironment
): TypeDescription {
  return createParameterType(inferType(expr.type, env));
}

export function inferPropertyDeclaration(
  expr: PropertyDeclaration,
  env: TypeEnvironment
): TypeDescription {
  return createModelMemberType(inferType(expr.type, env));
}

export function inferMeasurement(
  expr: MeasurementLiteral | MeasurementType,
  env: TypeEnvironment
): TypeDescription {
  if (
    isMeasurementLiteral(expr) &&
    isUnitDeclaration(expr.unit) &&
    isUnitFamilyDeclaration(expr.unit.$container) &&
    expr.unit.ref
  ) {
    const unitFamily = inferUnitFamily(
      expr.unit.$container,
      env
    ) as UnitFamilyType;
    return createMeasurementType(unitFamily);
  } else if (isMeasurementType(expr) && expr.unitFamily.ref) {
    const unitFamily = inferUnitFamily(
      expr.unitFamily.ref,
      env
    ) as UnitFamilyType;
    return createMeasurementType(unitFamily);
  } else {
    return createErrorType("Could not infer measurement", expr);
  }
}

export function inferUnitFamily(
  unitFamily: UnitFamilyDeclaration,
  env: TypeEnvironment
): TypeDescription {
  const unitTypes = unitFamily.units.map((unit) =>
    inferType(unit, env)
  ) as UnitType[];
  const unitConversions = unitFamily.conversions.map((conv) =>
    inferType(conv, env)
  ) as UnitConversionType[];

  return createUnitFamilyType(unitFamily.name, unitTypes, unitConversions);
}

export function inferUnit(unit: UnitDeclaration): TypeDescription {
  return createUnitType(unit.name, unit.description, unit.longName);
}

export function inferUnitConversion(
  conv: ConversionDeclaration,
  env: TypeEnvironment
): TypeDescription {
  if (conv.lambda) {
    return createUnitConversionType(
      inferType(conv.from.ref, env) as UnitType,
      inferType(conv.to.ref, env) as UnitType,
      inferType(conv.lambda, env) as LambdaTypeDescription
    );
  } else if (conv.formula && conv.formula.ref) {
    return createUnitConversionType(
      inferType(conv.from.ref, env) as UnitType,
      inferType(conv.to.ref, env) as UnitType,
      inferType(conv.formula.ref, env) as FormulaType
    );
  } else {
    return createErrorType("Could not infer unit conversion", conv);
  }
}

export function inferUnitConversionExpression(
  expr: UnitConversionExpression,
  env: TypeEnvironment
): TypeDescription {
  if (
    expr.unit &&
    expr.unit.ref &&
    isUnitFamilyDeclaration(expr.unit.ref.$container)
  ) {
    const unitFamily = inferUnitFamily(
      expr.unit.ref.$container,
      env
    ) as UnitFamilyType;
    return createMeasurementType(unitFamily);
  } else {
    return createErrorType("Could not infer unit conversion", expr);
  }
}

export function inferExpression(
  expr: Expression,
  env: TypeEnvironment
): TypeDescription {
  if (isStringLiteral(expr)) {
    return createTextType();
  } else if (isNumberLiteral(expr)) {
    return createNumberType();
  } else if (isBooleanLiteral(expr)) {
    return createBooleanType();
  } else if (isNullLiteral(expr)) {
    return createNullType();
  } else if (isMeasurementLiteral(expr)) {
    return inferMeasurement(expr, env);
  } else if (isModelValue(expr)) {
    return inferModelValue(expr, env);
  } else if (isListValue(expr)) {
    return inferType(expr, env);
  } else if (isModelMemberAssignment(expr)) {
    return inferModelMemberAssignment(expr, env);
  } else if (isBinaryExpression(expr)) {
    return inferBinaryExpression(expr, env);
  } else if (isUnaryExpression(expr)) {
    if (expr.operator === "!") {
      return createBooleanType();
    } else {
      return createNumberType();
    }
  } else if (isModelMemberCall(expr)) {
    return inferType(expr.element.ref, env);
  } else if (isUnitConversionExpression(expr)) {
    return inferUnitConversionExpression(expr, env);
  } else {
    return createErrorType("Could not infer type for expression", expr);
  }
}

export function inferModelValue(
  expr: ModelValue,
  env: TypeEnvironment
): TypeDescription {
  const memberTypes = expr.members.map((member) =>
    inferExpression(member, env)
  ) as ModelMemberType[];
  return createModelType("value", memberTypes);
}

export function inferModelMemberAssignment(
  expr: ModelMemberAssignment,
  env: TypeEnvironment
): TypeDescription {
  return inferExpression(expr.value, env);
}

export function inferBinaryExpression(
  expr: BinaryExpression,
  env: TypeEnvironment
): TypeDescription {
  // Operations that should return boolean
  if (["and", "or", "<", "<=", ">", ">=", "==", "!="].includes(expr.operator)) {
    return createBooleanType();
  }

  const left = inferType(expr.left, env);
  const right = inferType(expr.right, env);

  // Operations that should return a number or numberTypeWithUnitFamily
  if (isMeasurementLiteral(left) || isMeasurementLiteral(right)) {
    return inferMeasurementBinaryExpression(expr, env);
  } else {
    if (["-", "*", "/", "%", "^"].includes(expr.operator)) {
      return createNumberType();
    }
    if (expr.operator === "+") {
      if (isTextType(left) || isTextType(right)) {
        return createTextType();
      } else if (isNumberType(left) && isNumberType(right)) {
        return createNumberType();
      }
    } else if (expr.operator === "=") {
      return right;
    }
  }

  return createErrorType("Could not infer type from binary expression", expr);
}

export function inferMeasurementBinaryExpression(
  expr: BinaryExpression,
  env: TypeEnvironment
): TypeDescription {
  let leftType: TypeDescription;
  let rightType: TypeDescription;

  if (isMeasurementLiteral(expr.left)) {
    leftType = inferMeasurement(expr.left, env);
  } else {
    leftType = inferType(expr.left, env);
  }

  if (isMeasurementLiteral(expr.right)) {
    rightType = inferMeasurement(expr.right, env);
  } else {
    rightType = inferType(expr.right, env);
  }

  if (["-", "*", "/", "%"].includes(expr.operator)) {
    if (isMeasurementType(leftType) && isNumberType(rightType)) {
      return leftType;
    } else if (isNumberType(leftType) && isMeasurementType(rightType)) {
      return rightType;
    }
  } else if (expr.operator === "=") {
    return rightType;
  } else if (expr.operator === "^") {
    if (isMeasurementType(leftType) && isNumberType(rightType)) {
      return leftType;
    } else if (isNumberType(leftType) && isMeasurementType(rightType)) {
      return createErrorType("Cannot raise a number to a measurement", expr);
    }
  }

  return createErrorType("Could not infer type from binary expression", expr);
}

export function inferListValue(
  expr: ListValue,
  env: TypeEnvironment
): TypeDescription {
  if (expr.items.length > 0) {
    const elementType = inferType(expr.items[0], env);
    return createListType(elementType);
  } else {
    return createEmptyListType();
  }
}
