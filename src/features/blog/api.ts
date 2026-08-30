import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, publicMediaUrl, supabase } from "@/lib/supabase/client";
import type { BlogPostInput, BlogPostStatus } from "@/lib/supabase/types";
import { slugify } from "./validation";
import type { BlogPostView } from "./types";

const postSelect = `
  id, title, slug, excerpt, content, status, published_at, archived_at, updated_at, author_id,
  meta_title, meta_description, focus_keyword, featured_media_id, category_id,
  category:categories(id, name, slug),
  featured_media:media(id, storage_path, alt_text, bucket_name),
  blog_post_tags(tag:tags(id, name, slug, deleted_at))
`;

type EmbeddedCategory = { id: string; name: string; slug: string };
type EmbeddedMedia = { id: string; storage_path: string; alt_text: string | null; bucket_name: string };
type EmbeddedTag = { id: string; name: string; slug: string; deleted_at: string | null };
type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: BlogPostStatus;
  published_at: string | null;
  archived_at: string | null;
  updated_at: string;
  author_id: string;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  featured_media_id: string | null;
  category_id: string | null;
  category: EmbeddedCategory | EmbeddedCategory[] | null;
  featured_media: EmbeddedMedia | EmbeddedMedia[] | null;
  blog_post_tags: { tag: EmbeddedTag | null }[] | null;
};

export const blogKeys = {
  all: ["blog-posts"] as const,
  public: ["blog-posts", "published"] as const,
  categories: ["blog-categories"] as const,
  tags: ["blog-tags"] as const,
  detail: (id: string) => ["blog-posts", "detail", id] as const,
  slug: (slug: string) => ["blog-posts", "slug", slug] as const,
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mapPost(row: PostRow): BlogPostView {
  const category = one(row.category);
  const media = one(row.featured_media);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    status: row.status,
    categoryId: row.category_id,
    categoryName: category?.name || "General",
    tags: (row.blog_post_tags || [])
      .map((item) => item.tag)
      .filter((tag): tag is EmbeddedTag => Boolean(tag) && !tag?.deleted_at)
      .map(({ id, name, slug }) => ({ id, name, slug })),
    featuredMediaId: row.featured_media_id,
    coverUrl: publicMediaUrl(media?.storage_path, media?.bucket_name),
    coverAlt: media?.alt_text || row.title,
    authorId: row.author_id,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    focusKeyword: row.focus_keyword,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPublishedPosts(limit?: number) {
  let query = supabase
    .from("blog_posts")
    .select(postSelect)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return ((data || []) as unknown as PostRow[]).map(mapPost);
}

export function usePublishedPosts(limit?: number) {
  return useQuery({
    queryKey: [...blogKeys.public, limit],
    enabled: isSupabaseConfigured,
    queryFn: () => fetchPublishedPosts(limit),
  });
}

export function usePublishedPost(slug?: string) {
  return useQuery({
    queryKey: blogKeys.slug(slug || ""),
    enabled: isSupabaseConfigured && Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(postSelect)
        .eq("slug", slug!)
        .eq("status", "published")
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data ? mapPost(data as unknown as PostRow) : null;
    },
  });
}

export function useAdminPosts() {
  return useQuery({
    queryKey: blogKeys.all,
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(postSelect)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as unknown as PostRow[]).map(mapPost);
    },
  });
}

export function useAdminPost(id?: string) {
  return useQuery({
    queryKey: blogKeys.detail(id || ""),
    enabled: isSupabaseConfigured && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select(postSelect).eq("id", id!).is("deleted_at", null).maybeSingle();
      if (error) throw error;
      return data ? mapPost(data as unknown as PostRow) : null;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: blogKeys.categories,
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug").is("deleted_at", null).order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMediaLibrary() {
  return useQuery({
    queryKey: ["blog-media"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id, storage_path, file_name, alt_text, bucket_name")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(48);
      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        url: publicMediaUrl(item.storage_path, item.bucket_name),
      }));
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: blogKeys.tags,
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("id, name, slug").is("deleted_at", null).order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useSlugAvailable(slug: string, postId?: string) {
  return useQuery({
    queryKey: ["blog-slug", slug, postId],
    enabled: isSupabaseConfigured && slug.length >= 3,
    queryFn: async () => {
      let query = supabase.from("blog_posts").select("id").eq("slug", slug).is("deleted_at", null);
      if (postId) query = query.neq("id", postId);
      const { data, error } = await query.limit(1);
      if (error) throw error;
      return data.length === 0;
    },
  });
}

async function ensureTagId(name: string) {
  const slug = slugify(name);
  const label = name.trim();
  const { data: existing, error: lookupError } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.id;
  const { data, error } = await supabase.from("tags").insert({ name: label, slug }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function syncPostTags(postId: string, names: string[]) {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const tagIds = await Promise.all(unique.map(ensureTagId));
  const { data: current, error: currentError } = await supabase.from("blog_post_tags").select("tag_id").eq("blog_post_id", postId);
  if (currentError) throw currentError;
  const currentIds = (current || []).map((row) => row.tag_id);
  const remove = currentIds.filter((id) => !tagIds.includes(id));
  const add = tagIds.filter((id) => !currentIds.includes(id));
  if (remove.length) {
    const { error } = await supabase.from("blog_post_tags").delete().eq("blog_post_id", postId).in("tag_id", remove);
    if (error) throw error;
  }
  if (add.length) {
    const { error } = await supabase.from("blog_post_tags").insert(add.map((tag_id) => ({ blog_post_id: postId, tag_id })));
    if (error) throw error;
  }
}

export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const slug = slugify(name);
      const { data: existing } = await supabase.from("categories").select("id, name, slug").eq("slug", slug).is("deleted_at", null).maybeSingle();
      if (existing) return existing;
      const { data, error } = await supabase.from("categories").insert({ name: name.trim(), slug }).select("id, name, slug").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: blogKeys.categories }),
  });
}

export function useSavePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      authorId,
      tagNames,
    }: {
      id: string;
      input: BlogPostInput;
      authorId: string;
      tagNames: string[];
    }) => {
      const { data: existing } = await supabase.from("blog_posts").select("id").eq("id", id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("blog_posts").update(input).eq("id", id).select("id").single();
        if (error) throw error;
        await syncPostTags(data.id, tagNames);
        return data;
      }
      const { data, error } = await supabase.from("blog_posts").insert({ ...input, id, author_id: authorId }).select("id").single();
      if (error) throw error;
      await syncPostTags(data.id, tagNames);
      return data;
    },
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: blogKeys.all });
      client.invalidateQueries({ queryKey: blogKeys.public });
      client.invalidateQueries({ queryKey: blogKeys.detail(variables.id) });
      client.invalidateQueries({ queryKey: blogKeys.tags });
    },
  });
}

export function useDeletePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: blogKeys.all }),
  });
}
