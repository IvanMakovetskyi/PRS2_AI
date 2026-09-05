import { useEffect, useState } from "react";
import { Activity, Beaker, Gamepad2, Shapes } from "lucide-react";
import { Panel } from "./components/Panel";
import { PlayPage } from "./pages/PlayPage";

type Page = "play" | "lab" | "observer";

const PAGE_LABEL: Record<Page, string> = {
  play: "Play",
  lab: "Match Lab",
  observer: "Observer",
};

export default function App() {
  const [page, setPage] = useState<Page>("play");

  useEffect(() => {
    document.title = `${PAGE_LABEL[page]} — Rock Paper Scissors 2`;
  }, [page]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#main" aria-label="Rock Paper Scissors 2 home">
          <span className="brand-mark" aria-hidden="true">
            <Shapes size={21} />
          </span>
          <span>
            <strong>RPS</strong>
            <sup>2</sup>
            <small>engine room</small>
          </span>
        </a>
        <nav className="app-nav" aria-label="Workspace">
          <button className={page === "play" ? "is-active" : ""} onClick={() => setPage("play")}>
            <Gamepad2 size={17} aria-hidden="true" /> Play
          </button>
          <button className={page === "lab" ? "is-active" : ""} onClick={() => setPage("lab")}>
            <Beaker size={17} aria-hidden="true" /> Match Lab
          </button>
          <button
            className={page === "observer" ? "is-active" : ""}
            onClick={() => setPage("observer")}
          >
            <Activity size={17} aria-hidden="true" /> Observer
          </button>
        </nav>
        <span className="engine-ready">
          <i /> engine ready
        </span>
      </header>
      <main id="main" className="app-main" tabIndex={-1}>
        {page === "play" ? (
          <PlayPage />
        ) : (
          <Panel
            title={PAGE_LABEL[page]}
            eyebrow="Future AI workspace"
            className="placeholder-page"
          >
            <p>No AI provider installed.</p>
            <span>The deterministic engine and controller interfaces are ready.</span>
          </Panel>
        )}
      </main>
    </div>
  );
}
