import { defaultIdentity } from "@/data/signal-data";
import { IDENTITY_MAX_VALUES, IDENTITY_TEXT_LIMIT, IDENTITY_VALUE_LIMIT } from "@/types/signal";
import {
  addIdentityValue,
  isDefaultIdentityField,
  isUntouchedIdentity,
  removeIdentityValue,
  sanitizeIdentity,
} from "@/utils/identity";

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, received ${String(actual)}`);
  }
}

// --- sanitize: garbage in, usable profile out ---------------------------------

assertEqual(sanitizeIdentity(null).why, defaultIdentity.why, "null falls back to defaults");
assertEqual(sanitizeIdentity(undefined).why, defaultIdentity.why);
assertEqual(sanitizeIdentity("a string").why, defaultIdentity.why);
assertEqual(sanitizeIdentity([]).why, defaultIdentity.why, "an array is not a profile");
assertEqual(sanitizeIdentity({}).becoming, defaultIdentity.becoming, "missing fields fall back");
assertEqual(sanitizeIdentity({ why: 42 }).why, defaultIdentity.why, "wrong type falls back");

// A partially written profile keeps what it has and defaults the rest.
const partial = sanitizeIdentity({ why: "  My own reason.  " });
assertEqual(partial.why, "My own reason.", "text is trimmed");
assertEqual(partial.protects, defaultIdentity.protects);

// Over-long text is clamped rather than rejected.
const long = sanitizeIdentity({ why: "x".repeat(IDENTITY_TEXT_LIMIT + 500) });
assertEqual(long.why.length, IDENTITY_TEXT_LIMIT, "text clamps to the limit");

// Newline runs collapse so a paste cannot stretch the card forever, but a
// single blank line between stanzas survives.
assertEqual(sanitizeIdentity({ why: "a\n\n\n\n\nb" }).why, "a\n\nb");
assertEqual(sanitizeIdentity({ why: "a\nb" }).why, "a\nb");
assertEqual(sanitizeIdentity({ why: "a\r\nb" }).why, "a\nb", "CRLF normalises");

// --- sanitize: values ---------------------------------------------------------

assertEqual(sanitizeIdentity({ values: "nope" }).values.join(","), defaultIdentity.values.join(","));
assertEqual(sanitizeIdentity({ values: [] }).values.length, 0, "an explicit empty list is respected");
assertEqual(sanitizeIdentity({ values: ["  Focus  ", 7, "", null] }).values.join(","), "Focus", "junk entries drop");
assertEqual(sanitizeIdentity({ values: ["Focus", "focus", "FOCUS"] }).values.join(","), "Focus", "dedupe is case-insensitive");
assertEqual(sanitizeIdentity({ values: ["a  b   c"] }).values[0], "a b c", "inner whitespace collapses");
assertEqual(sanitizeIdentity({ values: ["y".repeat(60)] }).values[0].length, IDENTITY_VALUE_LIMIT, "labels clamp");
assertEqual(
  sanitizeIdentity({ values: Array.from({ length: 40 }, (_, i) => `v${i}`) }).values.length,
  IDENTITY_MAX_VALUES,
  "value count is capped",
);

// --- add / remove -------------------------------------------------------------

assertEqual(addIdentityValue([], "Sleep").join(","), "Sleep");
assertEqual(addIdentityValue(["Sleep"], "  ").join(","), "Sleep", "blank is ignored");
assertEqual(addIdentityValue(["Sleep"], "sleep").join(","), "Sleep", "duplicate is ignored, case-insensitively");
assertEqual(addIdentityValue(["Sleep"], "Focus").join(","), "Sleep,Focus", "appends in order");
assertEqual(
  addIdentityValue(Array.from({ length: IDENTITY_MAX_VALUES }, (_, i) => `v${i}`), "extra").length,
  IDENTITY_MAX_VALUES,
  "cannot exceed the cap",
);
assertEqual(removeIdentityValue(["Sleep", "Focus"], "Sleep").join(","), "Focus");
assertEqual(removeIdentityValue(["Sleep"], "missing").join(","), "Sleep", "removing an absent value is a no-op");

// --- default detection --------------------------------------------------------

assertEqual(isUntouchedIdentity(defaultIdentity), true, "the seeded profile counts as untouched");
assertEqual(isUntouchedIdentity({ ...defaultIdentity, why: "Mine." }), false, "one edited field is enough");
assertEqual(isUntouchedIdentity({ ...defaultIdentity, values: ["Only this"] }), false, "edited values count too");
assertEqual(isDefaultIdentityField(defaultIdentity, "why"), true);
assertEqual(isDefaultIdentityField({ ...defaultIdentity, why: "Mine." }, "why"), false);
// Whitespace-only differences should not read as personalised.
assertEqual(isDefaultIdentityField({ ...defaultIdentity, why: `  ${defaultIdentity.why}  ` }, "why"), true);

// Round-tripping the defaults through sanitize must not mark them as edited.
assertEqual(isUntouchedIdentity(sanitizeIdentity(defaultIdentity)), true);

console.log("identity tests passed");
