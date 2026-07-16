const NHTSA_API_BASE =
  process.env.NHTSA_API_BASE ?? "https://vpic.nhtsa.dot.gov/api";

const VALID_VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export type VINDecodeResult = {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  engine: string | null;
  countryOfOrigin: string | null;
  rawData: Record<string, string>;
  isValid: boolean;
  errorMessage?: string;
};

type NHTSADecodeVinResponse = {
  Results?: Array<{ Variable: string; Value: string | null }>;
};

function sanitizeVIN(rawInput: string): string {
  return rawInput
    .trim()
    .replace(/[\s-]/g, "")
    .replace(/l/g, "1")
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/I/g, "1");
}

function invalidResult(vin: string, errorMessage: string): VINDecodeResult {
  return {
    vin,
    year: null,
    make: null,
    model: null,
    trim: null,
    bodyStyle: null,
    engine: null,
    countryOfOrigin: null,
    rawData: {},
    isValid: false,
    errorMessage,
  };
}

function toNullableString(value: string | null | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

function buildEngineString(
  displacementL: string | null | undefined,
  fuelTypePrimary: string | null | undefined,
): string | null {
  const parts: string[] = [];
  const displacement = toNullableString(displacementL);
  const fuelType = toNullableString(fuelTypePrimary);

  if (displacement) parts.push(`${displacement}L`);
  if (fuelType) parts.push(fuelType);

  return parts.length > 0 ? parts.join(" ") : null;
}

export async function decodeVIN(rawInput: string): Promise<VINDecodeResult> {
  const vin = sanitizeVIN(rawInput);

  if (!VALID_VIN_PATTERN.test(vin)) {
    return invalidResult(
      vin,
      "Invalid VIN — must be 17 characters using letters A-H, J-N, P, R-Z and digits 0-9",
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${NHTSA_API_BASE}/vehicles/DecodeVin/${vin}?format=json`,
    );
  } catch {
    return invalidResult(
      vin,
      "Unable to reach vehicle database — please try again",
    );
  }

  if (!response.ok) {
    return invalidResult(
      vin,
      "Unable to reach vehicle database — please try again",
    );
  }

  let data: NHTSADecodeVinResponse;
  try {
    data = await response.json();
  } catch {
    return invalidResult(
      vin,
      "Unable to reach vehicle database — please try again",
    );
  }

  const rawData: Record<string, string> = {};
  for (const item of data.Results ?? []) {
    if (item.Value) rawData[item.Variable] = item.Value;
  }

  const make = toNullableString(rawData["Make"]);
  if (!make) {
    return invalidResult(vin, "VIN not found in NHTSA database");
  }

  const yearRaw = toNullableString(rawData["Model Year"]);

  return {
    vin,
    year: yearRaw ? parseInt(yearRaw, 10) : null,
    make,
    model: toNullableString(rawData["Model"]),
    trim: toNullableString(rawData["Trim"]),
    bodyStyle: toNullableString(rawData["Body Class"]),
    engine: buildEngineString(
      rawData["Displacement (L)"],
      rawData["Fuel Type - Primary"],
    ),
    countryOfOrigin: toNullableString(rawData["Plant Country"]),
    rawData,
    isValid: true,
  };
}
