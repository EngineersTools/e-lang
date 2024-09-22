import { EmptyFileSystem, LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { beforeAll, describe, expect, test } from "vitest";
import { createELangServices } from "../../src/language/e-lang-module.js";
import {
  ELangProgram,
  StatementBlock,
} from "../../src/language/generated/ast.js";
import {
  ComplexUnitFamilyType,
  createComplexUnitFamilyType,
  getTypeName,
  invertUnitFamily,
  reduceUnitFamilies,
  UnitFamilyType,
} from "../../src/language/type-system/descriptions.js";
import { inferType } from "../../src/language/type-system/infer.js";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.js";

let services: ReturnType<typeof createELangServices>;
let parse: ReturnType<typeof parseHelper<ELangProgram>>;
let document: LangiumDocument<ELangProgram> | undefined;

let lengthUF: UnitFamilyType;
let temperatureUF: UnitFamilyType;
let massUF: UnitFamilyType;
let lengthCubeTimesTemperatureOverMassSquare: ComplexUnitFamilyType;
let lengthTimesMassSquareOverTemperatureSquare: ComplexUnitFamilyType;

beforeAll(async () => {
  services = createELangServices(EmptyFileSystem);
  parse = parseHelper<ELangProgram>(services.ELang);

  // Setup up some base unit families
  document = await parse(`{
        unit_family Length {
            unit m:meter
            unit yd:yard
        }

        unit_family Temperature {
          unit degC:DegreesCentigrade
          unit degF:DegreesFahrenheit
        }

        unit_family Mass {
          unit kg:kilogram
          unit lb:pound
        }
    }`);

  const block = document.parseResult.value.statements[0] as StatementBlock;
  const typeEnv = new TypeEnvironment();
  lengthUF = inferType(block.statements[0], typeEnv) as UnitFamilyType;
  temperatureUF = inferType(block.statements[1], typeEnv) as UnitFamilyType;
  massUF = inferType(block.statements[2], typeEnv) as UnitFamilyType;
  lengthCubeTimesTemperatureOverMassSquare = createComplexUnitFamilyType([
    lengthUF,
    lengthUF,
    lengthUF,
    temperatureUF,
    invertUnitFamily(massUF),
    invertUnitFamily(massUF),
  ]);
  lengthTimesMassSquareOverTemperatureSquare = createComplexUnitFamilyType([
    lengthUF,
    massUF,
    massUF,
    invertUnitFamily(temperatureUF),
    invertUnitFamily(temperatureUF),
  ]);
});

describe("Unit Families", () => {
  describe("getTypeName()", () => {
    test("Check correct family unit name for base unit families", () => {
      expect(getTypeName(lengthUF)).toBe("Length");
      expect(getTypeName(temperatureUF)).toBe("Temperature");
      expect(getTypeName(massUF)).toBe("Mass");
    });

    test("Check correct family unit name for inverted base unit families", () => {
      expect(getTypeName(invertUnitFamily(lengthUF))).toBe("Length^-1");
      expect(getTypeName(invertUnitFamily(temperatureUF))).toBe(
        "Temperature^-1"
      );
      expect(getTypeName(invertUnitFamily(massUF))).toBe("Mass^-1");
    });

    test("Check correct family unit name for complex unit families with 'NegativeExponent' notation", () => {
      expect(getTypeName(lengthCubeTimesTemperatureOverMassSquare)).toBe(
        "Length^3*Mass^-2*Temperature"
      );
      expect(getTypeName(lengthTimesMassSquareOverTemperatureSquare)).toBe(
        "Length*Mass^2*Temperature^-2"
      );
    });

    test("Check correct family unit name for complex unit families with 'Division' notation", () => {
      expect(
        getTypeName(lengthCubeTimesTemperatureOverMassSquare, "Division")
      ).toBe("Length^3*Temperature/Mass^2");
      expect(
        getTypeName(lengthTimesMassSquareOverTemperatureSquare, "Division")
      ).toBe("Length*Mass^2/Temperature^2");
    });
  });

  describe("reduceUnitFamilies()", () => {
    test("Check correct reduction for base unit families", () => {
      expect(reduceUnitFamilies([lengthUF])[0].exponent).toBe(1);
      expect(reduceUnitFamilies([invertUnitFamily(lengthUF)])[0].exponent).toBe(
        -1
      );
      expect(
        reduceUnitFamilies([lengthUF, invertUnitFamily(lengthUF)])[0].exponent
      ).toBe(0);
      expect(
        reduceUnitFamilies([lengthUF, lengthUF, lengthUF])[0].exponent
      ).toBe(3);
      expect(
        reduceUnitFamilies([lengthUF, lengthUF, invertUnitFamily(lengthUF)])[0]
          .exponent
      ).toBe(1);
      expect(
        reduceUnitFamilies([
          lengthUF,
          invertUnitFamily(lengthUF),
          invertUnitFamily(lengthUF),
        ])[0].exponent
      ).toBe(-1);
      expect(
        reduceUnitFamilies([lengthUF, massUF, lengthUF, massUF, lengthUF])[0]
          .exponent
      ).toBe(3);
      expect(
        reduceUnitFamilies([lengthUF, massUF, lengthUF, massUF, lengthUF])[1]
          .exponent
      ).toBe(2);
      expect(
        reduceUnitFamilies([
          lengthUF,
          massUF,
          invertUnitFamily(lengthUF),
          invertUnitFamily(massUF),
          invertUnitFamily(massUF),
          lengthUF,
        ])[0].exponent
      ).toBe(1);
      expect(
        reduceUnitFamilies([
          lengthUF,
          massUF,
          invertUnitFamily(lengthUF),
          invertUnitFamily(massUF),
          invertUnitFamily(massUF),
          lengthUF,
        ])[1].exponent
      ).toBe(-1);
    });
  });
});
