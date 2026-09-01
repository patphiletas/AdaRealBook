import { timingSafeEqual } from "crypto";

export function checkEditPassword(password: unknown): boolean {
  const expected = (process.env.EDIT_PASSWORD || "").trim();
  if (!expected || typeof password !== "string" || !password) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
