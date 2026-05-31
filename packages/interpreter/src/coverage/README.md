# Interpreter Coverage Metric

This module provides a lightweight, programmatically callable tool to measure how much of the e-lang grammar is currently covered by the interpreter implementation.

## Public API

```ts
import { getUncoveredInterpreterPaths, CoverageReport } from 'e-lang-interpreter';

const report: CoverageReport = getUncoveredInterpreterPaths();
```

### CoverageReport

```ts
interface CoverageReport {
  uncoveredProductions: string[];   // Grammar productions with no detected handler
  uncoveredPaths: string[];         // Granular logical paths (e.g. specific operators)
  summary: {
    total: number;
    covered: number;
    uncovered: number;
    coveragePercent: number;
  };
  notes: string[];
}
```

## Approach (Sprint 0001)

- **Source of truth**: The generated AST types in `packages/language/src/generated/ast.ts` + the original `e-lang.langium` grammar.
- **Analysis method**: Static source scanning of the interpreter's `src/functions/` directory.
  - Looks for `is<Production>(` type-guard calls (e.g. `isIfStatement`, `isBinaryExpression`).
  - Looks for `case "..."` entries inside `runBinaryExpression` for operator coverage.
- **Scope for Sprint 1**:
  - Production-level coverage for `Statement` and `Expression` alternatives.
  - Operator-level coverage for all `BinaryExpression` operators.
  - A few known composite paths (MatchStatement options, IfStatement else branches, ForStatement step).
- **Non-goals** (out of scope for this sprint):
  - Full path coverage / branch coverage inside every function.
  - Runtime instrumentation.
  - Modifications to any existing `run*` functions.

This design keeps the coverage tool completely decoupled from interpreter execution logic.

## Usage Example

```ts
const report = getUncoveredInterpreterPaths();

console.log(`Grammar coverage: ${report.summary.coveragePercent}%`);

if (report.uncoveredProductions.length > 0) {
  console.log("Still need handlers for:", report.uncoveredProductions);
}
```

## Future Extensions

Possible next steps (future sprints):
- Use `ts-morph` or the TypeScript compiler API for more accurate static analysis.
- Add line/branch coverage via runtime instrumentation (e.g. Istanbul-style).
- Generate suggested test cases from uncovered paths.
- Integrate into CI to track coverage trends over time.

## Status

Implemented as part of Sprint 0001 – Interpreter Coverage Metric.
