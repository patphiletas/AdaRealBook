import { describe, it, expect } from "vitest";
import { validatePartitionInput, isValidPartitionId } from "./validation";

describe("validatePartitionInput", () => {
  const valid = { title: "Autumn Leaves", composer: "Joseph Kosma", musical_key: "Bb", category: "Realbook" };

  it("accepts a valid input and trims fields", () => {
    const result = validatePartitionInput({ ...valid, title: "  Autumn Leaves  " });
    expect(result).toEqual({
      valid: true,
      data: { title: "Autumn Leaves", composer: "Joseph Kosma", musical_key: "Bb", category: "Realbook" },
    });
  });

  it("normalizes missing musical_key/category to null", () => {
    const result = validatePartitionInput({ title: "X", composer: "Y" });
    expect(result).toEqual({
      valid: true,
      data: { title: "X", composer: "Y", musical_key: null, category: null },
    });
  });

  it("rejects when title is missing or blank", () => {
    expect(validatePartitionInput({ ...valid, title: "" }).valid).toBe(false);
    expect(validatePartitionInput({ ...valid, title: "   " }).valid).toBe(false);
    expect(validatePartitionInput({ ...valid, title: undefined }).valid).toBe(false);
  });

  it("rejects when composer is missing or blank", () => {
    expect(validatePartitionInput({ ...valid, composer: "" }).valid).toBe(false);
  });

  it("rejects a title or composer over 200 characters", () => {
    const long = "a".repeat(201);
    expect(validatePartitionInput({ ...valid, title: long }).valid).toBe(false);
    expect(validatePartitionInput({ ...valid, composer: long }).valid).toBe(false);
  });

  it("rejects a musical_key over 20 characters", () => {
    expect(validatePartitionInput({ ...valid, musical_key: "a".repeat(21) }).valid).toBe(false);
  });

  it("rejects a category over 100 characters", () => {
    expect(validatePartitionInput({ ...valid, category: "a".repeat(101) }).valid).toBe(false);
  });

  it("accepts fields exactly at the length limit", () => {
    expect(validatePartitionInput({ ...valid, title: "a".repeat(200) }).valid).toBe(true);
    expect(validatePartitionInput({ ...valid, musical_key: "a".repeat(20) }).valid).toBe(true);
    expect(validatePartitionInput({ ...valid, category: "a".repeat(100) }).valid).toBe(true);
  });
});

describe("isValidPartitionId", () => {
  it("accepts a positive number", () => {
    expect(isValidPartitionId(1)).toBe(true);
    expect(isValidPartitionId(42)).toBe(true);
  });

  it("accepts a non-empty string", () => {
    expect(isValidPartitionId("1")).toBe(true);
  });

  it("rejects null, undefined, NaN, empty string, and 0-length strings", () => {
    expect(isValidPartitionId(null)).toBe(false);
    expect(isValidPartitionId(undefined)).toBe(false);
    expect(isValidPartitionId(NaN)).toBe(false);
    expect(isValidPartitionId("")).toBe(false);
    expect(isValidPartitionId("   ")).toBe(false);
  });

  it("accepts 0 as a valid number id (falsy but a legitimate value)", () => {
    expect(isValidPartitionId(0)).toBe(true);
  });
});
