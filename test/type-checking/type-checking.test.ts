import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ELangProgram,
  StatementBlock,
} from "../../src/language/generated/ast.js";
import {
  ErrorType,
  isBooleanType,
  isErrorType,
  isNullType,
  isNumberType,
  isTextType,
} from "../../src/language/type-system/descriptions.js";
import { inferType } from "../../src/language/type-system/infer.js";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;
let typeEnv: TypeEnvironment;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);
  typeEnv = new TypeEnvironment();
});

describe("Type Check Primitives", () => {
  test("Check number", async () => {
    document = await parse("42");

    expect(
      isNumberType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check text", async () => {
    document = await parse("'Hello World'");

    expect(
      isTextType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check boolean", async () => {
    document = await parse("true");

    expect(
      isBooleanType(
        inferType(document.parseResult.value.statements[0], typeEnv)
      )
    ).toBe(true);
  });

  test("Check null", async () => {
    document = await parse("null");

    expect(
      isNullType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });
});

describe("Type Check Variables", () => {
  test("Check inferred constant assignment", async () => {
    document = await parse(`
        const x = 42
    `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check inferred constant type", async () => {
    document = await parse(`
        const x = 42
        x
    `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[1], typeEnv))
    ).toBe(true);
  });

  test("Check inferred mutable assignment", async () => {
    document = await parse(`
            var x = 42
        `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check inferred mutable type", async () => {
    document = await parse(`
                var x = 42
                x
            `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[1], typeEnv))
    ).toBe(true);
  });

  test("Check inferred mutable reassignment", async () => {
    document = await parse(`
                var x = 42
                x = 42
            `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[1], typeEnv))
    ).toBe(true);
  });

  test("Check inferred mutable reassignment with type mismatch", async () => {
    document = await parse(`
                    var x = 42
                    x = true
                `);

    expect(
      isErrorType(inferType(document!.parseResult.value.statements[1], typeEnv))
    ).toBe(true);

    expect(
      (
        inferType(
          document!.parseResult.value.statements[1],
          typeEnv
        ) as ErrorType
      ).message
    ).toBe(
      "Variable of type 'number' cannot be assigned a value of type 'boolean'"
    );
  });

  test("Check declared constant assignment", async () => {
    document = await parse(`
        const x: number = 42
    `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check declared constant type", async () => {
    document = await parse(`
        const x: number = 42
        x
    `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[1], typeEnv))
    ).toBe(true);
  });

  test("Check declared mutable assignment", async () => {
    document = await parse(`
                var x: number = 42
            `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check declared mutable type", async () => {
    document = await parse(`
                    var x: number = 42
                    x
                `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[1], typeEnv))
    ).toBe(true);
  });

  test("Check declared constant assignment with type mismatch", async () => {
    document = await parse(`
            const x: text = true
        `);

    expect(
      isErrorType(inferType(document!.parseResult.value.statements[0], typeEnv))
    ).toBe(true);

    expect(
      (
        inferType(
          document!.parseResult.value.statements[0],
          typeEnv
        ) as ErrorType
      ).message
    ).toBe(
      "Constant of type 'text' cannot be assigned a value of type 'boolean'"
    );
  });

  test("Check declared mutable assignment with type mismatch", async () => {
    document = await parse(`
                    var x: text = true
                `);

    expect(
      (
        inferType(
          document!.parseResult.value.statements[0],
          typeEnv
        ) as ErrorType
      ).message
    ).toBe(
      "Variable of type 'text' cannot be assigned a value of type 'boolean'"
    );
  });

  test("Check accessing non-existent variable", async () => {
    document = await parse(`
        x
    `);

    expect(
      (
        inferType(
          document!.parseResult.value.statements[0],
          typeEnv
        ) as ErrorType
      ).message
    ).toBe("Could not infer type for undefined variable");
  });
});

describe("Type Check Statement Blocks", () => {
  test("Check statement block", async () => {
    document = await parse(`
        {
            const x = 42
            x
        }
    `);

    expect(
      isNumberType(
        inferType(
          (document.parseResult.value.statements[0] as StatementBlock)
            .statements[1],
          typeEnv
        )
      )
    ).toBe(true);
  });

  test("Check statement block with external scope", async () => {
    document = await parse(`
        const x = 42

        {
            x + 42
        }
    `);

    expect(
      isNumberType(
        inferType(
          (document.parseResult.value.statements[1] as StatementBlock)
            .statements[0],
          typeEnv
        )
      )
    ).toBe(true);
  });

  test("Check statement block with type mismatch", async () => {
    document = await parse(`
        {
            const x = 42
            x = 10
        }
    `);

    const inferredType = inferType(
      (document!.parseResult.value.statements[0] as StatementBlock)
        .statements[1],
      typeEnv
    );

    console.log((inferredType as ErrorType).message);

    expect(isErrorType(inferredType)).toBe(true);
  });

  test.todo("Check statement block with non-existent variable", async () => {
    document = await parse(`
        {
            x
        }
    `);

    expect(() =>
      typeChecker.tc(
        (document!.parseResult.value.statements[0] as StatementBlock)
          .statements[0]
      )
    ).toThrowError(new ElangTypeError("Variable 'x' not defined"));
  });

  test.todo(
    "Check statement block with external scope and non-existent variable",
    async () => {
      document = await parse(`
        const y = 42

        {
            x
        }
    `);

      expect(() =>
        typeChecker.tc(
          (document!.parseResult.value.statements[1] as StatementBlock)
            .statements[0]
        )
      ).toThrowError(new ElangTypeError("Variable 'x' not defined"));
    }
  );
});

describe.todo("Type Check If Statements", () => {
  test("Check if statement with invalid condition type", async () => {
    document = await parse(`
        if ("Hello" + "World") {
            return 42
        }
    `);

    expect(() =>
      typeChecker.tc(document!.parseResult.value.statements[0])
    ).toThrowError(
      new ElangTypeError(
        "Invalid type for if statement condition: 'text'. Condition must be of type 'boolean'"
      )
    );

    document = await parse(`
        if (10 + 32) {
            return 42
        }
    `);

    expect(() =>
      typeChecker.tc(document!.parseResult.value.statements[0])
    ).toThrowError(
      new ElangTypeError(
        "Invalid type for if statement condition: 'number'. Condition must be of type 'boolean'"
      )
    );

    document = await parse(`
        if (null) {
            return 42
        }
    `);

    expect(() =>
      typeChecker.tc(document!.parseResult.value.statements[0])
    ).toThrowError(
      new ElangTypeError(
        "Invalid type for if statement condition: 'null'. Condition must be of type 'boolean'"
      )
    );
  });

  test("Check true path", async () => {
    document = await parse(`
        if (true) {
            const x = 42
            x
        }
    `);

    expect(typeChecker.tc(document.parseResult.value.statements[0])).toBe(
      ELangType.number
    );
  });

  test("Check false path", async () => {
    document = await parse(`
        if (false) {
            const x = 42
            x
        } else {
            const y = "Hello World"
            return y
        }
    `);

    expect(typeChecker.tc(document.parseResult.value.statements[0])).toBe(
      ELangType.text
    );
  });
});

describe.todo("Type Check Lambdas", () => {
  test("Check lambda", async () => {
    document = await parse(`
            (x: number) => x
        `);

    expect(typeChecker.tc(document.parseResult.value.statements[0])).toBe(
      ELangType.lambda
    );
  });

  test("Check lambda application", async () => {
    document = await parse(`
            ((x: number) => x)(42)
        `);

    expect(typeChecker.tc(document.parseResult.value.statements[0])).toBe(
      ELangType.number
    );
  });

  test("Check lambda application with type mismatch", async () => {
    document = await parse(`
            ((x: number) => x)(true)
        `);

    expect(() =>
      typeChecker.tc(document!.parseResult.value.statements[0])
    ).toThrowError(
      new ElangTypeError("Invalid types for assignment: 'number' and 'boolean'")
    );
  });

  test("Check lambda application with non-existent variable", async () => {
    document = await parse(`
            ((x: number) => x)(y)
        `);

    expect(() =>
      typeChecker.tc(document!.parseResult.value.statements[0])
    ).toThrowError(new ElangTypeError("Variable 'y' not defined"));
  });
});

describe.todo("Type Check Formulas", () => {
  test("Check formula", async () => {
    document = await parse(`
        formula add(x: number, y: number) returns number {
            return x + y
        }
    `);

    expect(typeChecker.tc(document.parseResult.value.statements[0])).toBe(
      ELangType.number
    );
  });

  test("Check formula without a return type", async () => {
    document = await parse(`
        formula add(x: number, y: number) {
            return x + y
        }
    `);

    expect(() =>
      typeChecker.tc(document!.parseResult.value.statements[0])
    ).toThrowError(
      new ElangTypeError(
        "Formula 'add' must declare a return type. Use the keyword 'returns' to declare the return type"
      )
    );
  });
});
