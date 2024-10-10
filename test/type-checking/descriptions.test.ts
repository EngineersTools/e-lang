import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  BinaryExpression,
  ELangProgram,
  FormulaDeclaration,
  LambdaDeclaration,
  StatementBlock,
} from "../../src/language/generated/ast.js";
import {
  createBooleanType,
  createNullType,
  createNumberType,
  createTextType,
  getTypeName
} from "../../src/language/type-system/descriptions.js";
import { inferType } from "../../src/language/type-system/infer.js";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);
});

describe("Primitives", () => {
  test("Check text type", async () => {
    expect(getTypeName(createTextType())).toBe("text");
  });

  test("Check number type", async () => {
    expect(getTypeName(createNumberType())).toBe("number");
  });

  test("Check boolean type", async () => {
    expect(getTypeName(createBooleanType())).toBe("boolean");
  });

  test("Check null type", async () => {
    expect(getTypeName(createNullType())).toBe("null");
  });
});

describe("Measurements", () => {
  test("Check measurement type", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        return 10_[m]
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number_[Length]");
  });

  test("Check measurement type as return from lambda", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        return () => 10_[m]
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("() => number_[Length]");
  });

  test("Check measurements addition", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        return 10_[m] + 10_[yd]
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number_[Length]");
  });

  test("Check incompatible measurements addition", async () => {
    document = await parse(`{
        unit_family Length {
          unit m:meter
          unit yd:yard
        }

        unit_family Temperature {
          unit degC:DegreesCentigrade
          unit degF:DegreesFahrenheit
        }

        return 10_[m] + 10_[degC]
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check measurement and number addition", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        return 10_[m] + 10
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check number and measurement addition", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        return 10 + 10_[yd]
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check measurement and number multiplication", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        return 10_[m] * 10
    }`);
    const stmt = document.parseResult.value.statements[0] as StatementBlock;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number_[Length]");
  });

  test("Check different measurement types multiplication", async () => {
    document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        unit_family Temperature {
          unit degC:DegreesCentigrade
          unit degF:DegreesFahrenheit
        }

        return 10_[m] * 5_[m] * 10_[degC]
    }`);
    const stmt = document.parseResult.value.statements[0];
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number_[Length^2*Temperature]");
  });
});

describe("Binary Expressions", () => {
  test("Check addition", async () => {
    document = await parse("42 + 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number");
  });

  test("Check concatenation", async () => {
    // text + number
    document = await parse("'Hello World' + 42");
    let stmt = document.parseResult.value.statements[0] as BinaryExpression;
    let _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("text");

    // number + text
    document = await parse("42 + 'Hello World'");
    stmt = document.parseResult.value.statements[0] as BinaryExpression;
    _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("text");

    // text + text
    document = await parse("'Hello' + 'World'");
    stmt = document.parseResult.value.statements[0] as BinaryExpression;
    _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("text");
  });

  test("Check subtraction", async () => {
    document = await parse("42 - 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number");
  });

  test("Check multiplication", async () => {
    document = await parse("42 * 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number");
  });

  test("Check division", async () => {
    document = await parse("42 / 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number");
  });

  test("Check exponentiation", async () => {
    document = await parse("42 ^ 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("number");
  });

  test("Check less than", async () => {
    document = await parse("42 < 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check greater than", async () => {
    document = await parse("42 > 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check less than or equal", async () => {
    document = await parse("42 <= 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check greater than or equal", async () => {
    document = await parse("42 >= 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check equality", async () => {
    document = await parse("42 == 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check inequality", async () => {
    document = await parse("42 != 42");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check and", async () => {
    document = await parse("true and false");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check or", async () => {
    document = await parse("true or false");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("boolean");
  });

  test("Check invalid addition", async () => {
    document = await parse("42 + true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid subtraction", async () => {
    document = await parse("42 - true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid multiplication", async () => {
    document = await parse("42 * true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid division", async () => {
    document = await parse("42 / true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid exponentiation", async () => {
    document = await parse("42 ^ true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid less than", async () => {
    document = await parse("42 < true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid greater than", async () => {
    document = await parse("42 > true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid less than or equal", async () => {
    document = await parse("42 <= true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid greater than or equal", async () => {
    document = await parse("42 >= true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid equality", async () => {
    document = await parse("42 == true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid inequality", async () => {
    document = await parse("42 != true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid and", async () => {
    document = await parse("42 and true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });

  test("Check invalid or", async () => {
    document = await parse("42 or true");
    const stmt = document.parseResult.value.statements[0] as BinaryExpression;
    const _type = inferType(stmt, new TypeEnvironment());
    expect(getTypeName(_type)).toBe("error");
  });
});

describe("Formulas", () => {
  test("Check formula without parameters", async () => {
    document = await parse(`
        formula add() returns number {
            return 10
        }
    `);

    const formulaStatement = document.parseResult.value
      .statements[0] as FormulaDeclaration;
    const formulaType = inferType(formulaStatement, new TypeEnvironment());
    expect(getTypeName(formulaType)).toBe("() => number");
  });

  test("Check formula with parameters", async () => {
    document = await parse(`
        formula add(x: number, y: number) returns number {
            return x + y
        }
    `);

    const formulaStatement = document.parseResult.value
      .statements[0] as FormulaDeclaration;
    const formulaType = inferType(formulaStatement, new TypeEnvironment());

    expect(getTypeName(formulaType)).toBe("(number,number) => number");
  });

  //   test("Check formula with inferred parameters", async () => {
  //     document = await parse(`
  //         formula add(x, y) returns number {
  //             return x + y
  //         }
  //     `);

  //     const formulaStatement = document.parseResult.value
  //       .statements[0] as FormulaDeclaration;
  //     const formulaType = inferType(formulaStatement, new TypeEnvironment());

  //     expect(getTypeName(formulaType)).toBe("(number,number) => number");
  //   });

  test("Check formula without return statement", async () => {
    document = await parse(`
        formula add(x: number, y: number) {
            return x + y
        }
    `);

    const formulaStatement = document.parseResult.value
      .statements[0] as FormulaDeclaration;
    const formulaType = inferType(formulaStatement, new TypeEnvironment());

    expect(getTypeName(formulaType)).toBe("error");
  });
});

describe("Lambdas", () => {
  test("Check lambda without parameters, statement block and return statement", async () => {
    document = await parse(`
            () => 1 + 2
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("() => number");
  });

  test("Check lambda with parameters, without statement block and return statement", async () => {
    document = await parse(`
            (x: number, y: number) => x + y
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("(number,number) => number");
  });

  test("Check lambda without parameters and statement block", async () => {
    document = await parse(`
            (): number => 1 + 2
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("() => number");
  });

  test("Check lambda with parameters and return", async () => {
    document = await parse(`
            (x: number, y: number): number => x + y
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("(number,number) => number");
  });

  test("Check lambda with statement block, without parameters", async () => {
    document = await parse(`
            () => {
                print "Hello World"
                return 1 + 2
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("() => number");
  });

  test("Check lambda with statement block and parameters", async () => {
    document = await parse(`
            (x: number, y: number) => {
                print "Hello World"
                return x + y
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("(number,number) => number");
  });

  test("Check lambda with statement block, without parameters and with return", async () => {
    document = await parse(`
            (): number => {
                print "Hello World"
                return 1 + 2
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("() => number");
  });

  test("Check lambda with statement block, parameters and return", async () => {
    document = await parse(`
            (x: number, y: number): number => {
                print "Hello World"
                return x + y
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("(number,number) => number");
  });

  test("Check lambda with multiple statement block, without parameters", async () => {
    document = await parse(`
            () => {
                if(true) {
                    return "Hello World"
                } else {
                    return 1 + 2
                }
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("() => text or number");
  });

  test("Check lambda with multiple statement block and parameters", async () => {
    document = await parse(`
            (test: boolean) => {
                if(test) {
                    return "Hello World"
                } else {
                    return 1 + 2
                }
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("(boolean) => text or number");
  });

  test("Check lambda with multiple statement block, without parameters", async () => {
    document = await parse(`
            (): text or number => {
                if(true) {
                    return "Hello World"
                } else {
                    return 1 + 2
                }
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("() => text or number");
  });

  test("Check lambda with multiple statement block, without parameters", async () => {
    document = await parse(`
            (cond: boolean): text or number => {
                if(cond) {
                    return "Hello World"
                } else {
                    return 1 + 2
                }
            }
        `);

    const stmt = document.parseResult.value.statements[0] as LambdaDeclaration;
    const _type = inferType(stmt, new TypeEnvironment());

    expect(getTypeName(_type)).toBe("(boolean) => text or number");
  });
});
