
import {
    ELangProgram,
    Expression,
    Statement,
    isBinaryExpression,
    isNumberLiteral,
    isBooleanLiteral,
    isStringLiteral,
    isReferenceExpression,
    isPrintStatement,
    isStatementBlock,
    isReturnStatement,
    isIfStatement,
    isForStatement,
    isConstantDeclaration,
    isMutableDeclaration,
    isCallExpression,
    FormulaDeclaration,
    isFormulaDeclaration,
    isExpression,
    ConstantDeclaration,
    MutableDeclaration
} from 'e-lang-language';
import { Context } from './context.js';


function isVariableDeclaration(node: any): node is ConstantDeclaration | MutableDeclaration {
    return isConstantDeclaration(node) || isMutableDeclaration(node);
}

class ReturnValue {
    constructor(public value: any) {}
}

export class Interpreter {
    // Global context to store global variables and functions
    private globalContext = new Context();

    eval(program: ELangProgram): any {
        // Pre-pass: Register all global functions (FormulaDeclarations)
        // This allows for forward references and recursion
        for (const stmt of program.statements) {
            if (isFormulaDeclaration(stmt)) {
                this.globalContext.define(stmt.name, stmt);
            }
        }

        // Execute statements
        for (const stmt of program.statements) {
            // Skip declarations for now as they are handled or will be executed if they have side effects?
            // Formula declarations are already registered. 
            // Variable declarations need to be executed in order.
            if (!isFormulaDeclaration(stmt)) {
                 this.executeStatement(stmt, this.globalContext);
            }
        }
    }

    private executeStatement(stmt: Statement, context: Context): any {
        if (isVariableDeclaration(stmt)) {
            const value = stmt.value ? this.evaluateExpression(stmt.value, context) : undefined;
            context.define(stmt.name, value);
            return;
        }

        // Assignment is handled as an Expression Statement
        
        if (isPrintStatement(stmt)) {
            const value = this.evaluateExpression(stmt.value, context);
            console.log(value);
            return;
        }

        if (isStatementBlock(stmt)) {
            this.executeBlock(stmt, context);
            return;
        }

        if (isIfStatement(stmt)) {
            // Check conditions
            // The grammar says 'conditions+=Expression' paired with 'blocks+=StatementBlock'
            //Wait, grammar: conditionS+=Expression blocks+=StatementBlock. 
            // It seems like if (cond1) {block1} else_if (cond2) {block2} ...
            // We need to match valid index.
            
            for (let i = 0; i < stmt.conditions.length; i++) {
                const cond = stmt.conditions[i];
                const block = stmt.blocks[i];
                const result = this.evaluateExpression(cond, context);
                if (result) {
                    return this.executeBlock(block, context);
                }
            }
            if (stmt.elseBlock) {
                return this.executeBlock(stmt.elseBlock, context);
            }
            return;
        }

        if (isForStatement(stmt)) {
            // for(counter from A to B step C)
            // Need to handle loop
            // Create a new scope for the loop counter?
            const loopContext = context.createChild();
            
            // Initial value
            const fromVal = this.evaluateExpression(stmt.from, context);
            const toVal = this.evaluateExpression(stmt.to, context);
            const stepVal = stmt.step ? this.evaluateExpression(stmt.step, context) : 1;
            
            // Initialize counter
            // stmt.counter is a VariableDeclaration
            // We should manually define it in loopContext
            const counterName = stmt.counter.name;
            loopContext.define(counterName, fromVal);

            let currentVal = fromVal;
            // Assuming increasing loop for now. Logic should handle direction based on step or comparison
            // Or simple for-loop semantic: while currentVal <= toVal (if step > 0)
            
            while ((stepVal >= 0 && currentVal <= toVal) || (stepVal < 0 && currentVal >= toVal)) {
                // Update counter in context
                loopContext.set(counterName, currentVal); // Use set as it's already defined

                try {
                    this.executeStatement(stmt.block, loopContext);
                } catch (e) {
                    if (e instanceof ReturnValue) throw e;
                    throw e; // rethrow other errors
                }

                currentVal += stepVal;
            }
            return;
        }

        if (isReturnStatement(stmt)) {
            const val = this.evaluateExpression(stmt.value, context);
            throw new ReturnValue(val);
        }

        // If it's an expression statement
        if (isExpression(stmt)) {
            return this.evaluateExpression(stmt, context);
        }

        // Ignore types that don't need runtime execution (like Unit/Dimension declarations if unused)
        // or throw if unimplemented
    }

    private executeBlock(block: any, context: Context): any {
         // Explicitly cast to ensure type safety if needed, or allow any.
         // Block creates a new scope? 
         // Usually yes.
         const childContext = context.createChild();
         for (const s of block.statements) {
             try {
                this.executeStatement(s, childContext);
             } catch (e) {
                 if (e instanceof ReturnValue) {
                     // If we are just a block, we propagate return up?
                     // Yes, return exits the function, not just the block.
                     throw e; 
                 }
                 throw e;
             }
         }
         // block.returnValue is optional in grammar?
         if (block.returnValue) {
             const val = this.evaluateExpression(block.returnValue.value, context); // Should use childContext?
             // Actually generated AST might have statements list AND returnValue field?
             // Grammar: '{' (statements+=Statement*)? returnValue=ReturnStatement? '}'
             // So if explicit return is at end check it
         }
    }

    private evaluateExpression(expr: Expression, context: Context): any {
        if (isNumberLiteral(expr)) return expr.value;
        if (isBooleanLiteral(expr)) return expr.value ? true : false; // .value might be boolean or string 'true'/'false' depending on parser mapping. Grammar says boolean.
        if (isStringLiteral(expr)) return expr.value;


        // Handle Assignment specifically (L-Value)
        if (isBinaryExpression(expr) && expr.operator === '=') {
             const rightVal = this.evaluateExpression(expr.right, context);
             
             // Check if left is ReferenceExpression
            if (isReferenceExpression(expr.left)) {
                const decl = expr.left.element.ref;
                if (!decl) throw new Error("Unresolved assignment target");
                context.set(decl.name, rightVal);
                return rightVal;
            }
            throw new Error("Invalid assignment target");
        }

        if (isBinaryExpression(expr)) {
            const left = this.evaluateExpression(expr.left, context);
            const right = this.evaluateExpression(expr.right, context);
            switch (expr.operator) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/': return left / right;
                case '^': return Math.pow(left, right);
                case '==': return left === right;
                case '!=': return left !== right;
                case '<': return left < right;
                case '<=': return left <= right;
                case '>': return left > right;
                case '>=': return left >= right;
                case 'and': return left && right;
                case 'or': return left || right;
                // ...
            }
        }

        if (isReferenceExpression(expr)) {
             const decl = expr.element.ref;
             if (!decl) throw new Error(`Unresolved reference to ${expr.element.$refText}`);
             return context.get(decl.name);
        }


        // Handle Assignment specifically (L-Value)
        if (isBinaryExpression(expr) && expr.operator === '=') {
             const rightVal = this.evaluateExpression(expr.right, context);
             
             // Check if left is ReferenceExpression
            if (isReferenceExpression(expr.left)) {
                const decl = expr.left.element.ref;
                if (!decl) throw new Error("Unresolved assignment target");
                context.set(decl.name, rightVal);
                return rightVal;
            }
            throw new Error("Invalid assignment target");
        }

        // Assignment check handled by BinaryExpression


        if (isCallExpression(expr)) {
             // expr.callee is the thing being called. 
             // In grammar: EvaluationExpression ... MemberAccess | CallExpression
             // CallExpression.callee = current. 
             // So callee is an Expression.
             
             // Evaluate callee to get the function
             const func = this.evaluateExpression(expr.callee, context);
             
             if (!func || !isFormulaDeclaration(func)) {
                 throw new Error("Calling a non-function");
             }
             
             // Prepare arguments
             const args = expr.arguments.map(arg => this.evaluateExpression(arg, context));
             
             // Create function context
             // Closures? e-lang seems to handle top-level functions (Formulas).
             // If they capture global scope, that's fine.
             const fnContext = this.globalContext.createChild(); // Use global as parent or definition context? 
             // Ideally definition context. But formulas are top level.
             
             // Bind parameters
             func.parameters.forEach((param, index) => {
                 const argVal = args[index];
                 fnContext.define(param.name, argVal);
             });
             
             // Execute body
             try {
                 this.executeStatement(func.body, fnContext);
             } catch (e) {
                 if (e instanceof ReturnValue) return e.value;
                 throw e;
             }
             return undefined; // Void return
        }

        return undefined;
        // throw new Error(`Unknown expression type: ${expr.$type}`);
    }
}
