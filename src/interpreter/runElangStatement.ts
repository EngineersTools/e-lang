import { interruptAndCheck } from "langium";
import { CancellationToken } from "vscode-languageserver";
import {
  ConversionDeclaration,
  Statement,
  isConstantDeclaration,
  isExpression,
  isForStatement,
  isFormulaDeclaration,
  isIfStatement,
  isLambdaDeclaration,
  isMatchStatement,
  isModelDeclaration,
  isModelMemberCall,
  isMutableDeclaration,
  isParameterDeclaration,
  isPrintStatement,
  isProcedureDeclaration,
  isPropertyDeclaration,
  isReturnStatement,
  isStatementBlock,
  isUnitFamilyDeclaration,
} from "../language/generated/ast.js";
import {
  createFormulaType,
  createLambdaType,
  createModelType,
  createProcedureType,
  createUnitFamilyType,
  createUnitType,
} from "../language/type-system/descriptions.js";
import { inferType } from "../language/type-system/infer.js";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";
import { runVariableDeclaration } from "./runVariableDeclaration.js";
import { serialiseExpression } from "./serialiseExpression.js";

export type ReturnFunction = (value: unknown) => void;

/**
 * This function runs an individual Elang Statement
 * @param statement The Elang statement to be run
 * @param context The context in which this statement is running
 * @param returnFn A return function that indicates if the statement
 *                 returns anything????
 */
export async function runElangStatement(
  statement: Statement,
  context: RunnerContext,
  returnFn: ReturnFunction
): Promise<void> {
  // Check if the program needs to be interrupted before
  // processing this statement
  await interruptAndCheck(context.cancellationToken);

  if (isExpression(statement)) {
    await runExpression(statement, context);
  } else if (isForStatement(statement)) {
    const { counter, from, to, step, block } = statement;
    context.variables.enter();
    context.types.enterScope();

    if (counter) {
      await runElangStatement(counter, context, returnFn);
    }

    for (
      let i = Number(await runExpression(from, context));
      i < Number(await runExpression(to, context));
      i = i + Number(await runExpression(step, context))
    ) {
      context.variables.set(counter, counter.name, i);
      await runElangStatement(block, context, returnFn);
    }

    context.variables.leave();
    context.types.leaveScope();
  } else if (isFormulaDeclaration(statement)) {
    context.types.set(
      statement.name,
      createFormulaType(
        inferType(statement, context.types),
        statement.parameters
      )
    );
    context.variables.push(statement.name, statement);
  } else if (isProcedureDeclaration(statement)) {
    context.types.set(
      statement.name,
      createProcedureType(
        inferType(statement, context.types),
        statement.parameters
      )
    );
    context.variables.push(statement.name, statement);
  } else if (isIfStatement(statement)) {
    const condition = await runExpression(statement.condition, context);
    if (Boolean(condition)) {
      await runElangStatement(statement.block, context, returnFn);
    } else if (statement.elseBlock) {
      await runElangStatement(statement.elseBlock, context, returnFn);
    }
  } else if (isLambdaDeclaration(statement)) {
    context.types.set(
      statement.$type,
      createLambdaType(
        inferType(statement, context.types),
        statement.parameters
      )
    );
    // This caters for the case where the lambda is
    // immediately invoked
    if (statement.explicitOperationCall) {
      const args = await Promise.all(
        statement.arguments.map((e) => runExpression(e, context))
      );

      context.variables.enter();
      context.types.enterScope();

      const names = statement.parameters.map((e) => e.name);

      for (let i = 0; i < statement.parameters.length; i++) {
        const argValue = args[i] ?? null;
        context.variables.push(names[i], argValue);
        const type = inferType(statement.parameters[i], context.types);
        context.types.set(statement.parameters[i].name, type);
      }

      await runElangStatement(statement.body, context, returnFn);

      context.variables.leave();
      context.types.leaveScope();
    }
  } else if (isMatchStatement(statement)) {
    const condition = await runExpression(statement.condition, context);
    for (let i = 0; i < statement.options.length; i++) {
      const element = statement.options[i];
      if (element.parameters == condition) context.log("Found it");
    }
  } else if (isModelDeclaration(statement)) {
    context.types.set(statement.name, createModelType(statement));
  } else if (
    isConstantDeclaration(statement) ||
    isMutableDeclaration(statement)
  ) {
    await runVariableDeclaration(statement, context);
  } else if (isParameterDeclaration(statement)) {
    const type = inferType(statement, context.types);
    context.types.set(statement.name, type);
  } else if (isPropertyDeclaration(statement)) {
    const type = inferType(statement, context.types);
    context.types.set(statement.name, type);
  } else if (isPrintStatement(statement)) {
    if (isExpression(statement.value)) {
      context.log(await serialiseExpression(statement.value, context));
    } else {
      context.log("This statement or expression cannot be printed.");
    }
  } else if (isReturnStatement(statement)) {
    context.types.set(statement.$type, inferType(statement, context.types));

    const result = statement.value
      ? await runExpression(statement.value, context)
      : null;
    returnFn(result);
  } else if (isStatementBlock(statement)) {
    await interruptAndCheck(CancellationToken.None);
    context.variables.enter();
    let end = false;

    const blockReturn: ReturnFunction = (value) => {
      // Yield the execution
      end = true;
      // Call the outer return function
      returnFn(value);
    };

    for (const subStatement of statement.statements) {
      await runElangStatement(subStatement, context, blockReturn);
      if (end) {
        break;
      }
    }
    context.variables.leave();
  } else if (isModelMemberCall(statement)) {
    await runExpression(statement, context);
  } else if (isUnitFamilyDeclaration(statement)) {
    context.types.set(statement.name, createUnitFamilyType(statement));

    if (statement.units && statement.units.length > 0) {
      for (const unit of statement.units) {
        context.types.set(unit.name, createUnitType(unit));
      }
    }

    if (statement.conversions && statement.conversions.length > 0) {
      for (const conversion of statement.conversions) {
        if (conversion.from.ref && conversion.to.ref) {
          const conversionName = getConversionName(conversion);
          context.variables.push(conversionName, conversion);
        }
      }
    }
  }
}

export function getConversionName(conversion: ConversionDeclaration): string {
  return `${conversion.from.ref?.name ?? ""}${conversion.to.ref?.name ?? ""}`;
}
