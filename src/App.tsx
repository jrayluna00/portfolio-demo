import { useEffect, useMemo, useState } from "react";
import customers from "./data/customers.json";
import { FeedList } from "./components/FeedList";
import { GuidanceDesk } from "./components/GuidanceDesk";
import { Header } from "./components/Header";
import { ImpactSidebar } from "./components/ImpactSidebar";
import { SourceCard } from "./components/SourceCard";
import { briefQuestion } from "./lib/guidance/expert";
import { withPlaybook } from "./lib/guidance/playbook";
import { buildIndex } from "./lib/guidance/search";
import type { ExpertBriefing, GuidanceSnapshot } from "./lib/guidance/types";
import { analyzeImpacts, withSeededExample } from "./lib/impact";
import { isComplianceItem } from "./lib/keywords";
import type { Customer, FeedItem, FeedSnapshot } from "./lib/types";

const customerProfiles = customers as Customer[];

const EMPTY_GUIDANCE: GuidanceSnapshot = {
  generatedAt: new Date(0).toISOString(),
  sources: [],
  rulesVersion: null,
  nistCatalogVersion: null,
  nistCatalogTitle: null,
  chunks: [],
  rules: [],
  definitions: [],
  ksis: [],
  controls: [],
};

function newestItem(items: FeedItem[]): FeedItem | undefined {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )[0];
}

function deskFromHash(): "news" | "guidance" {
  return window.location.hash.startsWith("#guidance") ? "guidance" : "news";
}

export default function App() {
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [desk, setDesk] = useState<"news" | "guidance">(deskFromHash);
  const [guidance, setGuidance] = useState<GuidanceSnapshot | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [briefing, setBriefing] = useState<ExpertBriefing | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/feeds.json`;
    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${url} (${response.status})`);
        }
        return (await response.json()) as FeedSnapshot;
      })
      .then(setSnapshot)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load feeds");
      });
  }, []);

  useEffect(() => {
    const onHash = () => setDesk(deskFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (desk !== "guidance" || guidance) return;
    setGuidanceLoading(true);
    const url = `${import.meta.env.BASE_URL}data/guidance.json`;
    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${url} (${response.status}). Run npm run ingest:guidance.`);
        }
        return (await response.json()) as GuidanceSnapshot;
      })
      .then(setGuidance)
      .catch((err: unknown) => {
        setGuidanceError(err instanceof Error ? err.message : "Failed to load guidance corpus");
        setGuidance(EMPTY_GUIDANCE);
      })
      .finally(() => setGuidanceLoading(false));
  }, [desk, guidance]);

  const latest = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.sources
      .flatMap((source) => source.items)
      .filter(isComplianceItem)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [snapshot]);

  const alerts = useMemo(() => {
    const live = analyzeImpacts(latest, customerProfiles);
    return withSeededExample(live).slice(0, 12);
  }, [latest]);

  const indexed = useMemo(() => {
    const corpus = withPlaybook(guidance ?? EMPTY_GUIDANCE);
    return { corpus, index: buildIndex(corpus.chunks) };
  }, [guidance]);

  function ask(next?: string) {
    const text = (next ?? question).trim();
    if (!text) return;
    setBusy(true);
    setQuestion(text);
    try {
      setBriefing(briefQuestion(text, indexed.corpus, indexed.index));
    } finally {
      setBusy(false);
    }
  }

  const generatedAt =
    desk === "guidance" ? (guidance?.generatedAt ?? snapshot?.generatedAt) : snapshot?.generatedAt;

  const corpusNote = guidance
    ? `Rules ${guidance.rulesVersion ?? "unknown"} · NIST ${guidance.nistCatalogVersion ?? "800-53"} · ${guidance.controls.length} controls`
    : null;

  return (
    <div id="top" className="page">
      <Header generatedAt={generatedAt} desk={desk} />
      {desk === "guidance" ? (
        <div className="shell shell--desk">
          <GuidanceDesk
            briefing={briefing}
            error={guidanceError}
            loading={guidanceLoading}
            busy={busy}
            corpusNote={corpusNote}
            question={question}
            onQuestionChange={setQuestion}
            onAsk={ask}
          />
        </div>
      ) : (
        <div className="shell">
          <div className="main-col">
            <section className="top-feed" aria-labelledby="top-feed-heading">
              <h2 id="top-feed-heading">Top News Feed</h2>
              {error ? <p className="banner banner--error">{error}. Run npm run ingest.</p> : null}
              <div className="source-grid">
                {(snapshot?.sources ??
                  Array.from({ length: 6 }, (_, i) => ({
                    id: `placeholder-${i}`,
                    label: "Loading…",
                    status: "ok" as const,
                    items: [],
                  }))).map((source) => (
                  <SourceCard key={source.id} source={source} item={newestItem(source.items)} />
                ))}
              </div>
            </section>

            <section className="latest" aria-labelledby="latest-heading">
              <h2 id="latest-heading">Latest news feed / Analysis / Impact on Customers</h2>
              <FeedList items={latest} />
            </section>
          </div>
          <ImpactSidebar alerts={alerts} />
        </div>
      )}
    </div>
  );
}
