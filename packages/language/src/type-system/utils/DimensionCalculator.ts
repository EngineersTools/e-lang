import {
  DimensionDeclaration,
  isDimensionDeclaration,
  isUnitDeclaration,
  isUnitLiteral,
  isUnitOperation,
  isUnitReference,
  UnitDeclaration,
  UnitExpression,
} from "../../generated/ast.js";

// The canonical representation of a dimension: { "Length": 1, "Time": -2 }
export type DimensionVector = Map<string, number>;

/**
 * The `DimensionCalculator` class provides utilities for calculating and manipulating
 * dimension vectors for physical units and dimensions in a type system.
 * 
 * It supports:
 * - Computing the dimension vector for a given dimension, unit declaration, or unit expression.
 * - Caching computed vectors to avoid redundant calculations and handle recursion.
 * - Handling base units, derived units, and unit expressions involving multiplication, division, and powers.
 * - Vector math operations such as addition, subtraction, scaling, and cleaning (removing zero exponents).
 * - Comparing vectors for equality and converting vectors to string representations for debugging or unique keys.
 * 
 * This class is intended to be used as part of a type system for a language that models physical units and dimensions.
 */
export class DimensionCalculator {
  // Cache to prevent re-calculating the same named unit repeatedly
  private cache = new Map<string, DimensionVector>();

  
  /**
   * Computes the dimension vector for the given node, which can be a
   * DimensionDeclaration, UnitDeclaration, or UnitExpression.
   *
   * Depending on the type of the node, this method delegates the computation
   * to the appropriate handler:
   * - If the node is a DimensionDeclaration, computes its dimension vector.
   * - If the node is a UnitDeclaration, computes its dimension vector.
   * - Otherwise, treats the node as a UnitExpression and computes its dimension vector.
   *
   * @param node - The AST node representing a dimension declaration, unit declaration, or unit expression.
   * @returns The computed DimensionVector for the provided node.
   */
  public compute(node: DimensionDeclaration | UnitDeclaration | UnitExpression): DimensionVector {
    if (isDimensionDeclaration(node)) {
      return this.computeDimensionDeclaration(node);
    } else if (isUnitDeclaration(node)) {
      return this.computeUnitDeclaration(node);
    } else {
      return this.computeExpression(node);
    }
  }

  /**
   * Computes and returns the dimension vector for a given dimension declaration.
   * If the dimension has already been computed and cached, returns the cached vector.
   * Otherwise, creates a new vector with the dimension's name set to 1, caches it, and returns it.
   *
   * @param def - The dimension declaration to compute the vector for.
   * @returns The computed or cached dimension vector for the given declaration.
   */
  private computeDimensionDeclaration(def: DimensionDeclaration): DimensionVector {
    if (this.cache.has(def.name)) {
      return this.cache.get(def.name)!;
    }

    const vector = new Map<string, number>();

    vector.set(def.name, 1);
    this.cache.set(def.name, vector);

    return vector;
  }

  /**
   * Computes the dimension vector for a given unit declaration, optionally raised to a specified power.
   *
   * This method handles three main cases:
   * 1. Unit declarations with both a dimension and an expression, where the dimension vector is derived from the expression.
   * 2. Base units that have a direct dimension reference.
   * 3. Derived units defined by an expression without a direct dimension reference.
   *
   * The computed dimension vector is cached for efficiency and to prevent recursion cycles.
   *
   * @param def - The unit declaration to compute the dimension vector for.
   * @param power - (Optional) The exponent to which the unit is raised. Defaults to 1 if not provided.
   * @returns The computed dimension vector as a `Map<string, number>`.
   */
  private computeUnitDeclaration(def: UnitDeclaration, power?: number): DimensionVector {
    const vector = new Map<string, number>();

    // Case 0: Unit declaration has both dimension and expression. Create a vector for this dimension based on the expression.
    if (def.dimension && def.dimension.ref && def.expression) {
      this.cache.set(def.name, new Map());
      const exprVector = this.computeExpression(def.expression, power);
      exprVector.forEach((val, key) => vector.set(key, (vector.get(key) || 0) + val * (power ?? 1)));
      const dimName = def.dimension.ref.name;
      this.cache.set(dimName, vector);
      return vector;
    }
    // Case 1: Base Unit (e.g., unit meter : Length;)
    else if (def.dimension && def.dimension.ref) {
      if (this.cache.has(def.name)) {
        return this.cache.get(def.name)!;
      }

      const dimName = def.dimension.ref.name;
      vector.set(dimName, power ?? 1);
    }
    // Case 2: Derived Unit (e.g., unit Newton = kg * m / s^2;)
    else if (def.expression) {
      // We temporarily set an empty vector to break recursion cycles
      this.cache.set(def.name, new Map());

      const exprVector = this.computeExpression(def.expression, power);

      // Merge results into our main vector
      exprVector.forEach((val, key) => vector.set(key, (vector.get(key) || 0) + val * (power ?? 1)));
    }

    // Store result in cache
    this.cache.set(def.name, vector);
    return vector;
  }

  /**
   * Computes the dimension vector for a given unit expression.
   *
   * This method recursively evaluates a `UnitExpression`, which may be a literal,
   * an operation (multiplication or division), or a reference to a unit declaration.
   * It returns a `DimensionVector` (a map from dimension names to their exponents)
   * representing the dimensionality of the expression.
   *
   * - For unit literals with a numeric value, returns a dimensionless vector.
   * - For operations, combines the dimension vectors of the left and right operands
   *   using addition (for multiplication) or subtraction (for division).
   * - For unit references, delegates to `computeUnitDeclaration` to resolve the dimension.
   *
   * @param expr - The unit expression to compute the dimension vector for.
   * @param power - (Optional) The exponent to apply to the unit reference, if any.
   * @returns The computed dimension vector as a `Map<string, number>`.
   */
  private computeExpression(expr: UnitExpression, power?: number): DimensionVector {
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
        return this.computeUnitDeclaration(expr.ref.ref, power ?? expr.power);
      }
    }

    // Default: dimensionless

    return new Map<string, number>();
  }

  /**
   * Determines whether two dimension vectors are equal.
   *
   * Compares the size and each dimension-exponent pair of the two given
   * `DimensionVector` instances. Returns `true` if both vectors have the same
   * dimensions with identical exponents; otherwise, returns `false`.
   *
   * @param v1 - The first dimension vector to compare.
   * @param v2 - The second dimension vector to compare.
   * @returns `true` if the vectors are equal; otherwise, `false`.
   */
  public static areVectorsEqual(
    v1: DimensionVector,
    v2: DimensionVector
  ): boolean {
    if (v1.size !== v2.size) {
      return false;
    }
    for (const [dim, exp] of v1) {
      if (v2.get(dim) !== exp) {
        return false;
      }
    }
    return true;
  }

  /**
   * Converts a `DimensionVector` to its string representation.
   * 
   * The output is a comma-separated list of dimension-exponent pairs,
   * sorted deterministically by dimension name. Each pair is formatted as `dimension:exponent`.
   *
   * @param v - The `DimensionVector` to convert.
   * @returns The string representation of the dimension vector.
   */
  public static toString(v: DimensionVector): string {
    return Array.from(v.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Ensure deterministic order
      .map(([dim, exp]) => `${dim}:${exp}`)
      .join(",");
  }

  /**
   * Adds two dimension vectors by summing the exponents of matching dimensions.
   *
   * @param v1 - The first dimension vector, represented as a Map of dimension keys to exponents.
   * @param v2 - The second dimension vector, represented as a Map of dimension keys to exponents.
   * @returns A new dimension vector (Map) representing the sum of the input vectors, with cleaned zero-exponent dimensions.
   */
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

  /**
   * Subtracts the exponents of two dimension vectors.
   *
   * Given two {@link DimensionVector} objects, this method subtracts the exponents of each dimension in `v2`
   * from the corresponding exponents in `v1`. If a dimension exists in `v2` but not in `v1`, it is treated as zero in `v1`.
   * The resulting vector is cleaned to remove any dimensions with a zero exponent.
   *
   * @param v1 - The minuend dimension vector.
   * @param v2 - The subtrahend dimension vector.
   * @returns A new {@link DimensionVector} representing the result of the subtraction.
   */
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

  /**
   * Scales all exponents in a given dimension vector by a specified factor.
   *
   * @param v - The dimension vector to scale, represented as a map of dimension names to their exponents.
   * @param factor - The numeric factor by which to multiply each exponent in the vector.
   * @returns A new dimension vector with each exponent scaled by the given factor.
   */
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

  /**
   * Removes all dimensions from the given {@link DimensionVector} whose exponent is zero.
   *
   * Iterates over the entries of the provided dimension vector and deletes any dimension
   * where the exponent is exactly zero, effectively "cleaning" the vector of zero-exponent entries.
   *
   * @param v - The {@link DimensionVector} to be cleaned in-place.
   * @returns The cleaned {@link DimensionVector} with all zero-exponent dimensions removed.
   */
  public static cleanVector(v: DimensionVector): DimensionVector {
    for (const [dim, exp] of v) {
      if (exp === 0) {
        v.delete(dim);
      }
    }
    return v;
  }

  /**
   * Converts a given `DimensionVector` to its string representation.
   * 
   * The output string lists each dimension and its exponent in the format `dim:exp`,
   * separated by commas. The dimensions are sorted alphabetically to ensure a
   * deterministic order.
   *
   * @param v - The `DimensionVector` to convert to a string.
   * @returns A string representation of the dimension vector, with each dimension
   * and its exponent separated by a colon and each pair separated by commas.
   */
  public toString(v: DimensionVector): string {
    return Array.from(v.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Ensure deterministic order
      .map(([dim, exp]) => `${dim}:${exp}`)
      .join(",");
  }
}
