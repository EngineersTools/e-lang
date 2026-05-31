/**
 * Interpreter Coverage Module
 *
 * Provides tools to measure how much of the e-lang grammar is covered
 * by the current interpreter implementation.
 */

export * from './types.js';
export { getUncoveredInterpreterPaths } from './coverage-calculator.js';
