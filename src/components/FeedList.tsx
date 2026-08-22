import type { FeedItem } from "../lib/types";
import { formatRelative } from "../lib/time";

type FeedListProps = {
  items: FeedItem[];
};

export function FeedList({ items }: FeedListProps) {
  if (items.length === 0) {
    return (
      <p className="feed-empty">
        No compliance-tagged items in this snapshot. Run <code>npm run ingest</code> to refresh
        feeds.
      </p>
    );
  }

  return (
    <ol className="feed-list">
      {items.map((item) => (
        <li key={item.id} className="feed-item">
          <p className="feed-item__source">{item.sourceLabel}</p>
          <h3>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          </h3>
          {item.summary ? <p className="feed-item__dek">{item.summary}</p> : null}
          <p className="feed-item__meta">
            <time dateTime={item.publishedAt}>{formatRelative(item.publishedAt)}</time>
          </p>
        </li>
      ))}
    </ol>
  );
}
