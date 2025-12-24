import {
    isUnitDeclaration,
    isUnitLiteral,
    isUnitOperation,
    isUnitReference,
    UnitDeclaration,
    UnitExpression,
} from "./generated/ast.js";

// The canonical representation of a dimension: { "Length": 1, "Time": -2 }
export type DimensionVector = Map<string, number>;

export class DimensionCalculator {
  // Cache to prevent re-calculating the same named unit repeatedly
  private cache = new Map<string, DimensionVector>();

  /**
   * Entry point: Computes the dimension vector for a given Unit Declaration or Expression.
   */
  public compute(node: UnitDeclaration | UnitExpression): DimensionVector {
    if (isUnitDeclaration(node)) {
      return this.computeUnitDeclaration(node);
    } else {
      return this.computeExpression(node);
    }
  }

  private computeUnitDeclaration(def: UnitDeclaration): DimensionVector {
    // Check cache first to avoid cycles and redundant work
    if (this.cache.has(def.name)) {
      return this.cache.get(def.name)!;
    }

    const vector = new Map<string, number>();

    // Case 1: Base Unit (e.g., unit meter : Length;)
    if (def.dimension && def.dimension.ref) {
      const dimName = def.dimension.ref.name;
      vector.set(dimName, 1);
    }
    // Case 2: Derived Unit (e.g., unit Newton = kg * m / s^2;)
    else if (def.expression) {
      // We temporarily set an empty vector to break recursion cycles
      this.cache.set(def.name, new Map());

      const exprVector = this.computeExpression(def.expression);

      // Merge results into our main vector
      exprVector.forEach((val, key) => vector.set(key, val));
    }

    // Store result in cache
    this.cache.set(def.name, vector);
    return vector;
  }

  private computeExpression(expr: UnitExpression): DimensionVector {
    // Since UnitExpression can be a chain of operations (left op right)

    if (isUnitLiteral(expr)) {
      // Case: Literal Number (e.g., "1000 * m")
      // Scalars are dimensionless. Return empty map.
      if (expr.value !== undefined) {
        return new Map<string, number>();
      }
    } else if (isUnitOperation(expr)) {
      const leftVec = this.computeExpression(expr.left);
      const rightVec = this.computeExpression(expr.right);

      if (expr.operator === "*") {
        return DimensionCalculator.addVectors(leftVec, rightVec);
      } else if (expr.operator === "/") {
        return DimensionCalculator.subtractVectors(leftVec, rightVec);
      }
    } else if (isUnitReference(expr)) {
      if (expr.ref && expr.ref.ref) {
        return this.computeUnitDeclaration(expr.ref.ref);
      }
    }

    // Default: dimensionless

    return new Map<string, number>();
  }

  // --- Vector Math Helpers ---

  public static addVectors(
    v1: DimensionVector,
    v2: DimensionVector
  ): DimensionVector {
    const result = new Map(v1);
    for (const [dim, exp] of v2) {
      result.set(dim, (result.get(dim) || 0) + exp);
    }
    return this.cleanVector(result);
  }

  public static subtractVectors(
    v1: DimensionVector,
    v2: DimensionVector
  ): DimensionVector {
    const result = new Map(v1);
    for (const [dim, exp] of v2) {
      result.set(dim, (result.get(dim) || 0) - exp);
    }
    return this.cleanVector(result);
  }

  public static scaleVector(
    v: DimensionVector,
    factor: number
  ): DimensionVector {
    const result = new Map<string, number>();
    for (const [dim, exp] of v) {
      result.set(dim, exp * factor);
    }
    return result;
  }

  // Removes dimensions with 0 exponent (e.g., m^1 / m^1 -> m^0 -> remove)
  public static cleanVector(v: DimensionVector): DimensionVector {
    for (const [dim, exp] of v) {
      if (exp === 0) {
        v.delete(dim);
      }
    }
    return v;
  }

  /**
   * Utility for debugging or creating unique keys for the Type System
   * Returns string like: "Length:1,Time:-2"
   */
  public toString(v: DimensionVector): string {
    return Array.from(v.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Ensure deterministic order
      .map(([dim, exp]) => `${dim}:${exp}`)
      .join(",");
  }
}
