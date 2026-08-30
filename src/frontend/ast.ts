
export type NodeType =
    | "Program"
    | "ConstantDeclaration"
    | "VariableDeclaration"
    | "DimensionDeclaration"
    | "UnitDeclaration"
    | "Identifier"
    | "Assignment"
    | "BinaryExpression"
    | "NumericLiteral"
    | "TextLiteral"
    | "BooleanLiteral"
    | "NullLiteral"

export interface Statement {
    kind: NodeType;
}

export interface Program extends Statement {
    kind: "Program";
    body: Statement[];
}

// STATEMENTS

export interface VariableDeclaration extends Statement {
    kind: "VariableDeclaration";
    identifier: string;
    value?: Expression;
}

export interface ConstantDeclaration extends Statement {
    kind: "ConstantDeclaration";
    identifier: string;
    value: Expression;
}

export interface DimensionDeclaration extends Statement {
    kind: "DimensionDeclaration";
    identifier: string;
}

export interface UnitDeclaration extends Statement {
    kind: "UnitDeclaration";
    identifier: string;
    dimension: string;
    conversion?: Expression;
}

// EXPRESSIONS

export interface Expression extends Statement { }

// COMPOUND EXPRESSIONS

export interface AssignmentExpression extends Expression {
    kind: "Assignment";
    identifier: IdentifierExpression;
    value: Expression;
}

export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    operator: string;
    left: Expression;
    right: Expression;
}

// PRIMARY EXPRESSIONS

export interface IdentifierExpression extends Expression {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expression {
    kind: "NumericLiteral";
    value: number;
}

export interface TextLiteral extends Expression {
    kind: "TextLiteral";
    value: string;
}

export interface BooleanLiteral extends Expression {
    kind: "BooleanLiteral";
    value: boolean;
}

export interface NullLiteral extends Expression {
    kind: "NullLiteral";
    value: null;
}