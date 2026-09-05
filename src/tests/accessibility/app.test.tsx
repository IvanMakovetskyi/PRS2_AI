import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../ui/App";

describe("workspace accessibility contracts", () => {
  it("exposes a labeled keyboard-operable board and navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const board = screen.getByRole("grid", { name: "Rock Paper Scissors 2 board" });
    const squares = within(board).getAllByRole("gridcell");
    expect(squares).toHaveLength(81);
    expect(new Set(squares.map((square) => square.getAttribute("aria-label"))).size).toBe(81);

    squares[72]?.focus();
    await user.keyboard("{Enter}");
    expect(squares[72]).toHaveAttribute("aria-selected", "true");

    const navigation = screen.getByRole("navigation", { name: "Workspace" });
    await user.click(within(navigation).getByRole("button", { name: "Match Lab" }));
    expect(screen.getByRole("heading", { name: "Match Lab", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Controller type", { selector: "#lab-player-1" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(screen.getByText("No AI provider installed")).toBeInTheDocument();
  });

  it("moves focus into restart confirmation and returns safely on cancel", async () => {
    const user = userEvent.setup();
    render(<App />);

    const restart = screen.getByRole("button", { name: "Restart" });
    await user.click(restart);
    const dialog = screen.getByRole("dialog", { name: "Restart this game?" });
    const cancel = within(dialog).getByRole("button", { name: "Keep playing" });
    await waitFor(() => expect(cancel).toHaveFocus());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Restart this game?" })).not.toBeInTheDocument();
    await waitFor(() => expect(restart).toHaveFocus());
  });
});
