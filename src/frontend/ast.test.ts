import { describe, it, expect } from "bun:test";

describe("AST", () => {
    it("should parse a simple expression", () => {
        const sourceCode = "const x = 5 + 3;";
        const tokens = tokenise(sourceCode);
        const ast = parse(tokens);
        expect(ast).toBeDefined();
        expect(ast.type).toBe("Program");
        expect(ast.body.length).toBe(1);
        const declaration = ast.body[0];
        expect(declaration.type).toBe("VariableDeclaration");
        expect(declaration.identifier.name).toBe("x");
        expect(declaration.initializer.type).toBe("BinaryExpression");
        expect(declaration.initializer.operator).toBe("+");
    });
});