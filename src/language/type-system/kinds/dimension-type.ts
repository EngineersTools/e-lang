import { Type, TypirProblem } from "typir";

export class DimensionType extends Type {
  override getName(): string {
    return "dimension";
    // throw new Error("Method not implemented.");
  }
  override getUserRepresentation(): string {
    return "Dimension Type";
    // throw new Error("Method not implemented.");
  }
  override analyzeTypeEqualityProblems(otherType: Type): TypirProblem[] {
    return [];
    // throw new Error("Method not implemented.");
  }
}
