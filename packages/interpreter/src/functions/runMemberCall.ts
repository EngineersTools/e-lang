import { CallExpression, isFormulaDeclaration, isLambdaExpression, isExpression } from "e-lang-language";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runExpression } from "./runExpression.js";
import { runStatement } from "./runStatement.js";
import { AstNodeError } from "../classes_and_types/AstNodeError.js";

export async function runMemberCall(
  expr: CallExpression,
  context: RunnerContext
): Promise<any> {
    const func = await runExpression(expr.callee, context);
             
    if (!func || (!isFormulaDeclaration(func) && !isLambdaExpression(func))) {
        throw new AstNodeError(expr, "Calling a non-function");
    }
    
    const args = await Promise.all(expr.arguments.map(arg => runExpression(arg, context)));
    
    context.variables.enter();
    
    if ((func as any)._closure) {
        for (const [k, v] of Object.entries((func as any)._closure as Record<string, unknown>)) {
            context.variables.push(k, v);
        }
    }
    
    func.parameters.forEach((param, index) => {
        const argVal = args[index];
        context.variables.push(param.name, argVal);
    });
    
    let result: any = undefined;
    try {
        if (isLambdaExpression(func) && isExpression(func.body)) {
            result = await runExpression(func.body, context);
        } else {
            await runStatement(func.body as any, context, (val) => {
                result = val;
            });
        }
    } finally {
        context.variables.leave();
    }
    return result;
}
