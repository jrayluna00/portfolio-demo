import type {
  Audience,
  CertificationTrack,
  Chunk,
  GuidanceSnapshot,
  LifecycleStage,
  ParsedQuery,
  RankedHit,
} from "./types";
import { extractControlIds, extractRuleIds } from "./ids";

const STOP = new Set([
  "a",
  "an",
  "the",
  "of",
  "for",
  "to",
  "in",
  "on",
  "and",
  "or",
  "is",
  "are",
  "be",
  "by",
  "as",
  "at",
  "it",
  "if",
  "with",
  "from",
  "that",
  "this",
  "what",
  "when",
  "how",
  "does",
  "do",
  "i",
  "we",
  "our",
  "still",
  "need",
  "into",
]);

const SYNONYMS: Record<string, string[]> = {
  sap: ["security assessment plan", "assessment plan", "iv&v", "independent verification"],
  sar: ["security assessment report", "assessment report", "certification package"],
  ssp: ["system security plan", "security decision record", "sdr", "certification package overview"],
  sdr: ["security decision record", "system security plan"],
  poam: ["poa&m", "plan of action", "vulnerability", "ret", "risk exposure"],
  "poa&m": ["poam", "plan of action", "vulnerability"],
  "3pao": ["assessor", "independent assessor", "independent assessment", "iv&v"],
  ato: ["authorization", "certification", "authority to operate"],
  ksi: ["key security indicator"],
  ivv: ["independent verification", "independent validation", "iv&v"],
  "iv&v": ["independent verification", "independent validation", "ivv"],
  conmon: ["continuous monitoring", "collaborative continuous monitoring"],
  inheritance: ["leveraged", "inherited", "customer responsibility", "mas"],
  baseline: ["low", "moderate", "high", "li-saas"],
};

const LIFECYCLE_TERMS: { stage: LifecycleStage; terms: string[] }[] = [
  { stage: "sap", terms: ["sap", "security assessment plan", "assessment plan", "test case", "rules of engagement"] },
  { stage: "sar", terms: ["sar", "security assessment report", "assessment report", "ret", "risk exposure"] },
  { stage: "ssp", terms: ["ssp", "system security plan", "sdr", "security decision record", "control implementation"] },
  { stage: "package", terms: ["package", "certification package", "authorization package", "submit", "submission"] },
  { stage: "testing", terms: ["test", "testing", "examine", "interview", "sample", "evidence", "penetration"] },
  { stage: "conmon", terms: ["conmon", "continuous monitoring", "annual assessment", "ocr"] },
  { stage: "change", terms: ["significant change", "scr", "scn"] },
  { stage: "start", terms: ["ready", "kickoff", "sponsor", "path", "class"] },
];

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9&+-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

export function parseQuery(raw: string): ParsedQuery {
  const normalized = raw.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const tokens = tokenize(normalized);
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const extra of SYNONYMS[token] ?? []) {
      for (const piece of tokenize(extra)) expanded.add(piece);
    }
  }
  for (const [key, extras] of Object.entries(SYNONYMS)) {
    if (lower.includes(key)) {
      expanded.add(key);
      for (const extra of extras) {
        for (const piece of tokenize(extra)) expanded.add(piece);
      }
    }
  }

  const tracks: CertificationTrack[] = [];
  if (/\b20x\b|class [abcd]\b|key security indicator|\bksi\b/.test(lower)) tracks.push("20x");
  if (/\brev\s*5\b|revision 5|agency.sponsor|3pao|\bsap\b|\bsar\b|\bssp\b/.test(lower)) {
    tracks.push("rev5");
  }

  const audiences: Audience[] = [];
  if (/assessor|3pao|iv&v|independent verification/.test(lower)) audiences.push("Assessors");
  if (/\bcsp\b|provider|cloud service/.test(lower)) audiences.push("Providers");
  if (/agency|authorizing official|\bao\b|sponsor/.test(lower)) audiences.push("Agencies");

  const lifecycle = LIFECYCLE_TERMS.filter((entry) =>
    entry.terms.some((term) => lower.includes(term)),
  ).map((entry) => entry.stage);

  return {
    raw,
    normalized,
    tokens,
    expanded: [...expanded],
    controlIds: extractControlIds(normalized),
    ruleIds: extractRuleIds(normalized),
    tracks,
    audiences,
    lifecycle,
  };
}

export type SearchIndex = {
  avgDl: number;
  idf: Map<string, number>;
  lengths: number[];
};

export function buildIndex(chunks: Chunk[]): SearchIndex {
  const df = new Map<string, number>();
  const lengths: number[] = [];
  for (const chunk of chunks) {
    const terms = new Set(tokenize(`${chunk.title} ${chunk.text}`));
    lengths.push(tokenize(`${chunk.title} ${chunk.text}`).length || 1);
    for (const term of terms) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const n = chunks.length || 1;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n - count + 0.5) / (count + 0.5) + 1));
  }
  const avgDl = lengths.reduce((sum, length) => sum + length, 0) / n || 1;
  return { avgDl, idf, lengths };
}

function bm25(tokens: string[], tf: Map<string, number>, dl: number, index: SearchIndex): number {
  const k1 = 1.2;
  const b = 0.75;
  let score = 0;
  for (const token of tokens) {
    const freq = tf.get(token) ?? 0;
    if (!freq) continue;
    const idf = index.idf.get(token) ?? 0;
    score += (idf * (freq * (k1 + 1))) / (freq + k1 * (1 - b + (b * dl) / index.avgDl));
  }
  return score;
}

function termFreq(text: string): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokenize(text)) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

export function searchChunks(
  query: ParsedQuery,
  snapshot: GuidanceSnapshot,
  index: SearchIndex,
  limit = 12,
): RankedHit[] {
  const ranked: RankedHit[] = [];
  const expanded = query.expanded;

  snapshot.chunks.forEach((chunk, i) => {
    const blob = `${chunk.title} ${chunk.text}`;
    const tf = termFreq(blob);
    let score = bm25(expanded, tf, index.lengths[i] ?? 1, index);
    const lowerTitle = chunk.title.toLowerCase();
    const lowerText = chunk.text.toLowerCase();

    for (const id of query.controlIds) {
      if (chunk.controlIds.includes(id) || lowerText.includes(id)) score += 10;
    }
    for (const id of query.ruleIds) {
      if (chunk.ruleIds.includes(id) || chunk.text.includes(id) || chunk.title.includes(id)) {
        score += 12;
      }
    }
    for (const token of query.tokens) {
      if (lowerTitle.includes(token)) score += 2.2;
    }
    if (query.lifecycle.some((stage) => chunk.lifecycle.includes(stage))) score += 3;
    if (query.tracks.length && query.tracks.some((track) => chunk.tracks.includes(track))) {
      score += 1.4;
    }
    if (query.audiences.some((audience) => chunk.audiences.includes(audience))) score += 1.2;
    if (chunk.kind === "playbook" && query.lifecycle.some((stage) => chunk.lifecycle.includes(stage))) {
      score += 4;
    }
    if (score > 0) ranked.push({ chunk, score });
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}
