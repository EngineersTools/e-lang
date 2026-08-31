import { describe, expect, it } from "bun:test";
import type { BinaryExpression, BooleanLiteral, MeasurementLiteral, NullLiteral, NumericLiteral, TextLiteral } from "../frontend/ast";
import { evaluateStatement } from "./interpreter";
import type { BooleanValue, MeasurementValue, NullValue, NumberValue, TextValue } from "./values";

describe('Interpreter Tests', () => {
    it("should evaluate a NumericLiteral correctly", () => {
        const astNode: NumericLiteral = {
            kind: "NumericLiteral",
            value: 42
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "number", value: 42 } as NumberValue);
    });

    it("should evaluate a TextLiteral correctly", () => {
        const astNode: TextLiteral = {
            kind: "TextLiteral",
            value: "Hello, World!"
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "text", value: "Hello, World!" } as TextValue);
    });

    it("should evaluate a BooleanLiteral correctly", () => {
        const astNode: BooleanLiteral = {
            kind: "BooleanLiteral",
            value: true
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "boolean", value: true } as BooleanValue);
    });

    it("should evaluate a NullLiteral correctly", () => {
        const astNode: NullLiteral = {
            kind: "NullLiteral",
            value: null
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "null", value: null } as NullValue);
    });

    it("should evaluate a MeasurementLiteral correctly", () => {
        const astNode: MeasurementLiteral = {
            kind: "MeasurementLiteral",
            value: 5.0,
            unit: "meter"
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "measurement", value: 5.0, unit: "meter" } as MeasurementValue);
    });

    it("should evaluate a addition BinaryExpression with numbers correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "+",
            left: { kind: "NumericLiteral", value: 5 } as NumericLiteral,
            right: { kind: "NumericLiteral", value: 3 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "number", value: 8 } as NumberValue);
    });

    it("should evaluate a concatenation BinaryExpression with texts correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "+",
            left: { kind: "TextLiteral", value: "Hello, " } as TextLiteral,
            right: { kind: "TextLiteral", value: "World!" } as TextLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "text", value: "Hello, World!" } as TextValue);
    });

    it("should evaluate a subtraction BinaryExpression with numbers correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "-",
            left: { kind: "NumericLiteral", value: 10 } as NumericLiteral,
            right: { kind: "NumericLiteral", value: 4 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "number", value: 6 } as NumberValue);
    });

    it("should evaluate a multiplication BinaryExpression with numbers correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "*",
            left: { kind: "NumericLiteral", value: 6 } as NumericLiteral,
            right: { kind: "NumericLiteral", value: 7 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "number", value: 42 } as NumberValue);
    });

    it("should evaluate a division BinaryExpression with numbers correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "/",
            left: { kind: "NumericLiteral", value: 20 } as NumericLiteral,
            right: { kind: "NumericLiteral", value: 4 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "number", value: 5 } as NumberValue);
    });

    it("should evaluate an exponentiation BinaryExpression with numbers correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "^",
            left: { kind: "NumericLiteral", value: 2 } as NumericLiteral,
            right: { kind: "NumericLiteral", value: 3 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "number", value: 8 } as NumberValue);
    });

    it("should evaluate an addition with MeasurementLiteral correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "+",
            left: { kind: "MeasurementLiteral", value: 5, unit: "meter" } as MeasurementLiteral,
            right: { kind: "MeasurementLiteral", value: 3, unit: "meter" } as MeasurementLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "measurement", value: 8, unit: "meter" } as MeasurementValue);
    });

    it("should evaluate a subtraction with MeasurementLiteral correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "-",
            left: { kind: "MeasurementLiteral", value: 10, unit: "meter" } as MeasurementLiteral,
            right: { kind: "MeasurementLiteral", value: 4, unit: "meter" } as MeasurementLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "measurement", value: 6, unit: "meter" } as MeasurementValue);
    });

    it("should evaluate a multiplication with MeasurementLiteral correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "*",
            left: { kind: "MeasurementLiteral", value: 6, unit: "meter" } as MeasurementLiteral,
            right: { kind: "NumericLiteral", value: 7 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "measurement", value: 42, unit: "meter" } as MeasurementValue);
    });

    it("should evaluate a division with MeasurementLiteral correctly", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "/",
            left: { kind: "MeasurementLiteral", value: 20, unit: "meter" } as MeasurementLiteral,
            right: { kind: "NumericLiteral", value: 4 } as NumericLiteral
        };
        const result = evaluateStatement(astNode);
        expect(result).toEqual({ type: "measurement", value: 5, unit: "meter" } as MeasurementValue);
    });

    it("should throw an error for type mismatch in BinaryExpression", () => {
        const astNode: BinaryExpression = {
            kind: "BinaryExpression",
            operator: "+",
            left: { kind: "NumericLiteral", value: 5 } as NumericLiteral,
            right: { kind: "TextLiteral", value: "World!" } as TextLiteral
        };
        expect(() => evaluateStatement(astNode)).toThrowError("Type mismatch in binary expression: number and text");
    });

    it("should throw an error for unsupported statement kinds", () => {
        const astNode = {
            kind: "UnsupportedKind"
        } as any;
        expect(() => evaluateStatement(astNode)).toThrowError("Unsupported statement kind: UnsupportedKind");
    });
})