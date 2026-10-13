// TODO: Replace every placeholder below with the real Förderverein data before going live.
export const FOERDERVEREIN = {
  name: "[Name des Fördervereins]",
  street: "[Straße Hausnummer]",
  city: "[PLZ Ort]",
  creditorId: "DE00ZZZ00000000000",
  yearlyFeeEur: 0,
  submitEndpoint: "/api/foerderverein",
} as const;

const IBAN_MIN_LENGTH = 15;
const IBAN_MAX_LENGTH = 34;
const IBAN_MOD = 97;
const LETTER_OFFSET = 55; // 'A' (65) → 10

/** Strips everything but letters and digits and upper-cases an IBAN. */
export function normalizeIban(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Groups an IBAN in blocks of four characters for display. */
export function formatIban(value: string): string {
  return normalizeIban(value).replace(/(.{4})/g, "$1 ").trim();
}

/** Validates an IBAN using format and ISO 7064 mod-97 checksum. */
export function isValidIban(value: string): boolean {
  const iban = normalizeIban(value);
  if (iban.length < IBAN_MIN_LENGTH || iban.length > IBAN_MAX_LENGTH) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = /\d/.test(char) ? char : String(char.charCodeAt(0) - LETTER_OFFSET);
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % IBAN_MOD;
    }
  }
  return remainder === 1;
}

/** Masks the middle of an IBAN for display, e.g. "DE89 **** **** **** **** 00". */
export function maskIban(value: string): string {
  const iban = normalizeIban(value);
  const masked = iban.slice(0, 4) + "*".repeat(Math.max(iban.length - 6, 0)) + iban.slice(-2);
  return masked.replace(/(.{4})/g, "$1 ").trim();
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}
