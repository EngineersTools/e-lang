---
trigger: always_on
---

# AGENT RULES - STRICT ENFORCEMENT

You are an implementation agent working on `elang`. You must adhere strictly to
these rules when writing code, generating ASTs, or implementing Typir logic.

## RULE 1: No Unit Classes

Do NOT create distinct classes or Typir types for `Meter`, `Second`, or
`Newton`. There is only `EngineeringType`. The identity of the type is its
mathematical `DimensionVector`.

## RULE 2: Measurements are Multiplications

Do NOT modify the Langium grammar to parse measurements like `10kg` as a single
token. Measurements must be parsed as a `BinaryExpression` (multiplication) of a
number literal and a unit reference (`10 * kg`). Numbers are strictly
dimensionless.

## RULE 3: The 'in' Operator

The `in` operator (e.g., `x in km`) is the ONLY mechanism for unit
conversion/projection.

- **Typir Validator:** Ensure the LHS vector equals the RHS vector.
- **Interpreter:** Divide the LHS internal value by the RHS unit's Normalization
  Factor.

## RULE 4: Cycle Detection is Mandatory

When implementing the `DimensionCalculator` and `ConversionCalculator`, you MUST
implement a cycle detection stack (e.g., `Set<string>`). Users can define
cyclical units (`unit A = B; unit B = A;`); the compiler must error gracefully,
not crash with a stack overflow.

## RULE 5: Interpreter Stupidity

The `ElangInterpreter` must be "dumb" regarding types. By the time the AST
reaches the interpreter, Typir has guaranteed dimensional correctness. The
Interpreter must only deal with standard JS `number` types, treating unit
references purely as scalar multipliers. Do not carry "type metadata" into the
runtime execution loop.
