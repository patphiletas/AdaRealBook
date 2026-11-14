import { describe, it, expect } from "vitest";
import { slugTitre, slugMorceau, idDepuisSlug, morceauDepuisUrl } from "./morceauUrl";
import type { Partition } from "@/types/interface";

const p = (id: number, title: string): Partition => ({
  id,
  title,
  composer: "",
  musical_key: "",
  name_pdf: "",
  category: "",
});

describe("slugTitre", () => {
  it("met en minuscules, retire accents et ponctuation", () => {
    expect(slugTitre("A Night In Tunisia")).toBe("a-night-in-tunisia");
    expect(slugTitre("Très Chouette !")).toBe("tres-chouette");
    expect(slugTitre("12-4 2-4/Duplicities")).toBe("12-4-2-4-duplicities");
  });
  it("donne « morceau » pour un titre vide ou sans lettres", () => {
    expect(slugTitre("")).toBe("morceau");
    expect(slugTitre("???")).toBe("morceau");
  });
  it("coupe les titres très longs", () => {
    expect(slugTitre("a".repeat(100)).length).toBeLessThanOrEqual(60);
  });
});

describe("slugMorceau / idDepuisSlug", () => {
  it("ajoute l'identifiant à la fin et sait le relire", () => {
    const slug = slugMorceau(p(42, "A Night In Tunisia"));
    expect(slug).toBe("a-night-in-tunisia-42");
    expect(idDepuisSlug(slug)).toBe(42);
  });
  it("ne lit que l'identifiant final", () => {
    expect(idDepuisSlug("502-blues-7")).toBe(7);
    expect(idDepuisSlug("12")).toBe(12);
  });
  it("renvoie null pour une valeur absente ou invalide", () => {
    expect(idDepuisSlug(null)).toBeNull();
    expect(idDepuisSlug("blues")).toBeNull();
    expect(idDepuisSlug("<script>")).toBeNull();
  });
});

describe("morceauDepuisUrl", () => {
  const liste = [p(1, "Afro Blue"), p(42, "A Night In Tunisia")];
  it("retrouve le morceau de l'adresse", () => {
    expect(morceauDepuisUrl("?morceau=a-night-in-tunisia-42", liste)?.title).toBe("A Night In Tunisia");
  });
  it("fonctionne même si le titre de l'adresse est ancien", () => {
    expect(morceauDepuisUrl("?morceau=ancien-titre-42", liste)?.id).toBe(42);
  });
  it("renvoie null si absent ou inconnu", () => {
    expect(morceauDepuisUrl("", liste)).toBeNull();
    expect(morceauDepuisUrl("?morceau=inconnu-999", liste)).toBeNull();
  });
});
