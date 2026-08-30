import type { BlogPostInput } from "@/lib/supabase/types";

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PostValidationInput = Pick<BlogPostInput, "title" | "slug" | "excerpt" | "content"> & {
  category_id?: string | null;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function draftIssues(post: PostValidationInput) {
  const issues: string[] = [];
  if (post.title.trim().length < 3) issues.push("Add a title of at least 3 characters.");
  if (!slugPattern.test(post.slug)) issues.push("Add a valid slug.");
  if (!post.category_id) issues.push("Select a category.");
  if ((post.excerpt || "").length > 160) issues.push("Shorten the excerpt to 160 characters.");
  return issues;
}

export function publishIssues(post: PostValidationInput) {
  const issues = draftIssues(post);
  if (post.content.trim().length === 0) issues.push("Add post content.");
  return issues;
}

export function validDraft(post: PostValidationInput) {
  return draftIssues(post).length === 0;
}

export function validPost(post: PostValidationInput) {
  return publishIssues(post).length === 0;
}
