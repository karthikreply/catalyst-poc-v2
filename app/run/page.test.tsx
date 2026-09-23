// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initialSessionGraph } from "@/lib/seed";
import { updateCapture } from "@/lib/session";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/components/session-provider", () => ({
  useSession: useSessionMock,
}));

import RunPage from "./page";

const sessionCapture = {
  id: "capture-1758645600000",
  sessionId: initialSessionGraph.session.id,
  stepId: "where-it-hurts",
  attributedTo: "Dana Reyes",
  text: "Board asked for a decision by November.",
  capturedAt: "2026-09-23T16:00:00.000Z",
};

beforeEach(() => {
  useSessionMock.mockReset();
  useSessionMock.mockImplementation(() => {
    const [graph, setGraph] = useState({
      ...initialSessionGraph,
      captures: [...initialSessionGraph.captures, sessionCapture],
    });

    return {
      graph,
      brand: { partnerName: "CDW" },
      viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
      canEditSession: true,
      addCapture: vi.fn(),
      updateCapture: (captureId: string, update: { attributedTo: string; text: string }) => {
        setGraph((current) => updateCapture(current, captureId, update));
      },
      setActiveStep: vi.fn(),
      updateValue: vi.fn(),
      updateValueConfirmer: vi.fn(),
      updateCostInput: vi.fn(),
      freezeLedgerNow: vi.fn(),
    };
  });
});

afterEach(cleanup);

describe("what we heard", () => {
  it("shows every capture and offers edit only on session captures", () => {
    render(<RunPage />);

    expect(screen.getByText("Intake sits six days, mostly manual PDF reading.")).toBeInTheDocument();
    expect(screen.getByText(sessionCapture.text)).toBeInTheDocument();
    expect(screen.getByText("6 captures")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1);
  });

  it("edits the text and speaker of a session capture", () => {
    render(<RunPage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    fireEvent.change(screen.getByLabelText("Edit capture text"), {
      target: { value: "Board asked for a decision by October." },
    });
    fireEvent.change(screen.getByLabelText("Change attributed speaker"), {
      target: { value: "Michelle Dorsey" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Board asked for a decision by October.")).toBeInTheDocument();
    expect(screen.queryByText(sessionCapture.text)).not.toBeInTheDocument();
    expect(screen.getByText("6 captures")).toBeInTheDocument();
  });

  it("discards an edit on cancel", () => {
    render(<RunPage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Edit capture text"), { target: { value: "Rewritten." } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText(sessionCapture.text)).toBeInTheDocument();
    expect(screen.queryByText("Rewritten.")).not.toBeInTheDocument();
  });
});
