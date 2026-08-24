type Desk = "news" | "guidance";

type HeaderProps = {
  generatedAt?: string;
  desk: Desk;
};

export function Header({ generatedAt, desk }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">
          <p className="brand__kicker">Federal compliance desk</p>
          <a className="brand__title" href="#top">
            Compliance Brief
          </a>
          <nav className="desk-switch" aria-label="Desks">
            <a href="#top" className={desk === "news" ? "is-active" : undefined}>
              News
            </a>
            <a href="#guidance" className={desk === "guidance" ? "is-active" : undefined}>
              Guidance desk
            </a>
          </nav>
        </div>
        <nav className="topics" aria-label="Coverage">
          <span>FedRAMP</span>
          <span>CMMC</span>
          <span>FISMA</span>
          <span>DoD IL6</span>
        </nav>
        {generatedAt ? (
          <p className="freshness">
            Updated <time dateTime={generatedAt}>{new Date(generatedAt).toLocaleString()}</time>
          </p>
        ) : null}
      </div>
    </header>
  );
}
