import type { ImpactAlert } from "../lib/types";

type ImpactSidebarProps = {
  alerts: ImpactAlert[];
};

export function ImpactSidebar({ alerts }: ImpactSidebarProps) {
  return (
    <aside className="impact" aria-labelledby="impact-heading">
      <h2 id="impact-heading">Customer analysis</h2>
      <p className="impact__lede">AI analysis impact on customer.</p>
      {alerts.length === 0 ? (
        <p className="impact__empty">No customer impacts matched this snapshot.</p>
      ) : (
        <ul className="impact-list">
          {alerts.map((alert) => (
            <li key={alert.id} className="impact-item">
              <span className={`severity severity--${alert.severity.toLowerCase()}`}>
                {alert.severity}
              </span>
              <p className="impact-item__line">
                {alert.severity} — {alert.headline}
              </p>
              <a href={alert.articleUrl} target="_blank" rel="noopener noreferrer">
                {alert.articleTitle}
              </a>
              {alert.seeded ? (
                <p className="impact-item__seed">Seeded example · Qwen / Chinese-model watch</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
