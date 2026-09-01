import { describe, it, expect } from "vitest";
import { filterPartitions } from "./filterPartitions";
import type { Partition } from "@/types/interface";

const partitions: Partition[] = [
  { id: 1, title: "Autumn Leaves", composer: "Joseph Kosma", musical_key: "Bb", name_pdf: "001", category: "Realbook" },
  { id: 2, title: "Blue in Green", composer: "Bill Evans", musical_key: "Bb", name_pdf: "002", category: "Ballad" },
  { id: 3, title: "So What", composer: "Miles Davis", musical_key: "Dm", name_pdf: "003", category: "Modal" },
];

describe("filterPartitions", () => {
  it("returns everything when the search is empty", () => {
    expect(filterPartitions(partitions, "")).toEqual(partitions);
    expect(filterPartitions(partitions, "   ")).toEqual(partitions);
  });

  it("returns everything when the search has fewer than 3 characters", () => {
    expect(filterPartitions(partitions, "so")).toEqual(partitions);
  });

  it("filters by title, case-insensitive, from 3 characters", () => {
    const result = filterPartitions(partitions, "aut");
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it("filters by composer", () => {
    const result = filterPartitions(partitions, "davis");
    expect(result.map((p) => p.id)).toEqual([3]);
  });

  it("filters by category", () => {
    const result = filterPartitions(partitions, "ballad");
    expect(result.map((p) => p.id)).toEqual([2]);
  });

  it("filters by exact musical_key with the (Bb) syntax", () => {
    const result = filterPartitions(partitions, "(Bb)");
    expect(result.map((p) => p.id).sort()).toEqual([1, 2]);
  });

  it("the (key) syntax is case-insensitive", () => {
    const result = filterPartitions(partitions, "(bb)");
    expect(result.map((p) => p.id).sort()).toEqual([1, 2]);
  });

  it("the (key) syntax returns nothing when no partition matches", () => {
    expect(filterPartitions(partitions, "(F#)")).toEqual([]);
  });

  it("returns nothing when no field matches a real search", () => {
    expect(filterPartitions(partitions, "xyz-not-found")).toEqual([]);
  });

  it("does not crash when musical_key/category/composer are null (allowed by the DB schema)", () => {
    const withNulls: Partition[] = [
      { id: 4, title: "Untitled", composer: null as unknown as string, musical_key: null as unknown as string, name_pdf: "004", category: null as unknown as string },
    ];
    expect(() => filterPartitions(withNulls, "untitled")).not.toThrow();
    expect(filterPartitions(withNulls, "untitled").map((p) => p.id)).toEqual([4]);
    expect(() => filterPartitions(withNulls, "(Bb)")).not.toThrow();
  });
});
