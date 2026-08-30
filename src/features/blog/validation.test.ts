import { describe, expect, it } from "vitest";
import { slugify, validPost } from "./validation";

const post = { title: "Useful article", slug: "useful-article", excerpt: "A useful summary.", content: "# Hello" };

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
  it("slugifies tag and category names", () => expect(slugify("Google Ads")).toBe("google-ads"));
});
