import { describe, test, expect } from 'bun:test'
import { tokenise } from '../src/frontend/lexer';

describe('Lexer Tests', () => {

    test('Tokenize empty input', () => {
        const input = '';
        const tokens = tokenise(input);
        expect(tokens).toEqual([]);
    });

    test('Tokenize whitespace only', () => {
        const input = '   \n\t  ';
        const tokens = tokenise(input);
        expect(tokens).toEqual([]);
    });

    test('Tokenize single identifier', () => {
        const input = 'myVariable';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "IdentifierTk", value: "myVariable", line: 1, column: 1 }
        ]);
    });

    test('Tokenize single number', () => {
        const input = '12345';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "NumberTk", value: "12345", line: 1, column: 1 }
        ]);
    });

    test('Tokenize single string literal', () => {
        const input = '"Hello, World!"';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "TextTk", value: "Hello, World!", line: 1, column: 2 }
        ]);
    });

    test('Tokenize single operator', () => {
        const input = '+';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "BinaryOperatorTk", value: "+", line: 1, column: 1 }
        ]);
    });

    test('Tokenize single parenthesis', () => {
        const input = '(';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "OpenParenTk", value: "(", line: 1, column: 1 }
        ]);
    });

    test('Tokenize single equal sign', () => {
        const input = '=';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "EqualTk", value: "=", line: 1, column: 1 }
        ]);
    });

    test('Tokenize simple expression', () => {
        const input = 'const x = 42 + 5';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "ConstantKeywordTk", value: "const", line: 1, column: 1 },
            { type: "IdentifierTk", value: "x", line: 1, column: 7 },
            { type: "EqualTk", value: "=", line: 1, column: 9 },
            { type: "NumberTk", value: "42", line: 1, column: 11 },
            { type: "BinaryOperatorTk", value: "+", line: 1, column: 14 },
            { type: "NumberTk", value: "5", line: 1, column: 16 }
        ]);
    });

    test('Tokenize string literal', () => {
        const input = 'var message = "Hello, World!"';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "VariableKeywordTk", value: "var", line: 1, column: 1 },
            { type: "IdentifierTk", value: "message", line: 1, column: 5 },
            { type: "EqualTk", value: "=", line: 1, column: 13 },
            { type: "TextTk", value: "Hello, World!", line: 1, column: 16 }
        ]);
    });

    test('Tokenize with newlines and whitespace', () => {
        const input = `
            const a = 10
            var b = 20
            a + b
        `;
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "ConstantKeywordTk", value: "const", line: 2, column: 13 },
            { type: "IdentifierTk", value: "a", line: 2, column: 19 },
            { type: "EqualTk", value: "=", line: 2, column: 21 },
            { type: "NumberTk", value: "10", line: 2, column: 23 },
            { type: "VariableKeywordTk", value: "var", line: 3, column: 13 },
            { type: "IdentifierTk", value: "b", line: 3, column: 17 },
            { type: "EqualTk", value: "=", line: 3, column: 19 },
            { type: "NumberTk", value: "20", line: 3, column: 21 },
            { type: "IdentifierTk", value: "a", line: 4, column: 13 },
            { type: "BinaryOperatorTk", value: "+", line: 4, column: 15 },
            { type: "IdentifierTk", value: "b", line: 4, column: 17 }
        ]);
    });

    test('Tokenize unterminated string literal', () => {
        const input = 'var message = "Hello, World!';
        expect(() => tokenise(input)).toThrowError('Unterminated string at line 1, column 29');
    });

    test('Tokenize invalid character', () => {
        const input = 'const x = 42 @ 5';
        expect(() => tokenise(input)).toThrowError('Unexpected character \'@\' at line 1, column 14');
    });

    test('Tokenize dimension and unit keywords', () => {
        const input = `dimension length 
        unit meter`;
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "DimensionKeywordTk", value: "dimension", line: 1, column: 1 },
            { type: "IdentifierTk", value: "length", line: 1, column: 11 },
            { type: "UnitKeywordTk", value: "unit", line: 2, column: 9 },
            { type: "IdentifierTk", value: "meter", line: 2, column: 14 }
        ]);
    });

    test('Tokenize complex expression with parentheses', () => {
        const input = 'const result = (a + b) * c';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "ConstantKeywordTk", value: "const", line: 1, column: 1 },
            { type: "IdentifierTk", value: "result", line: 1, column: 7 },
            { type: "EqualTk", value: "=", line: 1, column: 14 },
            { type: "OpenParenTk", value: "(", line: 1, column: 16 },
            { type: "IdentifierTk", value: "a", line: 1, column: 17 },
            { type: "BinaryOperatorTk", value: "+", line: 1, column: 19 },
            { type: "IdentifierTk", value: "b", line: 1, column: 21 },
            { type: "CloseParenTk", value: ")", line: 1, column: 22 },
            { type: "BinaryOperatorTk", value: "*", line: 1, column: 24 },
            { type: "IdentifierTk", value: "c", line: 1, column: 26 }
        ]);
    });

    test('Tokenize model keyword', () => {
        const input = 'model myModel';
        const tokens = tokenise(input);
        expect(tokens).toEqual([
            { type: "ModelKeywordTk", value: "model", line: 1, column: 1 },
            { type: "IdentifierTk", value: "myModel", line: 1, column: 7 }
        ]);
    });
})