export const RELATIONSHIP_TYPES = [
  { value: "current_owner", label: "Current owner" },
  { value: "previous_owner", label: "Previous owner" },
  { value: "family_member", label: "Family member" },
  { value: "other", label: "Other" },
] as const;

export const RELATIONSHIP_TYPE_VALUES: ReadonlySet<string> = new Set(
  RELATIONSHIP_TYPES.map((t) => t.value),
);

export const RELATIONSHIP_LABELS: Record<string, string> = Object.fromEntries(
  RELATIONSHIP_TYPES.map((t) => [t.value, t.label]),
);

export const PROOF_DOCUMENT_TYPES = [
  { value: "title", label: "Title" },
  { value: "registration", label: "Registration" },
  { value: "bill_of_sale", label: "Bill of sale" },
  { value: "insurance", label: "Insurance card" },
  { value: "other", label: "Other" },
] as const;
