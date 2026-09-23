import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { brands } from "@/lib/brands";
import { initialSessionGraph } from "@/lib/seed";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/components/session-provider", () => ({
  useSession: useSessionMock,
}));

import PlanPage from "./page";

describe("read-only Plan controls", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("disables delivery and mechanic options for CPM and exposes selected states", () => {
    useSessionMock.mockReturnValue({
      graph: initialSessionGraph,
      brand: brands.cdw,
      setDelivery: vi.fn(),
      setMechanic: vi.fn(),
      canEditSession: false,
    });

    const markup = renderToStaticMarkup(<PlanPage />);

    expect(markup.match(/disabled=""/g)).toHaveLength(4);
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(2);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(2);
  });
});
