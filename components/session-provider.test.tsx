// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initialSessionGraph } from "@/lib/seed";

import { SessionProvider, useSession } from "./session-provider";

function SessionActionsProbe() {
  const { graph, viewer, savePartnerNote, updateValueConfirmer } = useSession();
  const claims = graph.valueInputs.find((input) => input.id === "claims");

  return (
    <>
      <output aria-label="actor">{viewer.actor}</output>
      <output aria-label="partner-note-count">{graph.partnerNotes.length}</output>
      <output aria-label="claims-confirmer">{claims?.confirmedBy ?? "none"}</output>
      <button type="button" onClick={() => savePartnerNote(null, "Partner context")}>Save note</button>
      <button type="button" onClick={() => updateValueConfirmer("claims", "Alex Chen")}>Update confirmer</button>
    </>
  );
}

function renderForActor(actor: "pdm" | "partner" | "cpm") {
  localStorage.setItem("catalyst-session-graph-v3", JSON.stringify(initialSessionGraph));
  sessionStorage.setItem("catalyst-viewer-actor", actor);
  render(
    <SessionProvider>
      <SessionActionsProbe />
    </SessionProvider>,
  );
}

describe("SessionProvider action permissions", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(0), 0);
    });
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => window.clearTimeout(handle));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not save partner notes or update confirmers for CPM", async () => {
    renderForActor("cpm");
    await waitFor(() => expect(screen.getByLabelText("actor")).toHaveTextContent("cpm"));

    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    fireEvent.click(screen.getByRole("button", { name: "Update confirmer" }));

    expect(screen.getByLabelText("partner-note-count")).toHaveTextContent("0");
    expect(screen.getByLabelText("claims-confirmer")).toHaveTextContent("Michelle Dorsey");
  });

  it.each(["pdm", "partner"] as const)("allows the editable %s actor to save partner notes and update confirmers", async (actor) => {
    renderForActor(actor);
    await waitFor(() => expect(screen.getByLabelText("actor")).toHaveTextContent(actor));

    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    fireEvent.click(screen.getByRole("button", { name: "Update confirmer" }));

    expect(screen.getByLabelText("partner-note-count")).toHaveTextContent("1");
    expect(screen.getByLabelText("claims-confirmer")).toHaveTextContent("Alex Chen");
  });
});
