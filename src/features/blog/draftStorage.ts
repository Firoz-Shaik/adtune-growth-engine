import type { BlogPostStatus } from "@/lib/supabase/types";

export const COMPOSER_DRAFT_KEY = "adtune.blog.composer-draft";

export type ComposerDraftPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tagNames: string[];
  featuredMediaId: string | null;
  coverUrl: string | null;
  coverAlt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  publishedAt: string | null;
  archivedAt: string | null;
};

export type ComposerDraft = {
  postId: string;
  status: BlogPostStatus;
  post: ComposerDraftPost;
  updatedAt: number;
};

export function isBlankComposer(post: ComposerDraftPost) {
  return !post.title.trim() && !post.content.trim() && !post.categoryId && !post.excerpt.trim();
}

export function readComposerDraft(): ComposerDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(COMPOSER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ComposerDraft;
    if (!parsed?.postId || !parsed.post || typeof parsed.post.title !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeComposerDraft(draft: Omit<ComposerDraft, "updatedAt">) {
  if (typeof localStorage === "undefined") return;
  const payload: ComposerDraft = { ...draft, updatedAt: Date.now() };
  localStorage.setItem(COMPOSER_DRAFT_KEY, JSON.stringify(payload));
}

export function clearComposerDraft(postId?: string) {
  if (typeof localStorage === "undefined") return;
  if (postId) {
    const current = readComposerDraft();
    if (current && current.postId !== postId) return;
  }
  localStorage.removeItem(COMPOSER_DRAFT_KEY);
}
