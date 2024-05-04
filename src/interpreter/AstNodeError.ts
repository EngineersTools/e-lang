import { AstNode } from "langium";

/**
 * A class used to represent errors in the execution of specific
 * AstNodes of an Elang program. The error retrieves and outputs
 * the position in which the error is found.
 */

export class AstNodeError extends Error {
  constructor(node: AstNode, message: string) {
    const position = node.$cstNode!.range.start;
    super(`${message} @${position.line + 1}:${position.character + 1}`);
  }
}
