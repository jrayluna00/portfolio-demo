/** Terms that qualify an item for the curated latest-news stream. */
export const COMPLIANCE_KEYWORDS = [
  "fedramp",
  "fisma",
  "cmmc",
  "il6",
  "il-6",
  "il5",
  "il-5",
  "impact level",
  "nist 800-53",
  "nist 800-171",
  "sp 800-53",
  "sp 800-171",
  "800-53",
  "800-171",
  "dfars",
  "controlled unclassified",
  " cui",
  "cui ",
  "authority to operate",
  "authorization to operate",
  " ato",
  "rev5",
  "rev 5",
  "20x",
  "binding operational directive",
  "emergency directive",
  "cyber accreditation",
  "c3pao",
  "defense industrial base",
  "federal information security",
  "continuous monitoring",
  "conmon",
  "authorization boundary",
  "ssp",
  "poam",
  "poa&m",
  "cisa",
  "federal agencies",
  "gsa",
  "cloud service",
] as const;

const CRITICAL_TERMS = [
  "ban",
  "banned",
  "prohibit",
  "prohibition",
  "prohibited",
  "foreign adversary",
  "adversary-controlled",
  "chinese model",
  "chinese ai",
  "china-based",
  "prc",
  "covered nation",
  "national security risk",
  "must not use",
  "shall not use",
];

const HIGH_TERMS = [
  "require",
  "requirement",
  "mandate",
  "mandatory",
  "deadline",
  "suspend",
  "suspension",
  "rescind",
  "guidance",
  "rulemaking",
  "final rule",
  "proposed rule",
  "rfc",
  "bod",
  "emergency directive",
  "policy",
];

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchesAny(haystack: string, needles: readonly string[]): string[] {
  const text = normalizeText(haystack);
  return needles.filter((needle) => text.includes(needle.toLowerCase()));
}

export function isComplianceItem(item: {
  title: string;
  summary: string;
  sourceId?: string;
}): boolean {
  if (item.sourceId === "fedramp" || item.sourceId === "cmmc") return true;
  return matchesAny(`${item.title} ${item.summary}`, COMPLIANCE_KEYWORDS).length > 0;
}

export function severityFromText(text: string): "Critical" | "High" | "Watch" | null {
  const haystack = normalizeText(text);
  if (CRITICAL_TERMS.some((term) => haystack.includes(term))) return "Critical";
  if (HIGH_TERMS.some((term) => haystack.includes(term))) return "High";
  return null;
}
