import { AstNode, AstUtils } from "langium";
import {
  assertUnreachable,
  CreateParameterDetails,
  FunctionType,
  InferenceRuleNotApplicable,
  InferOperatorWithMultipleOperands,
  InferOperatorWithSingleOperand,
  NO_PARAMETER_NAME,
  TypeInitializer,
  TypirServices,
  ValidationProblemAcceptor,
} from "typir";
import {
  LangiumTypeSystemDefinition,
  TypirLangiumServices,
} from "typir-langium";
import {
  BinaryExpression,
  BooleanLiteral,
  ConstantDeclaration,
  ELangAstType,
  Expression,
  FormulaDeclaration,
  IfStatement,
  isConstantDeclaration,
  isFormulaDeclaration,
  isModelDeclaration,
  isMutableDeclaration,
  isNamedElement,
  isParameterDeclaration,
  MatchStatement,
  ModelDeclaration,
  MutableDeclaration,
  NullLiteral,
  NumberLiteral,
  ReturnStatement,
  StringLiteral,
  TypeReference,
} from "./generated/ast.js";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangAstType>
{
  onInitialize(typir: TypirLangiumServices<ELangAstType>): void {
    const typeBool = typir.factory.Primitives.create({
      primitiveName: "boolean",
    })
      .inferenceRule({ languageKey: BooleanLiteral })
      .inferenceRule({
        languageKey: TypeReference,
        matching: (node: TypeReference) => node.primitive === "boolean",
      })
      .finish();

    const typeNumber = typir.factory.Primitives.create({
      primitiveName: "number",
    })
      .inferenceRule({ languageKey: NumberLiteral })
      .inferenceRule({
        languageKey: TypeReference,
        matching: (node: TypeReference) => node.primitive === "number",
      })
      .finish();

    const typeString = typir.factory.Primitives.create({
      primitiveName: "string",
    })
      .inferenceRule({ languageKey: StringLiteral })
      .inferenceRule({
        languageKey: TypeReference,
        matching: (node: TypeReference) => node.primitive === "text",
      })
      .finish();

    // const typeNull = typir.factory.Primitives.create({ primitiveName: "null" })
    //   .inferenceRule({ languageKey: NullLiteral })
    //   .finish();

    const typeAny = typir.factory.Top.create({}).finish();

    const prefixUnaryInferenceRule: InferOperatorWithSingleOperand<
      AstNode,
      Expression
    > = {
      languageKey: Expression,
      matching: (node: Expression, name: string) =>
        node.prefixOperator === name,
      operand: (node: Expression, _name: string) => node,
      validateArgumentsOfCalls: true,
    };

    const postfixUnaryInferenceRule: InferOperatorWithSingleOperand<
      AstNode,
      Expression
    > = {
      languageKey: Expression,
      matching: (node: Expression, name: string) =>
        node.postfixOperator === name,
      operand: (node: Expression, _name: string) => node,
      validateArgumentsOfCalls: true,
    };

    typir.factory.Operators.createUnary({
      name: "!",
      signature: { operand: typeBool, return: typeBool },
    })
      .inferenceRule(prefixUnaryInferenceRule)
      .finish();

    typir.factory.Operators.createUnary({
      name: "not",
      signature: { operand: typeBool, return: typeBool },
    })
      .inferenceRule(prefixUnaryInferenceRule)
      .finish();

    typir.factory.Operators.createUnary({
      name: "-",
      signature: { operand: typeNumber, return: typeNumber },
    })
      .inferenceRule(prefixUnaryInferenceRule)
      .finish();

    typir.factory.Operators.createUnary({
      name: "--",
      signature: { operand: typeNumber, return: typeNumber },
    })
      .inferenceRule(postfixUnaryInferenceRule)
      .finish();

    typir.factory.Operators.createUnary({
      name: "++",
      signature: { operand: typeNumber, return: typeNumber },
    })
      .inferenceRule(postfixUnaryInferenceRule)
      .finish();

    const binaryInferenceRule: InferOperatorWithMultipleOperands<
      AstNode,
      BinaryExpression
    > = {
      languageKey: BinaryExpression,
      matching: (node: BinaryExpression, name: string) =>
        node.operator === name,
      operands: (node: BinaryExpression, _name: string) => [
        node.left,
        node.right,
      ],
      validateArgumentsOfCalls: true,
    };

    for (const operator of ["-", "*", "/"]) {
      typir.factory.Operators.createBinary({
        name: operator,
        signature: { left: typeNumber, right: typeNumber, return: typeNumber },
      })
        .inferenceRule(binaryInferenceRule)
        .finish();
    }

    typir.factory.Operators.createBinary({
      name: "+",
      signatures: [
        { left: typeNumber, right: typeNumber, return: typeNumber },
        { left: typeString, right: typeString, return: typeString },
        { left: typeNumber, right: typeString, return: typeString },
        { left: typeString, right: typeNumber, return: typeString },
      ],
    })
      .inferenceRule(binaryInferenceRule)
      .finish();

    for (const operator of ["<", "<=", ">", ">="]) {
      typir.factory.Operators.createBinary({
        name: operator,
        signature: { left: typeNumber, right: typeNumber, return: typeBool },
      })
        .inferenceRule(binaryInferenceRule)
        .finish();
    }

    for (const operator of ["and", "or"]) {
      typir.factory.Operators.createBinary({
        name: operator,
        signature: { left: typeBool, right: typeBool, return: typeBool },
      })
        .inferenceRule(binaryInferenceRule)
        .finish();
    }

    for (const operator of ["==", "!=", "equals", "not_equals"]) {
      typir.factory.Operators.createBinary({
        name: operator,
        signature: { left: typeAny, right: typeAny, return: typeBool },
      })
        .inferenceRule({
          ...binaryInferenceRule,
          validation: (node, _operatorName, _operatorType, accept, typir) =>
            typir.validation.Constraints.ensureNodeIsEquals(
              node.left,
              node.right,
              accept,
              (actual, expected) => ({
                message: `This comparison will always return '${
                  node.operator === "==" || node.operator === "equals"
                    ? "false"
                    : "true"
                }' as '${node.left.$cstNode?.text}' and '${
                  node.right.$cstNode?.text
                }' have the different types '${actual.name}' and '${
                  expected.name
                }'.`,
                languageNode: node,
                languageProperty: "operator",
                severity: "warning",
              })
            ),
        })
        .finish();
    }

    typir.factory.Operators.createBinary({
      name: "=",
      signature: { left: typeAny, right: typeAny, return: typeAny },
    })
      .inferenceRule({
        ...binaryInferenceRule,
        validation: (node, _opName, _opType, accept, typir) =>
          typir.validation.Constraints.ensureNodeIsAssignable(
            node.right,
            node.left,
            accept,
            (actual, expected) => ({
              message: `The expression '${node.right.$cstNode?.text}' of type '${actual.name}' is not assignable to '${node.left.$cstNode?.text}' with type '${expected.name}'`,
              languageProperty: "value",
            })
          ),
      })
      .finish();

    typir.Inference.addInferenceRulesForAstNodes({
      MemberAccess: (node) => {
        const ref = node.member.ref;

        if (isModelDeclaration(ref)) {
          return InferenceRuleNotApplicable;
        } else if (isNamedElement(ref)) {
          return InferenceRuleNotApplicable;
        } else if (isConstantDeclaration(ref)) {
          return ref;
        } else if (isMutableDeclaration(ref)) {
          return ref;
        } else if (isParameterDeclaration(ref)) {
          return ref;
        } else if (isFormulaDeclaration(ref)) {
          return InferenceRuleNotApplicable;
        } else if (ref === undefined) {
          return InferenceRuleNotApplicable;
        } else {
          assertUnreachable(ref);
        }
      },
      ConstantDeclaration: (node) => {
        if (node.type) {
          return node.type;
        } else if (node.value) {
          return node.value;
        } else {
          return InferenceRuleNotApplicable; // this case is impossible, there is a validation in the Langium LOX validator for this case
        }
      },
      MutableDeclaration: (node) => {
        if (node.type) {
          return node.type;
        } else if (node.value) {
          return node.value;
        } else {
          return InferenceRuleNotApplicable; // this case is impossible, there is a validation in the Langium LOX validator for this case
        }
      },
      ParameterDeclaration: (node) => node.type,
    });

    typir.factory.Functions.createUniqueFunctionValidation({
      registration: { languageKey: FormulaDeclaration },
    });

    const uniqueModelValidator =
      typir.factory.Classes.createUniqueClassValidation({
        registration: "MYSELF",
      });

    // typir.factory.Classes.createUniqueMethodValidation({
    //     isMethodDeclaration: (node) => isMethodMember(node), // MethodMembers could have other $containers?
    //     getClassOfMethod: (method, _type) => method.$container,
    //     uniqueClassValidator: uniqueModelValidator,
    //     registration: { languageKey: MethodMember },
    // });

    typir.validation.Collector.addValidationRule(uniqueModelValidator, {
      languageKey: ModelDeclaration,
    });

    typir.factory.Classes.createNoSuperClassCyclesValidation({
      registration: { languageKey: ModelDeclaration },
    });

    // typir.Conversion.markAsConvertible(typeNull, this.classKind.getOrCreateTopClassType({}), 'IMPLICIT_EXPLICIT');

    typir.validation.Collector.addValidationRulesForAstNodes({
      // ForStatement: this.validateCondition,
      // IfStatement: this.validateCondition,
      ReturnStatement: this.validateReturnStatement,
      // VariableDeclaration: this.validateVariableDeclaration,
      // WhileStatement: this.validateCondition,
    });
  }

  onNewAstNode(node: AstNode, typir: TypirLangiumServices<ELangAstType>): void {
    // if (isFormulaDeclaration(node)) {
    //   this.createFormulaDetails(node, typir);
    // }
  }

  protected createFormulaDetails(
    node: FormulaDeclaration,
    typir: TypirLangiumServices<ELangAstType>
  ): TypeInitializer<FunctionType, AstNode> {
    const typeNull = typir.factory.Primitives.create({ primitiveName: "null" })
      .inferenceRule({ languageKey: NullLiteral })
      .finish();

    if (node.returnType !== undefined) {
      const config = typir.factory.Functions.create({
        functionName: node.name,
        outputParameter: { name: NO_PARAMETER_NAME, type: node.returnType },
        inputParameters: node.parameters.map(
          (p) => <CreateParameterDetails<AstNode>>{ name: p.name, type: p.type }
        ),
        associatedLanguageNode: node,
      }).inferenceRuleForDeclaration({
        languageKey: node.$type,
        matching: (languageNode: FormulaDeclaration) => languageNode === node,
      });

      //   if (isFormulaDeclaration(node)) {
      //     config.inferenceRuleForCalls({
      //       languageKey: CallExpression,
      //       matching: (languageNode: CallExpression) =>
      //         isFormulaDeclaration(languageNode.callee) &&
      //         languageNode.callee &&
      //         languageNode.callee === node,
      //       inputArguments: (languageNode: CallExpression) =>
      //         languageNode.arguments,
      //       validateArgumentsOfFunctionCalls: true,
      //     });
      //   } else {
      //     assertUnreachable(node);
      //   }

      return config.finish();
    } else {
      const config = typir.factory.Functions.create({
        functionName: node.name,
        outputParameter: { name: NO_PARAMETER_NAME, type: typeNull },
        inputParameters: node.parameters.map(
          (p) => <CreateParameterDetails<AstNode>>{ name: p.name, type: p.type }
        ),
        associatedLanguageNode: node,
      }).inferenceRuleForDeclaration({
        languageKey: node.$type,
        matching: (languageNode: FormulaDeclaration) => languageNode === node,
      });
      return config.finish();
    }
  }

  protected validateReturnStatement(
    node: ReturnStatement,
    accept: ValidationProblemAcceptor<AstNode>,
    typir: TypirServices<AstNode>
  ): void {
    const callableDeclaration: FormulaDeclaration | undefined =
      AstUtils.getContainerOfType(node, (node): node is FormulaDeclaration =>
        isFormulaDeclaration(node)
      );

    if (callableDeclaration && callableDeclaration.returnType && node.value) {
      typir.validation.Constraints.ensureNodeIsAssignable(
        node.value,
        callableDeclaration.returnType,
        accept,
        (actual, expected) => ({
          message: `The expression '${node.value.$cstNode?.text}' of type '${actual.name}' is not usable as return value for the formula '${callableDeclaration.name}' with return type '${expected.name}'.`,
          languageProperty: "value",
        })
      );
    } else if (
      callableDeclaration &&
      callableDeclaration.returnType &&
      !node.value
    ) {
      typir.validation.Constraints.ensureNodeIsAssignable(
        node,
        callableDeclaration.returnType,
        accept,
        (actual, expected) => ({
          message: `The formula '${callableDeclaration.name}' with return type '${expected.name}' must return a value.`,
          languageProperty: "value",
        })
      );
    }
  }

  protected validateVariableDeclaration(
    node: ConstantDeclaration | MutableDeclaration,
    accept: ValidationProblemAcceptor<AstNode>,
    typir: TypirServices<AstNode>
  ): void {
    const typeVoid = typir.factory.Primitives.get({ primitiveName: "void" })!;

    typir.validation.Constraints.ensureNodeHasNotType(
      node,
      typeVoid,
      accept,
      () => ({
        message: "Variable can't be declared with a type 'void'.",
        languageProperty: "type",
      })
    );

    typir.validation.Constraints.ensureNodeIsAssignable(
      node.value,
      node,
      accept,
      (actual, expected) => ({
        message: `The expression '${node.value?.$cstNode?.text}' of type '${actual.name}' is not assignable to '${node.name}' with type '${expected.name}'`,
        languageProperty: "value",
      })
    );
  }

  protected validateIfConditions(
    node: IfStatement,
    accept: ValidationProblemAcceptor<AstNode>,
    typir: TypirServices<AstNode>
  ): void {
    const typeBool = typir.factory.Primitives.get({
      primitiveName: "boolean",
    })!;

    for (const condition of node.conditions) {
      typir.validation.Constraints.ensureNodeIsAssignable(
        condition,
        typeBool,
        accept,
        () => ({
          message: "Conditions need to evaluate to 'boolean'.",
          languageProperty: "condition",
        })
      );
    }
  }

  protected validateMatchCondition(
    node: MatchStatement,
    accept: ValidationProblemAcceptor<AstNode>,
    typir: TypirServices<AstNode>
  ): void {
    const typeBool = typir.factory.Primitives.get({
      primitiveName: "boolean",
    })!;

    typir.validation.Constraints.ensureNodeIsAssignable(
      node.condition,
      typeBool,
      accept,
      () => ({
        message: "Conditions need to evaluate to 'boolean'.",
        languageProperty: "condition",
      })
    );
  }
}
