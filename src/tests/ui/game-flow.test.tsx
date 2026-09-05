import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../ui/App";
import {
  createCustomPosition,
  generateMovesFrom,
  getMoveMasks,
  hasSquare,
  coordinateToSquare,
} from "../../engine";
import { GameBoard } from "../../ui/components/GameBoard";

describe("play workspace", () => {
  it("shows engine-derived legal destinations and supports undo and redo", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getAllByRole("gridcell")).toHaveLength(81);
    await user.click(screen.getByRole("gridcell", { name: "a1, blue rock" }));

    const a2 = screen.getByRole("gridcell", { name: "a2, empty, legal move" });
    const b2 = screen.getByRole("gridcell", { name: "b2, empty, legal move" });
    expect(a2).toHaveClass("is-legal");
    expect(b2).toHaveClass("is-legal");

    await user.click(a2);
    expect(screen.getByRole("gridcell", { name: "a2, blue rock" })).toBeInTheDocument();
    expect(screen.getAllByText("red to move").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /R a1–a2/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("gridcell", { name: "a1, blue rock" })).toBeInTheDocument();
    expect(screen.getAllByText("blue to move").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("gridcell", { name: "a2, blue rock" })).toBeInTheDocument();
  });

  it("keeps future moves while inspecting history and confirms a new branch", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("gridcell", { name: "a1, blue rock" }));
    await user.click(screen.getByRole("gridcell", { name: "a2, empty, legal move" }));
    await user.click(screen.getByRole("gridcell", { name: "a9, red rock" }));
    await user.click(screen.getByRole("gridcell", { name: "a8, empty, legal move" }));

    await user.click(screen.getByRole("button", { name: /Initial position/ }));
    expect(screen.getByText("Viewing ply 0. Future moves are preserved.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /R a1–a2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /R a9–a8/ })).toBeInTheDocument();

    await user.click(screen.getByRole("gridcell", { name: "a1, blue rock" }));
    await user.click(screen.getByRole("gridcell", { name: "b2, empty, legal move" }));
    const dialog = screen.getByRole("dialog", { name: "Create a new branch here?" });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Create branch" }));

    expect(screen.getByText("1 plies recorded")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /R a9–a8/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /R a1–b2/ })).toBeInTheDocument();
  });

  it("renders exactly the legal and capture masks returned by the engine", () => {
    const position = createCustomPosition({
      activePlayer: "blue",
      pieces: [
        { square: coordinateToSquare("d4"), player: "blue", piece: "rock" },
        { square: coordinateToSquare("e5"), player: "red", piece: "scissors" },
        { square: coordinateToSquare("c4"), player: "red", piece: "paper" },
      ],
    });
    const from = coordinateToSquare("d4");
    const masks = getMoveMasks(position, from);
    const legalMoves = generateMovesFrom(position, from);
    const { container } = render(
      <GameBoard
        position={position}
        selected={from}
        legalMask={masks.legal}
        captureMask={masks.captures}
        flipped={false}
        onSquarePress={() => undefined}
      />,
    );

    for (const squareElement of container.querySelectorAll<HTMLElement>("[data-square]")) {
      const coordinate = squareElement.dataset.square;
      if (!coordinate) throw new Error("Board square is missing its coordinate.");
      const square = coordinateToSquare(coordinate);
      expect(squareElement.classList.contains("is-legal")).toBe(hasSquare(masks.legal, square));
      expect(squareElement.classList.contains("is-capture")).toBe(
        hasSquare(masks.captures, square),
      );
    }
    expect(legalMoves.map((move) => move.to)).toContain(coordinateToSquare("e5"));
    expect(screen.getByRole("gridcell", { name: "e5, red scissors, legal capture" })).toHaveClass(
      "is-capture",
    );
    expect(screen.getByRole("gridcell", { name: "c4, red paper" })).not.toHaveClass("is-legal");
  });

  it("persists Match Lab configuration without inventing AI execution", async () => {
    window.localStorage.clear();
    const user = userEvent.setup();
    const firstRender = render(<App />);
    await user.click(screen.getByRole("button", { name: "Match Lab" }));
    const games = screen.getByLabelText("Number of games");
    await user.clear(games);
    await user.type(games, "12");
    await user.click(screen.getByRole("button", { name: "Save configuration" }));
    expect(screen.getByRole("status")).toHaveTextContent("Configuration saved in this browser.");
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    firstRender.unmount();

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Match Lab" }));
    expect(screen.getByLabelText("Number of games")).toHaveValue(12);
  });
});
