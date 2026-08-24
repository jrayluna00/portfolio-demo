import type { ExpertBriefing } from "../lib/guidance/types";

const SAMPLE_QUESTIONS = [
  "Do I still need a Security Assessment Plan for FedRAMP 20x?",
  "What belongs in a legacy SAP for an agency-sponsored Rev5 assessment?",
  "What must be in a FedRAMP Certification Package under FRC-CSO-PKG?",
  "How should a 3PAO write and submit a SAR package?",
  "What does NIST SP 800-53A require when assessing AC-2?",
  "When does FedRAMP stop accepting new Rev5 certifications?",
  "How do inherited IaaS controls work in the SAP and SAR?",
];

type GuidanceDeskProps = {
  briefing: ExpertBriefing | null;
  error: string | null;
  loading: boolean;
  busy: boolean;
  corpusNote: string | null;
  question: string;
  onQuestionChange: (value: string) => void;
  onAsk: (value?: string) => void;
};

export function GuidanceDesk({
  briefing,
  error,
  loading,
  busy,
  corpusNote,
  question,
  onQuestionChange,
  onAsk,
}: GuidanceDeskProps) {
  return (
    <section className="desk" aria-labelledby="desk-heading">
      <p className="desk__kicker">SAP through SAR · 2026 rules + NIST 800-53</p>
      <h2 id="desk-heading">FedRAMP guidance desk</h2>
      <p className="desk__lede">
        Ask a package question the way a 3PAO, CSP, or agency reviewer would. The desk retrieves current
        FedRAMP Consolidated Rules for 2026 and NIST SP 800-53/53A, then cites the source next to the
        analysis. Legacy SAP/SAR practice is labeled when it still applies.
      </p>

      <form
        className="desk__form"
        onSubmit={(event) => {
          event.preventDefault();
          onAsk();
        }}
      >
        <label className="desk__label" htmlFor="desk-question">
          Question
        </label>
        <textarea
          id="desk-question"
          className="desk__input"
          rows={4}
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="e.g. Does an agency-sponsored Rev5 assessment still need a SAR, and what goes in the package?"
        />
        <div className="desk__actions">
          <button type="submit" className="desk__ask" disabled={busy || !question.trim()}>
            {busy ? "Briefing…" : "Ask the desk"}
          </button>
          {corpusNote ? <p className="desk__meta">{corpusNote}</p> : null}
        </div>
      </form>

      <div className="desk__samples" aria-label="Sample questions">
        {SAMPLE_QUESTIONS.map((sample) => (
          <button
            key={sample}
            type="button"
            className="desk__chip"
            onClick={() => {
              onQuestionChange(sample);
              onAsk(sample);
            }}
          >
            {sample}
          </button>
        ))}
      </div>

      {loading ? <p className="banner">Loading official FedRAMP and NIST corpus…</p> : null}
      {error ? <p className="banner banner--error">{error}</p> : null}

      {briefing ? <Briefing briefing={briefing} /> : null}
    </section>
  );
}

function Briefing({ briefing }: { briefing: ExpertBriefing }) {
  return (
    <article className="briefing">
      <p className="briefing__currency">{briefing.currency}</p>
      <h3>{briefing.headline}</h3>

      <div className="briefing__analysis">
        {briefing.analysis.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>

      {briefing.controls.length > 0 ? (
        <section className="briefing__controls" aria-label="NIST controls">
          <h4>NIST SP 800-53 / 800-53A</h4>
          {briefing.controls.map(({ control, ksis }) => (
            <div key={control.id} className="control-card">
              <p className="control-card__id">
                {control.displayId} · {control.family}
              </p>
              <h5>{control.title}</h5>
              <p>{control.statement}</p>
              {control.methods.length ? (
                <p className="control-card__meta">
                  Assessment methods: {control.methods.join(" · ")}
                </p>
              ) : null}
              {control.objectives.length ? (
                <ul>
                  {control.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              ) : null}
              <p className="control-card__meta">
                FedRAMP Rev5 baselines:{" "}
                {[
                  control.baselines.low ? "Low" : null,
                  control.baselines.moderate ? "Moderate" : null,
                  control.baselines.high ? "High" : null,
                  control.baselines.lisaas ? "LI-SaaS" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "not in ingested Rev5 profiles"}
              </p>
              {ksis.length ? (
                <p className="control-card__meta">
                  20x KSIs: {ksis.map((ksi) => `${ksi.id} ${ksi.name}`).join("; ")}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {briefing.quotes.length > 0 ? (
        <section aria-label="Official excerpts">
          <h4>Official text</h4>
          <ul className="quote-list">
            {briefing.quotes.map((quote) => (
              <li key={quote.id} className="quote">
                <p className="quote__id">
                  {quote.force ? `${quote.force} · ` : ""}
                  {quote.id} · {quote.name}
                </p>
                <blockquote>
                  <p>{quote.statement}</p>
                </blockquote>
                <a href={quote.url} target="_blank" rel="noopener noreferrer">
                  Open source
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Citations">
        <h4>Citations</h4>
        <ol className="cite-list">
          {briefing.citations.map((citation) => (
            <li key={citation.url}>
              <a href={citation.url} target="_blank" rel="noopener noreferrer">
                {citation.title}
              </a>
              <span>
                {" "}
                — {citation.issuer}
                {citation.note ? ` · ${citation.note}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="briefing__disclaimer">
        Briefing only. Confirm the cited rule or NIST control before you change a live package. This desk
        does not replace FedRAMP, agency, or legal direction.
      </p>
    </article>
  );
}
