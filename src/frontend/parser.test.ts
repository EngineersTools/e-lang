import { describe, expect, it } from "bun:test";
import type { AssignmentExpression, BinaryExpression, BooleanLiteral, ConstantDeclaration, DimensionDeclaration, Expression, IdentifierExpression, MeasurementLiteral, NullLiteral, NumericLiteral, Program, TextLiteral, TypeReference, UnitDeclaration, VariableDeclaration } from "./ast";
import Parser from "./parser";

describe("Parser Tests", () => {
    it("should parse an empty program", () => {
        const sourceCode = '';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: []
        });
    });

    it("should parse a simple numeric (integer) literal", () => {
        const sourceCode = '42';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "NumericLiteral",
                    value: 42
                } as NumericLiteral
            ]
        });
    });

    it("should parse a simple numeric (floating-point) literal", () => {
        const sourceCode = '3.14';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "NumericLiteral",
                    value: 3.14
                } as NumericLiteral
            ]
        });
    });

    it("should parse a simple text literal", () => {
        const sourceCode = '"Hello, World!"';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "TextLiteral",
                    value: "Hello, World!"
                } as TextLiteral
            ]
        });
    });

    it("should parse a simple boolean literal", () => {
        const sourceCode = 'true false';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BooleanLiteral",
                    value: true
                } as BooleanLiteral,
                {
                    kind: "BooleanLiteral",
                    value: false
                } as BooleanLiteral
            ]
        });
    });

    it("should parse a simple null literal", () => {
        const sourceCode = 'null';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "NullLiteral",
                    value: null
                } as NullLiteral
            ]
        });
    });

    it("should parse a measurement literal", () => {
        const sourceCode = '5.3 @meter';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "MeasurementLiteral",
                    value: 5.3,
                    unit: "meter"
                } as MeasurementLiteral
            ]
        });
    });

    it("should parse a simple identifier", () => {
        const sourceCode = 'myVariable';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "Identifier",
                    symbol: "myVariable"
                } as IdentifierExpression
            ]
        });
    });

    it("should parse a simple assignment", () => {
        const sourceCode = 'x = 42';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "AssignmentExpression",
                    identifier: { kind: "Identifier", symbol: "x" },
                    value: { kind: "NumericLiteral", value: 42 }
                } as AssignmentExpression
            ]
        });
    });

    it("should parse a simple additive expression", () => {
        const sourceCode = '1 - 2 + 3';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "-",
                    left: { kind: "NumericLiteral", value: 1 },
                    right: {
                        kind: "BinaryExpression",
                        operator: "+",
                        left: { kind: "NumericLiteral", value: 2 },
                        right: { kind: "NumericLiteral", value: 3 }
                    }
                } as BinaryExpression
            ]
        });
    });

    it("should parse a complex additive expression with parentheses", () => {
        const sourceCode = '1 + (2 - 3)';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "+",
                    left: { kind: "NumericLiteral", value: 1 },
                    right: {
                        kind: "BinaryExpression",
                        operator: "-",
                        left: { kind: "NumericLiteral", value: 2 },
                        right: { kind: "NumericLiteral", value: 3 }
                    }
                } as BinaryExpression
            ]
        });
    });

    it("should parse a simple multiplicative expression", () => {
        const sourceCode = '4 * 5 / 2';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "/",
                    left: {
                        kind: "BinaryExpression",
                        operator: "*",
                        left: { kind: "NumericLiteral", value: 4 },
                        right: { kind: "NumericLiteral", value: 5 }
                    },
                    right: { kind: "NumericLiteral", value: 2 }
                } as BinaryExpression
            ]
        });
    });

    it("should parse a complex multiplicative expression with parentheses", () => {
        const sourceCode = '4 * (5 / 2)';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "*",
                    left: { kind: "NumericLiteral", value: 4 },
                    right: {
                        kind: "BinaryExpression",
                        operator: "/",
                        left: { kind: "NumericLiteral", value: 5 },
                        right: { kind: "NumericLiteral", value: 2 }
                    }
                } as BinaryExpression
            ]
        });
    });

    it("should parse a simple exponentiation expression", () => {
        const sourceCode = '2 ^ 3';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "^",
                    left: { kind: "NumericLiteral", value: 2 },
                    right: { kind: "NumericLiteral", value: 3 }
                } as BinaryExpression
            ]
        });
    });

    it("should parse a complex expression with mixed operators", () => {
        const sourceCode = '1^3 + 2 * 3 - 4 / 5';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "-",
                    left: {
                        kind: "BinaryExpression",
                        operator: "+",
                        left: {
                            kind: "BinaryExpression",
                            operator: "^",
                            left: { kind: "NumericLiteral", value: 1 },
                            right: { kind: "NumericLiteral", value: 3 }
                        },
                        right: {
                            kind: "BinaryExpression",
                            operator: "*",
                            left: { kind: "NumericLiteral", value: 2 },
                            right: { kind: "NumericLiteral", value: 3 }
                        }
                    },
                    right: {
                        kind: "BinaryExpression",
                        operator: "/",
                        left: { kind: "NumericLiteral", value: 4 },
                        right: { kind: "NumericLiteral", value: 5 }
                    }
                } as BinaryExpression
            ]
        });
    });

    it("should parse a complex expression with parentheses and mixed operators", () => {
        const sourceCode = '(1 + 2) * (3 - 4) / 5';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "BinaryExpression",
                    operator: "/",
                    left: {
                        kind: "BinaryExpression",
                        operator: "*",
                        left: {
                            kind: "BinaryExpression",
                            operator: "+",
                            left: { kind: "NumericLiteral", value: 1 },
                            right: { kind: "NumericLiteral", value: 2 }
                        },
                        right: {
                            kind: "BinaryExpression",
                            operator: "-",
                            left: { kind: "NumericLiteral", value: 3 },
                            right: { kind: "NumericLiteral", value: 4 }
                        }
                    },
                    right: { kind: "NumericLiteral", value: 5 }
                } as BinaryExpression
            ]
        });
    });

    it("should parse variable and constant declarations with assignment", () => {
        const sourceCode = 'var x = 10 const y = 20';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "VariableDeclaration",
                    identifier: "x",
                    value: { kind: "NumericLiteral", value: 10 }
                } as VariableDeclaration,
                {
                    kind: "ConstantDeclaration",
                    identifier: "y",
                    value: { kind: "NumericLiteral", value: 20 }
                } as ConstantDeclaration
            ]
        } as Program);
    });

    it("should parse a varilable and constant declarations with type annotations", () => {
        const sourceCode = 'var x: number = 10 const y: number = 20';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "VariableDeclaration",
                    identifier: "x",
                    type: {
                        kind: "TypeReference",
                        name: "number"
                    } as TypeReference,
                    value: { kind: "NumericLiteral", value: 10 }
                } as VariableDeclaration,
                {
                    kind: "ConstantDeclaration",
                    identifier: "y",
                    type: {
                        kind: "TypeReference",
                        name: "number"
                    } as TypeReference,
                    value: { kind: "NumericLiteral", value: 20 }
                } as ConstantDeclaration
            ]
        } as Program);
    });

    it("should parse variable declaration without assignment", () => {
        const sourceCode = 'var z';
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        const nullValueExpression = {
            kind: "NullLiteral",
            value: null
        } as Expression

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "VariableDeclaration",
                    identifier: "z",
                    value: nullValueExpression
                } as VariableDeclaration
            ]
        } as Program);
    });

    it("should throw an error for constant declaration without assignment", () => {
        const sourceCode = 'const a';
        const parser = new Parser();

        expect(() => {
            parser.parseProgram(sourceCode);
        }).toThrowError("Constant declaration must have an initial value at line 1, column 7");
    });

    it("should parse dimension and unit declarations", () => {
        const sourceCode = `
        dimension Length
        unit meter: Length
        `;
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "DimensionDeclaration",
                    identifier: "Length"
                } as DimensionDeclaration,
                {
                    kind: "UnitDeclaration",
                    identifier: "meter",
                    dimension: "Length"
                } as UnitDeclaration
            ]
        } as Program);
    });

    it("should throw an error for unit declaration without dimension", () => {
        const sourceCode = 'unit meter';
        const parser = new Parser();

        expect(() => {
            parser.parseProgram(sourceCode);
        }).toThrowError("Expected ':' or '=' after unit identifier, but got EOFTk at line 1, column 11");
    });

    it("should parse a unit declaration with a conversion expression", () => {
        const sourceCode = `
        dimension Length
        unit meter: Length
        unit kilometer = 1000 * meter
        `;
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "DimensionDeclaration",
                    identifier: "Length"
                } as DimensionDeclaration,
                {
                    kind: "UnitDeclaration",
                    identifier: "meter",
                    dimension: "Length"
                } as UnitDeclaration,
                {
                    kind: "UnitDeclaration",
                    identifier: "kilometer",
                    conversion: {
                        kind: "BinaryExpression",
                        operator: "*",
                        left: { kind: "NumericLiteral", value: 1000 },
                        right: { kind: "Identifier", symbol: "meter" }
                    } as Expression
                } as UnitDeclaration
            ]
        } as Program);
    });

    it("should parse a dimension declaration with a dimension calculation expression", () => {
        const sourceCode = `
        dimension Length
        dimension Area = Length ^ 2
        `;
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "DimensionDeclaration",
                    identifier: "Length"
                } as DimensionDeclaration,
                {
                    kind: "DimensionDeclaration",
                    identifier: "Area",
                    complexDimensionExpression: {
                        kind: "BinaryExpression",
                        operator: "^",
                        left: { kind: "Identifier", symbol: "Length" },
                        right: { kind: "NumericLiteral", value: 2 }
                    } as Expression
                } as DimensionDeclaration
            ]
        } as Program);
    });

    it("should parse a complex program with multiple statements", () => {
        const sourceCode = `
        var x: number = 10
        const y = 20
        var z
        dimension Length
        unit meter: Length
        unit kilometer = 1000 * meter
        z = x + y
        const l: Length = 5 @meter
        dimension Area = Length ^ 2
        unit squareMeter: Area
        const a: Area = 10 @squareMeter
        `;
        const parser = new Parser();
        const ast = parser.parseProgram(sourceCode);

        expect(ast).toEqual({
            kind: "Program",
            body: [
                {
                    kind: "VariableDeclaration",
                    identifier: "x",
                    type: {
                        kind: "TypeReference",
                        name: "number"
                    } as TypeReference,
                    value: { kind: "NumericLiteral", value: 10 }
                } as VariableDeclaration,
                {
                    kind: "ConstantDeclaration",
                    identifier: "y",
                    value: { kind: "NumericLiteral", value: 20 }
                } as ConstantDeclaration,
                {
                    kind: "VariableDeclaration",
                    identifier: "z",
                    value: { kind: "NullLiteral", value: null }
                } as VariableDeclaration,
                {
                    kind: "DimensionDeclaration",
                    identifier: "Length"
                } as DimensionDeclaration,
                {
                    kind: "UnitDeclaration",
                    identifier: "meter",
                    dimension: "Length",
                } as UnitDeclaration,
                {
                    kind: "UnitDeclaration",
                    identifier: "kilometer",
                    conversion: {
                        kind: "BinaryExpression",
                        operator: "*",
                        left: { kind: "NumericLiteral", value: 1000 },
                        right: { kind: "Identifier", symbol: "meter" }
                    } as Expression
                } as UnitDeclaration,
                {
                    kind: "AssignmentExpression",
                    identifier: { kind: "Identifier", symbol: "z" },
                    value: {
                        kind: "BinaryExpression",
                        operator: "+",
                        left: { kind: "Identifier", symbol: "x" },
                        right: { kind: "Identifier", symbol: "y" }
                    } as Expression
                } as AssignmentExpression,
                {
                    kind: "ConstantDeclaration",
                    identifier: "l",
                    type: {
                        kind: "TypeReference",
                        name: "Length"
                    } as TypeReference,
                    value: {
                        kind: "MeasurementLiteral",
                        value: 5,
                        unit: "meter"
                    } as Expression
                } as ConstantDeclaration,
                {
                    kind: "DimensionDeclaration",
                    identifier: "Area",
                    complexDimensionExpression: {
                        kind: "BinaryExpression",
                        operator: "^",
                        left: { kind: "Identifier", symbol: "Length" },
                        right: { kind: "NumericLiteral", value: 2 }
                    } as Expression
                } as DimensionDeclaration,
                {
                    kind: "UnitDeclaration",
                    identifier: "squareMeter",
                    dimension: "Area"
                } as UnitDeclaration,
                {
                    kind: "ConstantDeclaration",
                    identifier: "a",
                    type: {
                        kind: "TypeReference",
                        name: "Area"
                    } as TypeReference,
                    value: {
                        kind: "MeasurementLiteral",
                        value: 10,
                        unit: "squareMeter"
                    } as Expression
                } as ConstantDeclaration
            ]
        } as Program);
    });
})