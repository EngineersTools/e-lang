import { CallExpression, isFormulaDeclaration } from "e-lang-language";
import { RunnerContext } from "./RunnerContext.js";
import { runExpression } from "./runExpression.js";
import { runStatement } from "./runStatement.js"; // Circular?
import { AstNodeError } from "./AstNodeError.js";

// Note: In current branch grammar it is CallExpression. In main it was ModelMemberCall?
// I'll stick to CallExpression (current grammar) for compatibility.
// If main used ModelMemberCall, I should adapt.
// Current interpreter.ts used isCallExpression.

export async function runMemberCall(
  expr: CallExpression, // Using CallExpression as per current grammar
  context: RunnerContext
): Promise<any> {
    const func = await runExpression(expr.callee, context);
             
    if (!func || !isFormulaDeclaration(func)) {
        throw new AstNodeError(expr, "Calling a non-function");
    }
    
    const args = await Promise.all(expr.arguments.map(arg => runExpression(arg, context)));
    
    // Create new Variables stack for function (lexical scoping? formulas are top level usually)
    // Main branch implementation details:
    // It used context.variables.enter() but inside runStatement logic for Lambda/Formula?
    // Let's use a new variables scope on top of global?
    // Actually, formulas in E-Lang logic (from interpreter.ts) seemed to use global context or closure.
    // interpreter.ts: const fnContext = this.globalContext.createChild();
    // But Variables class is a single stack.
    // Use enter() to add a new frame if it's dynamic scope.
    // But if we want static scope, we need the closure context.
    // For now, assuming dynamic scope or global functions only.
    // We will use a NEW RunnerContext with a fresh Variables stack if we want isolation, OR 
    // push to current stack if we want dynamic scope.
    // Main branch Variables.ts suggests stack.
    // interpreter.ts used createChild().
    // If I use enter(), it pushes to the SAME stack. This equates to dynamic scoping if I am not careful about what is below the stack.
    // But usually call stack is different from lexical scope.
    // For simple interpreter, sharing the stack frame list (but pushing new frame) is common for "call stack".
    // But definitions should be from definition time.
    // If Formulas are top level, they are in the bottom of stack.
    // So pushing to stack is fine for args.
    
    // context.log(`Calling function, args: ${args}`);
    context.variables.enter();
    
    func.parameters.forEach((param, index) => {
        const argVal = args[index];
        context.variables.push(param.name, argVal);
    });
    
    let result: any = undefined;
    try {
        // We need runStatement to return value? 
        // runStatement uses a callback returnFn.
        await runStatement(func.body, context, (val) => {
            result = val;
        });
    } finally {
        context.variables.leave();
    }
    return result;
}
