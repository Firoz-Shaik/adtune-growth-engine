import type { BlogPostInput } from "@/lib/supabase/types";

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function validPost(post: Pick<BlogPostInput, "title" | "slug" | "excerpt" | "content">) {
  return post.title.trim().length >= 3
    && slugPattern.test(post.slug)
    && post.content.trim().length > 0
    && (post.excerpt || "").length <= 160;
}
