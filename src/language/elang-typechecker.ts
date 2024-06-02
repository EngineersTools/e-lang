import { ValidationAcceptor, ValidationChecks } from "langium";
import { ElangServices } from "./elang-module.js";
import {
  ConstantDeclaration,
  ElangAstType,
  ElangProgram,
  MutableDeclaration,
  PropertyDeclaration,
  Statement,
  isConstantDeclaration,
  isModelDeclaration,
  isMutableDeclaration,
} from "./generated/ast.js";
import { TypeEnvironment } from "./type-system/TypeEnvironment.class.js";
import {
  addStatement,
  registerModelDeclaration,
} from "./type-system/TypeEnvironment.functions.js";
import { getModelDeclarationParentsChain } from "./type-system/getModelDeclarationChain.js";
import { isAssignable } from "./type-system/assignment.js";
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

    console.dir(env, { depth: 6 });

    env.leaveScope();
  }

  typecheckStatement(
    env: TypeEnvironment,
    stmt: Statement,
    accept: ValidationAcceptor
  ): void {
    if (isModelDeclaration(stmt)) {
      registerModelDeclaration(stmt, env);
    } else if (isConstantDeclaration(stmt) || isMutableDeclaration(stmt)) {
      this.typecheckVariableDeclarationStatement(env, stmt, accept);
    }

    // if (isExpression(stmt)) {
    //   this.typecheckExpression(env, stmt, accept);
    // } else
    // if (isForStatement(stmt)) {
    // } else
    //if (isFormulaDeclaration(stmt)) {
    // } else if (isIfStatement(stmt)) {
    // } else if (isLambdaDeclaration(stmt)) {
    // } else if (isMatchStatement(stmt)) {
    // } else  else if (isPrintStatement(stmt)) {
    // } else if (isProcedureDeclaration(stmt)) {
    // } else if (isReturnStatement(stmt)) {
    // } else if (isStatementBlock(stmt)) {
    //   env.enterScope();
    //   stmt.statements.forEach((s) => this.typecheckStatement(env, s, accept));
    //   env.leaveScope();
    // } else if (isUnitFamilyDeclaration(stmt)) {
    // } else
  }

  // typecheckExpression(
  //   env: TypeEnvironment,
  //   exp: Expression,
  //   accept: ValidationAcceptor
  // ): void {
  //   const exprType = inferType(exp, env);
  //   accept("info", exprType.$type, { node: exp });
  // }

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
      } else if (!isAssignable(assignedType, exprType)) {
        accept("error", "Type mismatch", { node: stmt, property: "value" });
      }

      // env.setVariableType(stmt.name, assignedType);
      // if (isErrorType(assignedType)) {
      //   accept("error", assignedType.message, {
      //     node: stmt,
      //     property: "type",
      //   });
      // }
      // if (isErrorType(exprType)) {
      //   accept("error", exprType.message, {
      //     node: stmt,
      //     property: "value",
      //   });
      // }
      // if (isModelType(assignedType) || isModelType(exprType)) {
      //   this.checkModelAssignment(assignedType, exprType, env, accept);
      // }
      // if (assignedType.$type !== exprType.$type) {
      //   accept(
      //     "error",
      //     `Type mismatch. Value of type '${exprType.$type}' cannot be assigned to a variable of type '${assignedType.$type}'.`,
      //     { node: stmt, property: "value" }
      //   );
      // }
    }

    // else if (stmt.assignment && stmt.value) {
    //   const exprType = inferType(stmt.value, env);
    //   env.setVariableType(stmt.name, exprType);
    // } else if (stmt.type) {
    //   const assignedType = inferType(stmt.type, env);
    //   env.setVariableType(stmt.name, assignedType);
    // } else if (!stmt.assignment && !stmt.type && !stmt.value) {
    //   accept("error", "No type assigned to this variable", {
    //     node: stmt,
    //     property: "name",
    //   });
    // }
  }

  // checkModelAssignment(
  //   declaredModel: TypeDescription,
  //   modelValue: TypeDescription,
  //   env: TypeEnvironment,
  //   accept: ValidationAcceptor
  // ) {
  //   if (isDeclaredModelType(declaredModel) && isImpliedModelType(modelValue)) {
  //     const fromChain = getModelDeclarationChain(declaredModel.declaration);
  //     const propTypes = fromChain.flatMap((m) => m.properties);

  //     env.enterScope();

  //     const memberNames = modelValue.value.members.map((m) => m.property);

  //     propTypes.forEach((p) => env.setVariableType(p.name, inferType(p, env)));

  //     // Check that all mandatory properties have been assigned
  //     propTypes
  //       .filter((p) => !p.isOptional)
  //       .forEach((p) => {
  //         if (!memberNames.includes(p.name)) {
  //           accept(
  //             "error",
  //             `Property '${p.name}', defined in model '${declaredModel.declaration.name}', is missing from the model value.`,
  //             { node: modelValue.value }
  //           );
  //         }
  //       });

  //     // Check that all assigned properties are of a valid type
  //     modelValue.value.members.forEach((m) => {
  //       const memberType = inferType(m, env);
  //       const propType = env.getVariableType(m.property);

  //       if (propType && memberType.$type !== propType.$type) {
  //         accept(
  //           "error",
  //           `Property '${m.property}' cannot be assigned a value of type '${memberType.$type}'. Model '${declaredModel.declaration.name}' expects a value of type '${propType.$type}' for this property.`,
  //           { node: m, property: "value" }
  //         );
  //       }
  //     });

  //     env.leaveScope();
  //   }
  // }
}
