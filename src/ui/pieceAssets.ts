import type { PieceType, Player } from "../engine";

export const PIECE_ASSETS = {
  blue: {
    rock: "/assets/pieces/blue-rock.png",
    paper: "/assets/pieces/blue-paper.png",
    scissors: "/assets/pieces/blue-scissors.png",
  },
  red: {
    rock: "/assets/pieces/red-rock.png",
    paper: "/assets/pieces/red-paper.png",
    scissors: "/assets/pieces/red-scissors.png",
  },
} as const satisfies Record<Player, Record<PieceType, string>>;
