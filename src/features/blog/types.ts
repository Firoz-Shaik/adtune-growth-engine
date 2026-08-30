import type { BlogPostStatus } from "@/lib/supabase/types";

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPostView {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: BlogPostStatus;
  categoryId: string | null;
  categoryName: string;
  tags: BlogTag[];
  featuredMediaId: string | null;
  coverUrl: string | null;
  coverAlt: string;
  authorId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}
