import {
  TypeDescription,
  createBooleanType,
  createNullType,
  createNumberType,
  createTextType,
} from "./descriptions.js";

export class TypeRegistry {
  constructor() {
    this.varIndex = 0;
    this.stack = [];
    this._registerGlobalTypes();
  }

  varIndex: number;

  // Stores the name of the type and its type description
  private stack: Map<string, TypeDescription>[];

  private _registerGlobalTypes() {
    this.enterScope(); // The global scope
    this.set("text", createTextType());
    this.set("number", createNumberType());
    this.set("boolean", createBooleanType());
    this.set("null", createNullType());
  }

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
