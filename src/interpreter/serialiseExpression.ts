import {
  Statement,
  isExpression,
  isFormulaDeclaration,
  isLambdaDeclaration,
  isListValue,
  isMeasurementLiteral,
  isModelValue,
  isProcedureDeclaration,
} from "../language/generated/ast.js";
import {
  typeReferenceToTypeDescription,
  typeToString,
} from "../language/type-system/descriptions.js";
import { AstNodeError } from "./AstNodeError.js";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";
import { isBoolean, isMeasurement, isNull, isNumber } from "./runProgram.js";

export async function serialiseExpression(
  statement: Statement,
  context: RunnerContext
): Promise<string> {
  const result = isExpression(statement)
    ? await runExpression(statement, context)
    : statement;

  if (isMeasurementLiteral(result)) {
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
      const value = await runExpression(item, context);

      if (isNumber(value) || isBoolean(value) || isNull(value)) {
        items.push(value);
      } else if (isMeasurement(value)) {
        items.push(await serialiseExpression(value, context));
      } else {
        items.push(value);
      }
    }

    return JSON.stringify(items);
  } else if (isFormulaDeclaration(result) || isProcedureDeclaration(result)) {
    const params = result.parameters
      .map((e) => {
        if (e.type)
          return `${e.name}: ${typeToString(
            typeReferenceToTypeDescription(e.type)
          )}`;
        else return `${e.name}`;
      })
      .join(", ");

    if (result.returnType)
      return `${result.name}(${params}) => ${typeToString(
        typeReferenceToTypeDescription(result.returnType)
      )}`;
    else return `${result.name}(${params})`;
  } else if (isLambdaDeclaration(result)) {
    const params = result.parameters
      .map((e) => {
        if (e.type)
          return `${e.name}: ${typeToString(
            typeReferenceToTypeDescription(e.type)
          )}`;
        else return `${e.name}`;
      })
      .join(", ");

    if (result.returnType)
      return `(${params}) => ${typeToString(
        typeReferenceToTypeDescription(result.returnType)
      )}`;
    else return `(${params})`;
  } else {
    return JSON.stringify(result);
  }
}
