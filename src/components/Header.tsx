type HeaderProps = {
  generatedAt?: string;
};

export function Header({ generatedAt }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">
          <p className="brand__kicker">Federal compliance desk</p>
          <a className="brand__title" href="#top">
            Compliance Brief
          </a>
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
