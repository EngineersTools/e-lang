import {
  isBinaryExpression,
  isBooleanLiteral,
  isConstantDeclaration,
  isFormulaDeclaration,
  isIfStatement,
  isModelDeclaration,
  isModelMemberCall,
  isMutableDeclaration,
  isNullLiteral,
  isNumberLiteral,
  isStatementBlock,
  isStringLiteral,
  isTypeReference,
  ModelMemberCall,
  Statement,
} from "../generated/ast.js";
import { ELangType } from "./ELangType.js";
import { ElangTypeError } from "./ELangTypeError.js";
import { TypeEnvironment } from "./TypeEnvironment.js";

/**
 * @description Elang Type Checker
 */
export class ELangTypeChecker {
  constructor() {
    this.global = this._createGlobalEnvironment();
  }

  global: TypeEnvironment;

  /**
   * Infers and validates the type of an expression
   * @param exp The expression being checked
   */
  tc(exp: Statement, env: TypeEnvironment = this.global): ELangType {
    if (isStatementBlock(exp)) {
      env.enterScope();
      exp.statements.forEach((s) => this.tc(s, env));
      env.leaveScope();
    } else if (isNumberLiteral(exp)) {
      return ELangType.number;
    } else if (isStringLiteral(exp)) {
      return ELangType.text;
    } else if (isBooleanLiteral(exp)) {
      return ELangType.boolean;
    } else if (isNullLiteral(exp)) {
      return ELangType.null;
    } else if (isModelMemberCall(exp)) {
      return this._lookup(exp, env);
    } else if (isBinaryExpression(exp)) {
      const leftType = this.tc(exp.left, env);
      const rightType = this.tc(exp.right, env);

      if (exp.operator === "=") {
        if (leftType.equals(rightType)) {
          return leftType;
        } else {
          throw new ElangTypeError(
            `Invalid types for assignment: '${leftType.getName()}' and '${rightType.getName()}'`
          );
        }
      } else if (
        exp.operator === "<" ||
        exp.operator === ">" ||
        exp.operator === "<=" ||
        exp.operator === ">="
      ) {
        if (
          leftType.equals(ELangType.number) &&
          rightType.equals(ELangType.number)
        ) {
          return ELangType.boolean;
        }
      } else if (exp.operator === "==" || exp.operator === "!=") {
        if (leftType.equals(rightType)) {
          return ELangType.boolean;
        }
      } else if (exp.operator === "and" || exp.operator === "or") {
        if (
          leftType.equals(ELangType.boolean) &&
          rightType.equals(ELangType.boolean)
        ) {
          return ELangType.boolean;
        }
      } else if (exp.operator === "+") {
        if (
          leftType.equals(ELangType.number) &&
          rightType.equals(ELangType.number)
        ) {
          return ELangType.number;
        } else if (
          leftType.equals(ELangType.text) ||
          rightType.equals(ELangType.text)
        ) {
          return ELangType.text;
        }
      } else if (
        exp.operator === "-" ||
        exp.operator === "*" ||
        exp.operator === "/" ||
        exp.operator === "^"
      ) {
        if (
          leftType.equals(ELangType.number) &&
          rightType.equals(ELangType.number)
        ) {
          return ELangType.number;
        }
      }

      throw new ElangTypeError(
        `Invalid types for binary expression: '${leftType.getName()}' and '${rightType.getName()}'`
      );
    } else if (isConstantDeclaration(exp) || isMutableDeclaration(exp)) {
      if (exp.type === undefined && exp.value !== undefined) {
        // Type not passed, variable takes the type of the value
        const valueType = this.tc(exp.value, env);
        return env.setType(exp.name, valueType);
      } else if (exp.type !== undefined && exp.value !== undefined) {
        // Type passed, variable must match the type of the value
        const valueType = this.tc(exp.value, env);
        let declaredType: ELangType;

        if (isTypeReference(exp.type) && exp.type.primitive !== undefined) {
          declaredType = ELangType.fromString(exp.type.primitive);
        } else if (isModelDeclaration(exp.type.model)) {
          declaredType = env.getType(exp.type.model.name) ?? ELangType.null;
        } else {
          throw new ElangTypeError(`Invalid type reference: '${exp.type}'`);
        }

        if (valueType.equals(declaredType)) {
          return env.setType(exp.name, valueType);
        } else {
          throw new ElangTypeError(
            `Invalid types for variable declaration: '${declaredType.getName()}' and '${valueType.getName()}'`
          );
        }
      }
    } else if (isFormulaDeclaration(exp)) {
      if (exp.returnType) {
        // env.setType(exp.name, ELangType.formula);
        if (exp.parameters && exp.parameters.length > 0) {
          //   return createFormulaType(
          //     inferType(exp.returnType, env),
          //     exp.parameters.map((param) =>
          //       inferParameterDeclaration(param, env)
          //     ) as ParameterType[]
          //   );
        } else {
          //   return createFormulaType(inferType(exp.returnType, env));
        }
      } else {
        throw new ElangTypeError(
          `Formula '${exp.name}' must declare a return type. Use the keyword 'returns' to declare the return type`
        );
      }
    } else if (isIfStatement(exp)) {
    }

    throw new ElangTypeError(`Unknown expression type: '${exp.$type}'`);
  }

  /**
   * Creates the global type environment
   */
  private _createGlobalEnvironment(): TypeEnvironment {
    const env = new TypeEnvironment();
    env.enterScope();
    env.setType("number", ELangType.number);
    env.setType("text", ELangType.text);
    env.setType("boolean", ELangType.boolean);
    env.setType("null", ELangType.null);
    return env;
  }

  /**
   * Looks up the type of a variable in the current environment
   * @param exp The expression to be retrieved
   * @param env The current TypeEnvironment
   * @returns An ELangType representing the type of the expression or an error if the expression is not found
   */
  private _lookup(exp: ModelMemberCall, env: TypeEnvironment): ELangType {
    if (exp.element.ref === undefined) {
      throw new ElangTypeError(
        `Variable '${exp.element.$refText}' not defined`
      );
    }

    const name = exp.element.ref.name;
    const type = env.getType(name);

    if (type === undefined) {
      throw new ElangTypeError(`Variable '${name}' not defined`);
    }

    return type;
  }
}
