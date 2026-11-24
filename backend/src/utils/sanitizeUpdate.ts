const PROTECTED_KEYS = new Set(["_id", "id", "userId", "ownerId", "createdAt", "updatedAt", "__v"]);

/** Drops identity/ownership fields and Mongo operators from a client-supplied update body. */
export function sanitizeUpdate<T extends Record<string, any>>(input: T | null | undefined): Record<string, any> {
  const clean: Record<string, any> = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return clean;
  for (const [key, value] of Object.entries(input)) {
    if (PROTECTED_KEYS.has(key) || key.startsWith("$") || key.includes(".")) continue;
    clean[key] = value;
  }
  return clean;
}
