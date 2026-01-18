import {
  Expression,
  isBinaryExpression,
  isBooleanLiteral,
  isCallExpression,
  isModelExpression,
  isNullLiteral,
  isNumberLiteral,
  isPreUnaryExpression,
  isReferenceExpression,
  isStringLiteral
} from "e-lang-language";
import { RunnerContext } from "./RunnerContext.js";
import { runBinaryExpression } from "./runBinaryExpression.js";
import { runMemberCall } from "./runMemberCall.js";
import { AstNodeError } from "./AstNodeError.js";

// Helper type guard
function isAssignment(expr: Expression): boolean {
    return isBinaryExpression(expr) && expr.operator === '=';
}

export async function runExpression(
  expression: Expression,
  context: RunnerContext
): Promise<any> {
    
    if (isNumberLiteral(expression)) return expression.value;
    if (isBooleanLiteral(expression)) return expression.value;
    if (isStringLiteral(expression)) return expression.value;
    if (isNullLiteral(expression)) return expression.value;

    // Assignment
    if (isAssignment(expression)) {
        if (isBinaryExpression(expression)) {
            const rightVal = await runExpression(expression.right, context);
             if (isReferenceExpression(expression.left)) {
                 const decl = expression.left.element.ref;
                 if (!decl) throw new AstNodeError(expression, "Unresolved assignment target");
                 // We need context.variables.set to take AstNode for error reporting
                 // My Variables implementation takes (node, name, value).
                 // I should verify Variables class again.
                 // Variables.set(node: AstNode, name: string, value: unknown)
                 context.variables.set(expression, decl.name, rightVal);
                 return rightVal;
             }
             throw new AstNodeError(expression, "Invalid assignment target");
        }
    }

    if (isBinaryExpression(expression)) {
        return runBinaryExpression(expression, context);
    }

    if (isPreUnaryExpression(expression)) {
        const value = await runExpression(expression.value, context);
        const op = expression.operator;
        switch (op) {
            case 'not':
                if (typeof value !== 'boolean') throw new AstNodeError(expression, "Type Error: 'not' requires boolean operand");
                return !value;
            case '-':
                if (typeof value !== 'number') throw new AstNodeError(expression, "Type Error: unary '-' requires number operand");
                return -value;
            default:
                throw new AstNodeError(expression, `Unknown unary operator: ${op}`);
        }
    }

    if (isReferenceExpression(expression)) {
        const decl = expression.element.ref;
        if (!decl) throw new AstNodeError(expression, `Unresolved reference to ${expression.element.$refText}`);
        return context.variables.get(expression, decl.name);
    }

    if (isCallExpression(expression)) {
        return runMemberCall(expression, context);
    }
    
    if(isModelExpression(expression)) {
        return expression.members.toString();
    }
    
    return undefined;
}
