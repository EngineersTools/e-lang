import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { CancellationTokenSource } from "vscode-languageserver";
import { RunnerContext } from "../../src/interpreter/RunnerContext.js";
import { multiplyMeasurements } from "../../src/interpreter/units/unitArithmeticOperations.js";
import { Variables } from "../../src/interpreter/Variables.js";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
    ConstantDeclaration,
    ELangProgram,
    MeasurementLiteral,
} from "../../src/language/generated/ast.js";
import { getTypeName } from "../../src/language/type-system/descriptions.js";
import { inferType } from "../../src/language/type-system/infer.js";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;
let context: RunnerContext;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);

  // Setup up some base unit families
  document = await parse(`
    unit_family Length {
      unit m:meter
      unit yd:yard

      conversion m->yd: (val: number_[Length]) => val * 1.09361
      conversion yd->m: (val: number_[Length]) => val / 1.09361
    }

    unit_family Temperature {
      unit degC:DegreesCentigrade
      unit degF:DegreesFahrenheit
    }

    unit_family Mass {
      unit kg:kilogram
      unit lb:pound
    }

    const meas1 = 10_[m]
    const meas2 = 20_[m]
  `);

  const cancellationTokenSource = new CancellationTokenSource();
  const cancellationToken = cancellationTokenSource.token;

  const timeout = setTimeout(async () => {
    cancellationTokenSource.cancel();
  }, 1000);

  context = {
    variables: new Variables(),
    typeEnvironment: new TypeEnvironment(),
    cancellationToken,
    timeout: timeout,
    log: console.log,
  };
});

describe("Unit Arithmetic Operations", () => {
  describe("multiplyUnits()", () => {
    test("Check correct family unit name for base unit families", async () => {
      const meas1 = (
        document?.parseResult.value.statements[3] as ConstantDeclaration
      ).value as MeasurementLiteral;
      const meas2 = (
        document?.parseResult.value.statements[4] as ConstantDeclaration
      ).value as MeasurementLiteral;

      const result = await multiplyMeasurements(meas1, meas2, context);

      const resultType = inferType(result, context.typeEnvironment);

      expect(result.value).toBe(200);
      expect(getTypeName(resultType)).toBe("number_[Length^2]");
    });
  });
});
