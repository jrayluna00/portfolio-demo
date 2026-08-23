import type { Customer, FeedItem, ImpactAlert, Severity } from "./types";
import { matchesAny, severityFromText } from "./keywords";

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 3,
  High: 2,
  Watch: 1,
};

function articleText(item: FeedItem): string {
  return `${item.title} ${item.summary}`;
}

function headlineFor(severity: Severity, customerName: string): string {
  if (severity === "Critical") {
    return `New policy rumored to affect ${customerName}`;
  }
  if (severity === "High") {
    return `Guidance change may impact ${customerName}`;
  }
  return `Possible relevance for ${customerName}`;
}

export function analyzeImpacts(items: FeedItem[], customers: Customer[]): ImpactAlert[] {
  const alerts: ImpactAlert[] = [];

  for (const item of items) {
    const text = articleText(item);
    for (const customer of customers) {
      const stackHits = matchesAny(text, customer.stack);
      const frameworkHits = matchesAny(text, customer.frameworks);
      const watchHits = matchesAny(text, customer.watchTerms);

      if (stackHits.length + frameworkHits.length + watchHits.length === 0) {
        continue;
      }

      const termSeverity = severityFromText(text);
      let severity: Severity = "Watch";

      const criticalCustomerHit =
        watchHits.some((term) =>
          ["qwen", "chinese model", "chinese ai", "foreign adversary", "covered nation", "prc", "ban", "prohibit", "deepseek"].includes(
            term,
          ),
        ) && (termSeverity === "Critical" || stackHits.length > 0);

      if (criticalCustomerHit || termSeverity === "Critical") {
        severity = "Critical";
      } else if (termSeverity === "High" || frameworkHits.length > 0) {
        severity = "High";
      }

      alerts.push({
        id: `${customer.id}:${item.id}`,
        severity,
        headline: headlineFor(severity, customer.name),
        customerId: customer.id,
        customerName: customer.name,
        articleTitle: item.title,
        articleUrl: item.url,
      });
    }
  }

  alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = `${alert.customerId}:${alert.articleUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Always-visible example so the sidebar is never an empty dashed box. */
export function seededQwenAlert(): ImpactAlert {
  return {
    id: "seed:acme-analytics:qwen-policy",
    severity: "Critical",
    headline: "New policy rumored to affect Acme Analytics",
    customerId: "acme-analytics",
    customerName: "Acme Analytics",
    articleTitle:
      "Draft guidance would restrict Chinese-developed AI models in U.S. commercial operations",
    articleUrl: "https://www.fedramp.gov/changelog/",
    seeded: true,
  };
}

export function withSeededExample(alerts: ImpactAlert[]): ImpactAlert[] {
  const hasQwenCritical = alerts.some(
    (alert) => alert.customerId === "acme-analytics" && alert.severity === "Critical",
  );
  if (hasQwenCritical) return alerts;
  return [seededQwenAlert(), ...alerts];
}
