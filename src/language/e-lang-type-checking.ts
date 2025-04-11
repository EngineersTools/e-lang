import { AstNode } from "langium";
import { InferOperatorWithMultipleOperands } from "typir";
import { LangiumTypeSystemDefinition, TypirLangiumServices } from "typir-langium";
import { BinaryExpression, BooleanLiteral, ELangAstType, NullLiteral, NumberLiteral, StringLiteral, TypeReference } from "./generated/ast.js";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class ELangTypeSystem implements LangiumTypeSystemDefinition<ELangAstType> {
    onInitialize(typir: TypirLangiumServices<ELangAstType>): void {
        const typeBool = typir.factory.Primitives.create({ primitiveName: 'boolean' })
            .inferenceRule({ languageKey: BooleanLiteral })
            .inferenceRule({ languageKey: TypeReference, matching: (node: TypeReference) => node.primitive === 'boolean' })
            .finish();

        const typeNumber = typir.factory.Primitives.create({ primitiveName: 'number' })
            .inferenceRule({ languageKey: NumberLiteral })
            .inferenceRule({ languageKey: TypeReference, matching: (node: TypeReference) => node.primitive === 'number' })
            .finish();

        const typeString = typir.factory.Primitives.create({ primitiveName: 'string' })
            .inferenceRule({ languageKey: StringLiteral })
            .inferenceRule({ languageKey: TypeReference, matching: (node: TypeReference) => node.primitive === 'text' })
            .finish();

        const typeNull = typir.factory.Primitives.create({ primitiveName: 'null' })
            .inferenceRule({ languageKey: NullLiteral })
            .finish();

        const typeAny = typir.factory.Top.create({}).finish();

        const binaryInferenceRule: InferOperatorWithMultipleOperands<AstNode, BinaryExpression> = {
            languageKey: BinaryExpression,
            matching: (node: BinaryExpression, name: string) => node.operator === name,
            operands: (node: BinaryExpression, _name: string) => [node.left, node.right],
            validateArgumentsOfCalls: true,
        };

        for (const operator of ['-', '*', '/']) {
            typir.factory.Operators.createBinary({ name: operator, signature: { left: typeNumber, right: typeNumber, return: typeNumber } })
                .inferenceRule(binaryInferenceRule).finish();
        }

        typir.factory.Operators.createBinary({
            name: '+', signatures: [
                { left: typeNumber, right: typeNumber, return: typeNumber },
                { left: typeString, right: typeString, return: typeString },
                { left: typeNumber, right: typeString, return: typeString },
                { left: typeString, right: typeNumber, return: typeString },
            ]
        })
            .inferenceRule(binaryInferenceRule).finish();

        for (const operator of ['<', '<=', '>', '>=']) {
            typir.factory.Operators.createBinary({ name: operator, signature: { left: typeNumber, right: typeNumber, return: typeBool } })
                .inferenceRule(binaryInferenceRule).finish();
        }

        for (const operator of ['and', 'or']) {
            typir.factory.Operators.createBinary({ name: operator, signature: { left: typeBool, right: typeBool, return: typeBool } })
                .inferenceRule(binaryInferenceRule).finish();
        }

        for (const operator of ['==', '!=', 'equal', 'not_equal']) {
            typir.factory.Operators.createBinary({ name: operator, signature: { left: typeAny, right: typeAny, return: typeBool } })
                .inferenceRule({
                    ...binaryInferenceRule,
                    validation: (node, _operatorName, _operatorType, accept, typir) => typir.validation.Constraints.ensureNodeIsEquals(node.left, node.right, accept, (actual, expected) => ({
                        message: `This comparison will always return '${node.operator === '==' || node.operator === 'equal' ? 'false' : 'true'}' as '${node.left.$cstNode?.text}' and '${node.right.$cstNode?.text}' have the different types '${actual.name}' and '${expected.name}'.`,
                        languageNode: node,
                        languageProperty: 'operator',
                        severity: 'warning',
                    }))
                })
                .finish();
        }
    }

    onNewAstNode(languageNode: AstNode, typir: TypirLangiumServices<ELangAstType>): void {

    }
}