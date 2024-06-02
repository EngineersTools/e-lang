import { AstUtils, ValidationAcceptor, ValidationChecks } from "langium";
import { ElangServices } from "./elang-module.js";
import {
  BinaryExpression,
  ConstantDeclaration,
  ElangAstType,
  Expression,
  FormulaDeclaration,
  LambdaDeclaration,
  ModelDeclaration,
  ModelMemberAssignment,
  MutableDeclaration,
  ProcedureDeclaration,
  StatementBlock,
  TypeReference,
  UnaryExpression,
  isConstantDeclaration,
  isModelValue,
  isReturnStatement
} from "./generated/ast.js";
import { TypeEnvironment } from "./type-system/TypeEnvironment.class.js";
import { isAssignable } from "./type-system/assignment.js";
import { inferType } from "./type-system/infer.js";
import { isLegalOperation } from "./type-system/operator.js";
import { typeToString } from "./type-system/typeToString.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ElangServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ElangValidator;
  const checks: ValidationChecks<ElangAstType> = {
    // ModelDeclaration: validator.checkParentModelsForDuplicatedProperties,
    // PropertyDeclaration: validator.checkModelPropertiesAreNotDuplicated,
    // MutableDeclaration: [
    //   validator.checkUnitsAreOfCorrectFamily,
    //   validator.checkModelHasBeenAssignedCorrectProperties,
    // ],
    // ConstantDeclaration: [
    //   validator.checkUnitsAreOfCorrectFamily,
    //   validator.checkModelHasBeenAssignedCorrectProperties,
    // ],
    // FormulaDeclaration: [validator.checkItHasReturn, validator.checkReturnType],
    // ProcedureDeclaration: validator.checkReturnType,
    // LambdaDeclaration: validator.checkReturnType,
    // BinaryExpression: validator.checkBinaryOperationAllowed,
    // UnaryExpression: validator.checkUnaryOperationAllowed,
    // ModelMemberAssignment: validator.checkAssignmentOperationAllowed,
  };
  registry.register(checks, validator);
}

/**
 * Helper functions
 */

// function getInheritedModelProperties(
//   model: ModelDeclaration
// ): PropertyDeclaration[] {
//   const props = new Array<PropertyDeclaration>();

//   model.parentTypes.forEach((p) => {
//     if (p.ref) {
//       const parentProps = p.ref.properties;
//       props.push(...parentProps);
//       props.push(...getInheritedModelProperties(p.ref));
//     }
//   });

//   props.push(...model.properties);

//   return props;
// }

/**
 * Implementation of custom validations.
 */
export class ElangValidator {
  private getTypeCache(): TypeEnvironment {
    return new TypeEnvironment();
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

  checkModelHasBeenAssignedCorrectProperties(
    node: MutableDeclaration | ConstantDeclaration,
    accept: ValidationAcceptor
  ) {
    // if (
    //   node.assignment &&
    //   node.type &&
    //   node.type.model &&
    //   isModelValue(node.value) &&
    //   isModelDeclaration(node.type?.model?.ref)
    // ) {
    //   const props = getInheritedModelProperties(node.type.model.ref);
    //   for (const member of node.value.members) {
    //     if (isBinaryExpression(member)) {
    //       const memberName = member;
    //       if (memberName && !props.map((p) => p.name).includes(memberName)) {
    //         accept(
    //           "error",
    //           `PropertyDeclaration '${memberName}' does not exist in model '${node.type.model.ref.name}'`,
    //           {
    //             node: member,
    //             property: "left",
    //           }
    //         );
    //       }
    //     }
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
    memberAssignment: ModelMemberAssignment,
    accept: ValidationAcceptor
  ) {
    const modelValue = memberAssignment.$container;
    if (
      isModelValue(modelValue) &&
      isConstantDeclaration(modelValue.$container)
    ) {
      const map = this.getTypeCache();
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
