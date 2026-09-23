import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialSessionGraph } from "@/lib/seed";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/components/session-provider", () => ({
  useSession: useSessionMock,
}));

import ScopePage from "./page";

function renderVendorScope(complete: boolean) {
  useSessionMock.mockReturnValue({
    graph: {
      ...initialSessionGraph,
      session: {
        ...initialSessionGraph.session,
        claimsVolumeChoice: complete ? "about-400" : null,
        fundingRoute: complete ? "invite-karen" : null,
      },
    },
    viewer: { actor: "cpm", name: "Casey", org: "Platform vendor" },
    canEditSession: false,
  });

  return renderToStaticMarkup(<ScopePage />);
}

function renderPartnerScope() {
  useSessionMock.mockReturnValue({
    graph: {
      ...initialSessionGraph,
      partnerNotes: [{
        id: "partner-note-1",
        author: "Ravi Menon",
        text: "Claims leadership wants an October review.",
        updatedAt: "2026-09-23T16:00:00.000Z",
      }],
    },
    brand: { partnerName: "CDW" },
    viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
    canEditSession: true,
    applyClaimsChoice: vi.fn(),
    applyFunding: vi.fn(),
    applyPattern: vi.fn(),
    applyReusePilot: vi.fn(),
    savePartnerNote: vi.fn(),
    setColdScope: vi.fn(),
    restoreSeededScope: vi.fn(),
  });

  return renderToStaticMarkup(<ScopePage />);
}

describe("read-only vendor Scope navigation", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("shows disabled plan navigation until scope is complete", () => {
    const markup = renderVendorScope(false);

    expect(markup).toContain("Review session plan");
    expect(markup).toContain("disabled");
    expect(markup).toContain("The session plan is available when scoping is complete.");
    expect(markup).not.toContain('href="/plan"');
  });

  it("links to the plan when scope is complete without exposing edit controls", () => {
    const markup = renderVendorScope(true);

    expect(markup).toContain('href="/plan"');
    expect(markup).toContain("Scope complete.");
    expect(markup).not.toContain("Start without the record");
    expect(markup).not.toContain("Use account record instead");
    expect(markup).not.toContain("Close date pushed");
  });
});

describe("partner context", () => {
  it("shows one prefilled context field and one save action", () => {
    const markup = renderPartnerScope();

    expect(markup).toContain("Partner context");
    expect(markup).toContain("Claims leadership wants an October review.");
    expect(markup).toContain("Save context");
    expect(markup).not.toContain(">Edit<");
    expect(markup).not.toContain("Add partner note");
    expect(markup).not.toContain("Added by");
  });
});

describe("exact claims volume", () => {
  it("shows the exact-number field and keeps plan navigation disabled without a valid value", () => {
    useSessionMock.mockReturnValue({
      graph: {
        ...initialSessionGraph,
        session: {
          ...initialSessionGraph.session,
          claimsVolumeChoice: "exact",
          fundingRoute: "invite-karen",
        },
        valueInputs: initialSessionGraph.valueInputs.map((input) =>
          input.id === "claims" ? { ...input, quantity: null } : input,
        ),
      },
      brand: { partnerName: "CDW" },
      viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
      canEditSession: true,
      applyClaimsChoice: vi.fn(),
      applyExactClaims: vi.fn(),
      applyFunding: vi.fn(),
      applyPattern: vi.fn(),
      applyReusePilot: vi.fn(),
      savePartnerNote: vi.fn(),
      setColdScope: vi.fn(),
      restoreSeededScope: vi.fn(),
    });

    const markup = renderToStaticMarkup(<ScopePage />);

    expect(markup).toContain("Enter exact number");
    expect(markup).toContain('type="number"');
    expect(markup).toContain('aria-label="Exact claims per day"');
    expect(markup).toContain("Enter a positive whole number of claims.");
    expect(markup).not.toContain('href="/plan"');
  });

  it("completes Scope when an exact positive whole number and funding route are present", () => {
    useSessionMock.mockReturnValue({
      graph: {
        ...initialSessionGraph,
        session: {
          ...initialSessionGraph.session,
          claimsVolumeChoice: "exact",
          fundingRoute: "invite-karen",
        },
        valueInputs: initialSessionGraph.valueInputs.map((input) =>
          input.id === "claims" ? { ...input, quantity: 275 } : input,
        ),
      },
      brand: { partnerName: "CDW" },
      viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
      canEditSession: true,
      applyClaimsChoice: vi.fn(),
      applyExactClaims: vi.fn(),
      applyFunding: vi.fn(),
      applyPattern: vi.fn(),
      applyReusePilot: vi.fn(),
      savePartnerNote: vi.fn(),
      setColdScope: vi.fn(),
      restoreSeededScope: vi.fn(),
    });

    const markup = renderToStaticMarkup(<ScopePage />);

    expect(markup).toContain('value="275"');
    expect(markup).toContain('href="/plan"');
    expect(markup).toContain("Scope complete.");
  });
});
