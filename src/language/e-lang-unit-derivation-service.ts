import { LangiumDocument, ValidationAcceptor } from "langium";
import {
    BinaryUnitFamilyExpression,
    ConversionDeclaration,
    isBinaryUnitFamilyExpression,
    isUnitFamilyDeclaration,
    UnitDeclaration,
    UnitFamilyDeclaration,
    UnitFamilyExpression,
} from "./generated/ast.js";

export class ELangUnitDerivationService {
  private derivedFamilies: Map<string, UnitFamilyDeclaration> = new Map();

  /**
   * Process a unit family expression to create derived units
   */
  processUnitFamilyExpression(
    document: LangiumDocument,
    expression: UnitFamilyExpression | UnitFamilyDeclaration
  ): UnitFamilyDeclaration {
    if (isBinaryUnitFamilyExpression(expression)) {
      return this.processBinaryExpression(document, expression);
    } else if (isUnitFamilyDeclaration(expression)) {
      return expression;
    }
    throw new Error("Unsupported unit family expression type");
  }

  /**
   * Process binary expressions (multiplication, division, exponentiation)
   */
  private processBinaryExpression(
    document: LangiumDocument,
    expression: BinaryUnitFamilyExpression
  ): UnitFamilyDeclaration {
    switch (expression.operator) {
      case "*":
        return this.multiplyUnitFamilies(
          document,
          this.processUnitFamilyExpression(document, expression.left),
          this.processUnitFamilyExpression(document, expression.right!)
        );
      case "/":
        return this.divideUnitFamilies(
          document,
          this.processUnitFamilyExpression(document, expression.left),
          this.processUnitFamilyExpression(document, expression.right!)
        );
      case "^":
        return this.exponentiateUnitFamily(
          document,
          this.processUnitFamilyExpression(document, expression.base!),
          expression.exponent!
        );
      default:
        throw new Error(`Unsupported operator: ${expression.operator}`);
    }
  }

  /**
   * Multiply two unit families (e.g., Length * Time)
   */
  private multiplyUnitFamilies(
    document: LangiumDocument,
    family1: UnitFamilyDeclaration,
    family2: UnitFamilyDeclaration
  ): UnitFamilyDeclaration {
    const newName = `${family1.name}_times_${family2.name}`;

    if (this.derivedFamilies.has(newName)) {
      return this.derivedFamilies.get(newName)!;
    }

    const derivedFamily: UnitFamilyDeclaration = {
      name: newName,
      description: `Product of ${family1.name} and ${family2.name}`,
      units: this.combineUnits(family1.units || [], family2.units || [], "*"),
      conversions: this.deriveConversions(family1, family2, "*"),
      $type: "UnitFamilyDeclaration",
      $container: document,
    };

    this.derivedFamilies.set(newName, derivedFamily);
    return derivedFamily;
  }

  /**
   * Divide two unit families (e.g., Length / Time)
   */
  private divideUnitFamilies(
    document: LangiumDocument,
    family1: UnitFamilyDeclaration,
    family2: UnitFamilyDeclaration
  ): UnitFamilyDeclaration {
    const newName = `${family1.name}_per_${family2.name}`;

    if (this.derivedFamilies.has(newName)) {
      return this.derivedFamilies.get(newName)!;
    }

    const derivedFamily: UnitFamilyDeclaration = {
      name: newName,
      description: `Quotient of ${family1.name} and ${family2.name}`,
      units: this.combineUnits(family1.units || [], family2.units || [], "/"),
      conversions: this.deriveConversions(family1, family2, "/"),
      $type: "UnitFamilyDeclaration",
      $container: document,
    };

    this.derivedFamilies.set(newName, derivedFamily);
    return derivedFamily;
  }

  /**
   * Raise a unit family to a power (e.g., Length^2)
   */
  private exponentiateUnitFamily(
    document: LangiumDocument,
    family: UnitFamilyDeclaration,
    exponent: number
  ): UnitFamilyDeclaration {
    const newName = `${family.name}_pow_${exponent}`;

    if (this.derivedFamilies.has(newName)) {
      return this.derivedFamilies.get(newName)!;
    }

    const derivedFamily: UnitFamilyDeclaration = {
      name: newName,
      description: `${family.name} raised to power ${exponent}`,
      units: this.exponentiateUnits(family.units || [], exponent),
      conversions: this.exponentiateConversions(
        family.conversions || [],
        exponent
      ),
      $type: "UnitFamilyDeclaration",
      $container: document,
    };

    this.derivedFamilies.set(newName, derivedFamily);
    return derivedFamily;
  }

  /**
   * Combine units for multiplication/division operations
   */
  private combineUnits(
    units1: UnitDeclaration[],
    units2: UnitDeclaration[],
    operator: "*" | "/"
  ): UnitDeclaration[] {
    return units1.flatMap((u1) =>
      units2.map((u2) => ({
        name: `${u1.name}${operator}${u2.name}`,
        longName:
          u1.longName && u2.longName
            ? `${u1.longName}${operator}${u2.longName}`
            : undefined,
        description: `Combined unit: ${u1.name} ${operator} ${u2.name}`,
        $type: "UnitDeclaration",
      }))
    );
  }

  /**
   * Create exponentiated units
   */
  private exponentiateUnits(
    units: UnitDeclaration[],
    exponent: number
  ): UnitDeclaration[] {
    return units.map((unit) => ({
      name: `${unit.name}^${exponent}`,
      longName: unit.longName ? `${unit.longName}^${exponent}` : undefined,
      description: `${
        unit.description || unit.name
      } raised to power ${exponent}`,
      $type: "UnitDeclaration",
    }));
  }

  /**
   * Derive conversions for combined unit families
   */
  private deriveConversions(
    family1: UnitFamilyDeclaration,
    family2: UnitFamilyDeclaration,
    operator: "*" | "/"
  ): ConversionDeclaration[] {
    // Implement conversion derivation logic based on your lambda expression format
    // This will need to be customized based on your specific lambda syntax
    return [];
  }

  /**
   * Create exponentiated conversions
   */
  private exponentiateConversions(
    conversions: ConversionDeclaration[],
    exponent: number
  ): ConversionDeclaration[] {
    // Implement conversion exponentiation logic based on your lambda expression format
    return [];
  }

  /**
   * Validates a derived unit family
   */
  validateDerivedFamily(
    family: UnitFamilyDeclaration,
    accept: ValidationAcceptor
  ): void {
    if (!family.units?.length) {
      accept("error", "Derived unit family must have at least one unit", {
        node: family,
      });
    }

    // Add additional validation as needed
  }
}
