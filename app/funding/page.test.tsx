import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { brands } from "@/lib/brands";
import { initialSessionGraph } from "@/lib/seed";
import { applyClaimsVolumeChoice, applyExactClaimsVolume } from "@/lib/session";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/components/session-provider", () => ({
  useSession: useSessionMock,
}));

import FundingPage from "./page";

describe("exact claims provenance", () => {
  it("carries partner-entered provenance into the funding request", () => {
    const graph = applyExactClaimsVolume(
      applyClaimsVolumeChoice(initialSessionGraph, "exact"),
      275,
    );
    useSessionMock.mockReturnValue({
      graph,
      brand: brands.cdw,
      viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
    });

    const markup = renderToStaticMarkup(<FundingPage />);

    expect(markup).toContain(
      "Volume entered by partner in Scope · not respondent-confirmed",
    );
  });
});
