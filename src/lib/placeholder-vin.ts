// Placeholder VINs for vehicles where the owner doesn't have a real VIN
// (lost paperwork, very old cars, etc). Real VINs never contain I, O, or Q
// (they're excluded from the standard because they're easily confused with
// 1 and 0). Every placeholder starts with "NOVIN", which already contains
// an O and an I — so a placeholder can never collide with, or be mistaken
// for, a real manufacturer-assigned VIN. This lets it live in the same
// `vin varchar(17) unique not null` column with no schema change.

const RANDOM_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChars(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
  }
  return out;
}

function cleanChars(value: string | null | undefined, length: number): string {
  const cleaned = (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, length);
  return cleaned.padEnd(length, "X");
}

export function isPlaceholderVin(vin: string): boolean {
  return vin.startsWith("NOVIN");
}

export function buildPlaceholderVin(
  year: number | null,
  make: string,
  model: string | null,
): string {
  const yearPart = year ? String(year).slice(-2).padStart(2, "0") : "00";
  const makePart = cleanChars(make, 3);
  const modelPart = cleanChars(model, 3);
  const randomPart = randomChars(4);

  // NOVIN(5) + year(2) + make(3) + model(3) + random(4) = 17
  return `NOVIN${yearPart}${makePart}${modelPart}${randomPart}`;
}
