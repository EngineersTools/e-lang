import {
  Statement,
  isExpression,
  isForStatement,
  isFormulaDeclaration,
  isIfStatement,
  isPrintStatement,
  isStatementBlock,
  isConstantDeclaration,
  isMutableDeclaration,
  isReturnStatement
} from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";
import { runForStatement } from "./runForStatement.js";
import { runVariableDeclaration } from "./runVariableDeclaration.js";
import { serialiseExpression } from "./serialiseExpression.js";
import { interruptAndCheck } from "langium";

export type ReturnFunction = (value: unknown) => void;

export async function runStatement(
  statement: Statement,
  context: RunnerContext,
  returnFn: ReturnFunction = () => {}
): Promise<void> {
    await interruptAndCheck(context.cancellationToken!);

    if (isExpression(statement)) {
        await runExpression(statement, context);
    }
    else if (isForStatement(statement)) {
        await runForStatement(statement, context, returnFn);
    }
    // Formula Declaration (Global, usually pre-registered, but if local?)
    // In interpreter.ts logic, formulas were pre-registered.
    // If we encounter them during execution (and not pre-pass), what do we do?
    // RunProgram pre-pass logic registered them?
    // Wait, runProgram implementation I wrote relies on `isFormulaDeclaration` but `program.statements` are iterated.
    // I should check `runProgram` logic again. I didn't add pre-pass there!
    // Main branch implementation of `runProgram` didn't show pre-pass explicitly in the snippet I saw?
    // Wait, `runELangStatement` had `isFormulaDeclaration` check: `context.variables.push(statement.name, statement);`
    // So it registers them at runtime when encountered?
    // But they need to be hoisted for mutual recursion?
    // In `interpreter.ts` (current), there was a pre-pass.
    // In `main` `runELangStatement`: `else if (isFormulaDeclaration(statement)) { context.variables.push(statement.name, statement); }`
    // This implies declaration order matters or valid strict structure.
    // However, interpreter.ts did pre-pass.
    // I should probably follow main branch logic if I want to "backport", but current branch code works with pre-pass.
    // If I use main's logic, recursion for defined-later functions might fail if not hoisted?
    // Unless `ELangProgram` parsing handles scoping? No, interpreter needs to define them in variables.
    // I'll stick to main branch `runELangStatement` implementation for Formula.
    else if (isFormulaDeclaration(statement)) {
         context.variables.push(statement.name, statement);
    }
    else if (isIfStatement(statement)) {
        // Handle If conditions
        // Grammar: conditions+=Expression blocks+=StatementBlock elseBlock=StatementBlock
        // Main branch had: condition, block (simple if)
        // Current branch has multiple conditions (if else-if).
        // I need to support current branch grammar!
        // RunExpression for each condition.
        for (let i = 0; i < statement.conditions.length; i++) {
             const cond = statement.conditions[i];
             const block = statement.blocks[i];
             const res = await runExpression(cond, context);
             // console.log(`If condition: ${res}`);
             if (res) {
                 // console.log(`If condition true, executing block`);
                 await runStatement(block, context, returnFn);
                 return;
             }
        }
        if (statement.elseBlock) {
            await runStatement(statement.elseBlock, context, returnFn);
        }
    }
    else if (isConstantDeclaration(statement) || isMutableDeclaration(statement)) {
        await runVariableDeclaration(statement, context);
    }
    else if (isPrintStatement(statement)) {
        if (statement.value) { // statement.value from grammar
             const output = await serialiseExpression(statement.value, context);
             context.log!(output);
        }
    }
    else if (isReturnStatement(statement)) {
        const returnStmt = statement as any;
        const result = returnStmt.value
            ? await runExpression(returnStmt.value, context)
            : undefined;
        returnFn(result);
    }
    else if (isStatementBlock(statement)) {
        context.variables.enter();
        let end = false;
        const blockReturn: ReturnFunction = (val) => {
            end = true;
            returnFn(val);
        };
        for (const s of statement.statements) {
            await runStatement(s, context, blockReturn);
            if (end) break;
        }
        // Return block handling?
        if (!end && statement.returnValue) {
             const val = await runExpression(statement.returnValue.value, context);
             returnFn(val);
        }

        context.variables.leave();
    }
}
