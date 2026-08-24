import { PLAYBOOK } from "./playbook";
import { displayControlId } from "./ids";
import { parseQuery, searchChunks, type SearchIndex } from "./search";
import type {
  Citation,
  ControlBrief,
  ExpertBriefing,
  GuidanceSnapshot,
  OfficialQuote,
  ParsedQuery,
  PlaybookCard,
  RankedHit,
} from "./types";

function uniqueCitations(items: Citation[]): Citation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function playbookHits(query: ParsedQuery): PlaybookCard[] {
  const scored = PLAYBOOK.map((card) => {
    let score = 0;
    const hay = `${card.title} ${card.analysis} ${card.tags.join(" ")}`.toLowerCase();
    for (const token of query.tokens) {
      if (hay.includes(token)) score += 2;
    }
    for (const tag of card.tags) {
      if (query.normalized.toLowerCase().includes(tag)) score += 4;
    }
    if (query.lifecycle.some((stage) => card.lifecycle.includes(stage))) score += 6;
    if (query.tracks.some((track) => card.tracks.includes(track))) score += 1;
    return { card, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.card);

  if (scored.length > 0) return scored;
  return PLAYBOOK.filter((card) => card.id === "currency-2026");
}

function quotesFromSnapshot(query: ParsedQuery, snapshot: GuidanceSnapshot, hits: RankedHit[]): OfficialQuote[] {
  const quotes: OfficialQuote[] = [];
  const seen = new Set<string>();

  const push = (quote: OfficialQuote) => {
    if (seen.has(quote.id) || !quote.statement) return;
    seen.add(quote.id);
    quotes.push(quote);
  };

  for (const id of query.ruleIds) {
    const rule = snapshot.rules.find((item) => item.id === id);
    if (rule) {
      push({
        id: rule.id,
        name: rule.name,
        statement: rule.statement,
        force: rule.force,
        url: rule.url,
        kind: "rule",
      });
    }
    const ksi = snapshot.ksis.find((item) => item.id === id);
    if (ksi) {
      push({
        id: ksi.id,
        name: ksi.name,
        statement: ksi.statement,
        url: ksi.url,
        kind: "ksi",
      });
    }
  }

  const wantedRules = new Set(hits.flatMap((hit) => hit.chunk.ruleIds));
  if (/package|sap|sar|ssp|sdr|iv&v|ivv|assess/.test(query.normalized.toLowerCase())) {
    for (const id of ["FRC-CSO-PKG", "IVV-IAS-VIM"]) wantedRules.add(id);
  }

  for (const rule of snapshot.rules) {
    if (!wantedRules.has(rule.id)) continue;
    push({
      id: rule.id,
      name: rule.name,
      statement: rule.statement,
      force: rule.force,
      url: rule.url,
      kind: "rule",
    });
  }

  const hay = query.normalized.toLowerCase();
  for (const def of snapshot.definitions) {
    const names = [def.term, ...def.alts].map((value) => value.toLowerCase());
    if (names.some((name) => name.length > 3 && hay.includes(name))) {
      push({
        id: def.id,
        name: def.term,
        statement: def.definition,
        url: "https://www.fedramp.gov/2026/definitions/",
        kind: "definition",
      });
    }
  }

  for (const hit of hits) {
    if (hit.chunk.kind !== "narrative") continue;
    const snippet = hit.chunk.text.split(/\n+/).find((line) => line.length > 80) ?? hit.chunk.text;
    push({
      id: hit.chunk.id,
      name: hit.chunk.title,
      statement: snippet.slice(0, 600),
      url: hit.chunk.url,
      kind: "narrative",
    });
    if (quotes.filter((item) => item.kind === "narrative").length >= 3) break;
  }

  return quotes.slice(0, 8);
}

function controlBriefs(query: ParsedQuery, snapshot: GuidanceSnapshot): ControlBrief[] {
  return query.controlIds
    .map((id) => snapshot.controls.find((control) => control.id === id))
    .filter((control): control is NonNullable<typeof control> => Boolean(control))
    .map((control) => ({
      control,
      ksis: snapshot.ksis.filter((ksi) => ksi.controls.includes(control.id)).slice(0, 6),
    }));
}

function headlineFor(query: ParsedQuery, cards: PlaybookCard[], controls: ControlBrief[]): string {
  if (controls.length === 1) {
    const control = controls[0].control;
    return `${control.displayId} ${control.title} — official control and FedRAMP context`;
  }
  if (cards[0]) return cards[0].title;
  if (query.lifecycle.includes("sap")) return "Security Assessment Plan — current vs legacy path";
  if (query.lifecycle.includes("sar")) return "Security Assessment Report and certification package";
  return "FedRAMP and NIST 800-53 briefing";
}

function currencyNote(query: ParsedQuery): string {
  const sapOrSar = query.lifecycle.includes("sap") || query.lifecycle.includes("sar");
  if (sapOrSar) {
    return "Current: FedRAMP Consolidated Rules for 2026 (no standalone SAP/SAR for Program Certification). Legacy: agency-sponsored Rev5 may still require the archived SAP and SAR templates through 11 June 2027 for new Rev5 applications.";
  }
  return "Cited against the FedRAMP Consolidated Rules for 2026 and NIST SP 800-53 Rev 5.2.0 / SP 800-53A Rev 5.2.0. Pre-2026 FedRAMP templates are legacy unless an in-flight agency-sponsored Rev5 assessment still uses them.";
}

function analysisParagraphs(
  cards: PlaybookCard[],
  controls: ControlBrief[],
  quotes: OfficialQuote[],
): string[] {
  const paragraphs = cards.map((card) => card.analysis);
  if (controls.length) {
    paragraphs.push(
      controls
        .map((brief) => {
          const { control } = brief;
          const baseline = (
            [
              control.baselines.low ? "Low" : null,
              control.baselines.moderate ? "Moderate" : null,
              control.baselines.high ? "High" : null,
              control.baselines.lisaas ? "LI-SaaS" : null,
            ].filter(Boolean) as string[]
          ).join(", ");
          const methods = control.methods.length ? control.methods.join(", ") : "not listed in the compact catalog extract";
          const ksi = brief.ksis.length
            ? ` Mapped 20x Key Security Indicators: ${brief.ksis.map((item) => item.id).join(", ")}.`
            : "";
          const overlay = control.fedrampParameters.length
            ? ` FedRAMP parameter overlays: ${control.fedrampParameters.join("; ")}.`
            : "";
          return `${control.displayId} (${control.title}) is in the NIST SP 800-53 Rev 5.2.0 ${control.family} family${baseline ? ` and in FedRAMP Rev5 baseline(s): ${baseline}` : " but is not in the compact FedRAMP Rev5 baseline profiles ingested here"}. NIST SP 800-53A assessment methods: ${methods}. For a legacy SAP, these methods become the planned test cases; for 2026 Program Certification, use them as IV&V procedures and record results in the Security Decision Record rather than a standalone SAR.${ksi}${overlay}`;
        })
        .join("\n\n"),
    );
  }
  if (!paragraphs.length && quotes[0]) {
    paragraphs.push(
      `Official text below is the closest match in the ingested FedRAMP rules and NIST catalog. Read the cited source before you treat this as direction for a live package.`,
    );
  }
  return paragraphs.slice(0, 5);
}

export function briefQuestion(
  question: string,
  snapshot: GuidanceSnapshot,
  index: SearchIndex,
): ExpertBriefing {
  const query = parseQuery(question);
  const cards = playbookHits(query);
  const hits = searchChunks(query, snapshot, index, 10);
  const controls = controlBriefs(query, snapshot);
  const quotes = quotesFromSnapshot(query, snapshot, hits);
  const citations = uniqueCitations([
    ...cards.flatMap((card) => card.citations),
    ...quotes.map((quote) => ({
      title: `${quote.id} ${quote.name}`.trim(),
      url: quote.url,
      issuer: quote.kind === "narrative" ? "FedRAMP PMO" : quote.id.startsWith("KSI") || quote.id.startsWith("FR") || quote.id.includes("-") ? "FedRAMP PMO" : "NIST",
    })),
    ...controls.map((brief) => ({
      title: `NIST SP 800-53 Rev 5.2.0 ${brief.control.displayId} ${brief.control.title}`,
      url: `https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final`,
      issuer: "NIST",
      note: `Control ${displayControlId(brief.control.id)}`,
    })),
    {
      title: "FedRAMP Consolidated Rules for 2026",
      url: "https://www.fedramp.gov/2026/",
      issuer: "FedRAMP PMO",
      retrievedAt: snapshot.generatedAt,
    },
  ]);

  return {
    question,
    headline: headlineFor(query, cards, controls),
    currency: currencyNote(query),
    analysis: analysisParagraphs(cards, controls, quotes),
    quotes,
    controls,
    citations,
    hits,
    tracks: query.tracks,
    lifecycle: query.lifecycle,
  };
}
