import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ELangProgram,
  StatementBlock,
} from "../../src/language/generated/ast.js";
import {
  createNumberType,
  createTextType,
  createUnionType,
  equalsType,
  ErrorType,
  getTypeName,
  isBooleanType,
  isErrorType,
  isFormulaType,
  isLambdaType,
  isMeasurementType,
  isModelType,
  isNullType,
  isNumberType,
  isTextType,
  isUnionType,
  ModelType,
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
    ).toBe("Cannot infer type for non-existent variable: 'x'");
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

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Constant value cannot be reassigned"
    );
  });

  test("Check statement block with non-existent variable", async () => {
    document = await parse(`
        {
            x
        }
    `);

    typeEnv.resetScope();

    const inferredType = inferType(
      (document!.parseResult.value.statements[0] as StatementBlock)
        .statements[0],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Cannot infer type for non-existent variable: 'x'"
    );
  });

  test("Check statement block with external scope and non-existent variable", async () => {
    document = await parse(`
        const y = 42

        {
            x
        }
    `);

    typeEnv.resetScope();

    const inferredType = inferType(
      (document!.parseResult.value.statements[1] as StatementBlock)
        .statements[0],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Cannot infer type for non-existent variable: 'x'"
    );
  });
});

describe("Type Check If Statements", () => {
  test("Check if statement with invalid condition type", async () => {
    document = await parse(`
        if ("Hello" + "World") {
            return 42
        }
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
    ).toBe("If condition must be of type 'boolean' but got type 'text'");

    document = await parse(`
        if (10 + 32) {
            return 42
        }
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
    ).toBe("If condition must be of type 'boolean' but got type 'number'");

    document = await parse(`
        if (null) {
            return 42
        }
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
    ).toBe("If condition must be of type 'boolean' but got type 'null'");
  });

  test("Check true path", async () => {
    document = await parse(`
        if (true) {
            const x = 42
            return x
        }
    `);

    expect(
      isNumberType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check false path", async () => {
    document = await parse(`
        if (false) {
            const x = 42
            return x + "Hello"
        } else {
            const y = "Hello World"
            return y
        }
    `);

    expect(
      isTextType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);
  });

  test("Check both paths returning different types", async () => {
    document = await parse(`
      if (false) {
          const x = 42
          return x
      } else {
          const y = "Hello World"
          return y
      }
  `);

    const unionType = createUnionType(createTextType(), createNumberType());

    expect(
      isUnionType(inferType(document.parseResult.value.statements[0], typeEnv))
    ).toBe(true);

    expect(
      equalsType(
        inferType(document.parseResult.value.statements[0], typeEnv),
        unionType
      )
    ).toBe(true);
  });
});

describe("Type Check Lambdas", () => {
  test("Check lambda with no parameters and text return", async () => {
    document = await parse(`
            () => "Hello World"
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("() => text");
  });

  test("Check lambda with untyped parameter and text return", async () => {
    document = await parse(`
            (x) => "Hello World"
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(error) => text");
  });

  test("Check lambda with mandatory one parameter and expression return", async () => {
    document = await parse(`
            (x: number) => x
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(number) => number");
  });

  test("Check lambda with optional parameters and return expression", async () => {
    document = await parse(`
            (x: number, y?: text) => x
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(number,text?) => number");
  });

  test("Check lambda with union return expression", async () => {
    document = await parse(`
            (x: boolean) => {
              if(x) {
                return "True"
              } else {
                return 0 
              }
            }
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(boolean) => text or number");
  });

  test("Check lambda with union return expression", async () => {
    document = await parse(`
            (x: boolean) => {
              if(x) {
                return "True"
              } else {
                return 0 
              }
            }
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(boolean) => text or number");
  });

  test("Check lambda assigned to constant", async () => {
    document = await parse(`
            unit_family Length {
              unit m:meter
              unit ft:foot
            }

            const unitResult: (x: number_[Length]  => number_[Length] = (x: number_[Length]) => x->ft
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[1],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe(
      "(number_[Length]) => number_[Length]"
    );
  });

  test("Check lambda assigned to constant and evaluated", async () => {
    document = await parse(`
        unit_family Length {
          unit m:meter
          unit ft:foot
        }

        const unitResult = (x: number_[Length]) => x->ft

        const result = unitResult(42)
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[2],
      typeEnv
    );

    expect(isMeasurementType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("number_[Length]");
  });

  test("Check lambda with model parameter type and return model member", async () => {
    document = await parse(`
        model thing {
          a: text
        }

        (x: thing) => x.a
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[1],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(thing) => text");
  });

  test("Check lambda with model parameter type and return model parent member", async () => {
    document = await parse(`
            model parent {
              b: number
            }

            model thing extends parent {
              a: text
            }

            (x: thing) => x.b
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[2],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(thing) => number");
  });

  test("Check lambda with model parameter type and return model sub-model", async () => {
    document = await parse(`
            model parent {
              b: number
            }

            model subModel {
              c: boolean
            }

            model thing extends parent {
              a: text
              s: subModel
            }

            (x: thing) => x.s
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[3],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(thing) => subModel");
  });

  test("Check lambda with model parameter type and return model sub-model member", async () => {
    document = await parse(`
            model parent {
              b: number
            }

            model subModel {
              c: boolean
            }

            model thing extends parent {
              a: text
              s: subModel
            }

            (x: thing) => x.s.c
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[3],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(thing) => boolean");
  });

  test("Check lambda with model parameter type and return parent model sub-model", async () => {
    document = await parse(`
            model parent {
              b: number
              s: subModel
            }

            model subModel {
              c: boolean
            }

            model thing extends parent {
              a: text
            }

            (x: thing) => x.s
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[3],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(thing) => subModel");
  });

  test("Check lambda with model parameter type and return parent model sub-model member", async () => {
    document = await parse(`
            model parent {
              b: number
              s: subModel
            }

            model subModel {
              c: () => text
            }

            model thing extends parent {
              a: text
            }

            (x: thing) => x.s.c
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[3],
      typeEnv
    );

    expect(isLambdaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(thing) => () => text");
  });

  test("Check lambda evaluation", async () => {
    document = await parse(`      
      ((x: number, y: text) => x)(42, "Hello")
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isNumberType(inferredType)).toBe(true);
  });

  test("Check lambda evaluation with incorrect argument type", async () => {
    document = await parse(`      
      ((x: number, y: text) => x)('42', "Hello")
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Argument ''42'' of type 'text' is not compatible with parameter 'x: number'"
    );
  });

  test("Check lambda evaluation with optional parameter", async () => {
    document = await parse(`      
      ((x: number, y?: text, z: boolean) => z)(42,null,true)
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isBooleanType(inferredType)).toBe(true);
  });

  test("Check lambda evaluation with missing argument", async () => {
    document = await parse(`      
      ((x: number, y: text) => x)(42)
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Parameter 'y: text' is missing from the arguments provided"
    );
  });

  test("Check lambda evaluation with non-existent variable", async () => {
    document = await parse(`
            ((x: number) => y)(7)
        `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Cannot infer type for non-existent variable: 'y'"
    );
  });
});

describe("Type Check Formulas", () => {
  test("Check formula", async () => {
    document = await parse(`
        formula add(x: number, y: number) returns number {
            return x + y
        }
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isFormulaType(inferredType)).toBe(true);
    expect(getTypeName(inferredType)).toBe("(number,number) => number");
  });

  test("Check formula without a return type", async () => {
    document = await parse(`
        formula add(x: number, y: number) {
            return x + y
        }
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[0],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Formula requires a declared return type"
    );
  });
});

describe("Type Check Models", () => {
  test("Check model with primitive properties", async () => {
    document = await parse(`
        model myModel {
          textProp: text
          numberProp: number
          boolProp: boolean
          nullProp: null
          optionalProp?: text

        }

        const modelInstance: myModel = {
          textProp: "Hello World",
          numberProp: 42,
          boolProp: true,
          nullProp: null
        }

        modelInstance
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[2],
      typeEnv
    );

    expect(isModelType(inferredType)).toBe(true);
    expect(
      isTextType(
        (inferredType as ModelType).memberTypes.find(
          (m) => m.name === "textProp"
        )!.typeDesc
      )
    ).toBe(true);
    expect(
      isNumberType(
        (inferredType as ModelType).memberTypes.find(
          (m) => m.name === "numberProp"
        )!.typeDesc
      )
    ).toBe(true);
    expect(
      isBooleanType(
        (inferredType as ModelType).memberTypes.find(
          (m) => m.name === "boolProp"
        )!.typeDesc
      )
    ).toBe(true);
    expect(
      isNullType(
        (inferredType as ModelType).memberTypes.find(
          (m) => m.name === "nullProp"
        )!.typeDesc
      )
    ).toBe(true);
  });

  test("Check model with lambda property", async () => {
    document = await parse(`
        model myModel {
          lambdaProp: (x: number) => number
        }

        const modelInstance: myModel = {
          lambdaProp: (x: number) => x
        }

        modelInstance
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[2],
      typeEnv
    );

    console.log(inferType(document.parseResult.value.statements[0], typeEnv));
    console.log(inferType(document.parseResult.value.statements[1], typeEnv));
    console.log(inferredType);

    expect(isModelType(inferredType)).toBe(true);
    expect(
      isLambdaType(
        (inferredType as ModelType).memberTypes.find(
          (m) => m.name === "lambdaProp"
        )!.typeDesc
      )
    ).toBe(true);
  });

  test("Check model with incorrect primitive properties assignment", async () => {
    document = await parse(`
        model myModel {
          textProp: text
          numberProp: number
          boolProp: boolean
          nullProp: null
          optionalProp?: text

        }

        const modelInstance: myModel = {
          textProp: 42,
          numberProp: "Hello World",
          boolProp: null,
          nullProp: true,
          optionalProp: 42
        }

        modelInstance
    `);

    const inferredType = inferType(
      document.parseResult.value.statements[2],
      typeEnv
    );

    expect(isErrorType(inferredType)).toBe(true);
    expect((inferredType as ErrorType).message).toBe(
      "Member 'textProp: number' is not of the same type as 'textProp: text', Member 'numberProp: text' is not of the same type as 'numberProp: number', Member 'boolProp: null' is not of the same type as 'boolProp: boolean', Member 'nullProp: boolean' is not of the same type as 'nullProp: null', Member 'optionalProp: number' is not of the same type as 'optionalProp: text'"
    );
  });
});

describe.todo("Type Check Print Statement");
