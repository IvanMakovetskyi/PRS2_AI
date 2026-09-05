import { ArrowLeft, ArrowRight, Eye, Radio, Search } from "lucide-react";
import { createCustomPosition } from "../../engine";
import { Button } from "../components/Button";
import { EmptyChart } from "../components/EmptyChart";
import { GameBoard } from "../components/GameBoard";
import { Panel } from "../components/Panel";
import { TextField } from "../components/Field";

export function ObserverPage() {
  const emptyPosition = createCustomPosition();
  return (
    <div className="observer-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Event-stream consumer · observation only</p>
          <h1>Live Observer</h1>
          <p>
            Pause your view, inspect received plies, or jump between games without interrupting a
            future match run.
          </p>
        </div>
        <span className="observer-status">
          <Radio size={15} aria-hidden="true" /> Waiting for match
        </span>
      </header>
      <div className="observer-grid">
        <Panel
          title="Observed game"
          eyebrow="0 / 0"
          className="observer-board-panel"
          action={<span className="empty-badge">No game selected</span>}
        >
          <div className="observer-board">
            <GameBoard
              position={emptyPosition}
              flipped={false}
              disabled
              onSquarePress={() => undefined}
            />
          </div>
          <div className="observer-transport">
            <Button size="sm" icon={<ArrowLeft size={15} />} disabled>
              Back
            </Button>
            <Button size="sm" icon={<ArrowRight size={15} />} disabled>
              Forward
            </Button>
            <label>
              <input type="checkbox" defaultChecked />
              <span>Auto-follow live</span>
            </label>
            <label className="speed-control">
              <span>Playback</span>
              <select defaultValue="1" aria-label="Observer playback speed">
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
                <option value="2">2×</option>
                <option value="4">4×</option>
              </select>
            </label>
          </div>
          <p className="empty-state">
            <Eye size={16} aria-hidden="true" /> Start a configured match or connect an event source
            to observe a game.
          </p>
        </Panel>
        <div className="observer-side">
          <Panel title="Match progress" eyebrow="Aggregate results">
            <div className="observer-progress">
              <div>
                <span style={{ width: "0%" }} />
              </div>
              <p>
                <strong>0 / 0</strong>
                <span>Estimated completion —</span>
              </p>
            </div>
            <dl className="observer-metrics">
              <div>
                <dt>Blue wins</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Red wins</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Draws</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Blue win rate</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Red win rate</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Average length</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Captures / game</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Draw reasons</dt>
                <dd>—</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Jump to game" eyebrow="Received games">
            <form className="jump-form" noValidate onSubmit={(event) => event.preventDefault()}>
              <TextField
                id="observer-game-index"
                label="Game index"
                type="number"
                min={1}
                disabled
                help="No games have been received."
              />
              <Button icon={<Search size={15} />} disabled>
                Jump
              </Button>
            </form>
          </Panel>
        </div>
      </div>
      <div className="chart-grid">
        <EmptyChart
          title="Rolling results"
          description="Win and draw outcomes will appear as completed-game events arrive."
          variant="rolling"
        />
        <EmptyChart
          title="Game length distribution"
          description="Ply counts will appear only from completed, observed games."
          variant="length"
        />
      </div>
      <Panel title="Recent results" eyebrow="Latest completed games">
        <p className="empty-state">
          No match results received. This list never invents sample AI outcomes.
        </p>
      </Panel>
    </div>
  );
}
