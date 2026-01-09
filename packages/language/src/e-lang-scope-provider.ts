import { DefaultScopeProvider, LangiumDocuments } from "langium";
import { TypirLangiumServices } from "typir-langium";
import { ELangServices } from "./ELangServices.type.js";
import { ELangSpecifics } from "./type-system/ELangSpecifics.interface.js";

export class ELangScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;
  protected readonly typir: TypirLangiumServices<ELangSpecifics>;

  constructor(services: ELangServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.typir = services.typir;
  }

  // override getScope(context: ReferenceInfo): Scope {
  //   // target element of member calls
  //   if (isCallExpression(context.container) && context.property === CallExpression.callee) {
  //     // for now, `this` and `super` simply target the container class type
  //     if (context.reference.$refText === 'this' || context.reference.$refText === 'super') {
  //       const classItem = AstUtils.getContainerOfType(context.container, isModelDeclaration);
  //       if (classItem) {
  //         return this.scopeClassMembers(classItem);
  //       } else {
  //         return EMPTY_SCOPE;
  //       }
  //     }
  //     const memberCall = context.container as CallExpression;
  //     const previous = memberCall.callee;
  //     if (!previous) {
  //       return super.getScope(context);
  //     }
  //     // use Typir to identify the ClassType of the current expression (including variables, fields of nested classes, ...)
  //     const previousType = this.typir.Inference.inferType(previous);
  //     if (isClassType(previousType)) {
  //       return this.scopeClassMembers(previousType.associatedLanguageNode as Class); // the Class was associated with this ClassType during its creation
  //     }
  //     return EMPTY_SCOPE;
  //   }
  //   return super.getScope(context);
  // }

  // private scopeClassMembers(classItem: Class): Scope {
  //   const allMembers = getClassChain(classItem).flatMap(e => e.members);
  //   return this.createScopeForNodes(allMembers);
  // }
}
