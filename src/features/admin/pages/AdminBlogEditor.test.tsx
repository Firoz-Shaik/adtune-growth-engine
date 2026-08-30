import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMPOSER_DRAFT_KEY, writeComposerDraft } from "@/features/blog/draftStorage";
import AdminBlogEditor from "./AdminBlogEditor";

const { mutateAsync } = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({ id: "saved" }),
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: { access_token: "token" } }),
}));

vi.mock("@/features/blog/api", () => ({
  useAdminPost: () => ({ data: undefined, isLoading: false }),
  useCategories: () => ({ data: [{ id: "cat-1", name: "SEO", slug: "seo" }] }),
  useTags: () => ({ data: [] }),
  useMediaLibrary: () => ({ data: [] }),
  useSavePost: () => ({ mutateAsync, isPending: false }),
  useDeletePost: () => ({ mutateAsync: vi.fn() }),
  useCreateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSlugAvailable: () => ({ data: true }),
  upsertPostKeepalive: vi.fn(),
}));

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={["/admin/blogs/new"]}>
      <Routes>
        <Route path="/admin/blogs/new" element={<AdminBlogEditor />} />
      </Routes>
    </MemoryRouter>,
  );
}

const storedPost = {
  title: "Launch checklist",
  slug: "launch-checklist",
  excerpt: "",
  content: "Body copy for the post.",
  categoryId: "cat-1",
  tagNames: [] as string[],
  featuredMediaId: null,
  coverUrl: null,
  coverAlt: "",
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  publishedAt: null,
  archivedAt: null,
};

describe("admin blog editor required fields", () => {
  beforeEach(() => {
    localStorage.clear();
    mutateAsync.mockClear();
  });

  it("marks mandatory fields and keeps Publish disabled until they are filled", () => {
    renderEditor();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getAllByText("*").length).toBeGreaterThanOrEqual(4);

    fireEvent.change(screen.getByPlaceholderText("Add a clear, compelling title"), { target: { value: "Launch checklist" } });
    fireEvent.change(screen.getByLabelText("Post content"), { target: { value: "Body copy for the post." } });
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Select a category" }));
    fireEvent.click(screen.getByRole("button", { name: "SEO" }));
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });

  it("persists a local draft once the user starts writing", async () => {
    renderEditor();
    fireEvent.change(screen.getByPlaceholderText("Add a clear, compelling title"), { target: { value: "Launch checklist" } });
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(COMPOSER_DRAFT_KEY)!).post.title).toBe("Launch checklist");
    });
  });

  it("resumes a stored draft when returning to new post", () => {
    writeComposerDraft({ postId: "draft-1", status: "draft", post: storedPost });
    renderEditor();
    expect(screen.getByPlaceholderText("Add a clear, compelling title")).toHaveValue("Launch checklist");
    expect(screen.getByText("Resumed your draft.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start new post" }));
    expect(screen.getByPlaceholderText("Add a clear, compelling title")).toHaveValue("");
    expect(localStorage.getItem(COMPOSER_DRAFT_KEY)).toBeNull();
  });

  it("saves the draft to the API when leaving the editor after required fields are filled", async () => {
    const { unmount } = renderEditor();
    fireEvent.change(screen.getByPlaceholderText("Add a clear, compelling title"), { target: { value: "Launch checklist" } });
    fireEvent.click(screen.getByRole("button", { name: "Select a category" }));
    fireEvent.click(screen.getByRole("button", { name: "SEO" }));
    unmount();
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });
    expect(mutateAsync.mock.calls[0][0].input.status).toBe("draft");
    expect(mutateAsync.mock.calls[0][0].input.title).toBe("Launch checklist");
  });
});
