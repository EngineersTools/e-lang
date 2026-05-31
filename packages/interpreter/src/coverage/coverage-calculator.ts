/**
 * Interpreter Coverage Calculator
 *
 * Analyzes the interpreter implementation against the e-lang grammar to identify
 * uncovered grammar productions and logical execution paths.
 *
 * This module does NOT modify any existing interpreter logic.
 * It performs static/source analysis of the interpreter package.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CoverageReport, CoverageSummary } from './types.js';

// ---------------------------------------------------------------------------
// Grammar Productions (Source of Truth - derived from e-lang grammar + AST)
// These are the executable Statement and Expression alternatives that the
// interpreter is expected to handle.
// ---------------------------------------------------------------------------

/**
 * Top-level executable statement productions from the grammar.
 * These are the direct alternatives of the Statement rule (plus key subtypes).
 */
const GRAMMAR_STATEMENT_PRODUCTIONS = [
  'DimensionDeclaration',
  'UnitDeclaration',
  'ConstantDeclaration',
  'MutableDeclaration',
  'FormulaDeclaration',
  'ModelDeclaration',
  'StatementBlock',
  'PrintStatement',
  'IfStatement',
  'ForStatement',
  'ReturnStatement',
  'Expression', // catch-all for expression statements
] as const;

/**
 * Concrete Expression productions from the grammar that require runtime handling.
 */
const GRAMMAR_EXPRESSION_PRODUCTIONS = [
  'BinaryExpression',
  'BooleanLiteral',
  'CallExpression',
  'ImaginaryNumber',
  'IndexedAccess',
  'LambdaExpression',
  'ListExpression',
  'LogicalNotExpression',
  'MatchStatement',
  'Measurement',
  'MemberAccess',
  'ModelExpression',
  'NegativeNumericExpression',
  'NullLiteral',
  'NumberLiteral',
  'PostUnaryExpression',
  'ReferenceExpression',
  'StringLiteral',
] as const;

/**
 * BinaryExpression operators that have explicit handling.
 */
const BINARY_OPERATORS = [
  '+', '-', '*', '/', '^',
  '==', '!=', '<', '<=', '>', '>=',
  'and', 'or', 'equal', 'not_equal',
  '->',  // unit conversion
  '=',   // assignment (special handling)
] as const;

type GrammarProduction =
  | (typeof GRAMMAR_STATEMENT_PRODUCTIONS)[number]
  | (typeof GRAMMAR_EXPRESSION_PRODUCTIONS)[number];

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Returns the absolute path to the interpreter functions directory (the TypeScript sources).
 * This must work in these scenarios:
 *   - Running tests with Vitest (from src/)
 *   - Running the built package (from out/)
 *   - Running from monorepo root or package root
 *
 * We always want the .ts source files for static analysis, never the compiled .js.
 */
function getInterpreterFunctionsDir(): string {
  const candidates: string[] = [];

  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);

    // Scenario A: Running from source tree
    // currentDir = .../packages/interpreter/src/coverage
    candidates.push(path.resolve(currentDir, '..', 'functions'));

    // Scenario B: Running from built output
    // currentDir = .../packages/interpreter/out/coverage
    // We need to go back to src/functions
    const packageRoot = path.resolve(currentDir, '..', '..'); // out/ or src/ level
    candidates.push(path.resolve(packageRoot, 'src', 'functions'));

    // Scenario C: Common monorepo execution contexts
    candidates.push(path.resolve(process.cwd(), 'packages/interpreter/src/functions'));
    candidates.push(path.resolve(process.cwd(), 'src/functions'));

    // One more level up in case cwd is the workspace root
    candidates.push(path.resolve(process.cwd(), '..', 'packages/interpreter/src/functions'));
  } catch {
    // ignore - will use fallbacks
  }

  // Final absolute fallback
  candidates.push(path.resolve(process.cwd(), 'packages/interpreter/src/functions'));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const keyFile = path.join(candidate, 'runStatement.ts');
      if (fs.existsSync(keyFile)) {
        return candidate;
      }
    }
  }

  // Last resort
  return path.resolve(process.cwd(), 'packages/interpreter/src/functions');
}

/**
 * Reads the source of all interpreter execution files as a single string.
 * This is the pragmatic "static analysis" for Sprint 1.
 */
function readInterpreterSource(): string {
  const functionsDir = getInterpreterFunctionsDir();
  const files = [
    'runProgram.ts',
    'runStatement.ts',
    'runExpression.ts',
    'runBinaryExpression.ts',
    'runForStatement.ts',
    'runMemberCall.ts',
    'runVariableDeclaration.ts',
    'runUnitConversionExpression.ts',
    'serialiseExpression.ts',
  ];

  let combined = '';
  for (const file of files) {
    const fullPath = path.join(functionsDir, file);
    if (fs.existsSync(fullPath)) {
      combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
    }
  }
  return combined;
}

/**
 * Heuristic check: does the interpreter source contain handling for this production?
 *
 * We look for common patterns used in the current codebase:
 * - isConstantDeclaration, isIfStatement, etc.
 * - case "+" , case "and", etc. inside runBinaryExpression
 */
function hasHandlerForProduction(source: string, production: GrammarProduction): boolean {
  // Direct type guard usage (most common pattern)
  const typeGuardPattern = new RegExp(`is${production}\\s*\\(`, 'm');
  if (typeGuardPattern.test(source)) {
    return true;
  }

  // Special case: Expression is handled via isExpression
  if (production === 'Expression') {
    return /isExpression\s*\(/.test(source);
  }

  // For BinaryExpression operators we check the switch/case handling
  if (production === 'BinaryExpression') {
    // If any binary operator handling exists, we consider the production "touched"
    return BINARY_OPERATORS.some(op => hasHandlerForOperator(source, op));
  }

  return false;
}

function hasHandlerForOperator(source: string, operator: string): boolean {
  // Look for case "op": or case 'op':
  const casePattern = new RegExp(`case\\s+["']${escapeRegExp(operator)}["']\\s*:`, 'm');
  return casePattern.test(source);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main entry point: returns a report of uncovered grammar productions and paths.
 *
 * This function is the public API for the coverage metric.
 */
export function getUncoveredInterpreterPaths(): CoverageReport {
  const source = readInterpreterSource();

  const uncoveredProductions: string[] = [];
  const uncoveredPaths: string[] = [];
  const notes: string[] = [];

  // --- Statement level coverage ---
  for (const prod of GRAMMAR_STATEMENT_PRODUCTIONS) {
    if (!hasHandlerForProduction(source, prod)) {
      uncoveredProductions.push(prod);
    }
  }

  // --- Expression level coverage ---
  for (const prod of GRAMMAR_EXPRESSION_PRODUCTIONS) {
    if (!hasHandlerForProduction(source, prod)) {
      uncoveredProductions.push(prod);
    }
  }

  // --- Operator level coverage (granular paths) ---
  for (const op of BINARY_OPERATORS) {
    if (!hasHandlerForOperator(source, op)) {
      uncoveredPaths.push(`BinaryExpression:operator:${op}`);
    }
  }

  // --- Special logical paths we know exist in the grammar but may be partial ---
  // MatchStatement has options + defaultAction
  if (!/expression\.options|option\.action|defaultAction/.test(source)) {
    // Only flag if we don't see any match handling at all
    if (!hasHandlerForProduction(source, 'MatchStatement')) {
      uncoveredPaths.push('MatchStatement:options/defaultAction');
    }
  }

  // IfStatement has else_if and else branches
  if (!/else_if|elseBlock/.test(source) && hasHandlerForProduction(source, 'IfStatement')) {
    uncoveredPaths.push('IfStatement:else_if/else');
  }

  // ForStatement step handling
  if (!/statement\.step|step\s*\?/.test(source) && hasHandlerForProduction(source, 'ForStatement')) {
    uncoveredPaths.push('ForStatement:step');
  }

  // --- Calculate summary ---
  const totalProductions =
    GRAMMAR_STATEMENT_PRODUCTIONS.length + GRAMMAR_EXPRESSION_PRODUCTIONS.length;

  const coveredCount = totalProductions - uncoveredProductions.length;

  const summary: CoverageSummary = {
    total: totalProductions,
    covered: coveredCount,
    uncovered: uncoveredProductions.length,
    coveragePercent: totalProductions > 0
      ? Math.round((coveredCount / totalProductions) * 100)
      : 0,
  };

  notes.push(
    'Analysis based on static pattern matching of interpreter source files.',
    'Grammar productions extracted from packages/language/src/generated/ast.ts and e-lang.langium.',
    'This is a practical Sprint 1 implementation. Deeper path analysis can be added later.'
  );

  return {
    uncoveredProductions: [...new Set(uncoveredProductions)].sort(),
    uncoveredPaths: [...new Set(uncoveredPaths)].sort(),
    summary,
    notes,
  };
}
