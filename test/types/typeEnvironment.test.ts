import { describe } from "node:test";
import { expect, test } from "vitest";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.class.js";

describe("TypeEnvironment", () => {
  test("Creates correct number of scopes", () => {
    const env = new TypeEnvironment();

    expect(env.numberOfScopes()).toBe(0);

    env.enterScope();
    env.setVariableType("numberVar", { $type: "number" });
    env.setVariableType("textVar", { $type: "text" });
    expect(env.numberOfScopes()).toBe(1);

    env.enterScope();
    env.setVariableType("booleanVar", { $type: "boolean" });
    expect(env.numberOfScopes()).toBe(2);
    env.leaveScope();

    expect(env.numberOfScopes()).toBe(1);
    env.leaveScope();

    expect(env.numberOfScopes()).toBe(0);
  });

  test("Sets and gets variables", () => {
    const env = new TypeEnvironment();

    env.enterScope();
    env.setVariableType("numberVar", { $type: "number" });
    env.setVariableType("textVar", { $type: "text" });

    env.enterScope();
    env.setVariableType("booleanVar", { $type: "boolean" });

    expect(env.getVariableType("numberVar")).toEqual({ $type: "number" });
    expect(env.getVariableType("textVar")).toEqual({ $type: "text" });
    expect(env.getVariableType("booleanVar")).toEqual({ $type: "boolean" });
    expect(env.getVariableType("unknownVar")).toBeUndefined();

    env.leaveScope();
    expect(env.getVariableType("booleanVar")).toBeUndefined();

    env.leaveScope();
    expect(env.getVariableType("numberVar")).toBeUndefined();
    expect(env.getVariableType("textVar")).toBeUndefined();
  });
});
