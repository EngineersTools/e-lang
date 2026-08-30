export type TokenType =
    | "IdentifierTk"
    | "EqualTk"
    | "ConstantKeywordTk"
    | "VariableKeywordTk"
    | "OpenParenTk"
    | "CloseParenTk"
    | "TypeAssignmentTk"
    | "NumberTk"
    | "TextTk"
    | "BooleanTk"
    | "NullTk"
    | "BinaryOperatorTk"
    | "DimensionKeywordTk"
    | "UnitKeywordTk"
    | "ModelKeywordTk"
    | "EOFTk";

export const Keywords = {
    ["ConstantKeywordTk"]: 'const',
    ["VariableKeywordTk"]: 'var',
    ["DimensionKeywordTk"]: 'dimension',
    ["UnitKeywordTk"]: 'unit',
    ["ModelKeywordTk"]: 'model'
};

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}

export function buildToken(type: TokenType, value: string, line: number, column: number): Token {
    return { type, value, line, column };
}

export function tokenise(input: string): Token[] {
    const tokens: Token[] = [];
    let currentLine = 1;
    let currentColumn = 1;
    let currentIndex = 0;

    while (currentIndex < input.length) {
        const char = input[currentIndex]!;

        if (char === ' ' || char === '\t') {
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === '\n') {
            currentLine++;
            currentColumn = 1;
            currentIndex++;
            continue;
        }

        if(char === ":") {
            tokens.push(buildToken("TypeAssignmentTk", ':', currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === '=') {
            tokens.push(buildToken("EqualTk", '=', currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === '(') {
            tokens.push(buildToken("OpenParenTk", '(', currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === ')') {
            tokens.push(buildToken("CloseParenTk", ')', currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === '+' || char === '-' || char === '*' || char === '/') {
            tokens.push(buildToken("BinaryOperatorTk", char, currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char >= '0' && char <= '9') {
            let numberValue = '';
            while (currentIndex < input.length && input[currentIndex]! >= '0' && input[currentIndex]! <= '9') {
                numberValue += input[currentIndex];
                currentIndex++;
                currentColumn++;
            }
            tokens.push(buildToken("NumberTk", numberValue, currentLine, currentColumn - numberValue.length));
            continue;
        }

        if (char === '"') {
            let textValue = '';
            currentIndex++;
            currentColumn++;
            while (currentIndex < input.length && input[currentIndex] !== '"') {
                textValue += input[currentIndex];
                currentIndex++;
                currentColumn++;
            }
            if (currentIndex < input.length && input[currentIndex] === '"') {
                currentIndex++;
                currentColumn++;
                tokens.push(buildToken("TextTk", textValue, currentLine, currentColumn - textValue.length - 1));
            } else {
                throw new Error(`Unterminated string at line ${currentLine}, column ${currentColumn}`);
            }
            continue;
        }

        if (/[a-zA-Z_]/.test(char)) {
            let identifierValue = '';
            while (currentIndex < input.length && /[a-zA-Z0-9_]/.test(input[currentIndex]!)) {
                identifierValue += input[currentIndex];
                currentIndex++;
                currentColumn++;
            }
            if (identifierValue === Keywords.ConstantKeywordTk) {
                tokens.push(buildToken("ConstantKeywordTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else if (identifierValue === Keywords.VariableKeywordTk) {
                tokens.push(buildToken("VariableKeywordTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else if (identifierValue === Keywords.DimensionKeywordTk) {
                tokens.push(buildToken("DimensionKeywordTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else if (identifierValue === Keywords.UnitKeywordTk) {
                tokens.push(buildToken("UnitKeywordTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else if (identifierValue === Keywords.ModelKeywordTk) {
                tokens.push(buildToken("ModelKeywordTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else if (identifierValue === "null") {
                tokens.push(buildToken("NullTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else if (identifierValue === "true" || identifierValue === "false") {
                tokens.push(buildToken("BooleanTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            } else {
                tokens.push(buildToken("IdentifierTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            }
            continue;
        }

        throw new Error(`Unexpected character '${char}' at line ${currentLine}, column ${currentColumn}`);
    }

    tokens.push(buildToken("EOFTk", '<EndOfFile>', currentLine, currentColumn));
    return tokens;
}