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
    isStringLiteral,
    isUnitDeclaration,
    isLogicalNotExpression,
    isNegativeNumericExpression,
    isListExpression,
    isLambdaExpression,
    isMemberAccess,
    isIndexedAccess,
    isPostUnaryExpression,
    isImaginaryNumber,
    isDimensionDeclaration,
    ConversionCalculator,
    DimensionCalculator,
    ModelMemberAssignment,
    isMatchStatement,
    isExpression
} from "e-lang-language";
import { AstNodeError } from "../classes_and_types/AstNodeError.js";
import { ComplexNumber } from "../classes_and_types/ComplexNumber.js";
import { RunnerContext } from "../classes_and_types/Context.js";
import { runBinaryExpression } from "./runBinaryExpression.js";
import { runMemberCall } from "./runMemberCall.js";
import { runStatement } from "./runStatement.js";

// Helper type guard
function isAssignment(expr: Expression): boolean {
    return isBinaryExpression(expr) && expr.operator === '=';
}

export async function runExpression(
    expression: Expression,
    context: RunnerContext
): Promise<any> {

    if (isNumberLiteral(expression)) return expression.value;
    else if (isBooleanLiteral(expression)) return expression.$cstNode?.text === 'true';
    else if (isStringLiteral(expression)) return expression.value;
    else if (isNullLiteral(expression)) return expression.value;

    else if (isImaginaryNumber(expression)) {
        const value = expression.value ? await runExpression(expression.value, context) : 1;
        return new ComplexNumber(0, value);
    }

    else if (isMeasurement(expression)) {
        const value = await runExpression(expression.value, context);
        const unitDecl = expression.unit.ref;
        if (!unitDecl) throw new AstNodeError(expression, "Unresolved unit reference");
        const calculator = new ConversionCalculator();
        const factor = calculator.compute(unitDecl);
        return (value as number) * factor;
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

    else if (isLogicalNotExpression(expression)) {
        const value = await runExpression(expression.value, context);
        if (typeof value !== 'boolean') throw new AstNodeError(expression, "Type Error: 'not' requires boolean operand");
        return !value;
    }

    else if (isNegativeNumericExpression(expression)) {
        const value = await runExpression(expression.value, context);
        if (typeof value !== 'number') throw new AstNodeError(expression, "Type Error: unary '-' requires number operand");
        return -value;
    }

    else if (isPostUnaryExpression(expression)) {
        const leftVal = await runExpression(expression.value, context);
        if (typeof leftVal !== 'number') throw new AstNodeError(expression, "Type Error: Post-unary operators require number operand");
        
        if (isReferenceExpression(expression.value)) {
            const decl = expression.value.element.ref;
            if (decl) {
                const newVal = expression.operator === '++' ? leftVal + 1 : leftVal - 1;
                context.variables.set(expression, decl.name, newVal);
                return leftVal;
            }
        }
        throw new AstNodeError(expression, "Invalid assignment target for post-unary operator");
    }

    else if (isReferenceExpression(expression)) {
        const decl = expression.element.ref;
        if (!decl) throw new AstNodeError(expression, `Unresolved reference to ${expression.element.$refText}`);
        
        if (isUnitDeclaration(decl)) {
            const calculator = new ConversionCalculator();
            return calculator.compute(decl);
        }

        if (isDimensionDeclaration(decl)) {
            const calculator = new DimensionCalculator();
            const vec = calculator.compute(decl);
            return DimensionCalculator.toString(vec);
        }
        
        return context.variables.get(expression, decl.name);
    }

    else if (isCallExpression(expression)) {
        return runMemberCall(expression, context);
    }

    else if (isListExpression(expression)) {
        const list = [];
        for (const el of expression.elements) {
            list.push(await runExpression(el, context));
        }
        return list;
    }
    
    else if (isMatchStatement(expression)) {
        const conditionVal = await runExpression(expression.condition, context);
        let matched = false;
        let returnValue: any = undefined;
        
        if (expression.options) {
            for (const option of expression.options) {
                const optionVal = await runExpression(option.condition, context);
                if (conditionVal === optionVal) {
                    if (option.action) {
                        if (isExpression(option.action)) {
                            returnValue = await runExpression(option.action, context);
                        } else {
                            await runStatement(option.action, context, (val) => {
                                returnValue = val;
                            });
                        }
                    }
                    matched = true;
                    break;
                }
            }
        }
        if (!matched && expression.defaultAction) {
            if (isExpression(expression.defaultAction)) {
                returnValue = await runExpression(expression.defaultAction, context);
            } else {
                await runStatement(expression.defaultAction, context, (val) => {
                    returnValue = val;
                });
            }
        }
        return returnValue;
    }

    else if (isLambdaExpression(expression)) {
        (expression as any)._closure = context.variables.getAll();
        return expression;
    }

    else if (isModelExpression(expression)) {
        const model: Record<string, any> = {};
        for (const m of expression.members) {
            const member = m as ModelMemberAssignment;
            model[member.name] = await runExpression(member.value, context);
        }
        return model;
    }
    
    else if (isMemberAccess(expression)) {
        const receiver = await runExpression(expression.receiver, context);
        if (typeof receiver === 'object' && receiver !== null) {
            return receiver[expression.member.$refText];
        }
        throw new AstNodeError(expression, "Cannot access member on non-object");
    }

    else if (isIndexedAccess(expression)) {
        const receiver = await runExpression(expression.receiver, context);
        const index = await runExpression(expression.index, context);
        if (Array.isArray(receiver)) {
            return receiver[index];
        }
        throw new AstNodeError(expression, "Cannot index non-array");
    }

    return undefined;
}
