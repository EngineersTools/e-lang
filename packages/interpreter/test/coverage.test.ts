import { describe, expect, test } from 'vitest';
import { getUncoveredInterpreterPaths, CoverageReport } from '../src/coverage/index.js';

describe('Interpreter Coverage Metric (Sprint 0001)', () => {

  test('getUncoveredInterpreterPaths returns a valid CoverageReport structure', () => {
    const report: CoverageReport = getUncoveredInterpreterPaths();

    // Basic structure checks
    expect(report).toHaveProperty('uncoveredProductions');
    expect(report).toHaveProperty('uncoveredPaths');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('notes');

    expect(Array.isArray(report.uncoveredProductions)).toBe(true);
    expect(Array.isArray(report.uncoveredPaths)).toBe(true);
    expect(Array.isArray(report.notes)).toBe(true);

    const summary = report.summary;
    expect(summary).toHaveProperty('total');
    expect(summary).toHaveProperty('covered');
    expect(summary).toHaveProperty('uncovered');
    expect(summary).toHaveProperty('coveragePercent');

    expect(typeof summary.total).toBe('number');
    expect(typeof summary.covered).toBe('number');
    expect(typeof summary.uncovered).toBe('number');
    expect(typeof summary.coveragePercent).toBe('number');

    // Coverage percent should be between 0 and 100
    expect(summary.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(summary.coveragePercent).toBeLessThanOrEqual(100);

    // Sanity: we should have some uncovered items at this stage of development
    // (this is expected and not a failure condition for the sprint)
    expect(report.uncoveredProductions.length + report.uncoveredPaths.length).toBeGreaterThan(0);
  });

  test('report identifies key grammar productions and provides actionable output', () => {
    const report = getUncoveredInterpreterPaths();

    // The function must be programmatically consumable
    expect(typeof report.summary.coveragePercent).toBe('number');

    // Should reference grammar knowledge (via notes or structure)
    expect(report.notes.length).toBeGreaterThan(0);
    expect(report.notes.some(note => note.toLowerCase().includes('grammar') || note.toLowerCase().includes('production'))).toBe(true);
  });

  test('can be called multiple times without side effects', () => {
    const report1 = getUncoveredInterpreterPaths();
    const report2 = getUncoveredInterpreterPaths();

    expect(report1.summary.total).toBe(report2.summary.total);
    expect(report1.uncoveredProductions.length).toBe(report2.uncoveredProductions.length);
  });
});
