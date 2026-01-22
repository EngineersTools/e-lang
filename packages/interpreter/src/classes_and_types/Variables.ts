import { AstNode } from "langium";
import { AstNodeError } from "./AstNodeError.js";

/**
 * Class used to create objects that hold all the variables
 * available in a specific scope/context. It uses a stack
 * to add, remove and retrieve variable values
 */
export class Variables {
  private stack: Record<string, unknown>[] = [];
  private parentScope?: Variables;

  constructor(parentScope?: Variables) {
    this.parentScope = parentScope;
  }

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

    // Check in parent scope if exists
    if (this.parentScope) {
      return this.parentScope.get(node, name);
    }

    throw new AstNodeError(node, `No variable '${name}' defined`);
  }

  getAll(): Record<string, unknown> {
    const allVars: Record<string, unknown> = {};

    // Collect from parent scope first
    if (this.parentScope) {
      Object.assign(allVars, this.parentScope.getAll());
    }

    // Collect from current stack
    for (const scope of this.stack) {
      Object.assign(allVars, scope);
    }

    return allVars;
  }
}
