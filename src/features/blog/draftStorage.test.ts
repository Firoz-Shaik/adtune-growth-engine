import { beforeEach, describe, expect, it } from "vitest";
import {
  clearComposerDraft,
  COMPOSER_DRAFT_KEY,
  isBlankComposer,
  readComposerDraft,
  writeComposerDraft,
} from "./draftStorage";

const post = {
  title: "Launch checklist",
  slug: "launch-checklist",
  excerpt: "",
  content: "Body copy",
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

describe("composer draft storage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a draft and clears it", () => {
    writeComposerDraft({ postId: "draft-1", status: "draft", post });
    expect(readComposerDraft()?.post.title).toBe("Launch checklist");
    expect(readComposerDraft()?.postId).toBe("draft-1");
    clearComposerDraft("draft-1");
    expect(readComposerDraft()).toBeNull();
  });

  it("does not clear a different post's draft", () => {
    writeComposerDraft({ postId: "draft-1", status: "draft", post });
    clearComposerDraft("other");
    expect(readComposerDraft()?.postId).toBe("draft-1");
  });

  it("returns null for invalid JSON", () => {
    localStorage.setItem(COMPOSER_DRAFT_KEY, "{not-json");
    expect(readComposerDraft()).toBeNull();
  });

  it("treats empty composer fields as blank", () => {
    expect(isBlankComposer({ ...post, title: "", content: "", categoryId: "", excerpt: "" })).toBe(true);
    expect(isBlankComposer(post)).toBe(false);
  });
});
