import { ValidationAcceptor, ValidationChecks } from "langium";
import { ElangServices } from "./elang-module.js";
import {
  ConstantDeclaration,
  ElangAstType,
  ElangProgram,
  Expression,
  MutableDeclaration,
  Statement,
  isConstantDeclaration,
  isExpression,
  isForStatement,
  isFormulaDeclaration,
  isIfStatement,
  isLambdaDeclaration,
  isMatchStatement,
  isModelDeclaration,
  isMutableDeclaration,
  isPrintStatement,
  isProcedureDeclaration,
  isReturnStatement,
  isStatementBlock,
  isUnitFamilyDeclaration,
} from "./generated/ast.js";
import { TypeEnvironment } from "./type-system/TypeEnvironment.class.js";
import { createModelType } from "./type-system/descriptions.js";
import { inferType, inferTypeRef } from "./type-system/infer.js";

export function registerTypechecks(services: ElangServices) {
  const registry = services.validation.ValidationRegistry;
  const typesValidator = services.validation.ElangTypechecker;
  const checks: ValidationChecks<ElangAstType> = {
    ElangProgram: typesValidator.typecheckProgram,
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
    if (isExpression(stmt)) {
      this.typecheckExpression(env, stmt, accept);
    } else if (isForStatement(stmt)) {
    } else if (isFormulaDeclaration(stmt)) {
    } else if (isIfStatement(stmt)) {
    } else if (isLambdaDeclaration(stmt)) {
    } else if (isMatchStatement(stmt)) {
    } else if (isModelDeclaration(stmt)) {
      env.set(stmt.name, createModelType(stmt));
    } else if (isPrintStatement(stmt)) {
    } else if (isProcedureDeclaration(stmt)) {
    } else if (isReturnStatement(stmt)) {
    } else if (isStatementBlock(stmt)) {
    } else if (isUnitFamilyDeclaration(stmt)) {
    } else if (isConstantDeclaration(stmt) || isMutableDeclaration(stmt)) {
      this.typecheckVariableAssignent(env, stmt, accept);
    }
  }

  typecheckExpression(
    env: TypeEnvironment,
    exp: Expression,
    accept: ValidationAcceptor
  ): void {
    const exprType = inferType(exp, env);
    accept("info", exprType.$type, { node: exp });
  }

  typecheckVariableAssignent(
    env: TypeEnvironment,
    stmt: ConstantDeclaration | MutableDeclaration,
    accept: ValidationAcceptor
  ) {
    if (stmt.assignment && stmt.type && stmt.value) {
      const assignedType = inferTypeRef(stmt.type);
      const exprType = inferType(stmt.value, env);

      if (assignedType.$type !== exprType.$type) {
        accept(
          "error",
          `Type mismatch. Value '${stmt.value}' of type '${exprType.$type}' cannot be assigned to a variable of type '${assignedType}'.`,
          { node: stmt }
        );
      }
    }
  }
}
