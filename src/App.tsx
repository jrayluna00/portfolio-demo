import { useEffect, useMemo, useState } from "react";
import customers from "./data/customers.json";
import { FeedList } from "./components/FeedList";
import { Header } from "./components/Header";
import { ImpactSidebar } from "./components/ImpactSidebar";
import { SourceCard } from "./components/SourceCard";
import { analyzeImpacts, withSeededExample } from "./lib/impact";
import { isComplianceItem } from "./lib/keywords";
import type { Customer, FeedItem, FeedSnapshot } from "./lib/types";

const customerProfiles = customers as Customer[];

function newestItem(items: FeedItem[]): FeedItem | undefined {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )[0];
}

export default function App() {
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div id="top" className="page">
      <Header generatedAt={snapshot?.generatedAt} />
      <div className="shell">
        <div className="main-col">
          <section className="top-feed" aria-labelledby="top-feed-heading">
            <h2 id="top-feed-heading">Top News Feed</h2>
            {error ? <p className="banner banner--error">{error}. Run npm run ingest.</p> : null}
            <div className="source-grid">
              {(snapshot?.sources ?? Array.from({ length: 6 }, (_, i) => ({
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
    </div>
  );
}
