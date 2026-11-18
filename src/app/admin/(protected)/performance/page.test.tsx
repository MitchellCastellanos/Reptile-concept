import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  traffic: vi.fn(),
  newsletter: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getCurrentAdmin: m.getCurrentAdmin }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("@/lib/analytics/service", () => ({
  getTrafficReport: m.traffic,
  getNewsletterReport: m.newsletter,
}));
vi.mock("@/components/admin/performance/traffic-chart", () => ({ TrafficChart: () => null }));
vi.mock("@/components/admin/performance/top-pages-table", () => ({ TopPagesTable: () => null }));

import AdminPerformancePage from "./page";

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockClear());
});

describe("Performance page authorization", () => {
  it("redirects unauthenticated requests to login and never queries analytics", async () => {
    m.getCurrentAdmin.mockResolvedValue(null);
    await expect(AdminPerformancePage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/admin/login");
    expect(m.traffic).not.toHaveBeenCalled();
    expect(m.newsletter).not.toHaveBeenCalled();
  });
});
