import { describe, it, expect } from "vitest";
import { extractResponseText, normalizeInsight } from "./openai";

describe("extractResponseText", () => {
  it("returns output_text directly when present", () => {
    expect(extractResponseText({ output_text: "hello" })).toBe("hello");
  });

  it("extracts nested output[].content[].text when output_text is absent", () => {
    const responseJson = {
      output: [
        {
          content: [
            { type: "output_text", text: "line 1" },
            { type: "output_text", text: "line 2" },
          ],
        },
      ],
    };
    expect(extractResponseText(responseJson)).toBe("line 1\nline 2");
  });

  it("ignores content items that are not output_text", () => {
    const responseJson = {
      output: [{ content: [{ type: "something_else", text: "ignored" }] }],
    };
    expect(extractResponseText(responseJson)).toBe("");
  });

  it("returns an empty string when nothing exploitable is found", () => {
    expect(extractResponseText({})).toBe("");
    expect(extractResponseText(null)).toBe("");
    expect(extractResponseText({ output_text: "   " })).toBe("");
  });
});

describe("normalizeInsight", () => {
  const valid = {
    composerWord: "Bio du compositeur",
    tonalite: "Bb major",
    grille: "A-7 | D7 | Gmaj7",
    anecdotes: ["anecdote 1", "anecdote 2", "anecdote 3"],
  };

  it("accepts a valid payload", () => {
    expect(normalizeInsight(valid)).toEqual(valid);
  });

  it("trims all string fields", () => {
    const result = normalizeInsight({
      ...valid,
      composerWord: "  Bio  ",
      anecdotes: ["  a  ", "b", "c"],
    });
    expect(result?.composerWord).toBe("Bio");
    expect(result?.anecdotes[0]).toBe("a");
  });

  it("rejects when composerWord/tonalite/grille is missing or empty", () => {
    expect(normalizeInsight({ ...valid, composerWord: "" })).toBeNull();
    expect(normalizeInsight({ ...valid, tonalite: undefined })).toBeNull();
    expect(normalizeInsight({ ...valid, grille: "   " })).toBeNull();
  });

  it("rejects when there are fewer than 3 anecdotes", () => {
    expect(normalizeInsight({ ...valid, anecdotes: ["only one"] })).toBeNull();
  });

  it("truncates to 6 anecdotes when more are provided", () => {
    const result = normalizeInsight({
      ...valid,
      anecdotes: ["1", "2", "3", "4", "5", "6", "7", "8"],
    });
    expect(result?.anecdotes).toHaveLength(6);
  });

  it("filters out non-string anecdote entries", () => {
    const result = normalizeInsight({
      ...valid,
      anecdotes: ["a", "b", "c", 42, null, { x: 1 }],
    });
    expect(result?.anecdotes).toEqual(["a", "b", "c"]);
  });

  it("returns null for a non-object input", () => {
    expect(normalizeInsight(null)).toBeNull();
    expect(normalizeInsight(undefined)).toBeNull();
  });
});
