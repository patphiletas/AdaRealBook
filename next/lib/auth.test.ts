import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkEditPassword } from "./auth";

describe("checkEditPassword", () => {
  const original = process.env.EDIT_PASSWORD;

  beforeEach(() => {
    process.env.EDIT_PASSWORD = "secret-test";
  });

  afterEach(() => {
    process.env.EDIT_PASSWORD = original;
  });

  it("accepte le bon mot de passe", () => {
    expect(checkEditPassword("secret-test")).toBe(true);
  });

  it.each([["mauvais"], ["secret-tes"], [""], [null], [undefined], [42]])("refuse %s", (value) => {
    expect(checkEditPassword(value)).toBe(false);
  });

  it("refuse tout si EDIT_PASSWORD n'est pas défini", () => {
    delete process.env.EDIT_PASSWORD;
    expect(checkEditPassword("")).toBe(false);
    expect(checkEditPassword("secret-test")).toBe(false);
  });
});
