# Finalise E-Lang Interpreter Implementation

This plan aims to complete the interpreter for the `e-lang` programming language. The primary focus is aligning the existing codebase with the strict structural and architectural rules defined for the language: enforcing zero-cost abstractions, runtime type erasure, and proper dimensional/conversion calculations.

## User Review Required

> [!IMPORTANT]
> The current interpreter implementation wraps measurements in an object carrying type metadata (e.g., `{ value: 10, unit: 'kg' }`). This explicitly violates **Rule 5: Interpreter Stupidity**. The planned changes will aggressively strip this metadata from the execution loop, meaning all operations at runtime will just be standard JavaScript `number` arithmetic.

## Open Questions

> [!WARNING]  
> **Grammar Discrepancies:**  
> 1. **Rule 3** specifies the `in` operator for unit conversion, but the grammar currently uses `->`.  
> 2. **Rule 2** states measurements should be parsed as normal binary expressions (e.g., `10 * kg`), but the grammar currently supports a specific `Measurement` node with a `~` operator (e.g., `10 ~ kg`).  
> **Question:** Should I also update `e-lang.langium` to change `->` to `in` and remove the `~` measurement syntax during this implementation, or strictly limit changes to the interpreter?

## Proposed Changes

---

### Type System Calculators

#### [NEW] [ConversionCalculator.ts](file:///home/cjgb/Programming/e-lang/packages/language/src/type-system/utils/ConversionCalculator.ts)
- Implement a `ConversionCalculator` class (parallel to `DimensionCalculator`).
- **Role:** Calculates the scalar normalization factor to convert a defined unit back to the Base Unit.
- **Logic:** Recursively traverses unit definitions and expressions, multiplying scalar literals to find the absolute factor.
- **Cycle Detection:** Implement strict cycle detection using a call stack (`Set<string>`) to throw graceful errors on cyclic definitions, satisfying **Rule 4**.

#### [MODIFY] [DimensionCalculator.ts](file:///home/cjgb/Programming/e-lang/packages/language/src/type-system/utils/DimensionCalculator.ts)
- Update the existing calculator to include the mandatory `Set<string>` cycle detection to prevent stack overflows on cyclic dimension definitions.

---

### Interpreter

#### [MODIFY] [runExpression.ts](file:///home/cjgb/Programming/e-lang/packages/interpreter/src/functions/runExpression.ts)
- **Erase Runtime Types:** Remove the logic that wraps measurements in `{ value, unit }`.
- **Unit Evaluation:** When encountering a `UnitReference` or a base unit, dynamically evaluate it to its scalar Normalization Factor by invoking the `ConversionCalculator`.

#### [MODIFY] [runBinaryExpression.ts](file:///home/cjgb/Programming/e-lang/packages/interpreter/src/functions/runBinaryExpression.ts)
- Strip out the runtime unit-checking logic (e.g., checking if `left.unit !== right.unit`).
- By the time expressions reach the interpreter, Typir validation should guarantee dimensional correctness. The interpreter will just execute pure `number` math (e.g., `left * right` or `left + right`), enforcing zero-cost abstractions.

#### [MODIFY] [runUnitConversionExpression.ts](file:///home/cjgb/Programming/e-lang/packages/interpreter/src/functions/runUnitConversionExpression.ts)
- Implement the unit conversion (projection) logic for the `->` operator (or `in` if we update the grammar).
- **Logic:** Divide the LHS internal value (which is already normalized to the base unit) by the RHS unit's Normalization Factor.

#### [MODIFY] [runStatement.ts](file:///home/cjgb/Programming/e-lang/packages/interpreter/src/functions/runStatement.ts)
- Minor adjustments to ensure compatibility with pure numeric returns and variable assignments where expressions now evaluate to plain `number`s instead of typed objects.

## Verification Plan

### Automated Tests
- Run `npm run test` or `npx vitest` to ensure no existing tests are broken by the type-erasure.
- Write specific tests for cycle detection to assert that `unit A = B; unit B = A;` safely throws a compilation/resolution error rather than crashing the interpreter.
- Add tests to ensure unit conversion (e.g., `1000 * meter -> km`) correctly evaluates to `1`.

### Manual Verification
- Execute an `e-lang` script with complex nested unit multiplication and division to visually verify the correct output.
