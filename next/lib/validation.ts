export const PARTITION_FIELD_LIMITS = {
  title: 200,
  composer: 200,
  musicalKey: 20,
  category: 100,
} as const;

export interface PartitionInput {
  title: string;
  composer: string;
  musical_key: string | null;
  category: string | null;
}

export type ValidationResult =
  | { valid: true; data: PartitionInput }
  | { valid: false; error: string };

export function validatePartitionInput(input: {
  title?: unknown;
  composer?: unknown;
  musical_key?: unknown;
  category?: unknown;
}): ValidationResult {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const composer = typeof input.composer === "string" ? input.composer.trim() : "";
  const musicalKey = typeof input.musical_key === "string" ? input.musical_key.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";

  if (!title || !composer) {
    return { valid: false, error: "Titre et compositeur obligatoires" };
  }

  if (
    title.length > PARTITION_FIELD_LIMITS.title ||
    composer.length > PARTITION_FIELD_LIMITS.composer ||
    (musicalKey && musicalKey.length > PARTITION_FIELD_LIMITS.musicalKey) ||
    (category && category.length > PARTITION_FIELD_LIMITS.category)
  ) {
    return { valid: false, error: "Un ou plusieurs champs dépassent la longueur autorisée" };
  }

  return {
    valid: true,
    data: {
      title,
      composer,
      musical_key: musicalKey || null,
      category: category || null,
    },
  };
}

export function isValidPartitionId(value: unknown): boolean {
  return (typeof value === "number" && !Number.isNaN(value)) || (typeof value === "string" && value.trim().length > 0);
}
