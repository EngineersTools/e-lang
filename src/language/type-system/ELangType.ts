export class ELangType {
  constructor(name: string) {
    this.name = name;
  }

  private name: string;

  static number: ELangType;
  static text: ELangType;
  static boolean: ELangType;
  static null: ELangType;

  getName(): string {
    return this.name;
  }

  toString(): string {
    return this.getName();
  }

  equals(other: ELangType): boolean {
    return this.getName() === other.getName();
  }

  static fromString(name: string): ELangType {
    switch (name) {
      case "number":
        return ELangType.number;
      case "text":
        return ELangType.text;
      case "boolean":
        return ELangType.boolean;
      case "null":
        return ELangType.null;
      default:
        throw new Error(`Unknown type: ${name}`);
    }
  }
}

ELangType.number = new ELangType("number");
ELangType.text = new ELangType("text");
ELangType.boolean = new ELangType("boolean");
ELangType.null = new ELangType("null");
