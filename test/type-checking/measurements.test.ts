import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ConstantDeclaration,
  ELangProgram,
  isBinaryExpression,
  StatementBlock,
} from "../../src/language/generated/ast.js";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.js";
import {
  getTypeName,
  isMeasurementType,
} from "../../src/language/type-system/descriptions.js";
import { inferType } from "../../src/language/type-system/infer.js";

describe("Measurements", () => {
  let services: ReturnType<typeof createELangServices>;
  let parse: ReturnType<typeof parseHelper<ELangProgram>>;
  let document: LangiumDocument<ELangProgram> | undefined;
  let block: StatementBlock;
  let typeEnv: TypeEnvironment;

  beforeAll(async () => {
    services = createELangServices(EmptyFileSystem);
    parse = parseHelper<ELangProgram>(services.ELang);

    // Setup up some base unit families and measurements
    document = await parse(`{
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

        unit_family Time {
          unit sec:second
          unit m:minute
        }

        // 4
        const length = 10_[m]
        
        // 5
        const mass = 5_[kg]
        
        // 6
        const time = 2_[sec]

        // 7
        const measurementTimesNumber = length * 2

        // 8
        const numberTimesMeasurement = 3 * length

        // 9
        const measurementTimesMeasurement = length * time
        
        // 10
        const measurementDividedByNumber = length / 2

        // 11
        const numberDividedByMeasurement = 2 / length

        // 12
        const measurementDividedByMeasurement = length / mass
    }`);

    block = document.parseResult.value.statements[0] as StatementBlock;
    typeEnv = new TypeEnvironment();
  });

  describe("when a measurement is multiplied by a number", async () => {
    test("it should return the type of the measurement", () => {
      const inferredType = inferType(block.statements[7], typeEnv);

      expect(
        isBinaryExpression((block.statements[7] as ConstantDeclaration).value)
      ).toBe(true);
      expect(isMeasurementType(inferredType)).toBe(true);
      expect(getTypeName(inferredType)).toBe("number_[Length]");
    });
  });

  describe("when a number is multiplied by a measurement", async () => {
    test("it should return the type of the measurement", () => {
      const inferredType = inferType(block.statements[8], typeEnv);

      expect(
        isBinaryExpression((block.statements[8] as ConstantDeclaration).value)
      ).toBe(true);
      expect(isMeasurementType(inferredType)).toBe(true);
      expect(getTypeName(inferredType)).toBe("number_[Length]");
    });
  });

  describe("when a measurement is multiplied by another measurement", async () => {
    test("it should return the type of the measurement", () => {
      const inferredType = inferType(block.statements[9], typeEnv);

      expect(
        isBinaryExpression((block.statements[9] as ConstantDeclaration).value)
      ).toBe(true);
      expect(isMeasurementType(inferredType)).toBe(true);
      expect(getTypeName(inferredType)).toBe("number_[Length*Time]");
    });
  });

  describe("when a measurement is divided by a number", async () => {
    test("it should return the type of the measurement", () => {
      const inferredType = inferType(block.statements[10], typeEnv);

      expect(
        isBinaryExpression((block.statements[10] as ConstantDeclaration).value)
      ).toBe(true);
      expect(isMeasurementType(inferredType)).toBe(true);
      expect(getTypeName(inferredType)).toBe("number_[Length]");
    });
  });

  describe("when a number is divided by a measurement", async () => {
    test("it should return the type of the measurement", () => {
      const inferredType = inferType(block.statements[11], typeEnv);

      expect(
        isBinaryExpression((block.statements[11] as ConstantDeclaration).value)
      ).toBe(true);
      expect(isMeasurementType(inferredType)).toBe(true);
      expect(getTypeName(inferredType)).toBe("number_[Length^-1]");
    });
  });

  describe("when a measurement is divided by another measurement", async () => {
    test("it should return the type of the measurement", () => {
      const inferredType = inferType(block.statements[12], typeEnv);

      expect(
        isBinaryExpression((block.statements[12] as ConstantDeclaration).value)
      ).toBe(true);
      expect(isMeasurementType(inferredType)).toBe(true);
      expect(getTypeName(inferredType)).toBe("number_[Length*Mass^-1]");
    });
  });
});
