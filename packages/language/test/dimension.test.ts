import { describe, test } from "vitest";
import { validateElang } from "./utils.js";

describe("Dimension Analysis", () => {
  test("Parse, Calculate and Assign Base Unit Dimensions", async () => {
    await validateElang(
      `
      dimension Length
      unit m : Length
      const constantDistance:Length = 10 ~m
      var variableDistance:Length = 20 ~m
      const listOfDistances: Length list = [5 ~m, 15 ~m, 25 ~m]
      const constantDistance2 = 10 ~m
      var variableDistance2 = 20 ~m
      `,
      0
    );
  });

  test("Incorrect units for Dimension", async () => {
    await validateElang(
      `
      dimension Length
      dimension Time
      unit m : Length
      unit s : Time
      const constantDistance:Length = 10 ~s
      var variableDistance:Length = 20 ~s
      const numberWithoutUnit: Length = 15
      `,
      3
    );
  });

  test("Dimension inference from assigned unit", async () => {
    await validateElang(
      `
      dimension Length
      unit m : Length
      const constantDistance = 10 ~m
      var variableDistance = 20 ~m
      `,
      0
    );
  });

  test("Dimension reassignment error", async () => {
    await validateElang(
      `
      dimension Length
      dimension Time
      unit m : Length
      unit s : Time
      var variableDistance:Length = 20 ~m
      variableDistance = 30 ~s
      `,
      1
    );
  });

  test("Operations with compatible dimensions", async () => {
    await validateElang(
      `
      dimension Length
      unit m : Length
      const totalDistance:Length = 10 ~m + 20 ~m
      var differenceDistance:Length = 30 ~m - 5 ~m
      var scaledDistance:Length = 2 * 15 ~m
      var dividedDistance:Length = 30 ~m / 2
      `,
      0
    );
  });

  test('Dimension equality', async () => {
    await validateElang(
      `
      dimension Length
      unit m : Length
      const constantDistance:Length = 10 ~m
      const constantDistance2 = 10 ~m
      if (constantDistance == constantDistance2) { }
      `,
      0
    );
  });
});
