import { ELangType } from "./ELangType.js";
import { TypeRegistry } from "./TypeRegistry.js";

export class TypeEnvironment {
  constructor() {
    this.stack = new Array<TypeRegistry>();
  }

  private stack: TypeRegistry[];

  numberOfScopes(): number {
    return this.stack.length;
  }

  enterScope(): void {
    this.stack.push(new TypeRegistry());
  }

  leaveScope(): void {
    this.stack.pop();
  }

  setType(name: string, type: ELangType): ELangType {
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1].set(name, type);
    }
    return type;
  }

  getType(name: string): ELangType | undefined {
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
