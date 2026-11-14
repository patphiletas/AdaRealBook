import { describe, it, expect } from "vitest";
import { lireIds, basculerFavori, ajouterRecent, tonalitesDisponibles } from "./bibliotheque";

describe("lireIds", () => {
  it("relit une liste d'identifiants", () => {
    expect(lireIds("[3,1,2]")).toEqual([3, 1, 2]);
  });
  it("ignore les valeurs abîmées, négatives ou en double", () => {
    expect(lireIds(null)).toEqual([]);
    expect(lireIds("pas du json")).toEqual([]);
    expect(lireIds('{"a":1}')).toEqual([]);
    expect(lireIds('[1,"2",-3,1.5,1,4]')).toEqual([1, 4]);
  });
});

describe("basculerFavori", () => {
  it("ajoute en tête puis retire", () => {
    expect(basculerFavori([2], 5)).toEqual([5, 2]);
    expect(basculerFavori([5, 2], 5)).toEqual([2]);
  });
});

describe("ajouterRecent", () => {
  it("met le morceau en tête sans doublon", () => {
    expect(ajouterRecent([1, 2, 3], 2)).toEqual([2, 1, 3]);
  });
  it("limite la longueur", () => {
    expect(ajouterRecent([1, 2, 3], 4, 3)).toEqual([4, 1, 2]);
  });
});

describe("tonalitesDisponibles", () => {
  it("trie par fréquence puis par nom, ignore les vides", () => {
    expect(
      tonalitesDisponibles([
        { musical_key: "F" },
        { musical_key: "C" },
        { musical_key: "C" },
        { musical_key: "Bb" },
        { musical_key: null },
        { musical_key: " " },
      ])
    ).toEqual(["C", "Bb", "F"]);
  });
});
