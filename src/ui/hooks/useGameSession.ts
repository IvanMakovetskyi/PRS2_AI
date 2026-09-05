import { useCallback, useEffect, useState } from "react";
import { GameSession } from "../../game";

export function useGameSession(initial?: GameSession) {
  const [session, setSession] = useState(() => initial ?? new GameSession());
  const [, setRevision] = useState(0);

  useEffect(() => session.subscribe(() => setRevision((value) => value + 1)), [session]);

  const replaceSession = useCallback((next: GameSession) => {
    setSession(next);
    setRevision((value) => value + 1);
  }, []);

  return { session, replaceSession };
}
