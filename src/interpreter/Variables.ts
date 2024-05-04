import { AstNode } from "langium";
import { AstNodeError } from "./AstNodeError.js";

/**
 * Class used to create objects that hold all the variables
 * available in a specific scope/context. It uses a stack
 * to add, remove and retrieve variable values
 */

export class Variables {
  private stack: Record<string, unknown>[] = [];

  enter(): void {
    this.stack.push({});
  }

  leave(): void {
    this.stack.pop();
  }

  push(name: string, value: unknown): void {
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1][name] = value;
    }
  }

  set(node: AstNode, name: string, value: unknown): void {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const scope = this.stack[i];
      if (Object.hasOwn(scope, name)) {
        scope[name] = value;
        return;
      }
    }
    throw new AstNodeError(node, `No variable '${name}' defined`);
  }

  get(node: AstNode, name: string): unknown {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const scope = this.stack[i];
      if (Object.hasOwn(scope, name)) {
        return scope[name];
      }
    }
    throw new AstNodeError(node, `No variable '${name}' defined`);
  }
}
