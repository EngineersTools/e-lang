import { AstNode } from "langium";
import {
  ELangProgram,
  FormulaDeclaration,
  ForStatement,
  isELangProgram,
  isFormulaDeclaration,
  isForStatement,
  isLambdaExpression,
  isStatementBlock,
  LambdaExpression,
  StatementBlock,
} from "./generated/ast.js";

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_key: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export function isScopeBoundary(
  node: AstNode
): node is
  | StatementBlock
  | ELangProgram
  | FormulaDeclaration
  | LambdaExpression
  | ForStatement {
  return (
    isStatementBlock(node) ||
    isELangProgram(node) ||
    isFormulaDeclaration(node) ||
    isLambdaExpression(node) ||
    isForStatement(node)
  ); // For loop counter exists within its block
}
