import { timingSafeEqual } from "crypto";

const FAILED_AUTH_DELAY_MS = 1000;

export function checkEditPassword(password: unknown): boolean {
  const expected = (process.env.EDIT_PASSWORD || "").trim();
  if (!expected || typeof password !== "string" || !password) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

// Ralentit un bruteforce séquentiel du mot de passe (pas de vraie protection
// contre des requêtes envoyées en parallèle, voir DOC/securite.md).
export function delayFailedAuth(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FAILED_AUTH_DELAY_MS));
}
