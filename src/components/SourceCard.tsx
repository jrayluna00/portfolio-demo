import type { FeedItem, FeedSource } from "../lib/types";
import { formatRelative } from "../lib/time";

type SourceCardProps = {
  source: FeedSource;
  item: FeedItem | undefined;
};

export function SourceCard({ source, item }: SourceCardProps) {
  return (
    <article className="source-card">
      <p className="source-card__label">
        {source.label}
        {source.note ? <span className="source-card__note">{source.note}</span> : null}
      </p>
      {item ? (
        <>
          <h3 className="source-card__headline">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          </h3>
          {item.summary ? <p className="source-card__dek">{item.summary}</p> : null}
          <p className="source-card__meta">
            <time dateTime={item.publishedAt}>{formatRelative(item.publishedAt)}</time>
          </p>
        </>
      ) : (
        <p className="source-card__empty">
          {source.status === "error"
            ? source.error ?? "This feed could not be loaded."
            : "No matching story yet."}
        </p>
      )}
    </article>
  );
}
