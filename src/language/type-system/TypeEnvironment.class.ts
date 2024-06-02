import { TypeRegistry } from "./TypeRegistry.class.js";
import { TypeDescription } from "./descriptions.js";

export class TypeEnvironment {
  constructor() {
    this.stack = [];
    this.typeRegistry = new TypeRegistry();
    this._initialiseTypeEnvironment();
  }

  private typeRegistry: TypeRegistry;

  private stack: Map<string, TypeDescription>[];

  private _initialiseTypeEnvironment() {
    this.enterScope(); // The global scope
    this.typeRegistry.registerGlobalTypes();
  }

  numberOfScopes(): number {
    return this.stack.length;
  }

  enterScope(): void {
    this.stack.push(new Map());
    this.typeRegistry.enterScope();
  }

  leaveScope(): void {
    this.stack.pop();
    this.typeRegistry.leaveScope();
  }

  registerType(name: string, type: TypeDescription): void {
    this.typeRegistry.set(name, type);
  }

  getRegisteredType(name: string): TypeDescription | undefined {
    return this.typeRegistry.get(name);
  }

  getTypeRegistryVarIndex() {
    return this.typeRegistry.varIndex;
  }

  increaseTypeRegistryVarIndex() {
    this.typeRegistry.varIndex++;
  }

  setVariableType(name: string, type: TypeDescription): void {
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1].set(name, type);
    }
  }

  getVariableType(name: string): TypeDescription | undefined {
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
