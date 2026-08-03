import { defaultIdentity } from "@/data/signal-data";
import {
  IDENTITY_MAX_VALUES,
  IDENTITY_TEXT_LIMIT,
  IDENTITY_VALUE_LIMIT,
  type IdentityProfile,
} from "@/types/signal";

// Identity text reaches the app from two directions the user does not fully
// control: whatever is already in device storage, and whatever is in an
// imported file. Both go through here, so the screen only ever renders bounded,
// trimmed strings. Pure and native-free so it can be tested in Node.

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  // Collapse newline runs so a paste-bomb cannot stretch the card forever, but
  // keep single newlines — people write these as short stanzas.
  const normalized = value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return normalized.slice(0, IDENTITY_TEXT_LIMIT);
}

function cleanValues(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const label = entry.replace(/\s+/g, " ").trim().slice(0, IDENTITY_VALUE_LIMIT);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= IDENTITY_MAX_VALUES) break;
  }
  return out;
}

/**
 * Coerce anything into a usable IdentityProfile. Missing or malformed fields
 * fall back to Signal's defaults rather than rendering blank — an empty
 * Identity screen is worse than a generic one.
 */
export function sanitizeIdentity(raw: unknown, fallback: IdentityProfile = defaultIdentity): IdentityProfile {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return fallback;

  const source = raw as Partial<Record<keyof IdentityProfile, unknown>>;
  return {
    why: cleanText(source.why, fallback.why),
    becoming: cleanText(source.becoming, fallback.becoming),
    protects: cleanText(source.protects, fallback.protects),
    values: cleanValues(source.values, fallback.values),
  };
}

/** True while a field still holds Signal's words rather than the user's. */
export function isDefaultIdentityField(identity: IdentityProfile, field: keyof Omit<IdentityProfile, "values">) {
  return identity[field].trim() === defaultIdentity[field].trim();
}

/** True when nothing on the screen has been personalised yet. */
export function isUntouchedIdentity(identity: IdentityProfile) {
  return (
    isDefaultIdentityField(identity, "why") &&
    isDefaultIdentityField(identity, "becoming") &&
    isDefaultIdentityField(identity, "protects") &&
    identity.values.join("|").toLowerCase() === defaultIdentity.values.join("|").toLowerCase()
  );
}

/** Add a value chip, ignoring blanks, duplicates, and anything past the cap. */
export function addIdentityValue(values: string[], candidate: string): string[] {
  const label = candidate.replace(/\s+/g, " ").trim().slice(0, IDENTITY_VALUE_LIMIT);
  if (!label) return values;
  if (values.length >= IDENTITY_MAX_VALUES) return values;
  if (values.some((existing) => existing.toLowerCase() === label.toLowerCase())) return values;
  return [...values, label];
}

export function removeIdentityValue(values: string[], label: string): string[] {
  return values.filter((existing) => existing !== label);
}
