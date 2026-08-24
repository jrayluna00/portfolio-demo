const CONTROL_RE =
  /\b([a-z]{2})[\s-]*(\d{1,2})(?:[\s().-]+(\d{1,2}))?\b/gi;

const RULE_RE = /\b([A-Z]{2,4}-[A-Z]{2,4}-[A-Z0-9]{2,6})\b/g;
const KSI_RE = /\b(KSI-[A-Z]{3}-[A-Z0-9]{2,6})\b/gi;

export function nistId(family: string, number: string, enhancement?: string): string {
  const fam = family.toLowerCase();
  const num = String(Number(number));
  if (enhancement) return `${fam}-${num}.${Number(enhancement)}`;
  return `${fam}-${num}`;
}

export function displayControlId(id: string): string {
  const m = id
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .match(/^([a-z]{2})-(\d+)(?:[.-](\d+))?$/);
  if (!m) return id.toUpperCase();
  const base = `${m[1].toUpperCase()}-${Number(m[2])}`;
  return m[3] ? `${base}(${Number(m[3])})` : base;
}

export function normalizeControlId(raw: string): string | null {
  const compact = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m = compact.match(/^([a-z]{2})-?(\d{1,2})(?:[\s().-]+(\d{1,2}))?$/);
  if (!m) return null;
  return nistId(m[1], m[2], m[3]);
}

export function extractControlIds(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(CONTROL_RE)) {
    const family = match[1].toLowerCase();
    if (!CONTROL_FAMILIES.has(family)) continue;
    found.add(nistId(family, match[2], match[3]));
  }
  return [...found];
}

export function extractRuleIds(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(RULE_RE)) {
    found.add(match[1].toUpperCase());
  }
  for (const match of text.matchAll(KSI_RE)) {
    found.add(match[1].toUpperCase());
  }
  return [...found];
}

export function fedrampCtlToNist(id: string): string {
  const m = id.trim().toUpperCase().match(/^([A-Z]+)-(\d+)(?:-(\d+))?$/);
  if (!m) return id.toLowerCase();
  return nistId(m[1], m[2], m[3]);
}

const CONTROL_FAMILIES = new Set([
  "ac",
  "at",
  "au",
  "ca",
  "cm",
  "cp",
  "ia",
  "ir",
  "ma",
  "mp",
  "pe",
  "pl",
  "pm",
  "ps",
  "pt",
  "ra",
  "sa",
  "sc",
  "si",
  "sr",
]);
