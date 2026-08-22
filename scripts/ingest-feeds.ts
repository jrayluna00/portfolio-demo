import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { isComplianceItem } from "../src/lib/keywords.ts";
import type { FeedItem, FeedSnapshot, FeedSource } from "../src/lib/types.ts";

const USER_AGENT =
  "ComplianceBrief/1.0 (+https://github.com/jrayluna00/portfolio-demo; compliance news aggregator)";
const TIMEOUT_MS = 20_000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  cdataPropName: "__cdata",
});

type SourceConfig = {
  id: string;
  label: string;
  note?: string;
  urls: string[];
  htmlFallbackUrl?: string;
  filterCompliance?: boolean;
};

const SOURCES: SourceConfig[] = [
  {
    id: "fedramp",
    label: "FedRAMP",
    urls: [
      "https://www.fedramp.gov/changelog/rss.xml",
      "https://fedramp.gov/changelog/rss.xml",
      "https://www.fedramp.gov/notices/rss.xml",
    ],
    htmlFallbackUrl: "https://www.fedramp.gov/changelog/",
  },
  {
    id: "linkedin",
    label: "LinkedIn Feed",
    note: "RSS stand-in · Connect later",
    urls: ["https://cyberscoop.com/feed/"],
  },
  {
    id: "discord",
    label: "Discord",
    note: "RSS stand-in · Connect later",
    urls: [
      "https://federalnewsnetwork.com/category/cybersecurity/feed/",
      "https://federalnewsnetwork.com/feed/",
    ],
  },
  {
    id: "fedramp-news",
    label: "News crawler for FedRAMP",
    urls: ["https://fedscoop.com/feed/"],
    filterCompliance: true,
  },
  {
    id: "other",
    label: "Other source",
    urls: [
      "https://www.cisa.gov/news.xml",
      "https://www.cisa.gov/news-events/news/rss.xml",
      "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    ],
  },
  {
    id: "cmmc",
    label: "CMMC Plug",
    urls: [
      "https://federalnewsnetwork.com/tag/cmmc/feed/",
      "https://www.nist.gov/blogs/cybersecurity-insights/rss.xml",
    ],
    filterCompliance: true,
  },
];

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function firstHref(html: string, base: string): string {
  const match = html.match(/href=["']([^"']+)["']/i);
  if (!match) return "";
  try {
    return new URL(match[1], base).toString();
  } catch {
    return match[1];
  }
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.__cdata === "string") return record.__cdata;
    if (typeof record["#text"] === "string") return record["#text"];
  }
  return "";
}

function toIso(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnly) return new Date(`${dateOnly[1]}T12:00:00Z`).toISOString();
  return new Date().toISOString();
}

function itemId(sourceId: string, url: string, title: string): string {
  return `${sourceId}:${url || title}`.slice(0, 240);
}

function decodeXmlItems(xml: string, source: SourceConfig): FeedItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;
  const rssItems = asArray(
    (doc.rss as { channel?: { item?: unknown } } | undefined)?.channel?.item,
  );
  const atomItems = asArray((doc.feed as { entry?: unknown } | undefined)?.entry);

  const fromRss = rssItems.map((raw) => {
    const item = raw as Record<string, unknown>;
    const title = stripHtml(textOf(item.title));
    const encoded = textOf(item["content:encoded"]);
    const guid = textOf(item.guid);
    const related = firstHref(encoded, "https://www.fedramp.gov/");
    const url = related || (guid.startsWith("http") ? guid : "") || textOf(item.link);
    const summary = stripHtml(textOf(item.description) || encoded);
    return {
      id: itemId(source.id, guid || url, title),
      sourceId: source.id,
      sourceLabel: source.label,
      title,
      summary,
      url,
      publishedAt: toIso(textOf(item.pubDate) || textOf(item["dc:date"])),
    } satisfies FeedItem;
  });

  const fromAtom = atomItems.map((raw) => {
    const item = raw as Record<string, unknown>;
    const title = stripHtml(textOf(item.title));
    const links = asArray(item.link);
    const href =
      links
        .map((link) => {
          if (typeof link === "string") return link;
          return textOf((link as { "@_href"?: string })["@_href"]);
        })
        .find(Boolean) ?? "";
    const summary = stripHtml(textOf(item.summary) || textOf(item.content));
    return {
      id: itemId(source.id, href, title),
      sourceId: source.id,
      sourceLabel: source.label,
      title,
      summary,
      url: href,
      publishedAt: toIso(textOf(item.updated) || textOf(item.published)),
    } satisfies FeedItem;
  });

  return [...fromRss, ...fromAtom].filter((item) => item.title);
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseFedrampChangelog(html: string, source: SourceConfig): FeedItem[] {
  const items: FeedItem[] = [];
  const listItem = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = listItem.exec(html))) {
    const chunk = match[1];
    const text = stripHtml(chunk);
    const dated = text.match(/^(\d{4}-\d{2}-\d{2})\s+(.+)/);
    if (!dated) continue;
    const hrefMatch = chunk.match(/href=["']([^"']+)["']/i);
    const url = hrefMatch
      ? new URL(hrefMatch[1], "https://www.fedramp.gov/").toString()
      : "https://www.fedramp.gov/changelog/";
    items.push({
      id: itemId(source.id, url, dated[2]),
      sourceId: source.id,
      sourceLabel: source.label,
      title: dated[2].replace(/\s+\(See .+\)$/i, "").trim(),
      summary: dated[2],
      url,
      publishedAt: toIso(dated[1]),
    });
  }
  return items;
}

function pickItems(items: FeedItem[], filterCompliance?: boolean): FeedItem[] {
  const unique = new Map<string, FeedItem>();
  for (const item of items) {
    if (!unique.has(item.id)) unique.set(item.id, item);
  }
  const all = [...unique.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  if (!filterCompliance) return all.slice(0, 20);
  const matched = all.filter(isComplianceItem);
  return (matched.length > 0 ? matched : all).slice(0, 20);
}

async function ingestSource(source: SourceConfig): Promise<FeedSource> {
  const errors: string[] = [];
  const collected: FeedItem[] = [];

  for (const url of source.urls) {
    try {
      const xml = await fetchText(url);
      const parsed = decodeXmlItems(xml, source);
      if (parsed.length > 0) {
        collected.push(...parsed);
        break;
      }
      errors.push(`${url}: no items`);
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (collected.length === 0 && source.htmlFallbackUrl) {
    try {
      const html = await fetchText(source.htmlFallbackUrl);
      collected.push(...parseFedrampChangelog(html, source));
    } catch (error) {
      errors.push(
        `${source.htmlFallbackUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const items = pickItems(collected, source.filterCompliance);
  if (items.length === 0) {
    return {
      id: source.id,
      label: source.label,
      note: source.note,
      status: "error",
      error: errors.join(" · ") || "No items returned",
      items: [],
    };
  }

  return {
    id: source.id,
    label: source.label,
    note: source.note,
    status: "ok",
    items,
  };
}

async function main() {
  const sources = [];
  for (const source of SOURCES) {
    process.stdout.write(`Ingesting ${source.label}...\n`);
    const result = await ingestSource(source);
    process.stdout.write(
      `  ${result.status} · ${result.items.length} items${result.error ? ` · ${result.error}` : ""}\n`,
    );
    sources.push(result);
  }

  const snapshot: FeedSnapshot = {
    generatedAt: new Date().toISOString(),
    sources,
  };

  const outPath = resolve(dirname(fileURLToPath(import.meta.url)), "../public/data/feeds.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  process.stdout.write(`Wrote ${outPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
