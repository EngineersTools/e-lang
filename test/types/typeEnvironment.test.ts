import { describe } from "node:test";
import { expect, test } from "vitest";
import { TypeEnvironment } from "../../src/language/type-system/TypeEnvironment.class.js";

describe("TypeEnvironment", () => {
  test("Creates correct number of scopes", () => {
    const env = new TypeEnvironment();

    expect(env.numberOfScopes()).toBe(0);

    env.enterScope();
    env.set("numberVar", { $type: "number" });
    env.set("textVar", { $type: "text" });
    expect(env.numberOfScopes()).toBe(1);

    env.enterScope();
    env.set("booleanVar", { $type: "boolean" });
    expect(env.numberOfScopes()).toBe(2);
    env.leaveScope();

    expect(env.numberOfScopes()).toBe(1);
    env.leaveScope();

    expect(env.numberOfScopes()).toBe(0);
  });

  test("Sets and gets variables", () => {
    const env = new TypeEnvironment();

    env.enterScope();
    env.set("numberVar", { $type: "number" });
    env.set("textVar", { $type: "text" });

    env.enterScope();
    env.set("booleanVar", { $type: "boolean" });

    expect(env.get("numberVar")).toEqual({ $type: "number" });
    expect(env.get("textVar")).toEqual({ $type: "text" });
    expect(env.get("booleanVar")).toEqual({ $type: "boolean" });
    expect(env.get("unknownVar")).toBeUndefined();

    env.leaveScope();
    expect(env.get("booleanVar")).toBeUndefined();

    env.leaveScope();
    expect(env.get("numberVar")).toBeUndefined();
    expect(env.get("textVar")).toBeUndefined();
  });
});
