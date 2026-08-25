import { beforeEach, describe, expect, it, vi } from "vitest";

const { eq, is, order, limit, select, from } = vi.hoisted(() => ({
  eq: vi.fn(),
  is: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  publicMediaUrl: () => null,
  supabase: { from },
}));
import { fetchPublishedPosts } from "./api";

describe("published blog query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    from.mockReturnValue({ select });
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ is });
    is.mockReturnValue({ order });
    order.mockReturnValue({ limit, then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }) });
    limit.mockResolvedValue({ data: [], error: null });
  });
  it("requests only published, non-deleted posts", async () => {
    await fetchPublishedPosts(3);
    expect(eq).toHaveBeenCalledWith("status", "published");
    expect(is).toHaveBeenCalledWith("deleted_at", null);
    expect(limit).toHaveBeenCalledWith(3);
  });
});
