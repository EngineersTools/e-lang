import type { NullLiteral } from "typescript/unstable/ast";
import type { AssignmentExpression, BinaryExpression, BooleanLiteral, ConstantDeclaration, Expression, IdentifierExpression, NumericLiteral, Program, Statement, TextLiteral, VariableDeclaration } from "./ast";
import { tokenise, type Token } from "./lexer";

export default class Parser {
    private tokens: Token[] = [];

    private notAtEOF(): boolean {
        return this.tokens[0] !== undefined
            && this.tokens[0].type !== "EOFTk";
    }

    private at(): Token {
        return this.tokens[0]!;
    }

    private consume(): Token {
        const token = this.tokens.shift()!;
        return token;
    }

    private peek(offset: number = 0): Token {
        return this.tokens[offset]!;
    }

    private expect(type: string): Token {
        const token = this.consume();
        if (token.type !== type) {
            throw new Error(`Expected token of type ${type}, but got ${token.value} at line ${token.line}, column ${token.column}`);
        }
        return token;
    }

    public parseProgram(sourceCode: string): Program {
        this.tokens = tokenise(sourceCode);

        const program: Program = {
            kind: "Program",
            body: []
        };

        while (this.notAtEOF()) {
            program.body.push(this.parseStatement());
        }

        return program;
    }

    // STATEMENTS

    private parseStatement(): Statement {
        switch (this.at().type) {
            case "VariableKeywordTk":
            case "ConstantKeywordTk":
                return this.parseVariableDeclaration();
            case "DimensionKeywordTk":
                return this.parseDimensionDeclaration();
            case "UnitKeywordTk":
                return this.parseUnitDeclaration();
            default:
                return this.parseExpression();
            // default:
            //     throw new Error(`Unexpected token type: ${this.at().type}`);
        }
    }

    private parseVariableDeclaration(): Statement {
        const keywordToken = this.consume();
        const identifierToken = this.expect("IdentifierTk");
        const isAssignment = this.peek().type === "EqualTk";

        if (!isAssignment) {
            if (keywordToken.type === "VariableKeywordTk") {
                // In ELang, variable declarations without an initial value are allowed
                // By convention an unassigned VariableDeclaration is assigned a
                // `null` value by default.
                const nullExpression = {
                    kind: "NullLiteral",
                    value: null
                } as Expression;

                return {
                    kind: "VariableDeclaration",
                    identifier: identifierToken.value,
                    value: nullExpression
                } as VariableDeclaration;
            } else if (keywordToken.type === "ConstantKeywordTk") {
                throw new Error(`Constant declaration must have an initial value at line ${identifierToken.line}, column ${identifierToken.column}`);
            } else {
                throw new Error(`Unexpected keyword token type: ${keywordToken.type}`);
            }
        } else {
            this.expect("EqualTk");
            const valueExpression = this.parseExpression();

            if (keywordToken.type === "VariableKeywordTk") {
                return {
                    kind: "VariableDeclaration",
                    identifier: identifierToken.value,
                    value: valueExpression
                } as VariableDeclaration;
            } else if (keywordToken.type === "ConstantKeywordTk") {
                return {
                    kind: "ConstantDeclaration",
                    identifier: identifierToken.value,
                    value: valueExpression
                } as ConstantDeclaration;
            } else {
                throw new Error(`Unexpected keyword token type: ${keywordToken.type}`);
            }
        }
    }

    private parseDimensionDeclaration(): Statement {
        this.consume(); // consume 'dimension' keyword
        const identifierToken = this.expect("IdentifierTk");

        return {
            kind: "DimensionDeclaration",
            identifier: identifierToken.value
        } as Statement;
    }

    private parseUnitDeclaration(): Statement {
        this.consume(); // consume 'unit' keyword
        const identifierToken = this.expect("IdentifierTk");
        this.expect("TypeAssignmentTk"); // expect ':'
        const dimensionToken = this.expect("IdentifierTk");

        if(this.peek().type === "EqualTk") {
            this.consume(); // consume '=' token
            const conversionExpression = this.parseExpression();

            return {
                kind: "UnitDeclaration",
                identifier: identifierToken.value,
                dimension: dimensionToken.value,
                conversion: conversionExpression
            } as Statement;
        }

        return {
            kind: "UnitDeclaration",
            identifier: identifierToken.value,
            dimension: dimensionToken.value
        } as Statement;
    }

    // EXPRESSIONS

    private parseExpression(): Expression {
        return this.parseAssignmentExpression();
    }

    private parseAssignmentExpression(): Expression {
        const left = this.parseSubtractionExpression();

        if (this.at().type === "EqualTk") {

            if (left.kind !== "Identifier") {
                throw new Error(`Left-hand side of assignment must be an identifier, but got ${left.kind}`);
            }

            this.consume(); // consume the '=' token
            const valueExpression = this.parseSubtractionExpression();
            return {
                kind: "Assignment",
                identifier: {
                    kind: "Identifier",
                    symbol: (left as IdentifierExpression).symbol
                } as IdentifierExpression,
                value: valueExpression
            } as AssignmentExpression;
        }

        return left;
    }

    private parseSubtractionExpression(): Expression {
        let left = this.parseAdditionExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "-") {
            const operatorToken = this.consume();
            const right = this.parseAdditionExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseAdditionExpression(): Expression {
        let left = this.parseDivisionExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "+") {
            const operatorToken = this.consume();
            const right = this.parseDivisionExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseDivisionExpression(): Expression {
        let left = this.parseMultiplicationExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "/") {
            const operatorToken = this.consume();
            const right = this.parseMultiplicationExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseMultiplicationExpression(): Expression {
        let left = this.parsePrimaryExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "*") {
            const operatorToken = this.consume();
            const right = this.parsePrimaryExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parsePrimaryExpression(): Expression {
        const tk = this.at();

        switch (tk.type) {
            case "NumberTk":
                this.consume();
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(tk.value)
                } as NumericLiteral;
            case "TextTk":
                this.consume();
                return {
                    kind: "TextLiteral",
                    value: tk.value
                } as TextLiteral;
            case "BooleanTk":
                this.consume();
                return {
                    kind: "BooleanLiteral",
                    value: tk.value === "true"
                } as BooleanLiteral;
            case "IdentifierTk":
                this.consume();
                return {
                    kind: "Identifier",
                    symbol: tk.value
                } as IdentifierExpression;
            case "OpenParenTk":
                this.consume(); // consume '('
                const expr = this.parseExpression();
                this.expect("CloseParenTk"); // expect ')'
                return expr;
            default:
                throw new Error(`Unexpected token type: ${tk.type}`);
        }
    }
}