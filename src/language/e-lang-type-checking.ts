import { AstNode, AstUtils } from "langium";
import {
  assertUnreachable,
  CreateFieldDetails,
  CreateMethodDetails,
  CreateParameterDetails,
  FunctionType,
  InferenceRuleNotApplicable,
  InferOperatorWithMultipleOperands,
  InferOperatorWithSingleOperand,
  isType,
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
  ConstantDeclaration,
  DimensionDeclaration,
  ELangAstType,
  Expression,
  FormulaDeclaration,
  IfStatement,
  isBinaryExpression,
  isConstantDeclaration,
  isConversionDeclaration,
  isDimensionDeclaration,
  isFormulaDeclaration,
  isLambdaExpression,
  isModelDeclaration,
  isMutableDeclaration,
  isNamedElement,
  isParameterDeclaration,
  isReferenceExpression,
  isUnitDeclaration,
  LambdaExpression,
  MatchStatement,
  ModelDeclaration,
  MutableDeclaration,
  NullLiteral,
  ReturnStatement,
  TypeReference,
} from "./generated/ast.js";
import {
  createTypeAny,
  createTypeNumber,
  createTypeText,
  getOrCreateTypeBool,
  getOrCreateTypeNull,
} from "./type-system/createPrimitives.js";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class ELangTypeSystem
  implements LangiumTypeSystemDefinition<ELangAstType>
{
  onInitialize(typir: TypirLangiumServices<ELangAstType>): void {
    /**
     * Create and register primitive types
     */
    const typeBool = getOrCreateTypeBool(typir);
    const typeNumber = createTypeNumber(typir);
    const typeText = createTypeText(typir);
    const typeNull = getOrCreateTypeNull(typir);
    const typeAny = createTypeAny(typir);

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
        if (isBinaryExpression(node.$container)) {
          const parent = node.$container;
          if (
            parent.operator === "=" &&
            !isReferenceExpression(parent.right) &&
            isReferenceExpression(parent.left) &&
            parent.left.element.ref
          ) {
            const variableType = typir.Inference.inferType(
              parent.left.element.ref
            );
            const valueType = typir.Inference.inferType(parent.right);

            if (
              isType(variableType) &&
              variableType === typeNull &&
              isType(valueType) &&
              valueType !== typeNull
            ) {
              typir.caching.LanguageNodeInference.cacheSet(
                node.element.ref,
                valueType
              );
              return parent.right;
            }
          }
        } else if (isParameterDeclaration(node.element.ref)) {
          return node.element.ref.type;
        }

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
      TypeReference: (node) =>
        node.declaredType?.ref ?? InferenceRuleNotApplicable,
    });

    // Null can be assigned to any type
    typir.Conversion.markAsConvertible(typeNull, typeBool, "IMPLICIT_EXPLICIT");

    typir.Conversion.markAsConvertible(
      typeNull,
      typeNumber,
      "IMPLICIT_EXPLICIT"
    );

    typir.Conversion.markAsConvertible(typeNull, typeText, "IMPLICIT_EXPLICIT");

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
        { left: typeText, right: typeText, return: typeText },
        { left: typeNumber, right: typeText, return: typeText },
        { left: typeText, right: typeNumber, return: typeText },
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
      // BinaryExpression: this.inferTypeOfImplicitNullAssignment,
    });
  }

  onNewAstNode(node: AstNode, typir: TypirLangiumServices<ELangAstType>): void {
    // console.log(node.$type, node.$cstNode?.text);
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

      // explicitly declare, that 'null' can be assigned to any Class variable
      modelType.addListener((type) => {
        typir.Conversion.markAsConvertible(
          typir.factory.Primitives.get({ primitiveName: "null" })!,
          type,
          "IMPLICIT_EXPLICIT"
        );
      });
      // The following idea does not work, since variables in LOX have a concrete class type and not an "any class" type:
      // typir.conversion.markAsConvertible(typeNil, this.classKind.getOrCreateTopClassType({}), 'IMPLICIT_EXPLICIT');
    } else if (isDimensionDeclaration(node)) {
      typir.factory.Classes.create({
        className: node.name,
        fields: node.units.filter(isUnitDeclaration).map(
          (f) =>
            <CreateFieldDetails<AstNode>>{
              name: f.name,
              type: f,
            }
        ),
        methods: node.conversions.filter(isConversionDeclaration).map(
          (m) =>
            <CreateMethodDetails<AstNode>>{
              type: m,
            }
        ),
        associatedLanguageNode: node,
      })
        .inferenceRuleForClassDeclaration({
          languageKey: DimensionDeclaration,
          matching: (languageNode: DimensionDeclaration) =>
            languageNode === node,
        })
        .finish();
    } else if (isLambdaExpression(node)) {
      this.createLambdaDetails(node, typir);
    }
  }

  protected createLambdaDetails(
    node: LambdaExpression,
    typir: TypirLangiumServices<ELangAstType>
  ) {
    if (node.returnType !== undefined) {
      const config = typir.factory.Functions.create({
        functionName: "Lambda",
        outputParameter: { name: NO_PARAMETER_NAME, type: node.returnType },
        inputParameters: node.parameters.map(
          (p) => <CreateParameterDetails<AstNode>>{ name: p.name, type: p.type }
        ),
      });

      return config.finish();
    } else {
      const typeNull = getOrCreateTypeNull(typir);

      const config = typir.factory.Functions.create({
        functionName: "Lambda",
        outputParameter: { name: NO_PARAMETER_NAME, type: typeNull },
        inputParameters: node.parameters.map(
          (p) => <CreateParameterDetails<AstNode>>{ name: p.name, type: p.type }
        ),
      });

      return config.finish();
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
    typir: TypirLangiumServices<ELangAstType>
  ): void {
    const typeBool = getOrCreateTypeBool(typir)!;

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

  protected inferTypeOfImplicitNullAssignment(
    node: BinaryExpression,
    accept: ValidationProblemAcceptor<AstNode>,
    typir: TypirServices<AstNode>
  ): void {
    // Only handle assignment operations
    if (node.operator !== "=") {
      return;
    }

    const left = node.left;
    const right = node.right;

    // Check if left side is a reference to a mutable variable
    if (isReferenceExpression(left)) {
      const ref = left.element.ref;
      if (isMutableDeclaration(ref)) {
        // If the variable's type is null and we're assigning a new value
        const typeNull = typir.factory.Primitives.get({
          primitiveName: "null",
        })!;
        const currentType = typir.Inference.inferType(ref);

        if (currentType === typeNull) {
          // Infer the type from the right-hand side expression
          const newTypeResult = typir.Inference.inferType(right);
          if (Array.isArray(newTypeResult)) {
            // If there are inference problems, report them
            newTypeResult.forEach((problem) => {
              accept({
                message: problem.location,
                severity: "error",
                languageNode: node,
                languageProperty: "operator",
              });
            });
            return;
          }

          if (newTypeResult !== typeNull) {
            // Get the primitive type name from the type
            // const typeName = typir.factory.Primitives.get({
            //   primitiveName: newTypeResult.getIdentifier(),
            // })?.getIdentifier();

            // Create a new TypeReference based on the inferred type
            const typeRef: TypeReference = {
              $type: "TypeReference",
              primitive: "text",
              array: false,
            };
            // Update the variable's type
            ref.type = typeRef;
          }
        }
      }
    }
  }
}
