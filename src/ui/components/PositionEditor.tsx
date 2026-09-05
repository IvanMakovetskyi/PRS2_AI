import { useEffect, useMemo, useRef, useState } from "react";
import {
  clonePosition,
  createCustomPosition,
  createInitialPosition,
  deserializePosition,
  getPieceAt,
  placePiece,
  removePiece,
  serializePosition,
  updatePositionMetadata,
  validatePosition,
  type GamePosition,
  type PieceType,
  type Player,
  type Square,
} from "../../engine";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { SelectField, TextField } from "./Field";
import { GameBoard } from "./GameBoard";

interface PositionEditorProps {
  open: boolean;
  position: Readonly<GamePosition>;
  onOpenChange: (open: boolean) => void;
  onLoad: (position: GamePosition) => void;
}

export function PositionEditor({ open, position, onOpenChange, onLoad }: PositionEditorProps) {
  const [draft, setDraft] = useState(() => clonePosition(position));
  const [player, setPlayer] = useState<Player>("blue");
  const [piece, setPiece] = useState<PieceType>("rock");
  const [serialized, setSerialized] = useState(() => serializePosition(position, 2));
  const [parseError, setParseError] = useState("");
  const loadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const next = clonePosition(position);
      setDraft(next);
      setSerialized(serializePosition(next, 2));
      setParseError("");
    }
  }, [open, position]);

  const validation = useMemo(() => validatePosition(draft), [draft]);

  const updateDraft = (next: GamePosition) => {
    setDraft(next);
    setSerialized(serializePosition(next, 2));
    setParseError("");
  };

  const handleSquare = (square: Square) => {
    updateDraft(
      getPieceAt(draft, square)
        ? removePiece(draft, square)
        : placePiece(draft, square, player, piece),
    );
  };

  const pasteSerialized = () => {
    try {
      const next = deserializePosition(serialized);
      setDraft(next);
      setParseError("");
    } catch (caught) {
      setParseError(caught instanceof Error ? caught.message : "Position data is malformed.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Position editor"
      description="Place or remove pieces, edit counters, validate the result, then load it as a new playable game."
      size="lg"
      initialFocusRef={loadButtonRef}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            ref={loadButtonRef}
            intent="brand"
            emphasis="solid"
            disabled={!validation.valid}
            onClick={() => onLoad(clonePosition(draft))}
          >
            Load position
          </Button>
        </>
      }
    >
      <form className="editor-layout" noValidate onSubmit={(event) => event.preventDefault()}>
        <div className="editor-board">
          <GameBoard position={draft} flipped={false} onSquarePress={handleSquare} />
        </div>
        <div className="editor-tools">
          <div className="field-grid">
            <SelectField
              id="editor-player"
              label="Place for"
              value={player}
              onChange={(event) => setPlayer(event.target.value as Player)}
            >
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </SelectField>
            <SelectField
              id="editor-piece"
              label="Piece type"
              value={piece}
              onChange={(event) => setPiece(event.target.value as PieceType)}
            >
              <option value="rock">Rock</option>
              <option value="paper">Paper</option>
              <option value="scissors">Scissors</option>
            </SelectField>
            <SelectField
              id="editor-turn"
              label="Active player"
              value={draft.activePlayer}
              onChange={(event) =>
                updateDraft(
                  updatePositionMetadata(draft, { activePlayer: event.target.value as Player }),
                )
              }
            >
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </SelectField>
            <TextField
              id="editor-no-capture"
              label="No-capture plies"
              type="number"
              min={0}
              max={draft.rules.noCapturePlyLimit}
              value={draft.noCapturePlyCount}
              onChange={(event) =>
                updateDraft(
                  updatePositionMetadata(draft, { noCapturePlyCount: Number(event.target.value) }),
                )
              }
            />
            <TextField
              id="editor-total-ply"
              label="Total plies"
              type="number"
              min={0}
              value={draft.totalPlyCount}
              onChange={(event) =>
                updateDraft(
                  updatePositionMetadata(draft, { totalPlyCount: Number(event.target.value) }),
                )
              }
            />
          </div>
          <div className="editor-actions">
            <Button
              size="sm"
              onClick={() =>
                updateDraft(
                  createCustomPosition({ rules: draft.rules, activePlayer: draft.activePlayer }),
                )
              }
            >
              Clear board
            </Button>
            <Button size="sm" onClick={() => updateDraft(createInitialPosition())}>
              Reset initial
            </Button>
          </div>
          <div
            className={`validation-box ${validation.valid ? "is-valid" : "is-invalid"}`}
            role="status"
          >
            <strong>
              {validation.valid
                ? "Position valid"
                : `${validation.errors.length} validation issue${validation.errors.length === 1 ? "" : "s"}`}
            </strong>
            {!validation.valid && (
              <ul>
                {validation.errors.map((error) => (
                  <li key={`${error.code}-${error.message}`}>{error.message}</li>
                ))}
              </ul>
            )}
          </div>
          <label className="textarea-label" htmlFor="editor-serialized">
            Serialized position
          </label>
          <textarea
            id="editor-serialized"
            className="code-textarea code-textarea--editor"
            value={serialized}
            onChange={(event) => {
              setSerialized(event.target.value);
              setParseError("");
            }}
            aria-invalid={Boolean(parseError)}
            aria-describedby="editor-serialized-help"
            spellCheck={false}
          />
          <p id="editor-serialized-help" className={parseError ? "form-error" : "field__help"}>
            {parseError || "Edit or paste position JSON, then apply it to the editor."}
          </p>
          <div className="editor-actions">
            <Button size="sm" onClick={pasteSerialized}>
              Apply serialized data
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
