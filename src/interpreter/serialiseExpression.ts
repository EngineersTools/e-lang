import {
  Statement,
  isExpression,
  isFormulaDeclaration,
  isLambdaDeclaration,
  isListValue,
  isMeasurementLiteral,
  isModelMemberCall,
  isModelValue,
  isNullLiteral,
  isProcedureDeclaration,
  isStatement,
  isStringLiteral
} from "../language/generated/ast.js";
import { TypeEnvironment } from "../language/type-system/TypeEnvironment.class.js";
import { getReturnType } from "../language/type-system/TypeEnvironment.functions.js";
import { inferType } from "../language/type-system/infer.js";
import { typeToString } from "../language/type-system/typeToString.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";
import { runMemberCall } from "./runMemberCall.js";
import {
  isBoolean,
  isMeasurement,
  isNull,
  isNumber,
  isString,
} from "./runProgram.js";

export async function serialiseExpression(
  statement: Statement,
  context: RunnerContext
): Promise<string> {
  const result = isExpression(statement)
    ? await runExpression(statement, context)
    : isModelMemberCall(statement)
    ? await runMemberCall(statement, context)
    : statement;

  if (isStringLiteral(result)) {
    return result.value;
  } else if (isString(result)) {
    return result;
  } else if (isMeasurementLiteral(result)) {
    if (result.unit.error)
      throw new AstNodeError(result, `Print: ${result.unit.error.message}`);
    if (result.unit.ref) return `${result.value}_[${result.unit.ref.name}]`;
    else return `${result.value}_[unknown unit]`;
  } else if (isModelValue(result)) {
    const entries = [];

    for (const member of result.members) {
      const value = await runExpression(member.value, context);

      if (isMeasurement(value) || isFormulaDeclaration(value)) {
        entries.push([
          member.property,
          await serialiseExpression(value, context),
        ]);
      } else if (isModelValue(value) || isListValue(value)) {
        const serialisedModel = await serialiseExpression(value, context);
        entries.push([member.property, JSON.parse(serialisedModel)]);
      } else {
        entries.push([member.property, value]);
      }
    }

    const modelObject = Object.fromEntries(entries);

    return JSON.stringify(modelObject);
  } else if (isListValue(result)) {
    const items = [];

    for (const item of result.items) {
      const value =
        item === undefined ? null : await runExpression(item, context);

      if (isNumber(value) || isBoolean(value) || isNull(value)) {
        items.push(value);
      } else if (isMeasurement(value)) {
        items.push(await serialiseExpression(value, context));
      } else if (isListValue(value)) {
        items.push(JSON.parse(await serialiseExpression(value, context)));
      } else {
        items.push(value);
      }
    }

    return JSON.stringify(items);
  } else if (isFormulaDeclaration(result) || isProcedureDeclaration(result)) {
    const params = result.parameters
      .map((e) => {
        if (e.type) return `${e.name}: ${typeToString(e.type)}`;
        else return `${e.name}`;
      })
      .join(", ");

    if (result.returnType)
      return `${result.name}(${params}) => ${typeToString(result.returnType)}`;
    else return `${result.name}(${params})`;
  } else if (isLambdaDeclaration(result)) {
    const params = result.parameters
      .map((e) => {
        if (e.type) return `${e.name}: ${typeToString(e.type)}`;
        else return `${e.name}`;
      })
      .join(", ");

    if (result.returnType) {
      return `(${params}) => ${typeToString(result.returnType)}`;
    } else if (isExpression(result.body)) {
      return `(${params}) => ${
        inferType(result.body, new TypeEnvironment()).$type
      }`;
    } else if (isStatement(result.body)) {
      const returnType = getReturnType(result.body, new TypeEnvironment());
      return `(${params}) => ${returnType.$type}`;
    }
    return `(${params})`;
  } else if (isStatement(result)) {
    return serialiseExpression(result, context);
  } else if (isNullLiteral(result) || isNull(result) || result === undefined) {
    return "null";
  } else {
    return JSON.stringify(result);
  }
}
