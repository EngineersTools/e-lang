/**
 * Interpreter Coverage Metric Types
 *
 * These types define the structure returned by the coverage calculator.
 * The goal is to identify which grammar productions and logical execution paths
 * in the interpreter are not yet implemented.
 */

export interface CoverageSummary {
  total: number;
  covered: number;
  uncovered: number;
  coveragePercent: number;
}

export interface CoverageReport {
  /** Grammar productions (AST node types) that have no handling in the interpreter */
  uncoveredProductions: string[];

  /** More granular uncovered logical paths (e.g. specific operators, branches) */
  uncoveredPaths: string[];

  summary: CoverageSummary;

  /** Human-readable notes about the analysis approach */
  notes: string[];
}
