import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Clipboard,
  Download,
  FlipHorizontal2,
  Pause,
  PencilRuler,
  Play,
  Redo2,
  RotateCcw,
  Undo2,
  Upload,
} from "lucide-react";
import { Button } from "./Button";

interface GameControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  paused: boolean;
  inHistory: boolean;
  playbackSpeed: number;
  onNewGame: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRestart: () => void;
  onPauseToggle: () => void;
  onFlip: () => void;
  onImport: () => void;
  onExport: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onReturnLive: () => void;
  onPlaybackSpeedChange: (value: number) => void;
}

export function GameControls(props: GameControlsProps) {
  return (
    <div className="game-controls" aria-label="Game controls">
      <div className="control-group">
        <Button intent="brand" emphasis="solid" onClick={props.onNewGame}>
          New game
        </Button>
        <Button icon={<Undo2 size={16} />} onClick={props.onUndo} disabled={!props.canUndo}>
          Undo
        </Button>
        <Button icon={<Redo2 size={16} />} onClick={props.onRedo} disabled={!props.canRedo}>
          Redo
        </Button>
        <Button icon={<RotateCcw size={16} />} onClick={props.onRestart}>
          Restart
        </Button>
        <Button
          icon={props.paused ? <Play size={16} /> : <Pause size={16} />}
          onClick={props.onPauseToggle}
        >
          {props.paused ? "Resume" : "Pause"}
        </Button>
        <Button icon={<FlipHorizontal2 size={16} />} onClick={props.onFlip}>
          Flip
        </Button>
      </div>
      <div className="control-group control-group--utility">
        <Button size="sm" emphasis="ghost" icon={<Upload size={15} />} onClick={props.onImport}>
          Import
        </Button>
        <Button size="sm" emphasis="ghost" icon={<Download size={15} />} onClick={props.onExport}>
          Export
        </Button>
        <Button size="sm" emphasis="ghost" icon={<Clipboard size={15} />} onClick={props.onCopy}>
          Copy position
        </Button>
        <Button size="sm" emphasis="ghost" icon={<PencilRuler size={15} />} onClick={props.onEdit}>
          Position editor
        </Button>
      </div>
      <div className="replay-controls">
        <Button
          size="sm"
          emphasis="ghost"
          icon={<ArrowLeftToLine size={15} />}
          onClick={props.onUndo}
          disabled={!props.canUndo}
          aria-label="Move one ply backward"
        >
          Back
        </Button>
        <label className="speed-control">
          <span>Playback</span>
          <select
            value={props.playbackSpeed}
            onChange={(event) => props.onPlaybackSpeedChange(Number(event.target.value))}
            aria-label="Playback speed"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>
        <Button
          size="sm"
          emphasis="ghost"
          icon={<ArrowRightToLine size={15} />}
          onClick={props.onRedo}
          disabled={!props.canRedo}
          aria-label="Move one ply forward"
        >
          Forward
        </Button>
        {props.inHistory && (
          <Button size="sm" intent="brand" emphasis="outline" onClick={props.onReturnLive}>
            Return to live
          </Button>
        )}
      </div>
    </div>
  );
}
