import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  coordinateToSquare,
  createCustomPosition,
  createInitialPosition,
  serializePosition,
} from "../../engine";
import { GameSession } from "../../game";
import App from "../../ui/App";

describe("import and position editing", () => {
  it("reports malformed game imports without losing the entered data", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Import" }));
    const dialog = screen.getByRole("dialog", { name: "Import a recorded game" });
    const textarea = within(dialog).getByLabelText("Serialized game JSON");
    fireEvent.change(textarea, { target: { value: "{broken" } });
    await user.click(within(dialog).getByRole("button", { name: "Import game" }));

    expect(within(dialog).getByText("Game data is not valid JSON.")).toBeInTheDocument();
    expect(textarea).toHaveValue("{broken");
    expect(textarea).toHaveFocus();
  });

  it("imports a complete game with its history and replay cursor", async () => {
    const user = userEvent.setup();
    const imported = new GameSession(createInitialPosition());
    imported.play(coordinateToSquare("a1"), coordinateToSquare("a2"));
    const gameData = imported.serialize();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Import" }));
    const dialog = screen.getByRole("dialog", { name: "Import a recorded game" });
    fireEvent.change(within(dialog).getByLabelText("Serialized game JSON"), {
      target: { value: gameData },
    });
    await user.click(within(dialog).getByRole("button", { name: "Import game" }));

    expect(
      screen.queryByRole("dialog", { name: "Import a recorded game" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "a2, blue rock" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /R a1–a2/ })).toHaveAttribute("aria-current", "step");
  });

  it("loads a validated custom position from serialized editor data", async () => {
    const user = userEvent.setup();
    const custom = createCustomPosition({
      activePlayer: "blue",
      noCapturePlyCount: 7,
      totalPlyCount: 23,
      pieces: [
        { square: coordinateToSquare("b2"), player: "blue", piece: "paper" },
        { square: coordinateToSquare("h8"), player: "red", piece: "scissors" },
      ],
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Position editor" }));
    const dialog = screen.getByRole("dialog", { name: "Position editor" });
    fireEvent.change(within(dialog).getByLabelText("Serialized position"), {
      target: { value: serializePosition(custom, 2) },
    });
    await user.click(within(dialog).getByRole("button", { name: "Apply serialized data" }));
    expect(within(dialog).getByText("Position valid")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Load position" }));

    expect(screen.getByRole("gridcell", { name: "b2, blue paper" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "h8, red scissors" })).toBeInTheDocument();
    expect(screen.getByText("7 / 100")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });
});
