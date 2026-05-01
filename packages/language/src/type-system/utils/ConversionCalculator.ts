import {
  isUnitDeclaration,
  isUnitLiteral,
  isUnitOperation,
  isUnitReference,
  UnitDeclaration,
  UnitExpression,
} from "../../generated/ast.js";

/**
 * The `ConversionCalculator` computes the scalar normalization factor
 * required to convert a defined unit back to the Base Unit.
 */
export class ConversionCalculator {
  private cache = new Map<string, number>();
  private stack = new Set<string>();

  public compute(node: UnitDeclaration | UnitExpression): number {
    if (isUnitDeclaration(node)) {
      return this.computeUnitDeclaration(node);
    } else {
      return this.computeUnitExpression(node);
    }
  }

  private computeUnitDeclaration(def: UnitDeclaration, power: number = 1): number {
    if (this.stack.has(def.name)) {
      throw new Error(`Cycle detected in unit definitions: ${Array.from(this.stack).join(" -> ")} -> ${def.name}`);
    }

    if (this.cache.has(def.name)) {
      return Math.pow(this.cache.get(def.name)!, power);
    }

    this.stack.add(def.name);
    let factor = 1.0;

    // Derived Unit (e.g., unit Newton = kg * m / s^2;)
    if (def.expression) {
      factor = this.computeUnitExpression(def.expression);
    }
    // Base Unit (e.g., unit meter : Length;)
    else if (def.dimension && def.dimension.ref) {
      factor = 1.0;
    }

    this.cache.set(def.name, factor);
    this.stack.delete(def.name);

    return Math.pow(factor, power);
  }

  private computeUnitExpression(expr: UnitExpression, power: number = 1): number {
    let factor = 1.0;

    if (isUnitLiteral(expr)) {
      if (expr.value !== undefined) {
        factor = expr.value;
      }
    } else if (isUnitOperation(expr)) {
      const leftVal = this.computeUnitExpression(expr.left);
      const rightVal = this.computeUnitExpression(expr.right);

      if (expr.operator === "*") {
        factor = leftVal * rightVal;
      } else if (expr.operator === "/") {
        factor = leftVal / rightVal;
      }
    } else if (isUnitReference(expr)) {
      if (expr.ref && expr.ref.ref) {
        factor = this.computeUnitDeclaration(expr.ref.ref, expr.power ?? 1);
      }
    }

    return Math.pow(factor, power);
  }
}
