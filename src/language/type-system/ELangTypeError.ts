export class ElangTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ElanTypeError";
  }
}
