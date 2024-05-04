import { LangiumDocument } from "langium";

/**
 * Represents the result of building a LangiumDocument
 * It has two properties:
 *  - document: the built LangiumDocument
 *  - dispose: a function that should be called when the
 *             the program has finished running
 */
export interface BuildResult {
  document: LangiumDocument;
  dispose: () => Promise<void>;
}
