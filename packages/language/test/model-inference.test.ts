import { describe, test } from "vitest";
import { validateElang } from "./utils.js";

describe("Model Inference and Structural Typing", () => {
  test("Assign ModelExpression to ModelDeclaration variable (Structural Typing)", async () => {
    await validateElang(
      `
      model Person { name: text, age: number }
      var p: Person = { name: "Alice", age: 30 }
      `,
      0
    );
  });

  test('Assign ModelExpression to ModelDeclaration variable (Structural Typing) with parent', async () => {
    await validateElang(
      `
      model Person { name: text, age: number }
      model Employee { name: text, age: number, salary: number }
      var p: Person = { name: "Alice", age: 30 }
      var e: Employee = { name: "Bob", age: 40, salary: 5000 }
      `,
      0
    );
  });

  test("ModelExpression structural equality (Same structure)", async () => {
    await validateElang(
      `
      var x = { a: 1, b: "text" }
      var y = { a: 2, b: "other" }
      if (x == y) { }
      `,
      0
    );
  });

  test("ModelExpression structural equality with ModelDeclaration", async () => {
    await validateElang(
      `
      model Point { x: number, y: number }
      var p: Point = { x: 1, y: 2 }
      var q = { x: 3, y: 4 }
      if (p == q) { }
      `,
      0
    );
  });

  test("Incorrect structure assignment (Missing property)", async () => {
    await validateElang(
      `
      model Person { name: text, age: number }
      var p: Person = { name: "Alice" }
      `,
      1 // Expect error: missing 'age'
    );
  });

  test("Incorrect structure assignment (Wrong type)", async () => {
    await validateElang(
      `
      model Person { name: text, age: number }
      var p: Person = { name: "Alice", age: "Thirty" }
      `,
      1 // Expect error: 'age' type mismatch
    );
  });
  
  test("Anonymous Model Expression Type Inference", async () => {
      // Logic: inferred type of 'const p' should be compatible with explicit type of 'var q'
      await validateElang(
          `
          const p = { x: 10, y: 20 }
          model Point { x: number, y: number }
          var q: Point = p
          `,
          0
      );
  });
});
