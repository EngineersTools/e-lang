import {
  AstUtils,
  ValidationAcceptor,
  ValidationChecks,
  ValidationRegistry,
} from "langium";
import { ELangServices } from "./e-lang-module.js";
import {
  BinaryExpression,
  ConstantDeclaration,
  ELangAstType,
  ELangProgram,
  Expression,
  FormulaDeclaration,
  isBinaryExpression,
  isConstantDeclaration,
  isExpression,
  isFormulaDeclaration,
  isLambdaDeclaration,
  isListAdd,
  isListCount,
  isMatchStatement,
  isModelDeclaration,
  isModelMemberAssignment,
  isModelMemberCall,
  isModelValue,
  isMutableDeclaration,
  isPrintStatement,
  isReturnStatement,
  isStatementBlock,
  LambdaDeclaration,
  ModelDeclaration,
  ModelMemberAssignment,
  ModelMemberCall,
  ModelValue,
  MutableDeclaration,
  ProcedureDeclaration,
  PropertyDeclaration,
  Statement,
  StatementBlock,
  TypeReference,
  UnaryExpression,
} from "./generated/ast.js";
import { TypeEnvironment } from "./type-system/TypeEnvironment.class.js";
import {
  addFormulaDeclaration,
  addLambdaDeclaration,
  addStatement,
  getReturnStatements,
  getReturnType,
  registerModelDeclaration,
} from "./type-system/TypeEnvironment.functions.js";
import { isAssignable } from "./type-system/assignment.js";
import {
  isEmtpyListType,
  isFormulaType,
  isListType,
  isModelType,
} from "./type-system/descriptions.js";
import { getModelDeclarationParentsChain } from "./type-system/getModelDeclarationChain.js";
import { inferType } from "./type-system/infer.js";
import { isLegalOperation } from "./type-system/operator.js";
import { typeToString } from "./type-system/typeToString.js";

export class ELangValidationRegistry extends ValidationRegistry {
  constructor(services: ELangServices) {
    super(services);
    const validator = services.validation.ELangValidator;
    const checks: ValidationChecks<ELangAstType> = {
      ELangProgram: validator.typecheckProgram,
      PropertyDeclaration: validator.checkModelPropertiesAreNotDuplicated,
      ModelMemberAssignment: validator.checkAssignmentOperationAllowed,
      ConstantDeclaration: validator.checkAssignmentOperationAllowed,
      MutableDeclaration: validator.checkAssignmentOperationAllowed,
      ModelMemberCall: validator.checkListAccessIsInteger,
    };
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class ELangValidator {
  private getTypeCache(): TypeEnvironment {
    return new TypeEnvironment();
  }

  typecheckProgram(program: ELangProgram, accept: ValidationAcceptor): void {
    const env = new TypeEnvironment();

    env.enterScope();

    program.statements.forEach((stmt) => {
      this.typecheckStatement(env, stmt, accept);
    });

    env.leaveScope();
  }

  typecheckStatement(
    env: TypeEnvironment,
    stmt: Statement,
    accept: ValidationAcceptor
  ): void {
    if (isModelDeclaration(stmt)) {
      registerModelDeclaration(stmt, env);
    } else if (isFormulaDeclaration(stmt)) {
      addFormulaDeclaration(stmt, env);
      this.typecheckFormulaDeclaration(env, stmt, accept);
    } else if (isLambdaDeclaration(stmt)) {
      addLambdaDeclaration(stmt, env);
      this.typecheckLambdaDeclaration(env, stmt, accept);
    } else if (isConstantDeclaration(stmt) || isMutableDeclaration(stmt)) {
      this.typecheckVariableDeclarationStatement(env, stmt, accept);
    } else if (isMatchStatement(stmt)) {
      stmt.options.forEach((opt) => {
        this.typecheckStatement(env, opt.condition, accept);
        if (opt.block) this.typecheckStatement(env, opt.block, accept);
        if (opt.value) this.typecheckStatement(env, opt.value, accept);
      });
      if (stmt.block) this.typecheckStatement(env, stmt.block, accept);
      if (stmt.value) this.typecheckStatement(env, stmt.value, accept);
    } else if (isStatementBlock(stmt)) {
      stmt.statements.forEach((s) => this.typecheckStatement(env, s, accept));
    } else if (isBinaryExpression(stmt)) {
      switch (stmt.operator) {
        case "=":
          if (isModelMemberCall(stmt.left)) {
            if (isConstantDeclaration(stmt.left.element.ref)) {
              accept(
                "error",
                `Cannot re-assign new values to constant '${stmt.left.element.ref.name}'`,
                {
                  node: stmt,
                  property: "left",
                }
              );
            }

            const to = env.getVariableType(stmt.left.element.$refText);
            const from = inferType(stmt.right, env);

            if (to && from) {
              const assignable = isAssignable(from, to);

              if (!assignable.result) {
                accept("error", assignable.reason, {
                  node: stmt,
                  property: "right",
                });
              }
            }
          }
      }
    } else if (isListCount(stmt)) {
      const inferredType = inferType(stmt.list, env);
      if (!isListType(inferredType) && !isEmtpyListType(inferredType))
        accept(
          "error",
          `Element '${stmt.list.$cstNode?.text}' is not a valid list type`,
          {
            node: stmt,
            property: "list",
          }
        );
    } else if (isListAdd(stmt)) {
      const listInferredType = inferType(stmt.list, env);
      const addedElementInferredType = inferType(stmt.item, env);

      if (!isListType(listInferredType) && !isEmtpyListType(listInferredType)) {
        accept(
          "error",
          `Element '${stmt.list.$cstNode?.text}' is not a valid list type`,
          {
            node: stmt,
            property: "list",
          }
        );
      } else {
        const assignable = isAssignable(
          addedElementInferredType,
          listInferredType
        );

        if (!assignable.result) {
          accept("error", assignable.reason, {
            node: stmt,
            property: "item",
          });
        }
      }
    } else if (isPrintStatement(stmt)) {
      this.typecheckStatement(env, stmt.value, accept);
    }
  }

  typecheckVariableDeclarationStatement(
    env: TypeEnvironment,
    stmt: ConstantDeclaration | MutableDeclaration,
    accept: ValidationAcceptor
  ) {
    addStatement(stmt, env);

    if (stmt.assignment && stmt.value) {
      const assignedType = env.getVariableType(stmt.name);
      const exprType = inferType(stmt.value, env);

      if (isLambdaDeclaration(stmt.value))
        this.typecheckLambdaDeclaration(env, stmt.value, accept);

      if (assignedType === undefined) {
        accept("error", "No type assigned to this variable", {
          node: stmt,
          property: "name",
        });
      } else if (
        stmt.type &&
        stmt.type.model &&
        stmt.type.model.ref &&
        isModelValue(stmt.value)
      ) {
        this.typecheckModelAssignment(
          env,
          stmt.type.model.ref,
          stmt.value,
          accept
        );
      } else {
        const isAssignableResult = isAssignable(exprType, assignedType);
        if (!isAssignableResult.result) {
          accept("error", isAssignableResult.reason, {
            node: stmt,
            property: "value",
          });
        }
      }
    }
  }

  typecheckModelAssignment(
    env: TypeEnvironment,
    declaration: ModelDeclaration,
    value: ModelValue,
    accept: ValidationAcceptor
  ) {
    const to = env.getRegisteredType(declaration.name);
    const from = inferType(value, env);

    if (from && to && isModelType(from) && isModelType(to)) {
      from.memberTypes.forEach((member) => {
        const toMember = to.memberTypes.find((m) => m.name === member.name);

        if (!toMember) {
          return (
            member.optional ??
            accept(
              "error",
              `Property '${member.name}' is not defined on type '${declaration.name}'`,
              {
                node: value,
                property: "members",
                index: from.memberTypes.indexOf(member),
              }
            )
          );
        }

        const isAssignableResult = isAssignable(member, toMember);

        if (!isAssignableResult.result) {
          accept("error", isAssignableResult.reason, {
            node:
              value.members.find((m) => m.property === toMember.name) ?? value,
          });
        }
      });
    }
  }

  typecheckFormulaDeclaration(
    env: TypeEnvironment,
    stmt: FormulaDeclaration,
    accept: ValidationAcceptor
  ) {
    const formulaTypeDescription = env.getVariableType(stmt.name);
    const returnType = getReturnType(stmt.body, env);

    if (formulaTypeDescription && isFormulaType(formulaTypeDescription)) {
      this.typecheckStatement(env, stmt.body, accept);

      const returnStatements = stmt.body.statements.filter((s) =>
        isReturnStatement(s)
      );

      if (returnStatements && returnStatements.length > 0) {
        returnStatements.forEach((s) => {
          const isAssignableResult = isAssignable(
            returnType,
            formulaTypeDescription.returnType
          );
          if (!isAssignableResult.result) {
            accept("error", isAssignableResult.reason, { node: s });
          }
        });
      }
    }
  }

  typecheckLambdaDeclaration(
    env: TypeEnvironment,
    stmt: LambdaDeclaration,
    accept: ValidationAcceptor
  ) {
    const returnType =
      stmt.returnType !== undefined
        ? inferType(stmt.returnType, env)
        : isStatementBlock(stmt.body)
        ? getReturnType(stmt.body, env)
        : inferType(stmt.body, env);

    if (isStatementBlock(stmt.body)) {
      this.typecheckStatement(env, stmt.body, accept);

      const returnStatements = getReturnStatements(stmt.body, env);

      if (returnStatements && returnStatements.length > 0) {
        returnStatements.forEach((s) => {
          const isAssignableResult = isAssignable(
            inferType(s, env),
            returnType
          );
          if (!isAssignableResult.result) {
            accept(
              "error",
              `Incorrect return type. ${isAssignableResult.reason}`,
              { node: s }
            );
          }
        });
      }
    } else if (isExpression(stmt.body)) {
      const isAssignableResult = isAssignable(
        inferType(stmt.body, env),
        returnType
      );
      if (!isAssignableResult.result) {
        accept("error", `Incorrect return type. ${isAssignableResult.reason}`, {
          node: stmt.body,
        });
      }
    }
  }

  checkListAccessIsInteger(
    node: ModelMemberCall,
    accept: ValidationAcceptor
  ): void {
    if (node.accessElement) {
      if (!isExpression(node.index) && !Number.isInteger(node.index)) {
        accept("error", "Index must be an integer", {
          node: node,
          property: "index",
        });
      }
    }
  }

  checkModelPropertiesAreNotDuplicated(
    prop: PropertyDeclaration,
    accept: ValidationAcceptor
  ): void {
    if (isModelDeclaration(prop.$container)) {
      const model = prop.$container;

      let count = 0;
      model.properties.forEach((p) => {
        if (p.name === prop.name) {
          count++;

          if (count > 1)
            accept(
              "error",
              `PropertyDeclaration '${prop.name}' already exists in model '${model.name}'`,
              {
                node: prop,
                property: "name",
              }
            );
        }
      });

      const parentModels = getModelDeclarationParentsChain(model);

      parentModels.forEach((parentModel) => {
        if (parentModel) {
          const parentModelPropertiesNames = parentModel.properties.map(
            (p) => p.name
          );

          if (
            parentModelPropertiesNames.includes(prop.name) &&
            !prop.override
          ) {
            accept(
              "error",
              `This property already exists in parent model '${parentModel.name}', use the 'override' keyword if this is intentional`,
              {
                node: prop,
                property: "name",
              }
            );
          }
        }
      });
    }
  }

  checkParentModelsForDuplicatedProperties(
    model: ModelDeclaration,
    accept: ValidationAcceptor
  ): void {
    if (model.parentTypes.length > 1) {
      for (let i = 1; i < model.parentTypes.length; i++) {
        const currentModel = model.parentTypes[i];
        const currentModelPropsNames = currentModel.ref?.properties.map(
          (p) => p.name
        );

        // Check against all previous models
        for (let j = 0; j < i; j++) {
          model.parentTypes[j].ref?.properties.forEach((p) => {
            if (currentModelPropsNames?.includes(p.name)) {
              accept(
                "error",
                `PropertyDeclaration '${p.name}' already exists in model '${model.parentTypes[j].ref?.name}'`,
                {
                  node: model,
                  property: "parentTypes",
                  index: i,
                }
              );
            }
          });
        }
      }
    }
  }

  checkAllModelPropertiesHaveBeenAssigned(
    prop: ModelValue,
    accept: ValidationAcceptor
  ) {
    accept("info", "Checking if all properties have been assigned", {
      node: prop,
    });
    // if (isModelValue(prop.$container)) {
    //   const model = prop.$container;
    //   const modelProperties = model.properties.map((p) => p.name);
    //   const modelValueProperties = model.properties.map((p) => p.name);

    //   modelProperties.forEach((p) => {
    //     if (!modelValueProperties.includes(p)) {
    //       accept("error", `Property '${p}' must be assigned`, {
    //         node: prop,
    //         property: "name",
    //       });
    //     }
    //   });
    // }
  }

  checkUnitsAreOfCorrectFamily(
    node: ConstantDeclaration | MutableDeclaration,
    accept: ValidationAcceptor
  ) {
    // if (
    //   isConstantDeclaration(node) &&
    //   isTypeReference(node.type) &&
    //   isMeasurementLiteral(node.value)
    // ) {
    //   const unitRef = node.value.unit.ref;
    //   const unitFamilyRef = node.type. .unitFamily.ref;
    //   const unitFamilyUnits = unitFamilyRef?.units.map((u) => u.name);
    //   if (
    //     unitRef &&
    //     unitFamilyRef &&
    //     !unitFamilyRef.units.map((u) => u.name).includes(unitRef.name)
    //   ) {
    //     accept(
    //       "error",
    //       `The unit ${unitRef.name} has is not part of the ${unitFamilyRef.name} unit family. Valid unit options for this family are: ${unitFamilyUnits}`,
    //       { node, property: "value" }
    //     );
    //   }
    // }
  }

  checkReturnType(
    method: FormulaDeclaration | ProcedureDeclaration | LambdaDeclaration,
    accept: ValidationAcceptor
  ): void {
    if (method.returnType) {
      this.checkFunctionReturnTypeInternal(
        method.body,
        method.returnType,
        accept
      );
    }
  }

  checkBinaryOperationAllowed(
    binary: BinaryExpression,
    accept: ValidationAcceptor
  ): void {
    const map = this.getTypeCache();
    const left = inferType(binary.left, map);
    const right = inferType(binary.right, map);
    if (!isLegalOperation(binary.operator, left, right)) {
      accept(
        "error",
        `Cannot perform operation '${
          binary.operator
        }' on values of type '${typeToString(left)}' and '${typeToString(
          right
        )}'.`,
        {
          node: binary,
        }
      );
    } else if (binary.operator === "=") {
      if (!isAssignable(right, left)) {
        accept(
          "error",
          `Type '${typeToString(
            right
          )}' is not assignable to type '${typeToString(left)}'.`,
          {
            node: binary,
            property: "right",
          }
        );
      }
    } else if (["==", "!="].includes(binary.operator)) {
      if (!isAssignable(right, left)) {
        accept(
          "warning",
          `This comparison will always return '${
            binary.operator === "==" ? "false" : "true"
          }' as types '${typeToString(left)}' and '${typeToString(
            right
          )}' are not compatible.`,
          {
            node: binary,
            property: "operator",
          }
        );
      }
    }
  }

  checkUnaryOperationAllowed(
    unary: UnaryExpression,
    accept: ValidationAcceptor
  ): void {
    const item = inferType(unary.value, this.getTypeCache());
    if (!isLegalOperation(unary.operator, item)) {
      accept(
        "error",
        `Cannot perform operation '${
          unary.operator
        }' on value of type '${typeToString(item)}'.`,
        {
          node: unary,
        }
      );
    }
  }

  checkItHasReturn(method: FormulaDeclaration, accept: ValidationAcceptor) {
    if (!method.returnType) {
      accept("error", "A formula must have a return type", {
        node: method,
        property: "name",
      });
    }
  }

  checkAssignmentOperationAllowed(
    assignment:
      | ModelMemberAssignment
      | ConstantDeclaration
      | MutableDeclaration,
    accept: ValidationAcceptor
  ) {
    const map = this.getTypeCache();

    if (isModelMemberAssignment(assignment)) {
      const modelValue = assignment.$container;
      if (
        isModelValue(modelValue) &&
        isConstantDeclaration(modelValue.$container)
      ) {
        const left = inferType(modelValue.$container, map);
        const right = inferType(modelValue, map);
        if (!isAssignable(left, right)) {
          accept(
            "error",
            `Type '${typeToString(
              right
            )}' is not assignable to type '${typeToString(left)}'.`,
            {
              node: left,
              property: "right",
            }
          );
        }
      }
    } else if (
      isConstantDeclaration(assignment) ||
      isMutableDeclaration(assignment)
    ) {
      const expectedType = inferType(assignment.type, map);
      const assignedType = inferType(assignment.value, map);
      if (!isAssignable(assignedType, expectedType)) {
        accept(
          "error",
          `Type '${typeToString(
            assignedType
          )}' is not assignable to type '${typeToString(expectedType)}'.`,
          {
            node: assignment,
            property: "value",
          }
        );
      }
    }
  }

  private checkFunctionReturnTypeInternal(
    body: StatementBlock | Expression,
    returnType: TypeReference,
    accept: ValidationAcceptor
  ): void {
    const map = this.getTypeCache();
    const returnStatements = AstUtils.streamAllContents(body)
      .filter(isReturnStatement)
      .toArray();
    const expectedType = inferType(returnType, map);

    if (returnStatements.length === 0) {
      accept(
        "error",
        "A function that declares a return type must return a value.",
        {
          node: returnType,
        }
      );
      return;
    }

    for (const returnStatement of returnStatements) {
      const returnValueType = inferType(returnStatement, map);
      if (!isAssignable(returnValueType, expectedType)) {
        accept(
          "error",
          `Type '${typeToString(
            returnValueType
          )}' is not assignable to the declared return type '${typeToString(
            expectedType
          )}'.`,
          {
            node: returnStatement,
          }
        );
      }
    }
  }
}
