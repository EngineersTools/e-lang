import {
    Expression,
    isBinaryExpression,
    isBooleanLiteral,
    isCallExpression,
    isMeasurement,
    isModelExpression,
    isNullLiteral,
    isNumberLiteral,
    isReferenceExpression,
    isStringLiteral
} from "e-lang-language";
import { AstNodeError } from "../classes_and_types/AstNodeError.js";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runBinaryExpression } from "./runBinaryExpression.js";
import { runMemberCall } from "./runMemberCall.js";

// Helper type guard
function isAssignment(expr: Expression): boolean {
    return isBinaryExpression(expr) && expr.operator === '=';
}

export async function runExpression(
    expression: Expression,
    context: RunnerContext
): Promise<any> {

    if (isNumberLiteral(expression)) return expression.value;
    else if (isBooleanLiteral(expression)) return expression.value;
    else if (isStringLiteral(expression)) return expression.value;
    else if (isNullLiteral(expression)) return expression.value;

    else if (isMeasurement(expression)) {
        const value = await runExpression(expression.value, context);
        const unit = expression.unit.ref?.name || 'unknown unit';
        return { value, unit };
    }

    // Assignment
    else if (isAssignment(expression)) {
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

    else if (isBinaryExpression(expression)) {
        return runBinaryExpression(expression, context);
    }

    // else if (isPreUnaryExpression(expression)) {
    //     const value = await runExpression(expression.value, context);
    //     const op = expression.operator;
    //     switch (op) {
    //         case 'not':
    //             if (typeof value !== 'boolean') throw new AstNodeError(expression, "Type Error: 'not' requires boolean operand");
    //             return !value;
    //         case '-':
    //             if (typeof value !== 'number') throw new AstNodeError(expression, "Type Error: unary '-' requires number operand");
    //             return -value;
    //         default:
    //             throw new AstNodeError(expression, `Unknown unary operator: ${op}`);
    //     }
    // }

    else if (isReferenceExpression(expression)) {
        const decl = expression.element.ref;
        if (!decl) throw new AstNodeError(expression, `Unresolved reference to ${expression.element.$refText}`);
        return context.variables.get(expression, decl.name);
    }

    else if (isCallExpression(expression)) {
        return runMemberCall(expression, context);
    }

    else if (isModelExpression(expression)) {
        return expression.members.toString();
    }

    return undefined;
}
