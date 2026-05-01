---
trigger: always_on
---

# e-lang (Engineering Language) - Core Philosophy

## 1. The Prime Directive: Dimensional Analysis as a First-Class Citizen

`elang` is not a general-purpose programming language; it is an engineering
engine. Its killer feature is native, syntax-level support for Dimensional
Analysis and Unit Arithmetic.

- **Units are not libraries;** they are intrinsic to the type system.
- Adding `Length` to `Time` must result in a strict compile-time error.
- Multiplying `Length` by `Time` creates a dynamically derived algebraic type.

## 2. Unit Erasure & Zero-Cost Abstraction

The complex type-checking of units exists **only at compile time**.

- At runtime, all variables are erased to dimensionless primitive scalars
  (standard 64-bit floats/doubles).
- **The Normalization Rule:** All values are stored internally normalized to
  their Base Unit. (e.g., `10 * km` is stored as `10000.0`).
- Complex units exist purely for developer ergonomics and mathematical
  verification.

## 3. Structural over Nominal Typing

In traditional OOP, `Meter` might inherit from `Length`. **Do not do this in
elang.**

- `elang` uses **Structural Typing** based on a "Dimension Vector" (e.g.,
  `[Length: 1, Mass: 0, Time: -2]`).
- Any unit that mathematically reduces to the same vector is of the same Type.
  `Meter` and `Foot` are both structurally `Length`.

## 4. Separation of Value and Unit

A measurement is never a single monolithic token.

- `10 * meter` is an AST `BinaryExpression`.
- `10` is a dimensionless scalar (Value).
- `meter` is a unit reference (Type Constraint & Normalization Factor).
