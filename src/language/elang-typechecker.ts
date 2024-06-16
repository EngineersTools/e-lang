import { ValidationAcceptor, ValidationChecks } from "langium";
import { ElangServices } from "./elang-module.js";
import {
  ConstantDeclaration,
  ElangAstType,
  ElangProgram,
  FormulaDeclaration,
  ModelDeclaration,
  ModelValue,
  MutableDeclaration,
  PropertyDeclaration,
  Statement,
  isConstantDeclaration,
  isFormulaDeclaration,
  isModelDeclaration,
  isModelValue,
  isMutableDeclaration,
  isReturnStatement,
} from "./generated/ast.js";
import { TypeEnvironment } from "./type-system/TypeEnvironment.class.js";
import {
  addFormulaDeclaration,
  addStatement,
  getReturnType,
  registerModelDeclaration,
} from "./type-system/TypeEnvironment.functions.js";
import { isAssignable } from "./type-system/assignment.js";
import { isFormulaType, isModelType } from "./type-system/descriptions.js";
import { getModelDeclarationParentsChain } from "./type-system/getModelDeclarationChain.js";
import { inferType } from "./type-system/infer.js";

export function registerTypechecks(services: ElangServices) {
  const registry = services.validation.ValidationRegistry;
  const typesValidator = services.validation.ElangTypechecker;
  const checks: ValidationChecks<ElangAstType> = {
    ElangProgram: typesValidator.typecheckProgram,
    PropertyDeclaration: typesValidator.checkModelPropertiesAreNotDuplicated,
  };
  registry.register(checks, typesValidator);
}

export class ElangTypechecker {
  typecheckProgram(program: ElangProgram, accept: ValidationAcceptor): void {
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
    } else if (isConstantDeclaration(stmt) || isMutableDeclaration(stmt)) {
      this.typecheckVariableDeclarationStatement(env, stmt, accept);
    }
  }

  checkModelPropertiesAreNotDuplicated(
    prop: PropertyDeclaration,
    accept: ValidationAcceptor
  ): void {
    if (isModelDeclaration(prop.$container)) {
      const model = prop.$container;
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

  typecheckVariableDeclarationStatement(
    env: TypeEnvironment,
    stmt: ConstantDeclaration | MutableDeclaration,
    accept: ValidationAcceptor
  ) {
    addStatement(stmt, env);

    if (stmt.assignment && stmt.type && stmt.value) {
      const assignedType = env.getVariableType(stmt.name);
      const exprType = inferType(stmt.value, env);

      if (assignedType === undefined) {
        accept("error", "No type assigned to this variable", {
          node: stmt,
          property: "name",
        });
      } else if (
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
    const from = env.getRegisteredType(declaration.name);
    const to = inferType(value, env);

    if (from && to && isModelType(from) && isModelType(to)) {
      from.memberTypes.forEach((member) => {
        const toMember = to.memberTypes.find((m) => m.name === member.name);

        if (!toMember) {
          return (
            member.optional ??
            accept("error", "Property is missing", {
              node: value,
              property: "members",
            })
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
}
