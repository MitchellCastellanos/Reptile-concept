import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
// Plain function (not a vi.fn) for the failure case: vitest's result tracking
// would otherwise report the intentionally rejected promise as unhandled.
let failing = false;
vi.mock("@/lib/db", () => ({
  prisma: {
    pageView: {
      create: async (...a: unknown[]) => {
        if (failing) throw new Error("db down");
        return create(...a);
      },
    },
  },
}));

import { POST } from "./route";

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://site.test/api/track", {
    method: "POST",
    body,
    headers: { host: "site.test", ...headers },
  });

beforeEach(() => {
  create.mockReset();
  failing = false;
});

describe("POST /api/track", () => {
  it("stores a valid same-origin event", async () => {
    create.mockResolvedValue({});
    const res = await POST(req(JSON.stringify({ path: "/shop/", locale: "fr" }), { origin: "https://site.test" }));
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith({ data: { path: "/shop", locale: "fr" } });
  });

  it("rejects cross-site requests without writing", async () => {
    const res = await POST(req(JSON.stringify({ path: "/", locale: "fr" }), { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  it.each(["not json", "{}", JSON.stringify({ path: "/a?b", locale: "fr" }), JSON.stringify({ path: "/", locale: "xx" })])(
    "rejects invalid body %s",
    async (body) => {
      const res = await POST(req(body));
      expect(res.status).toBe(400);
      expect(create).not.toHaveBeenCalled();
    },
  );

  it("rejects oversized bodies", async () => {
    const res = await POST(req(JSON.stringify({ path: "/", locale: "fr", pad: "x".repeat(2000) })));
    expect(res.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it("swallows database failures", async () => {
    failing = true;
    const res = await POST(req(JSON.stringify({ path: "/", locale: "en" })));
    expect(res.status).toBe(200);
  });
});
