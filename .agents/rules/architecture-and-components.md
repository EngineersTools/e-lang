---
trigger: always_on
---

# Architecture Blueprint

## 1. The Stack

- **Parser/AST/LSP:** Langium.
- **Type Inference/Validation:** TypeFox/Typir.
- **Execution (Hot Path):** TypeScript Interpreter (Embedded in JS
  Runtime/Flutter).
- **Execution (Cold Path):** C++ Generator (For high-performance compiled
  binaries).

## 2. Core Compiler Components (TypeScript)

The compiler relies on two critical tree-walking calculators:

### A. The DimensionCalculator

- **Role:** Maps any AST `UnitExpr` to a `DimensionVector`
  (`Map<string, number>`).
- **Logic:**
  - Literals (numbers) -> Dimensionless `[]`
  - Base Units -> `[Dimension: 1]`
  - Multiplication (`*`) -> Add vectors
  - Division (`/`) -> Subtract vectors

### B. The ConversionCalculator

- **Role:** Calculates the scalar factor required to convert a defined unit to
  the Base Unit.
- **Logic:** Traverses the unit definitions recursively, multiplying scalar
  literals to find the absolute normalization factor (e.g., tracing `inch` ->
  `foot` -> `meter` to return `0.0254`).

## 3. Typir Integration (`EngineeringType`)

- We define a single custom Typir Type called `EngineeringType` which wraps a
  `DimensionVector`.
- **Critical Override:** The `isSubtypeOf(other)` method is overridden. It
  bypasses Typir's standard nominal graph traversal and instead compares the
  stringified Dimension Vectors for strict equality.

## 4. The Dual-Engine Execution (Sim-Gen Pattern)

- **Interpreter (`ElangInterpreter`):** Traverses the AST, converting all unit
  references to their pre-calculated normalization factor. It performs math on
  raw numbers and manages standard execution context maps.
- **Generator (`CppGenerator`):** Traverses the AST and emits C++17 code. It
  performs **constant folding** on unit expressions, emitting raw `double` math
  (e.g., emitting `double x = 10 * 1000.0;` instead of `10 * km`).
