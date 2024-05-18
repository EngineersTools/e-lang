import { AstNode } from "langium";
import {
  BinaryExpression,
  TypeReference,
  isBinaryExpression,
  isBooleanLiteral,
  isConstantDeclaration,
  isFormulaDeclaration,
  isLambdaDeclaration,
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
  isStringLiteral,
  isTypeReference,
  isUnaryExpression,
} from "../generated/ast.js";
import { TypeEnvironment } from "./TypeEnvironment.class.js";
import {
  TypeDescription,
  createBooleanType,
  createErrorType,
  createFormulaType,
  createLambdaType,
  createListType,
  createMeasurementType,
  createModelType,
  createModelTypeFromValue,
  createNullType,
  createNumberType,
  createTextType,
  isTextType,
} from "./descriptions.js";

export function inferType(
  node: AstNode | undefined,
  cache: TypeEnvironment
): TypeDescription {
  let type: TypeDescription | undefined;

  if (!node) {
    return createErrorType("Could not infer type for undefined", node);
  }
  const existing = cache.get(node.$type);
  if (existing) {
    return existing;
  }
  // Prevent recursive inference errors
  cache.set(node.$type, createErrorType("Recursive definition", node));

  if (isStringLiteral(node)) {
    type = createTextType(node);
  } else if (isNumberLiteral(node)) {
    type = createNumberType(node);
  } else if (isBooleanLiteral(node)) {
    type = createBooleanType(node);
  } else if (isNullLiteral(node)) {
    type = createNullType();
  } else if (isMeasurementLiteral(node)) {
    type = createMeasurementType(node);
  } else if (isModelValue(node)) {
    type = createModelTypeFromValue(node);
  } else if (isFormulaDeclaration(node)) {
    const returnType = inferType(node.returnType, cache);
    type = createFormulaType(returnType, node.parameters);
  } else if (isProcedureDeclaration(node)) {
    const returnType = inferType(node.returnType, cache);
    type = createFormulaType(returnType, node.parameters);
  } else if (isLambdaDeclaration(node)) {
    const returnType = inferType(node.returnType, cache);
    type = createLambdaType(returnType, node.parameters);
  } else if (isTypeReference(node)) {
    type = inferTypeRef(node);
  } else if (isConstantDeclaration(node) || isMutableDeclaration(node)) {
    if (node.type) {
      type = inferType(node.type, cache);
    } else if (node.value) {
      type = inferType(node.value, cache);
    } else {
      type = createErrorType("No type hint for this element", node);
    }
  } else if (isModelMemberAssignment(node)) {
    type = inferType(node.value, cache);
  } else if (isParameterDeclaration(node)) {
    type = inferType(node.type, cache);
  } else if (isPropertyDeclaration(node)) {
    type = inferType(node.type, cache);
  } else if (isModelDeclaration(node)) {
    type = createModelType(node);
  } else if (isModelMemberCall(node)) {
    type = inferType(node.element.ref, cache);
  } else if (isBinaryExpression(node)) {
    type = inferBinaryExpression(node, cache);
  } else if (isUnaryExpression(node)) {
    if (node.operator === "!") {
      type = createBooleanType();
    } else {
      type = createNumberType();
    }
  } else if (isReturnStatement(node)) {
    type = inferType(node.value, cache);
  }

  if (!type) {
    type = createErrorType("Could not infer type for " + node.$type, node);
  }

  cache.set(node.$type, type);
  return type;
}

export function inferTypeRef(node: TypeReference): TypeDescription {
  let primaryType!: TypeDescription;

  if (node.primitive) {
    if (node.primitive === "number") {
      primaryType = createNumberType();
    } else if (node.primitive === "text") {
      primaryType = createTextType();
    } else if (node.primitive === "boolean") {
      primaryType = createBooleanType();
    }
  } else if (node.model) {
    if (node.model.ref) {
      primaryType = createModelType(node.model.ref);
    }
  } else if (node.lambda) {
    const returnType = inferTypeRef(node.lambda.returnType);
    const parameters = node.lambda.parameters;
    primaryType = createFormulaType(returnType, parameters);
  } else if (node.measurement) {
    primaryType = createMeasurementType();
  } else {
    primaryType = createErrorType(
      "Could not infer type for this reference",
      node
    );
  }

  if (node.array) {
    return createListType(primaryType);
  } else {
    return primaryType;
  }
}

function inferBinaryExpression(
  expr: BinaryExpression,
  cache: TypeEnvironment
): TypeDescription {
  // Operations that should return boolean
  if (["and", "or", "<", "<=", ">", ">=", "==", "!="].includes(expr.operator)) {
    return createBooleanType();
  }

  // Operations that should return a number or numberTypeWithUnitFamily
  const left = inferType(expr.left, cache);
  const right = inferType(expr.right, cache);

  if (isMeasurementType(left) || isMeasurementType(right)) {
    if (["-", "*", "/", "%", "^"].includes(expr.operator)) {
      return createMeasurementType();
    }
    if (expr.operator === "+") {
      if (isTextType(left) || isTextType(right)) {
        return createTextType();
      } else {
        return createMeasurementType();
      }
    } else if (expr.operator === "=") {
      return right;
    }
  } else {
    if (["-", "*", "/", "%", "^"].includes(expr.operator)) {
      return createNumberType();
    }
    if (expr.operator === "+") {
      if (isTextType(left) || isTextType(right)) {
        return createTextType();
      } else {
        return createNumberType();
      }
    } else if (expr.operator === "=") {
      return right;
    }
  }

  return createErrorType("Could not infer type from binary expression", expr);
}


