import { AstNode } from "langium";

/**
 * Error type raised for problems associated with a specific AST node.
 *
 * The error message will have the node's source location appended when available.
 * Location is taken from the node's CST range start and formatted as " @<line>:<column>"
 * using 1-based line and column numbers.
 *
 * @extends Error
 *
 * @param node - The AST node related to the error; its CST location (node.$cstNode?.range.start)
 *               is used to augment the message when present.
 * @param message - A human-readable error message describing the problem.
 */
export class AstNodeError extends Error {
  constructor(node: AstNode, message: string) {
    const position = node.$cstNode?.range.start;
    const location = position ? ` @${position.line + 1}:${position.character + 1}` : '';
    super(`${message}${location}`);
  }
}
