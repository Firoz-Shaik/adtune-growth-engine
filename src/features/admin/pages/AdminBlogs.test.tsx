import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AdminBlogs from "./AdminBlogs";

const mutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock("@/features/blog/api", () => ({
  useAdminPosts: () => ({
    data: [{ id: "1", title: "Test post", slug: "test-post", categoryName: "SEO", status: "draft", updatedAt: "2026-08-07", coverUrl: null }],
    isLoading: false,
    error: null,
  }),
  useDeletePost: () => ({ mutateAsync }),
}));

describe("admin post deletion", () => {
  it("requires explicit confirmation", async () => {
    render(<MemoryRouter><AdminBlogs /></MemoryRouter>);
    fireEvent.click(screen.getAllByLabelText("Delete Test post")[0]);
    expect(mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete post" }));
    expect(mutateAsync).toHaveBeenCalledWith("1");
  });
});
