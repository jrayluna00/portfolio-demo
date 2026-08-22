export type Severity = "Critical" | "High" | "Watch";

export type FeedItem = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
};

export type FeedSource = {
  id: string;
  label: string;
  note?: string;
  status: "ok" | "error";
  error?: string;
  items: FeedItem[];
};

export type FeedSnapshot = {
  generatedAt: string;
  sources: FeedSource[];
};

export type Customer = {
  id: string;
  name: string;
  stack: string[];
  frameworks: string[];
  watchTerms: string[];
  notes: string;
};

export type ImpactAlert = {
  id: string;
  severity: Severity;
  headline: string;
  customerId: string;
  customerName: string;
  articleTitle: string;
  articleUrl: string;
  seeded?: boolean;
};
