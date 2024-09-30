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
  isModelMemberCall,
  isMutableDeclaration,
  isPrintStatement,
  isProcedureDeclaration,
  isReturnStatement,
  isStatementBlock,
  isUnitFamilyDeclaration,
} from "../language/generated/ast.js";
import { runExpression } from "./runExpression.js";
import { runForStatement } from "./runForStatement.js";
import { RunnerContext } from "./RunnerContext.js";
import { runVariableDeclaration } from "./runVariableDeclaration.js";
import { serialiseExpression } from "./serialiseExpression.js";

export type ReturnFunction = (value: unknown) => void;

/**
 * This function runs an individual ELang Statement
 * @param statement The ELang statement to be run
 * @param context The context in which this statement is running
 * @param returnFn A return function that indicates if the statement
 *                 returns anything????
 */
export async function runELangStatement(
  statement: Statement,
  context: RunnerContext,
  returnFn: ReturnFunction
): Promise<void> {
  // Check if the program needs to be interrupted before
  // processing this statement
  await interruptAndCheck(context.cancellationToken);

  if (isExpression(statement)) {
    const result = await runExpression(statement, context);
    if (isLambdaDeclaration(statement.$container)) {
      returnFn(result);
    }
  } else if (isForStatement(statement)) {
    await runForStatement(statement, context, returnFn);
  } else if (isFormulaDeclaration(statement)) {
    context.variables.push(statement.name, statement);
  } else if (isProcedureDeclaration(statement)) {
    context.variables.push(statement.name, statement);
  } else if (isIfStatement(statement)) {
    const condition = await runExpression(statement.condition, context);
    if (Boolean(condition)) {
      await runELangStatement(statement.block, context, returnFn);
    } else if (statement.elseBlock) {
      await runELangStatement(statement.elseBlock, context, returnFn);
    }
    // } else if (isLambdaDeclaration(statement)) {
    //   // This caters for the case where the lambda is
    //   // immediately invoked
    //   if (statement.explicitOperationCall) {
    //     const args = await Promise.all(
    //       statement.arguments.map((e) => runExpression(e, context))
    //     );

    //     context.variables.enter();

    //     const names = statement.parameters.map((e) => e.name);

    //     for (let i = 0; i < statement.parameters.length; i++) {
    //       const argValue = args[i] ?? null;
    //       context.variables.push(names[i], argValue);
    //     }

    //     await runELangStatement(statement.body, context, returnFn);

    //     context.variables.leave();
    //   }
  } else if (isMatchStatement(statement)) {
    const condition = await runExpression(statement.condition, context);
    let matched = false;
    for (let i = 0; i < statement.options.length; i++) {
      const element = statement.options[i];
      const elementValue = await runExpression(element.condition, context);
      if (elementValue == condition) {
        if (element.block) {
          await runELangStatement(element.block, context, returnFn);
        } else if (element.value) {
          returnFn(element.value);
        }
        matched = true;
      }
    }
    if (statement.block && !matched) {
      await runELangStatement(statement.block, context, returnFn);
    } else if (statement.value) {
      returnFn(statement.value);
    }
  } else if (
    isConstantDeclaration(statement) ||
    isMutableDeclaration(statement)
  ) {
    await runVariableDeclaration(statement, context);
  } else if (isPrintStatement(statement)) {
    if (isExpression(statement.value)) {
      context.log(await serialiseExpression(statement.value, context));
    } else {
      context.log("This statement or expression cannot be printed.");
    }
  } else if (isReturnStatement(statement)) {
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
      await runELangStatement(subStatement, context, blockReturn);
      if (end) {
        break;
      }
    }
    context.variables.leave();
  } else if (isModelMemberCall(statement)) {
    await runExpression(statement, context);
  } else if (isUnitFamilyDeclaration(statement)) {
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
