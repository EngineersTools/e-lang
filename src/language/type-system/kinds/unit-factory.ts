import { CustomKind } from "typir";
import { UnitDeclaration } from "../../generated/ast.js";
import { ELangTypirServices } from "../e-lang-type-services.js";
import { UnitType } from "./unit-type.js";

export function createUnitFactory(
  services: ELangTypirServices<UnitDeclaration>
) {
  return new CustomKind<UnitType, UnitDeclaration>(services, {
    name: "Unit",
    calculateTypeName: (unit) => `Unit_${unit.name}:${unit.longName}`,
  });
}
