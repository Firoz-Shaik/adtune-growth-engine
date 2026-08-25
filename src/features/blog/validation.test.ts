import { describe, expect, it } from "vitest";
import { slugify, validPost } from "./validation";

const post = { title: "Useful article", slug: "useful-article", excerpt: "A useful summary.", content: "# Hello" };

describe("blog editor validation", () => {
  it("accepts a complete Markdown post", () => expect(validPost(post)).toBe(true));
  it("requires excerpt when publishing", () => {
    expect(validPost({ ...post, excerpt: "" }, true)).toBe(false);
    expect(validPost(post, true)).toBe(true);
  });
  it("rejects invalid slugs and empty content", () => {
    expect(validPost({ ...post, slug: "Bad Slug" })).toBe(false);
    expect(validPost({ ...post, content: " " })).toBe(false);
  });
  it("slugifies tag and category names", () => expect(slugify("Google Ads")).toBe("google-ads"));
});
