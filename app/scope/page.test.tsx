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
