import { TypeDescription } from "./descriptions.js";

export class TypeEnvironment {
  private stack: Map<string, TypeDescription>[] = [];

  numberOfScopes(): number {
    return this.stack.length;
  }

  enterScope(): void {
    this.stack.push(new Map());
  }

  leaveScope(): void {
    this.stack.pop();
  }

  set(name: string, type: TypeDescription): void {
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1].set(name, type);
    }
  }

  get(name: string): TypeDescription | undefined {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const scope = this.stack[i];
      const type = scope.get(name);
      if (type) {
        return type;
      }
    }

    return undefined;
  }
}
