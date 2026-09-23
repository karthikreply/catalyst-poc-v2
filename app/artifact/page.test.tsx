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

vi.mock("html2canvas-pro", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({ default: vi.fn() }));

import ArtifactPage from "./page";

describe("exact claims provenance", () => {
  it("renders partner-entered, non-respondent-confirmed provenance", () => {
    const graph = applyExactClaimsVolume(
      applyClaimsVolumeChoice(initialSessionGraph, "exact"),
      275,
    );
    useSessionMock.mockReturnValue({
      graph,
      brand: brands.cdw,
      viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
    });

    const markup = renderToStaticMarkup(<ArtifactPage />);

    expect(markup).toContain(
      "Volume entered by partner in Scope · not respondent-confirmed",
    );
    expect(markup).not.toContain("Volume is an unconfirmed estimate from scope.");
  });
});
