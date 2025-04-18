import { AstNode, AstUtils } from "langium";
import {
  assertUnreachable,
  CreateFieldDetails,
  CreateParameterDetails,
  FunctionType,
  InferenceRuleNotApplicable,
  InferOperatorWithMultipleOperands,
  InferOperatorWithSingleOperand,
  NO_PARAMETER_NAME,
  TypeInitializer,
  TypirServices,
  ValidationProblemAcceptor
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
  isReferenceExpression,
  MatchStatement,
  ModelDeclaration,
  MutableDeclaration,
  NullLiteral,
  NumberLiteral,
  ReturnStatement,
  StringLiteral,
  TypeReference
} from "./generated/ast.js";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangAstType>
{
  onInitialize(typir: TypirLangiumServices<ELangAstType>): void {
    /**
     * Primitive types
     */
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
      primitiveName: "text",
    })
      .inferenceRule({ languageKey: StringLiteral })
      .inferenceRule({
        languageKey: TypeReference,
        matching: (node: TypeReference) => node.primitive === "text",
      })
      .finish();

    const typeNull = typir.factory.Primitives.create({ primitiveName: "null" })
      .inferenceRule({ languageKey: NullLiteral })
      .finish();

    const typeAny = typir.factory.Top.create({}).finish();

    typir.Inference.addInferenceRulesForAstNodes({
      MemberAccess: (node) => {
        const ref = node.member.ref;

        if (isReferenceExpression(ref)) {
          return ref;
        } else if (isModelDeclaration(ref)) {
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
      ReferenceExpression: (node) => {
        return node.element.ref ?? InferenceRuleNotApplicable;
      },
      ConstantDeclaration: (node) => {
        if (node.type) {
          return node.type;
        } else if (node.value) {
          return node.value;
        } else {
          return InferenceRuleNotApplicable;
        }
      },
      MutableDeclaration: (node) => {
        if (node.type) {
          return node.type;
        } else if (node.value) {
          return node.value;
        } else {
          return InferenceRuleNotApplicable;
        }
      },
      ParameterDeclaration: (node) => node.type,
    });

    // Null can be assigned to any type
    typir.Conversion.markAsConvertible(typeNull, typeBool, "IMPLICIT_EXPLICIT");

    typir.Conversion.markAsConvertible(
      typeNull,
      typeNumber,
      "IMPLICIT_EXPLICIT"
    );

    typir.Conversion.markAsConvertible(
      typeNull,
      typeString,
      "IMPLICIT_EXPLICIT"
    );

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
      name: '=',
      signature: { left: typeNull, right: typeAny, return: typeAny }
    })
      .inferenceRule(binaryInferenceRule)
      .finish()

    typir.factory.Operators.createBinary({
      name: "=",
      signature: { left: typeAny, right: typeAny, return: typeAny },
    })
      .inferenceRule({
        ...binaryInferenceRule,
        validation: [
          (node, _opName, _opType, accept, typir) =>
            typir.validation.Constraints.ensureNodeIsAssignable(
              node.right,
              node.left,
              accept,
              (actual, expected) => ({
                message: `The expression '${node.right.$cstNode?.text}' of type '${actual.name}' is not assignable to '${node.left.$cstNode?.text}' with type '${expected.name}'`,
                languageProperty: "value",
              })
            ),
          (node, _opName, _opType, accept, _typir) => {
            if (
              isReferenceExpression(node.left) &&
              isConstantDeclaration(node.left.element.ref)
            ) {
              accept({
                message: `The constant '${node.left.element.ref.name}' value can't be re-assigned.`,
                languageNode: node,
                languageProperty: "operator",
                severity: "error",
              });
            }
          },
        ],
      })
      .finish();

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

    typir.validation.Collector.addValidationRulesForAstNodes({
      ConstantDeclaration: this.validateVariableDeclaration,
      MutableDeclaration: this.validateVariableDeclaration,
      // ForStatement: this.validateCondition,
      // IfStatement: this.validateCondition,
      ReturnStatement: this.validateReturnStatement,
      // WhileStatement: this.validateCondition,
    });
  }

  onNewAstNode(node: AstNode, typir: TypirLangiumServices<ELangAstType>): void {
    if (isModelDeclaration(node)) {
      const modelName = node.name;
      const modelType = typir.factory.Classes.create({
        className: modelName,
        // superClasses: node.parentTypes,
        fields: node.properties
          .filter(isParameterDeclaration) // only Fields, no Methods
          .map(
            (f) =>
              <CreateFieldDetails<AstNode>>{
                name: f.name,
                type: f.type, // note that type inference is used here
              }
          ),
        methods: [],
        // node.properties
        //   .filter(isLambdaExpression) // only Methods, no Fields
        //   .map(
        //     (member) =>
        //       <CreateMethodDetails<AstNode>>{
        //         type: this.createFunctionDetails(member, typir),
        //       }
        //   ), // same logic as for functions, since the LOX grammar defines them very similar
        associatedLanguageNode: node, // this is used by the ScopeProvider to get the corresponding class declaration after inferring the (class) type of an expression
      })
        // inference rule for declaration
        // .inferenceRuleForClassDeclaration({
        //   languageKey: ModelDeclaration,
        //   matching: (languageNode: ModelDeclaration) => languageNode === node,
        // })
        // inference rule for constructor calls (i.e. class literals) conforming to the current class
        // .inferenceRuleForClassLiterals({
        //   // <InferClassLiteral<MemberCall>>
        //   languageKey: MemberAccess,
        //   matching: (languageNode: MemberAccess) =>
        //     isModelDeclaration(languageNode.member?.ref) &&
        //     languageNode.member!.ref === modelName &&
        //     languageNode.member,
        //   inputValuesForFields: (_languageNode: MemberCall) => new Map(), // values for fields don't matter for nominal typing
        // })
        // .inferenceRuleForClassLiterals({
        //   // <InferClassLiteral<TypeReference>>
        //   languageKey: TypeReference,
        //   matching: (languageNode: TypeReference) =>
        //     isModelDeclaration(languageNode.declaredType?.ref) &&
        //     languageNode.declaredType!.ref.name === modelName,
        //   inputValuesForFields: (_languageNode: TypeReference) => new Map(), // values for fields don't matter for nominal typing
        // })
        // inference rule for accessing fields
        // .inferenceRuleForFieldAccess({
        //   languageKey: MemberAccess,
        //   matching: (languageNode: MemberAccess) =>
        //     isParameterDeclaration(languageNode.member?.ref) &&
        //     languageNode.member!.ref.$container === node,
        //   field: (languageNode: MemberAccess) => languageNode.member!.ref!.name,
        // })
        .finish();

      // explicitly declare, that 'nil' can be assigned to any Class variable
      modelType.addListener((type) => {
        typir.Conversion.markAsConvertible(
          typir.factory.Primitives.get({ primitiveName: "null" })!,
          type,
          "IMPLICIT_EXPLICIT"
        );
      });
      // The following idea does not work, since variables in LOX have a concrete class type and not an "any class" type:
      // typir.conversion.markAsConvertible(typeNil, this.classKind.getOrCreateTopClassType({}), 'IMPLICIT_EXPLICIT');
    }
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
