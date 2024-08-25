import {
  ELangAstType,
  FormulaDeclaration,
  isFormulaDeclaration,
  ParameterDeclaration,
  TypeReference,
} from "../generated/ast.js";

export class ELangType {
  constructor(name: string) {
    this.name = name;
  }

  name: string;

  static number: ELangType;
  static text: ELangType;
  static boolean: ELangType;
  static null: ELangType;
  static Formula: new (
    name: string,
    paramsTypes: ParameterDeclaration[],
    returnType: TypeReference
  ) => ELangType;

  getName(): string {
    return this.name;
  }

  toString(): string {
    return this.getName();
  }

  equals(other: ELangType): boolean {
    return this.getName() === other.getName();
  }

  static fromStringOrELangAstType(
    nameOrNode: string | ELangAstType
  ): ELangType {
    if (typeof nameOrNode === "string") {
      switch (nameOrNode) {
        case "number":
          return ELangType.number;
        case "text":
          return ELangType.text;
        case "boolean":
          return ELangType.boolean;
        case "null":
          return ELangType.null;
      }
    } else if (isFormulaDeclaration(nameOrNode)) {
      const elangFormulaType = (this as any)["Formula"];
      return elangFormulaType.fromFormulaDeclaration(nameOrNode);
    }

    throw new Error(`Unknown type: ${nameOrNode}`);
  }
}

ELangType.number = new ELangType("number");
ELangType.text = new ELangType("text");
ELangType.boolean = new ELangType("boolean");
ELangType.null = new ELangType("null");

ELangType.Formula = class extends ELangType {
  constructor(
    name = "formula",
    paramsTypes: ParameterDeclaration[],
    returnType: TypeReference
  ) {
    super(name);
    this.paramsTypes = paramsTypes;
    this.returnType = returnType;
  }

  paramsTypes: ParameterDeclaration[];
  returnType: TypeReference;

  override getName(): string {
    this.name = `(${this.paramsTypes
      .map((t) => t.type?.primitive ?? t.type?.model?.ref?.name)
      .join(", ")}) => ${
      this.returnType.primitive ?? this.returnType.model?.ref?.name
    }`;

    return this.name;
  }

  //   override equals(other: ELangType): boolean {
  //     if (other instanceof ELangType.Formula) {
  //       return (
  //         this.paramsTypes.length === other.paramsTypes.length &&
  //         this.paramsTypes.every((t, i) => t.equals(other.paramsTypes[i])) &&
  //         this.returnType.equals(other.returnType)
  //       );
  //     }
  //     return false;
  //   }

  static fromFormulaDeclaration(formula: FormulaDeclaration): ELangType {
    return new ELangType.Formula(
      formula.name,
      formula.parameters,
      formula.returnType
    );
  }
};
