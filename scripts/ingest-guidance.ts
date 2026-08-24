import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { displayControlId, extractControlIds, extractRuleIds, fedrampCtlToNist } from "../src/lib/guidance/ids.ts";
import type {
  Audience,
  CertificationTrack,
  Chunk,
  ControlRecord,
  DefinitionRecord,
  GuidanceSnapshot,
  GuidanceSource,
  KsiRecord,
  LifecycleStage,
  RuleRecord,
} from "../src/lib/guidance/types.ts";

const USER_AGENT =
  "ComplianceBrief/1.0 (+https://github.com/jrayluna00/portfolio-demo; FedRAMP/NIST guidance ingest)";
const TIMEOUT_MS = 90_000;

const NIST_CATALOG_URL =
  "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json";
const RULES_URL =
  "https://raw.githubusercontent.com/FedRAMP/rules/main/fedramp-consolidated-rules.json";
const MARKDOWN_REPO = "https://github.com/FedRAMP/2026-markdown.git";

const BASELINE_PROFILES = [
  {
    key: "low" as const,
    url: "https://raw.githubusercontent.com/OSCAL-Foundation/fedramp-resources/main/baselines/rev5/json/FedRAMP_rev5_LOW-baseline_profile.json",
  },
  {
    key: "moderate" as const,
    url: "https://raw.githubusercontent.com/OSCAL-Foundation/fedramp-resources/main/baselines/rev5/json/FedRAMP_rev5_MODERATE-baseline_profile.json",
  },
  {
    key: "high" as const,
    url: "https://raw.githubusercontent.com/OSCAL-Foundation/fedramp-resources/main/baselines/rev5/json/FedRAMP_rev5_HIGH-baseline_profile.json",
  },
  {
    key: "lisaas" as const,
    url: "https://raw.githubusercontent.com/OSCAL-Foundation/fedramp-resources/main/baselines/rev5/json/FedRAMP_rev5_LI-SaaS-baseline_profile.json",
  },
];

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return response.json();
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function proseOf(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(proseOf).filter(Boolean).join(" ");
  const rec = asRecord(node);
  const parts = [textOf(rec.prose), ...asArray(rec.parts).map(proseOf)];
  return parts.filter(Boolean).join(" ");
}

function substituteParams(text: string, params: Map<string, string>): string {
  return text.replace(/\{\{\s*insert:\s*param,\s*([^}]+?)\s*\}\}/g, (_, id: string) => {
    const key = id.trim();
    return `[assignment: ${params.get(key) ?? key}]`;
  });
}

function namedPart(parts: unknown[], name: string): unknown | undefined {
  return parts.find((part) => asRecord(part).name === name);
}

function walkNamed(parts: unknown[], name: string, found: unknown[] = []): unknown[] {
  for (const part of parts) {
    const rec = asRecord(part);
    if (rec.name === name) found.push(part);
    walkNamed(asArray(rec.parts), name, found);
  }
  return found;
}

function paramMap(params: unknown[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const param of params) {
    const rec = asRecord(param);
    const id = textOf(rec.id);
    const label = textOf(rec.label);
    const choices = asRecord(rec.select).choice;
    const choiceText = Array.isArray(choices) ? choices.map(textOf).filter(Boolean).join(" | ") : "";
    const guideline = proseOf(rec.guidelines);
    map.set(id, collapse(label || choiceText || guideline || id));
  }
  return map;
}

function assessmentMethods(parts: unknown[]): string[] {
  const methods = new Set<string>();
  for (const method of walkNamed(parts, "assessment-method")) {
    const rec = asRecord(method);
    for (const prop of asArray(rec.props)) {
      const p = asRecord(prop);
      if (p.name === "method" && typeof p.value === "string") methods.add(p.value);
    }
  }
  return [...methods];
}

function assessmentObjectives(parts: unknown[], params: Map<string, string>, limit = 5): string[] {
  const objs: string[] = [];
  for (const obj of walkNamed(parts, "assessment-objective")) {
    const text = collapse(substituteParams(proseOf(obj), params));
    if (text) objs.push(text.slice(0, 280));
    if (objs.length >= limit) break;
  }
  return objs;
}

function compactControl(
  rec: Json,
  family: string,
  parent: string | null,
  baselines: Record<string, Set<string>>,
  overlays: Map<string, { guidance: string[]; parameters: string[] }>,
): ControlRecord[] {
  const id = textOf(rec.id);
  if (!id) return [];
  const parts = asArray(rec.parts);
  const params = paramMap(asArray(rec.params));
  const statement = collapse(
    substituteParams(proseOf(namedPart(parts, "statement")), params),
  ).slice(0, 1400);
  const guidance = collapse(proseOf(namedPart(parts, "guidance"))).slice(0, 700);
  const overlay = overlays.get(id) ?? overlays.get(id.replace(".", "-"));
  const record: ControlRecord = {
    id,
    displayId: displayControlId(id),
    title: textOf(rec.title),
    family,
    parent,
    statement,
    guidance,
    methods: assessmentMethods(parts),
    objectives: assessmentObjectives(parts, params),
    baselines: {
      low: baselines.low.has(id),
      moderate: baselines.moderate.has(id),
      high: baselines.high.has(id),
      lisaas: baselines.lisaas.has(id),
    },
    fedrampGuidance: overlay?.guidance ?? [],
    fedrampParameters: overlay?.parameters ?? [],
  };
  const nested = asArray(rec.controls).flatMap((child) =>
    compactControl(asRecord(child), family, id, baselines, overlays),
  );
  return [record, ...nested];
}

function profileControlIds(profileDoc: unknown): Set<string> {
  const ids = new Set<string>();
  const profile = asRecord(asRecord(profileDoc).profile);
  for (const imported of asArray(profile.imports)) {
    for (const include of asArray(asRecord(imported)["include-controls"])) {
      for (const id of asArray(asRecord(include)["with-ids"])) {
        if (typeof id === "string") ids.add(id);
      }
    }
  }
  return ids;
}

function siteUrlForMarkdown(relPath: string): string {
  const withoutExt = relPath.replace(/\.md$/, "");
  const cleaned = withoutExt.replace(/\/index$/, "/");
  return `https://www.fedramp.gov/2026/${cleaned}`.replace(/([^:]\/)\/+/g, "$1");
}

function inferTracks(text: string, relPath: string): CertificationTrack[] {
  const tracks = new Set<CertificationTrack>();
  if (relPath.includes("/20x/") || /\b20x\b/i.test(text)) tracks.add("20x");
  if (relPath.includes("/rev5/") || /\brev\s*5\b/i.test(text)) tracks.add("rev5");
  if (tracks.size === 0) {
    tracks.add("20x");
    tracks.add("rev5");
  }
  return [...tracks];
}

function inferAudiences(text: string, relPath: string): Audience[] {
  const audiences = new Set<Audience>();
  if (relPath.startsWith("assessors/") || /assessor/i.test(text)) audiences.add("Assessors");
  if (relPath.startsWith("providers/") || /cloud service provider/i.test(text)) audiences.add("Providers");
  if (relPath.startsWith("agencies/") || /agency/i.test(text)) audiences.add("Agencies");
  if (relPath.startsWith("advisors/")) audiences.add("Advisors");
  if (relPath.startsWith("responsibilities/fedramp") || relPath.startsWith("authority/")) {
    audiences.add("FedRAMP");
  }
  if (audiences.size === 0) {
    audiences.add("Assessors");
    audiences.add("Providers");
  }
  return [...audiences];
}

function inferLifecycle(text: string, relPath: string): LifecycleStage[] {
  const stages = new Set<LifecycleStage>();
  const hay = `${relPath} ${text}`.toLowerCase();
  if (/security assessment plan|\bsap\b/.test(hay)) stages.add("sap");
  if (/security assessment report|\bsar\b/.test(hay)) stages.add("sar");
  if (/system security plan|\bssp\b|security decision record|\bsdr\b/.test(hay)) stages.add("ssp");
  if (/certification package|package overview/.test(hay)) stages.add("package");
  if (/independent verification|assessment|examine|interview/.test(hay)) stages.add("testing");
  if (/continuous monitoring|conmon|annual/.test(hay)) stages.add("conmon");
  if (/significant change|\bscr\b|\bscn\b/.test(hay)) stages.add("change");
  if (/marketplace|sponsor|getting started|class/.test(hay)) stages.add("start");
  return [...stages];
}

function stripMarkdown(raw: string): { title: string; tags: string[]; body: string } {
  let text = raw;
  const tags: string[] = [];
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    const tagBlock = fm[1].match(/tags:\n((?:\s+-\s+.+\n)+)/);
    if (tagBlock) {
      for (const line of tagBlock[1].split("\n")) {
        const tag = line.replace(/^\s+-\s+/, "").trim();
        if (tag) tags.push(tag);
      }
    }
    text = text.slice(fm[0].length);
  }
  text = text
    .replace(/<span[\s\S]*?<\/span>/g, " ")
    .replace(/:[a-z0-9_-]+?:\{[^}]*\}/gi, " ")
    .replace(/\{[^}\n]*data-preview[^}\n]*\}/g, " ")
    .replace(/!!! \w+(?: "[^"]*")?\s*\n(?: {4}.+\n?)*/g, (block) =>
      collapse(block.replace(/!!! \w+(?: "[^"]*")?/, " ")),
    )
    .replace(/\?\?\? \w+ "[^"]+"\s*\n(?: {4}.+\n?)*/g, (block) => collapse(block.replace(/\?\?\? \w+ "[^"]+"/, " ")))
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*`|_]/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  return { title: titleMatch ? collapse(titleMatch[1]) : "", tags, body: collapse(text) };
}

function chunkMarkdown(relPath: string, raw: string): Chunk[] {
  if (relPath.startsWith("reference/")) return [];
  const base = relPath.split("/").pop() ?? "";
  if (base === "AGENTS.md" || base === "README.md") return [];

  const sections = raw.split(/\n(?=##\s+)/);
  const chunks: Chunk[] = [];
  const fileMeta = stripMarkdown(raw);
  const url = siteUrlForMarkdown(relPath);

  const pieces = sections.length ? sections : [raw];
  pieces.forEach((section, index) => {
    const cleaned = stripMarkdown(index === 0 ? raw.split(/\n(?=##\s+)/)[0] ?? section : `---\n---\n${section}`);
    const title =
      (section.match(/^##\s+(.+)$/m)?.[1] ?? fileMeta.title ?? relPath).replace(/\{#[^}]+\}/g, "").trim() ||
      fileMeta.title;
    let text = cleaned.body;
    if (text.length < 80) return;
    if (text.length > 1800) text = `${text.slice(0, 1800)}…`;
    const blob = `${title} ${text}`;
    chunks.push({
      id: `${relPath}:${index}`,
      kind: "narrative",
      title,
      text,
      url,
      path: relPath,
      tracks: inferTracks(blob, relPath),
      audiences: inferAudiences(blob, relPath),
      lifecycle: inferLifecycle(blob, relPath),
      controlIds: extractControlIds(blob),
      ruleIds: extractRuleIds(blob),
      tags: fileMeta.tags,
    });
  });
  return chunks;
}

async function collectMarkdown(root: string, rel = ""): Promise<Chunk[]> {
  const dir = join(root, rel);
  const entries = await readdir(dir, { withFileTypes: true });
  const chunks: Chunk[] = [];
  for (const entry of entries) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "reference") continue;
      chunks.push(...(await collectMarkdown(root, child)));
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const raw = await readFile(join(root, child), "utf8");
    chunks.push(...chunkMarkdown(child, raw));
  }
  return chunks;
}

function flattenRules(doc: Json): { rules: RuleRecord[]; ksis: KsiRecord[]; definitions: DefinitionRecord[] } {
  const rules: RuleRecord[] = [];
  const frr = asRecord(doc.FRR);
  for (const [code, rulesetRaw] of Object.entries(frr)) {
    const ruleset = asRecord(rulesetRaw);
    const meta = asRecord(ruleset.info);
    const web = textOf(meta.web_name) || code.toLowerCase();
    const url = `https://www.fedramp.gov/2026/reference/${web}/`;
    const data = asRecord(ruleset.data);
    for (const [trackKey, subsetsRaw] of Object.entries(data)) {
      const track: CertificationTrack[] =
        trackKey === "20x" ? ["20x"] : trackKey === "rev5" ? ["rev5"] : ["20x", "rev5"];
      const subsets = asRecord(subsetsRaw);
      for (const [subset, subsetRulesRaw] of Object.entries(subsets)) {
        const subsetRules = asRecord(subsetRulesRaw);
        for (const [id, ruleRaw] of Object.entries(subsetRules)) {
          const rule = asRecord(ruleRaw);
          const following = asArray(rule.following_information).map((item) => String(item));
          const statement = collapse(
            [textOf(rule.statement), following.length ? following.join(" ") : ""].filter(Boolean).join(" "),
          );
          const existing = rules.find((item) => item.id === id);
          if (existing) {
            for (const t of track) {
              if (!existing.tracks.includes(t)) existing.tracks.push(t);
            }
            continue;
          }
          const affects = asArray(rule.affects).map((item) => String(item)) as Audience[];
          rules.push({
            id,
            name: textOf(rule.name) || id,
            statement: statement.slice(0, 1600),
            force: textOf(rule.force),
            note: textOf(rule.note) || undefined,
            following,
            related: asArray(rule.related).map((item) => String(item)),
            ruleset: textOf(meta.short_name) || code,
            rulesetName: textOf(meta.name) || code,
            subset,
            tracks: [...track],
            audiences: affects.length ? affects : ["Providers"],
            url,
          });
        }
      }
    }
  }

  const ksis: KsiRecord[] = [];
  for (const familyRaw of Object.values(asRecord(doc.KSI))) {
    const family = asRecord(familyRaw);
    const familyId = textOf(family.id) || textOf(family.short_name);
    const familyName = textOf(family.name);
    const web = textOf(family.web_name);
    const url = `https://www.fedramp.gov/2026/providers/20x/key-security-indicators/${web}/`;
    for (const [id, indicatorRaw] of Object.entries(asRecord(family.indicators))) {
      const indicator = asRecord(indicatorRaw);
      ksis.push({
        id,
        name: textOf(indicator.name) || id,
        familyId,
        familyName,
        statement: collapse(textOf(indicator.statement)).slice(0, 1200),
        controls: asArray(indicator.controls).map((item) => String(item)),
        url,
      });
    }
  }

  const definitions: DefinitionRecord[] = [];
  const frdAll = asRecord(asRecord(asRecord(doc.FRD).data).all);
  for (const [id, defRaw] of Object.entries(frdAll)) {
    const def = asRecord(defRaw);
    definitions.push({
      id,
      term: textOf(def.term) || id,
      definition: collapse(textOf(def.definition)).slice(0, 800),
      alts: asArray(def.alts).map((item) => String(item)),
    });
  }

  return { rules, ksis, definitions };
}

function ctlOverlays(doc: Json): Map<string, { guidance: string[]; parameters: string[] }> {
  const map = new Map<string, { guidance: string[]; parameters: string[] }>();
  for (const familyRaw of Object.values(asRecord(doc.CTL))) {
    const family = asRecord(familyRaw);
    for (const [ctlId, recRaw] of Object.entries(family)) {
      const rec = asRecord(recRaw);
      const nistId = fedrampCtlToNist(ctlId);
      const guidance = asArray(rec.guidance).map((item) => String(item));
      const parameters = asArray(rec.parameters).map((item) => {
        const param = asRecord(item);
        return `${textOf(param.parameterId)} = ${textOf(param.value)}`;
      });
      map.set(nistId, { guidance, parameters });
    }
  }
  return map;
}

function ruleChunks(rules: RuleRecord[]): Chunk[] {
  return rules.map((rule) => ({
    id: `rule:${rule.id}`,
    kind: "rule" as const,
    title: `${rule.id} ${rule.name}`,
    text: collapse([rule.statement, rule.note ?? "", rule.following.join(" ")].join(" ")),
    url: rule.url,
    tracks: rule.tracks,
    audiences: rule.audiences,
    lifecycle: inferLifecycle(`${rule.name} ${rule.statement}`, "rules"),
    controlIds: extractControlIds(`${rule.id} ${rule.statement}`),
    ruleIds: [rule.id, ...rule.related],
    tags: [rule.ruleset, rule.force].filter(Boolean),
  }));
}

function definitionChunks(defs: DefinitionRecord[]): Chunk[] {
  return defs.map((def) => ({
    id: `def:${def.id}`,
    kind: "definition" as const,
    title: def.term,
    text: def.definition,
    url: "https://www.fedramp.gov/2026/definitions/",
    tracks: ["20x", "rev5"] as CertificationTrack[],
    audiences: ["Assessors", "Providers", "Agencies"] as Audience[],
    lifecycle: inferLifecycle(def.term, "definitions"),
    controlIds: [],
    ruleIds: [def.id],
    tags: def.alts,
  }));
}

function ksiChunks(ksis: KsiRecord[]): Chunk[] {
  return ksis.map((ksi) => ({
    id: `ksi:${ksi.id}`,
    kind: "ksi" as const,
    title: `${ksi.id} ${ksi.name}`,
    text: ksi.statement,
    url: ksi.url,
    tracks: ["20x"] as CertificationTrack[],
    audiences: ["Assessors", "Providers"] as Audience[],
    lifecycle: ["testing", "package"],
    controlIds: ksi.controls,
    ruleIds: [ksi.id],
    tags: [ksi.familyName],
  }));
}

function controlMiniChunks(controls: ControlRecord[]): Chunk[] {
  return controls.map((control) => ({
    id: `control:${control.id}`,
    kind: "control" as const,
    title: `${control.displayId} ${control.title}`,
    text: collapse(
      [control.statement, control.guidance, control.fedrampGuidance.join(" ")].join(" "),
    ).slice(0, 900),
    url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    tracks: ["rev5", "20x"] as CertificationTrack[],
    audiences: ["Assessors", "Providers"] as Audience[],
    lifecycle: ["sap", "testing", "sar"],
    controlIds: [control.id],
    ruleIds: [],
    tags: [control.family],
  }));
}

async function cloneMarkdown(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "fedramp-md-"));
  execFileSync("git", ["clone", "--depth", "1", MARKDOWN_REPO, dir], { stdio: "inherit" });
  return dir;
}

async function main() {
  const sources: GuidanceSource[] = [];
  process.stdout.write("Fetching FedRAMP Consolidated Rules JSON...\n");
  const rulesDoc = asRecord(await fetchJson(RULES_URL));
  const rulesVersion = textOf(asRecord(rulesDoc.info).version) || null;
  sources.push({
    id: "fedramp-rules",
    title: textOf(asRecord(rulesDoc.info).title) || "FedRAMP Consolidated Rules for 2026",
    url: "https://github.com/FedRAMP/rules",
    version: rulesVersion ?? undefined,
  });
  const { rules, ksis, definitions } = flattenRules(rulesDoc);
  const overlays = ctlOverlays(rulesDoc);
  process.stdout.write(`  ${rules.length} rules · ${ksis.length} KSIs · ${definitions.length} definitions\n`);

  process.stdout.write("Fetching FedRAMP Rev5 baseline profiles...\n");
  const baselines: Record<string, Set<string>> = {
    low: new Set(),
    moderate: new Set(),
    high: new Set(),
    lisaas: new Set(),
  };
  for (const profile of BASELINE_PROFILES) {
    const doc = await fetchJson(profile.url);
    baselines[profile.key] = profileControlIds(doc);
    process.stdout.write(`  ${profile.key}: ${baselines[profile.key].size} controls\n`);
  }
  sources.push({
    id: "fedramp-baselines",
    title: "FedRAMP Rev5 OSCAL baseline profiles",
    url: "https://github.com/OSCAL-Foundation/fedramp-resources/tree/main/baselines/rev5",
  });

  process.stdout.write("Fetching NIST SP 800-53 / 800-53A OSCAL catalog...\n");
  const nistDoc = asRecord(await fetchJson(NIST_CATALOG_URL));
  const catalog = asRecord(nistDoc.catalog);
  const metadata = asRecord(catalog.metadata);
  const nistCatalogVersion = textOf(metadata.version) || null;
  const nistCatalogTitle = textOf(metadata.title) || null;
  const controls = asArray(catalog.groups).flatMap((groupRaw) => {
    const group = asRecord(groupRaw);
    const family = textOf(group.title) || textOf(group.id).toUpperCase();
    return asArray(group.controls).flatMap((control) =>
      compactControl(asRecord(control), family, null, baselines, overlays),
    );
  });
  sources.push({
    id: "nist-800-53",
    title: nistCatalogTitle || "NIST SP 800-53 Rev 5 / SP 800-53A",
    url: "https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5",
    version: nistCatalogVersion ?? undefined,
  });
  process.stdout.write(`  ${controls.length} controls and enhancements\n`);

  process.stdout.write("Cloning FedRAMP 2026 Markdown corpus...\n");
  const mdDir = await cloneMarkdown();
  let narrative: Chunk[] = [];
  try {
    narrative = await collectMarkdown(mdDir);
  } finally {
    await rm(mdDir, { recursive: true, force: true });
  }
  sources.push({
    id: "fedramp-2026-markdown",
    title: "FedRAMP Consolidated Rules for 2026 (Markdown corpus)",
    url: "https://github.com/FedRAMP/2026-markdown",
  });
  process.stdout.write(`  ${narrative.length} narrative chunks\n`);

  const chunks = [
    ...narrative,
    ...ruleChunks(rules),
    ...definitionChunks(definitions),
    ...ksiChunks(ksis),
    ...controlMiniChunks(controls),
  ];

  const snapshot: GuidanceSnapshot = {
    generatedAt: new Date().toISOString(),
    sources,
    rulesVersion,
    nistCatalogVersion,
    nistCatalogTitle,
    chunks,
    rules,
    definitions,
    ksis,
    controls,
  };

  const outPath = resolve(dirname(fileURLToPath(import.meta.url)), "../public/data/guidance.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(snapshot)}\n`);
  process.stdout.write(
    `Wrote ${outPath} (${Math.round(Buffer.byteLength(JSON.stringify(snapshot)) / 1024)} KB, ${chunks.length} chunks)\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
