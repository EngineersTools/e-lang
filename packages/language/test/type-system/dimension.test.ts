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
});
