import { AstNode } from "langium";
import {
  ConstantDeclaration,
  Expression,
  FormulaDeclaration,
  IfStatement,
  LambdaDeclaration,
  LambdaType,
  ListValue,
  MatchStatement,
  ModelDeclaration,
  ModelMemberAssignment,
  ModelValue,
  MutableDeclaration,
  NamedElement,
  PrintStatement,
  ProcedureDeclaration,
  ReturnStatement,
  Statement,
  StatementBlock,
  UnitFamilyDeclaration,
  isConstantDeclaration,
  isElangProgram,
  isExpression,
  isForStatement,
  isFormulaDeclaration,
  isIfStatement,
  isLambdaDeclaration,
  isLambdaType,
  isListValue,
  isMatchStatement,
  isModelDeclaration,
  isModelMemberAssignment,
  isModelValue,
  isMutableDeclaration,
  isPrintStatement,
  isProcedureDeclaration,
  isReturnStatement,
  isStatementBlock,
  isUnitDeclaration,
  isUnitFamilyDeclaration,
} from "../generated/ast.js";
import { TypeEnvironment } from "./TypeEnvironment.class.js";
import { ListType, TypeDescription, createUnionType } from "./descriptions.js";
import { inferModelDeclaration, inferType } from "./infer.js";

export function buildTypeEnvironment(
  ast: AstNode,
  env: TypeEnvironment = new TypeEnvironment()
): TypeEnvironment {
  if (isElangProgram(ast)) {
    for (const stmt of ast.statements) {
      addStatement(stmt, env);
    }
  } else {
    throw new Error("Unknown AST node type");
  }

  return env;
}

export function closeTypeEnvironment(env: TypeEnvironment): void {
  for (let i = 0; i < env.numberOfScopes(); i++) {
    env.leaveScope();
  }
}

export function addStatement(stmt: Statement, env: TypeEnvironment): void {
  if (isExpression(stmt)) {
    addExpression(stmt, env);
  } else if (isForStatement(stmt)) {
    addStatement(stmt.block, env);
  } else if (isFormulaDeclaration(stmt)) {
    addFormulaDeclaration(stmt, env);
  } else if (isIfStatement(stmt)) {
    addIfStatement(stmt, env);
  } else if (isLambdaDeclaration(stmt)) {
    addLambdaDeclaration(stmt, env);
  } else if (isLambdaType(stmt)) {
    addLambdaType(stmt, env);
  } else if (isMatchStatement(stmt)) {
    addMatchStatement(stmt, env);
  } else if (isModelDeclaration(stmt)) {
    registerModelDeclaration(stmt, env);
  } else if (isPrintStatement(stmt)) {
    addPrintStatement(stmt, env);
  } else if (isProcedureDeclaration(stmt)) {
    addProcedureDeclaration(stmt, env);
  } else if (isReturnStatement(stmt)) {
    addReturnStatemen(stmt, env);
  } else if (isStatementBlock(stmt)) {
    addStatementBlock(stmt, env);
  } else if (isUnitFamilyDeclaration(stmt)) {
    addUnitFamilyDeclaration(stmt, env);
  } else if (isConstantDeclaration(stmt)) {
    addConstantDeclaration(stmt, env);
  } else if (isMutableDeclaration(stmt)) {
    addMutableDeclaration(stmt, env);
  }
}

export function addExpression(expr: Expression, env: TypeEnvironment): void {
  if (isModelValue(expr)) {
    addModelValue(expr, env);
  } else if (isListValue(expr)) {
    addListValue(expr, env);
  } else if (isModelMemberAssignment(expr)) {
    addModelMemberAssignment(expr, env);
  }
}

export function addConstantDeclaration(
  constant: ConstantDeclaration,
  env: TypeEnvironment
): void {
  env.setVariableType(constant.name, inferType(constant, env));
}

export function addMutableDeclaration(
  mutable: MutableDeclaration,
  env: TypeEnvironment
): void {
  env.setVariableType(mutable.name, inferType(mutable, env));
}

export function addStatementBlock(
  block: StatementBlock,
  env: TypeEnvironment
): void {
  block.statements.forEach((s) => addStatement(s, env));
}

export function registerModelDeclaration(
  mdl: ModelDeclaration,
  env: TypeEnvironment
): void {
  env.registerType(mdl.name, inferModelDeclaration(mdl, env));
}

export function addModelValue(mdl: ModelValue, env: TypeEnvironment): void {
  const modelName = `Model_${env.getTypeRegistryVarIndex()}`;
  env.increaseTypeRegistryVarIndex();
  env.registerType(modelName, inferType(mdl, env));
}

export function addModelMemberAssignment(
  mbmr: ModelMemberAssignment,
  env: TypeEnvironment
): void {
  env.setVariableType(mbmr.property, inferType(mbmr.value, env));
}

export function addListType(item: NamedElement, env: TypeEnvironment): void {
  const itemType = inferType(item, env);
  const listName = `List_${itemType.$type}`;
  const listType = inferType(item, env);
  env.registerType(listName, listType);
}

export function addListValue(lst: ListValue, env: TypeEnvironment): void {
  const lstType = inferType(lst, env) as ListType;
  const listName = `List_${lstType.itemType.$type}`;
  env.registerType(listName, lstType);
}

export function addFormulaDeclaration(
  fmr: FormulaDeclaration,
  env: TypeEnvironment
): void {
  env.setVariableType(fmr.name, inferType(fmr, env));

  if (fmr.parameters) {
    fmr.parameters.forEach((p) => {
      env.setVariableType(p.name, inferType(p.type, env));
    });
  }

  addStatement(fmr.body, env);
}

export function getReturnType(prc: StatementBlock, env: TypeEnvironment) {
  const returnTypes: TypeDescription[] = [];

  prc.statements.forEach((stmt) => {
    if (isReturnStatement(stmt)) {
      returnTypes.push(inferType(stmt.value, env));
    } else if (isFormulaDeclaration(stmt) || isProcedureDeclaration(stmt)) {
      returnTypes.push(getReturnType(stmt.body, env));
    } else if (isLambdaDeclaration(stmt)) {
      if (isStatementBlock(stmt.body)) {
        returnTypes.push(getReturnType(stmt.body, env));
      } else {
        returnTypes.push(inferType(stmt.body, env));
      }
    } else if (isIfStatement(stmt)) {
      returnTypes.push(getReturnType(stmt.block, env));
      if (stmt.elseBlock) returnTypes.push(getReturnType(stmt.elseBlock, env));
    }
  });

  if (returnTypes.length === 1) return returnTypes[0];
  else return createUnionType(...returnTypes);
}

export function addProcedureDeclaration(
  prc: ProcedureDeclaration,
  env: TypeEnvironment
): void {
  if (prc.returnType) env.setVariableType(prc.name, inferType(prc, env));

  if (prc.parameters) {
    prc.parameters.forEach((p) => {
      env.setVariableType(p.name, inferType(p.type, env));
    });
  }

  addStatement(prc.body, env);
}

export function addLambdaDeclaration(
  lmb: LambdaDeclaration,
  env: TypeEnvironment
): void {
  if (lmb.returnType) {
    const lambdaName = `Lambda_${env.getTypeRegistryVarIndex()}`;
    env.increaseTypeRegistryVarIndex();
    env.setVariableType(lambdaName, inferType(lmb, env));
  }

  if (lmb.parameters) {
    lmb.parameters.forEach((p) => {
      env.setVariableType(p.name, inferType(p.type, env));
    });
  }

  addStatement(lmb.body, env);
}

export function addLambdaType(lmb: LambdaType, env: TypeEnvironment): void {
  if (lmb.returnType) {
    const lambdaName = `Lambda_${env.getTypeRegistryVarIndex()}`;
    env.increaseTypeRegistryVarIndex();
    env.setVariableType(lambdaName, inferType(lmb, env));
  }

  if (lmb.parameters) {
    lmb.parameters.forEach((p) => {
      env.setVariableType(p.name, inferType(p.type, env));
    });
  }
}

export function addIfStatement(stmt: IfStatement, env: TypeEnvironment): void {
  addStatement(stmt.block, env);
  if (stmt.elseBlock) addStatement(stmt.elseBlock, env);
}

export function addMatchStatement(
  stmt: MatchStatement,
  env: TypeEnvironment
): void {
  stmt.options.forEach((opt) => {
    if (opt.block) addStatement(opt.block, env);
    else if (opt.value) addStatement(opt.value, env);
  });
}

export function addPrintStatement(
  stmt: PrintStatement,
  env: TypeEnvironment
): void {
  addExpression(stmt.value, env);
}

export function addReturnStatemen(
  stmt: ReturnStatement,
  env: TypeEnvironment
): void {
  addExpression(stmt.value, env);
}

export function addUnitFamilyDeclaration(
  unitFamily: UnitFamilyDeclaration,
  env: TypeEnvironment
): void {
  env.registerType(`number_[${unitFamily.name}]`, inferType(unitFamily, env));

  if (unitFamily.units && unitFamily.units.length > 0) {
    unitFamily.units.forEach((unit) => {
      env.registerType(unit.name, inferType(unit, env));
    });

    if (unitFamily.conversions && unitFamily.conversions.length > 0) {
      unitFamily.conversions.forEach((conv) => {
        if (conv.lambda) addLambdaDeclaration(conv.lambda, env);
        else if (conv.formula && conv.formula.ref) {
          const formulaType = env.getVariableType(conv.formula.ref.name);
          if (
            formulaType &&
            isUnitDeclaration(conv.from) &&
            isUnitDeclaration(conv.to)
          )
            env.setVariableType(
              `${conv.from.ref?.name}->${conv.to.ref?.name}`,
              formulaType
            );
        }
      });
    }
  }
}
