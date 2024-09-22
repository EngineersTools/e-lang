import { AstNode } from "langium";
import { unique } from "../../utils/array.functions.js";
import {
  BinaryExpression,
  ConstantDeclaration,
  ConversionDeclaration,
  Expression,
  FormulaDeclaration,
  LambdaDeclaration,
  LambdaType,
  ListValue,
  MeasurementLiteral,
  MeasurementType,
  ModelDeclaration,
  ModelMemberAssignment,
  ModelValue,
  MutableDeclaration,
  ParameterDeclaration,
  PropertyDeclaration,
  StatementBlock,
  TypeReference,
  UnitConversionExpression,
  UnitDeclaration,
  UnitFamilyDeclaration,
  isBinaryExpression,
  isBooleanLiteral,
  isConstantDeclaration,
  isConversionDeclaration,
  isExpression,
  isFormulaDeclaration,
  isIfStatement,
  isLambdaDeclaration,
  isLambdaType,
  isListAdd,
  isListRemove,
  isListValue,
  isMeasurementLiteral,
  isMeasurementType,
  isModelDeclaration,
  isModelMemberAssignment,
  isModelMemberCall,
  isModelValue,
  isMutableDeclaration,
  isNullLiteral,
  isNumberLiteral,
  isParameterDeclaration,
  isProcedureDeclaration,
  isPropertyDeclaration,
  isReturnStatement,
  isStatementBlock,
  isStringLiteral,
  isTypeReference,
  isTypeUnion,
  isUnaryExpression,
  isUnitConversionExpression,
  isUnitDeclaration,
  isUnitFamilyDeclaration,
} from "../generated/ast.js";
import { TypeEnvironment } from "./TypeEnvironment.js";
import {
  ELangType,
  FormulaType,
  LambdaType as LambdaTypeDescription,
  ModelMemberType,
  ModelType,
  ParameterType,
  UnitConversionType,
  UnitFamilyType,
  UnitType,
  createBooleanType,
  createComplexUnitFamilyType,
  createEmptyListType,
  createErrorType,
  createFormulaType,
  createLambdaType,
  createListType,
  createMeasurementType,
  createModelMemberType,
  createModelTypeDescription,
  createNullType,
  createNumberType,
  createParameterType,
  createTextType,
  createUnionType,
  createUnitConversionType,
  createUnitFamilyType,
  createUnitType,
  equalsType,
  getTypeName,
  isBooleanType,
  isComplexUnitFamilyType,
  isMeasurementType as isMeasurementTypeDescription,
  isNumberType,
  isParameterType,
  isTextType,
} from "./descriptions.js";
import { getAllPropertiesInModelDeclarationChain } from "./getAllPropertiesInModelDeclarationChain.js";

export function inferType(
  node: AstNode | undefined,
  env: TypeEnvironment
): ELangType {
  let type: ELangType | undefined;

  if (!node) {
    return createErrorType("Could not infer type for undefined variable", node);
  }

  if (isExpression(node)) {
    type = inferExpression(node, env);
  } else if (isStatementBlock(node)) {
    type = inferStatementBlock(node, env);
  } else if (isConstantDeclaration(node)) {
    type = inferConstantDeclaration(node, env);
  } else if (isMutableDeclaration(node)) {
    type = inferMutableDeclaration(node, env);
  } else if (isTypeReference(node)) {
    type = inferTypeReference(node, env);
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
  } else if (isFormulaDeclaration(node)) {
    type = inferFormula(node, env);
  } else if (isModelDeclaration(node)) {
    type = inferModelDeclaration(node, env);
  } else if (isReturnStatement(node)) {
    type = inferType(node.value, env);
  }

  if (!type) {
    type = createErrorType("Could not infer type for " + node.$type, node);
  }

  return type;
}

export function inferConstantDeclaration(
  node: ConstantDeclaration,
  env: TypeEnvironment
): ELangType {
  if (node.assignment) {
    const constType = inferType(node.type, env);
    const valueType = inferType(node.value, env);

    if (node.type === undefined) {
      return valueType;
    } else if (equalsType(constType, valueType)) {
      return constType;
    } else {
      return createErrorType(
        `Constant of type '${getTypeName(
          constType
        )}' cannot be assigned a value of type '${getTypeName(valueType)}'`
      );
    }
  } else {
    if (node.type) {
      return inferType(node.type, env);
    } else if (node.value) {
      return inferType(node.value, env);
    } else {
      return createErrorType(
        "The type of this constant cannot be inferred. Assign a type or a value to it.",
        node
      );
    }
  }
}

export function inferMutableDeclaration(
  node: MutableDeclaration,
  env: TypeEnvironment
): ELangType {
  if (node.assignment) {
    const varType = inferType(node.type, env);
    const valueType = inferType(node.value, env);

    if (node.type === undefined) {
      return valueType;
    } else if (equalsType(varType, valueType)) {
      return varType;
    } else {
      return createErrorType(
        `Variable of type '${getTypeName(
          varType
        )}' cannot be assigned a value of type '${getTypeName(valueType)}'`
      );
    }
  } else {
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
}

export function inferTypeReference(
  typeRef: TypeReference,
  env: TypeEnvironment
): ELangType {
  let resolvedType!: ELangType;

  if (typeRef.primitive) {
    resolvedType = inferPrimitive(typeRef);
  } else if (isTypeUnion(typeRef)) {
    const leftTypes = [];
    const rightTypes = [];

    if (isTypeUnion(typeRef.left)) {
      leftTypes.push(inferType(typeRef.left.left, env));
      leftTypes.push(inferType(typeRef.left.right, env));
    } else {
      leftTypes.push(inferType(typeRef.left, env));
    }

    if (isTypeUnion(typeRef.right)) {
      rightTypes.push(inferType(typeRef.right.left, env));
      rightTypes.push(inferType(typeRef.right.right, env));
    } else {
      rightTypes.push(inferType(typeRef.right, env));
    }

    resolvedType = createUnionType(...leftTypes, ...rightTypes);
  } else if (isLambdaType(typeRef)) {
    resolvedType = inferLambda(typeRef, env);
  } else if (
    typeRef.model &&
    typeRef.model.ref &&
    isModelDeclaration(typeRef.model.ref)
  ) {
    const memberTypes = getAllPropertiesInModelDeclarationChain(
      typeRef.model.ref
    ).map((member) => inferType(member, env)) as ModelMemberType[];
    resolvedType = createModelTypeDescription(
      "declaration",
      memberTypes,
      undefined,
      typeRef.model.ref.name,
      typeRef.model.ref
    );
  } else if (isMeasurementType(typeRef)) {
    resolvedType = inferMeasurement(typeRef, env);
  } else if (isTypeReference(typeRef.primitive)) {
    resolvedType = inferTypeReference(typeRef.primitive, env);
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

export function inferPrimitive(typeRef: TypeReference): ELangType {
  if (typeRef.primitive === "number") {
    return createNumberType();
  } else if (typeRef.primitive === "text") {
    return createTextType();
  } else if (typeRef.primitive === "boolean") {
    return createBooleanType();
  } else if (typeRef.primitive === "null") {
    return createNullType();
  } else {
    return createErrorType("Could not infer primitive type", typeRef);
  }
}

export function inferLambda(
  expr: LambdaDeclaration | LambdaType,
  env: TypeEnvironment
): ELangType {
  if (isLambdaDeclaration(expr)) {
    const returnType = expr.returnType
      ? inferType(expr.returnType, env)
      : inferType(expr.body, env);

    if (expr.parameters && expr.parameters.length > 0) {
      return createLambdaType(
        returnType,
        expr.parameters.map((param) =>
          inferParameterDeclaration(param, env)
        ) as ParameterType[]
      );
    } else {
      return createLambdaType(returnType);
    }
  } else if (isLambdaType(expr)) {
    if (expr.parameters.length > 0) {
      return createLambdaType(
        inferType(expr.returnType, env),
        expr.parameters.map((param) =>
          inferParameterDeclaration(param, env)
        ) as ParameterType[]
      );
    } else {
      return createLambdaType(inferType(expr.returnType, env));
    }
  }

  return createErrorType("Could not infer lambda type", expr);
}

export function inferFormula(
  expr: FormulaDeclaration,
  env: TypeEnvironment
): ELangType {
  if (expr.returnType) {
    if (expr.parameters && expr.parameters.length > 0) {
      return createFormulaType(
        inferType(expr.returnType, env),
        expr.parameters.map((param) =>
          inferParameterDeclaration(param, env)
        ) as ParameterType[]
      );
    } else {
      return createFormulaType(inferType(expr.returnType, env));
    }
  } else {
    return createErrorType("Formula requires a declared return type", expr);
  }
}

export function inferParameterDeclaration(
  expr: ParameterDeclaration,
  env: TypeEnvironment
): ELangType {
  return createParameterType(expr.name, inferType(expr.type, env));
}

export function inferPropertyDeclaration(
  expr: PropertyDeclaration,
  env: TypeEnvironment
): ELangType {
  if (expr.type.primitive) {
    const propType = env.getType(expr.type.primitive);
    if (propType) {
      return createModelMemberType(expr.name, propType, expr.isOptional);
    }
  } else if (expr.type.model && expr.type.model.ref) {
    const propType = env.getType(expr.type.model.ref.name);
    if (propType) {
      return createModelMemberType(expr.name, propType, expr.isOptional);
    } else if (isTypeReference(expr.type)) {
      return createModelMemberType(
        expr.name,
        inferType(expr.type, env),
        expr.isOptional
      );
    }
  } else if (isTypeUnion(expr.type)) {
    return createModelMemberType(
      expr.name,
      inferType(expr.type, env),
      expr.isOptional
    );
  } else if (isMeasurementType(expr.type)) {
    return createModelMemberType(
      expr.name,
      inferMeasurement(expr.type, env),
      expr.isOptional
    );
  } else if (isLambdaType(expr.type)) {
    return createModelMemberType(
      expr.name,
      inferLambda(expr.type, env),
      expr.isOptional
    );
  }

  return createErrorType("Could not infer property type", expr);
}

export function inferMeasurement(
  expr: MeasurementLiteral | MeasurementType,
  env: TypeEnvironment
): ELangType {
  if (
    isMeasurementLiteral(expr) &&
    isUnitDeclaration(expr.unit.ref) &&
    isUnitFamilyDeclaration(expr.unit.ref.$container)
  ) {
    const unitFamily = inferUnitFamily(
      expr.unit.ref.$container,
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
): ELangType {
  const unitTypes = unitFamily.units.map((unit) =>
    inferType(unit, env)
  ) as UnitType[];
  const unitConversions = unitFamily.conversions.map((conv) =>
    inferType(conv, env)
  ) as UnitConversionType[];

  const unitFamilyType = createUnitFamilyType(
    unitFamily.name,
    unitTypes,
    unitConversions
  );

  return unitFamilyType;
}

export function inferUnit(unit: UnitDeclaration): ELangType {
  return createUnitType(unit.name, unit.description, unit.longName);
}

export function inferUnitConversion(
  conv: ConversionDeclaration,
  env: TypeEnvironment
): ELangType {
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
): ELangType {
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
): ELangType {
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
    return inferListValue(expr, env);
  } else if (isListAdd(expr) || isListRemove(expr)) {
    return inferType(expr.list, env);
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

export function inferModelDeclaration(
  expr: ModelDeclaration,
  env: TypeEnvironment
): ELangType {
  const propertyTypes = expr.properties.map((prop) =>
    inferPropertyDeclaration(prop, env)
  ) as ModelMemberType[];

  const parentTypes = expr.parentTypes
    .filter((p) => p.ref && isModelDeclaration(p.ref))
    .map((m) => inferType(m.ref, env) as ModelType);

  const parentTypesProperties = parentTypes.map((p) => p.memberTypes).flat();

  propertyTypes.push(...parentTypesProperties);

  return createModelTypeDescription(
    "declaration",
    propertyTypes,
    parentTypes,
    expr.name,
    expr
  );
}

export function inferModelValue(
  expr: ModelValue,
  env: TypeEnvironment
): ELangType {
  const memberTypes = expr.members.map((member) =>
    createModelMemberType(member.property, inferExpression(member, env))
  );
  return createModelTypeDescription(
    "value",
    memberTypes,
    undefined,
    `{${memberTypes.map((m) => `${m.name}:${m.typeDesc.$type}`).join(", ")}}`
  );
}

export function inferModelMemberAssignment(
  expr: ModelMemberAssignment,
  env: TypeEnvironment
): ELangType {
  if (isExpression(expr.value)) return inferExpression(expr.value, env);
  else return inferLambda(expr.value, env);
}

export function inferBinaryExpression(
  expr: BinaryExpression,
  env: TypeEnvironment
): ELangType {
  const leftExpr = inferType(expr.left, env);
  const rightExpr = inferType(expr.right, env);

  const left = isParameterType(leftExpr) ? leftExpr.typeDescription : leftExpr;
  const right = isParameterType(rightExpr)
    ? rightExpr.typeDescription
    : rightExpr;

  // Operations that should return boolean
  if (["and", "or"].includes(expr.operator)) {
    if (isBooleanType(left) && isBooleanType(right)) {
      return createBooleanType();
    } else {
      return createErrorType(
        `Invalid boolean expression operands '${getTypeName(
          left
        )}' and '${getTypeName(right)}' for operation ${expr.operator}`,
        expr
      );
    }
  } else if (["<", "<=", ">", ">=", "==", "!="].includes(expr.operator)) {
    if (isNumberType(left) && isNumberType(right)) {
      return createBooleanType();
    } else {
      return createErrorType(
        `Invalid comparison expression operands '${getTypeName(
          left
        )}' and '${getTypeName(right)}' for operation ${expr.operator}`,
        expr
      );
    }
  }
  // Operations that should return a number or numberTypeWithUnitFamily
  if (
    isMeasurementTypeDescription(left) ||
    isMeasurementTypeDescription(right)
  ) {
    return inferMeasurementBinaryExpression(expr, env);
  } else {
    if (["-", "*", "/", "^"].includes(expr.operator)) {
      if (isNumberType(left) && isNumberType(right)) {
        return createNumberType();
      } else {
        return createErrorType(
          `Invalid binary expression operands '${getTypeName(
            left
          )}' and '${getTypeName(right)}' for operation ${expr.operator}`,
          expr
        );
      }
    }
    if (expr.operator === "+") {
      if (isTextType(left) || isTextType(right)) {
        return createTextType();
      } else if (isNumberType(left) && isNumberType(right)) {
        return createNumberType();
      }
    } else if (expr.operator === "=") {
      if (equalsType(right, left)) {
        return right;
      } else {
        return createErrorType(
          `Variable of type '${getTypeName(
            left
          )}' cannot be assigned a value of type '${getTypeName(right)}'`
        );
      }
    }
  }

  return createErrorType("Could not infer type of binary expression", expr);
}

export function inferMeasurementBinaryExpression(
  expr: BinaryExpression,
  env: TypeEnvironment
): ELangType {
  let leftType: ELangType;
  let rightType: ELangType;

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

  if (expr.operator === "*") {
    if (equalsType(leftType, rightType)) {
      return rightType;
    } else if (
      isMeasurementTypeDescription(leftType) &&
      isNumberType(rightType)
    ) {
      return leftType;
    } else if (
      isNumberType(leftType) &&
      isMeasurementTypeDescription(rightType)
    ) {
      return rightType;
    } else if (
      isMeasurementTypeDescription(leftType) &&
      isMeasurementTypeDescription(rightType)
    ) {
      const left = isComplexUnitFamilyType(leftType.unitFamilyType)
        ? leftType.unitFamilyType.unitFamilies
        : [leftType.unitFamilyType];
      const right = isComplexUnitFamilyType(rightType.unitFamilyType)
        ? rightType.unitFamilyType.unitFamilies
        : [rightType.unitFamilyType];
      const unitFamilyType = createComplexUnitFamilyType([...left, ...right]);
      return unitFamilyType;
    }
  } else if (expr.operator === "/") {
    if (equalsType(leftType, rightType)) {
      return rightType;
    }
  } else if (expr.operator === "-") {
    if (!equalsType(leftType, rightType)) {
      return createErrorType(
        `Cannot perform operation '${
          expr.operator
        }' with different measurement types: '${getTypeName(
          leftType
        )}' and '${getTypeName(rightType)}'`,
        expr
      );
    }
    return rightType;
  } else if (expr.operator === "+") {
    if (equalsType(leftType, rightType)) {
      return rightType;
    } else if (isTextType(leftType) || isTextType(rightType)) {
      return createTextType();
    }

    return createErrorType(
      `Cannot perform operation '${
        expr.operator
      }' with different measurement unit types: '${getTypeName(
        leftType
      )}' and '${getTypeName(rightType)}'`,
      expr
    );
  } else if (expr.operator === "=") {
    if (!equalsType(leftType, rightType)) {
      return createErrorType(
        `Measurement of type ${getTypeName(
          leftType
        )} cannot be assigned a value of type ${getTypeName(rightType)}`
      );
    }

    return rightType;
  } else if (expr.operator === "^") {
    if (isMeasurementTypeDescription(leftType) && isNumberType(rightType)) {
      return leftType;
    } else if (
      isNumberType(leftType) &&
      isMeasurementTypeDescription(rightType)
    ) {
      return createErrorType(
        "Cannot raise a number to a measurement type",
        expr
      );
    }
  }

  return createErrorType("Could not infer type of binary expression", expr);
}

export function inferListValue(
  expr: ListValue,
  env: TypeEnvironment
): ELangType {
  if (expr.items.length > 0) {
    const elementTypes = unique(expr.items.map((item) => inferType(item, env)));
    if (elementTypes.length === 1) {
      return createListType(elementTypes[0]);
    } else {
      return createListType(createUnionType(...elementTypes));
    }
  } else {
    return createEmptyListType();
  }
}

export function inferStatementBlock(
  stmt: StatementBlock,
  env: TypeEnvironment
): ELangType {
  const returnTypes: ELangType[] = [];

  stmt.statements.forEach((stmt) => {
    if (isReturnStatement(stmt)) {
      returnTypes.push(inferType(stmt.value, env));
    } else if (isFormulaDeclaration(stmt) || isProcedureDeclaration(stmt)) {
      returnTypes.push(inferStatementBlock(stmt.body, env));
    } else if (isLambdaDeclaration(stmt)) {
      if (isStatementBlock(stmt.body)) {
        returnTypes.push(inferStatementBlock(stmt.body, env));
      } else {
        returnTypes.push(inferType(stmt.body, env));
      }
    } else if (isIfStatement(stmt)) {
      returnTypes.push(inferStatementBlock(stmt.block, env));
      if (stmt.elseBlock)
        returnTypes.push(inferStatementBlock(stmt.elseBlock, env));
    }
  });

  if (returnTypes.length === 1) return returnTypes[0];
  else return createUnionType(...returnTypes);
}
