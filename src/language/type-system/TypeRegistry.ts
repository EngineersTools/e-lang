import { ELangType } from "./ELangType.js";

export class TypeRegistry {
  constructor() {
    this._registry = new Map();
  }

  // Stores the name of the type and its type description
  private _registry: Map<string, ELangType>;

  set(name: string, type: ELangType): void {
    this._registry.set(name, type);
  }

  get(name: string): ELangType | undefined {
    return this._registry.get(name);
  }
}
