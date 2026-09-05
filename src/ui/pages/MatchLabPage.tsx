import { useState } from "react";
import { Bot, CircleOff, Save, StepForward } from "lucide-react";
import { aiProviderRegistry } from "../../players";
import { Button } from "../components/Button";
import { Panel } from "../components/Panel";
import { SelectField, TextField } from "../components/Field";
import { usePersistentState } from "../hooks/usePersistentState";

type ControllerKind = "human" | "ai";

interface MatchLabConfig {
  player1: ControllerKind;
  player2: ControllerKind;
  implementation: string;
  version: string;
  games: number;
  swapSides: boolean;
  alternateStarter: boolean;
  workers: number;
  maximumMoves: number;
  moveTimeMs: number;
  seed: string;
}

const DEFAULT_CONFIG: MatchLabConfig = {
  player1: "human",
  player2: "ai",
  implementation: "",
  version: "",
  games: 100,
  swapSides: true,
  alternateStarter: false,
  workers: 4,
  maximumMoves: 500,
  moveTimeMs: 1000,
  seed: "rps2-001",
};

export function MatchLabPage() {
  const [saveMessage, setSaveMessage] = useState("");
  const [config, setConfig, storageError] = usePersistentState(
    "rps2.matchLabConfig",
    DEFAULT_CONFIG,
  );
  const providers = aiProviderRegistry.list();
  const aiUnavailable = providers.length === 0;
  const update = <K extends keyof MatchLabConfig>(key: K, value: MatchLabConfig[K]) =>
    setConfig({ ...config, [key]: value });

  return (
    <div className="lab-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Controller contract · batch-ready schema</p>
          <h1>Match Lab</h1>
          <p>
            Define a reproducible match run now. Execution unlocks when an AI provider is
            registered.
          </p>
        </div>
        <span className="lab-status">
          <CircleOff size={15} aria-hidden="true" /> No provider
        </span>
      </header>
      <div className="lab-grid">
        <Panel title="Controllers" eyebrow="Sides">
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <div className="controller-pair">
              <div className="controller-card controller-card--blue">
                <span className="controller-card__side">Player 1 · Blue</span>
                <SelectField
                  id="lab-player-1"
                  label="Controller type"
                  value={config.player1}
                  onChange={(event) => update("player1", event.target.value as ControllerKind)}
                >
                  <option value="human">Human</option>
                  <option value="ai">AI</option>
                </SelectField>
              </div>
              <div className="controller-card controller-card--red">
                <span className="controller-card__side">Player 2 · Red</span>
                <SelectField
                  id="lab-player-2"
                  label="Controller type"
                  value={config.player2}
                  onChange={(event) => update("player2", event.target.value as ControllerKind)}
                >
                  <option value="human">Human</option>
                  <option value="ai">AI</option>
                </SelectField>
              </div>
            </div>
            <div className="field-grid">
              <SelectField
                id="lab-ai-implementation"
                label="AI implementation"
                value={config.implementation}
                disabled={aiUnavailable}
                help={aiUnavailable ? "No AI provider installed." : undefined}
                onChange={(event) => update("implementation", event.target.value)}
              >
                <option value="">Select provider</option>
                {providers.map((provider) => (
                  <option value={provider.id} key={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="lab-ai-version"
                label="AI version"
                value={config.version}
                disabled={aiUnavailable}
                help={aiUnavailable ? "Versions appear after provider registration." : undefined}
                onChange={(event) => update("version", event.target.value)}
              >
                <option value="">Select version</option>
                {providers.map((provider) => (
                  <option value={provider.version} key={`${provider.id}-${provider.version}`}>
                    {provider.version}
                  </option>
                ))}
              </SelectField>
            </div>
          </form>
        </Panel>
        <Panel title="Run configuration" eyebrow="Reproducibility">
          <form noValidate onSubmit={(event) => event.preventDefault()}>
            <div className="field-grid field-grid--three">
              <TextField
                id="lab-games"
                label="Number of games"
                type="number"
                min={1}
                max={1000000}
                value={config.games}
                onChange={(event) => update("games", Number(event.target.value))}
              />
              <TextField
                id="lab-workers"
                label="Parallel workers"
                type="number"
                min={1}
                max={typeof navigator === "undefined" ? 16 : navigator.hardwareConcurrency || 16}
                value={config.workers}
                onChange={(event) => update("workers", Number(event.target.value))}
              />
              <TextField
                id="lab-max-moves"
                label="Maximum moves"
                type="number"
                min={1}
                value={config.maximumMoves}
                onChange={(event) => update("maximumMoves", Number(event.target.value))}
              />
              <TextField
                id="lab-move-time"
                label="Per-move limit (ms)"
                type="number"
                min={1}
                value={config.moveTimeMs}
                onChange={(event) => update("moveTimeMs", Number(event.target.value))}
              />
              <TextField
                id="lab-seed"
                label="Random seed"
                value={config.seed}
                onChange={(event) => update("seed", event.target.value)}
                help="Stored for future seeded providers; not used by the deterministic engine."
              />
            </div>
            <div className="switch-grid">
              <label>
                <input
                  type="checkbox"
                  checked={config.swapSides}
                  onChange={(event) => update("swapSides", event.target.checked)}
                />
                <span>
                  <strong>Swap sides</strong>
                  <small>Reverse colors between games.</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={config.alternateStarter}
                  onChange={(event) => update("alternateStarter", event.target.checked)}
                />
                <span>
                  <strong>Alternate starting player</strong>
                  <small>Override the default starter between games.</small>
                </span>
              </label>
            </div>
            {storageError && (
              <p className="form-error" role="alert">
                {storageError}
              </p>
            )}
          </form>
        </Panel>
      </div>
      <Panel className="execution-panel">
        <div className="provider-empty">
          <span className="provider-empty__icon">
            <Bot size={26} aria-hidden="true" />
          </span>
          <div>
            <h2>No AI provider installed</h2>
            <p>
              The engine, controller interface, event stream, reproducible run schema, and observer
              contract are ready. Register an <code>AiProviderRegistration</code> to enable
              execution.
            </p>
          </div>
        </div>
        <div className="execution-controls" aria-label="Match execution controls">
          <Button intent="brand" emphasis="solid" disabled>
            Start
          </Button>
          <Button disabled>Pause</Button>
          <Button disabled>Resume</Button>
          <Button intent="danger" emphasis="outline" disabled>
            Stop
          </Button>
          <Button icon={<StepForward size={15} />} disabled>
            Step one move
          </Button>
          <Button
            icon={<Save size={15} />}
            onClick={() => {
              setConfig({ ...config });
              setSaveMessage("Configuration saved in this browser.");
            }}
          >
            Save configuration
          </Button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {saveMessage}
        </p>
      </Panel>
    </div>
  );
}
