import { DefaultScopeProvider, EMPTY_SCOPE, LangiumDocuments, ReferenceInfo, Scope } from "langium";
import { isCustomType } from "typir";
import { TypirLangiumServices } from "typir-langium";
import { ELangServices } from "./ELangServices.type.js";
import { isMemberAccess, ModelDeclaration } from "./generated/ast.js";
import { isModelType } from "./type-system/custom-types/model/Model.type.js";
import { ELangSpecifics } from "./type-system/ELangSpecifics.interface.js";
import { getModelDeclarationChain } from "./utils/getModelChain.js";

export class ELangScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;
  protected readonly typir: TypirLangiumServices<ELangSpecifics>;

  constructor(services: ELangServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.typir = services.typir;
  }

  override getScope(context: ReferenceInfo): Scope {
    if (
      isMemberAccess(context.container) &&
      context.property === "member"
    ) {
      const memberAccess = context.container;
      const receiver = memberAccess.receiver;
      if (!receiver) {
        return super.getScope(context);
      }
      const previousType = this.typir.Inference.inferType(receiver);
      if (
        isCustomType(previousType, "Model") &&
        isModelType(previousType.properties) &&
        previousType.associatedLanguageNode
      ) {
        return this.scopeModelMembers(
          previousType.associatedLanguageNode as ModelDeclaration
        );
      }
      return EMPTY_SCOPE;
    }
    return super.getScope(context);
  }

  private scopeModelMembers(model: ModelDeclaration): Scope {
    const allMembers = getModelDeclarationChain(model).flatMap(
      (e) => e.properties
    );
    return this.createScopeForNodes(allMembers);
  }
}

// function getModelDeclarationChain(model: ModelDeclaration): ModelDeclaration[] {
//   return collectAllModels(model);
// }

// function collectAllModels(
//   model: ModelDeclaration,
//   visited: Set<ModelDeclaration> = new Set()
// ): ModelDeclaration[] {
//   if (visited.has(model)) {
//     return [];
//   }
//   visited.add(model);
//   let result = [model];
//   for (const parent of model.parentTypes) {
//     if (parent.ref) {
//       result = result.concat(collectAllModels(parent.ref, visited));
//     }
//   }
//   return result;
// }

