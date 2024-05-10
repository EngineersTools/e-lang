import { AstNode } from "langium";
import { TypeDescription } from "./descriptions.js";

export class TypeEnvironment {
  private stack: Map<AstNode, TypeDescription>[] = [];

  length(): number {
    return this.stack.length;
  }

  enter(): void {
    this.stack.push(new Map());
  }

  leave(): void {
    this.stack.pop();
  }

  set(node: AstNode, type: TypeDescription): void {
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1].set(node, type);
    }
  }

  get(node: AstNode): TypeDescription | undefined {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const scope = this.stack[i];
      const type = scope.get(node);
      if (type) {
        return type;
      }
    }

    return undefined;
  }
}
