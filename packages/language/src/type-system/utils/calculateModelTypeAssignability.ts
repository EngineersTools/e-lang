import { CustomType, Type } from "typir";
import { ModelType, isModelType } from "../custom-types/model/Model.type.js";
import { ELangSpecifics } from "../ELangSpecifics.interface.js";
import { ELangTypirServices } from "../ELangAdditionalTypirServices.type.js";

export function calculateModelTypeAssignability(
  source: CustomType<ModelType, ELangSpecifics>,
  target: Type,
  typir: ELangTypirServices
): boolean {
  // console.log("Compare", source.properties.name, target.kind); 
  // Commented out to avoid spam, but I need it now.
  
  if (
    !("properties" in target) ||
    !isModelType(target.properties)
  ) {
    return false;
  }
  
  console.log("Checking assignability:", source.properties.name, "->", (target.properties as ModelType).name);


  const targetProps = target.properties.properties;
  const sourceProps = new Map(source.properties.properties.map(p => [p.name, p]));

  for (const targetProp of targetProps) {
    const sourceProp = sourceProps.get(targetProp.name);

    if (!sourceProp) {
        if (!targetProp.isOptional) {
            console.log("Missing required property:", targetProp.name);
            return false;
        }
        continue;
    }

    // Check if source property type is assignable to target property type
    // We strive for implicit assignability here.
    const sourcePropType = sourceProp.type;
    const targetPropType = targetProp.type;

    const assignability = typir.Assignability.isAssignable(sourcePropType as unknown as Type, targetPropType as unknown as Type);
    if (!assignability) {
        return false;
    }
  }

  console.log("Returning true for " + source.properties.name + " -> " + (target as any).name);
  return true;
}
