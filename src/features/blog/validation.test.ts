import { describe, expect, it } from "vitest";
import { formatSaveError } from "./errors";
import { draftIssues, publishIssues, slugify, validDraft, validPost } from "./validation";

const post = {
  title: "Useful article",
  slug: "useful-article",
  excerpt: "A useful summary.",
  content: "# Hello",
  category_id: "cat-1",
};

describe("blog editor validation", () => {
  it("accepts a complete Markdown post", () => expect(validPost(post)).toBe(true));
  it("allows an empty excerpt and rejects one over 160 characters", () => {
    expect(validPost({ ...post, excerpt: "" })).toBe(true);
    expect(validPost({ ...post, excerpt: "x".repeat(161) })).toBe(false);
  });
  it("rejects invalid slugs and empty content", () => {
    expect(validPost({ ...post, slug: "Bad Slug" })).toBe(false);
    expect(validPost({ ...post, content: " " })).toBe(false);
  });
  it("requires a category for drafts and publish", () => {
    expect(validDraft({ ...post, category_id: null })).toBe(false);
    expect(validPost({ ...post, category_id: "" })).toBe(false);
    expect(draftIssues({ ...post, category_id: null })).toContain("Select a category.");
  });
  it("allows a draft without body content once title, slug, and category exist", () => {
    expect(validDraft({ ...post, content: "" })).toBe(true);
    expect(publishIssues({ ...post, content: "" })).toContain("Add post content.");
    expect(validPost({ ...post, content: "" })).toBe(false);
  });
  it("slugifies tag and category names", () => expect(slugify("Google Ads")).toBe("google-ads"));
});

describe("save error mapping", () => {
  it("maps a missing category_id constraint to a clear message", () => {
    expect(formatSaveError({
      code: "23502",
      message: 'null value in column "category_id" of relation "blog_posts" violates not-null constraint',
    })).toBe("Add a category before saving.");
  });
  it("maps a duplicate slug to a clear message", () => {
    expect(formatSaveError({
      code: "23505",
      message: "duplicate key value violates unique constraint",
      details: "Key (slug)=(erere) already exists.",
    })).toBe("This slug is already used.");
  });
  it("falls back to the API message when it is already useful", () => {
    expect(formatSaveError({ message: "Slug already exists" })).toBe("Slug already exists");
  });
  it("does not show a generic Try again for plain Postgrest objects", () => {
    expect(formatSaveError({ code: "23502", message: 'null value in column "title" of relation "blog_posts" violates not-null constraint' }))
      .toBe("Add a title before saving.");
  });
});
