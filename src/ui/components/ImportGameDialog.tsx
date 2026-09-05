import { useEffect, useRef, useState } from "react";
import { GameSession } from "../../game";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ImportGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (session: GameSession) => void;
}

export function ImportGameDialog({ open, onOpenChange, onImport }: ImportGameDialogProps) {
  const [data, setData] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  const importGame = () => {
    try {
      const session = GameSession.deserialize(data);
      onImport(session);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Game data could not be imported.");
      textareaRef.current?.focus();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import a recorded game"
      description="Paste a complete RPS2 game export. The move record and replay cursor are validated before loading."
      size="lg"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button intent="brand" emphasis="solid" onClick={importGame} disabled={!data.trim()}>
            Import game
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <label className="textarea-label" htmlFor="game-import-data">
          Serialized game JSON
        </label>
        <textarea
          ref={textareaRef}
          id="game-import-data"
          className="code-textarea"
          value={data}
          onChange={(event) => {
            setData(event.target.value);
            if (error) setError("");
          }}
          aria-invalid={Boolean(error)}
          aria-describedby="game-import-help"
          spellCheck={false}
          placeholder='{ "version": 1, "initialPosition": … }'
        />
        <p id="game-import-help" className={error ? "form-error" : "field__help"}>
          {error || "Only engine-produced version 1 exports are accepted."}
        </p>
      </form>
    </Dialog>
  );
}
