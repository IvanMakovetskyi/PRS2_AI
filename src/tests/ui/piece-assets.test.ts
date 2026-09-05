import { PIECE_ASSETS } from "../../ui/pieceAssets";

describe("piece artwork", () => {
  it("maps every player and piece type to its public PNG asset", () => {
    expect(PIECE_ASSETS).toEqual({
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
    });
  });
});
