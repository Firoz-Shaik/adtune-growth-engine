import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, Save, Send, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { useAdminPost, useCategories, useCreateCategory, useSavePost, useSlugAvailable, useTags } from "@/features/blog/api";
import { Markdown, readTime } from "@/features/blog/Markdown";
import { uploadFeaturedMedia } from "@/features/blog/media";
import { publicMediaUrl } from "@/lib/supabase/client";
import type { BlogPostInput, BlogPostStatus } from "@/lib/supabase/types";
import { slugify, validPost } from "@/features/blog/validation";

type EditorState = {
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

const empty: EditorState = {
  title: "", slug: "", excerpt: "", content: "", categoryId: "", tagNames: [],
  featuredMediaId: null, coverUrl: null, coverAlt: "", metaTitle: "", metaDescription: "", focusKeyword: "",
  publishedAt: null, archivedAt: null,
};

export default function AdminBlogEditor() {
  const { id: routeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [postId] = useState(() => routeId || crypto.randomUUID());
  const { data, isLoading } = useAdminPost(routeId);
  const { data: categories = [] } = useCategories();
  const { data: allTags = [] } = useTags();
  const savePost = useSavePost();
  const createCategory = useCreateCategory();
  const [post, setPost] = useState<EditorState>(empty);
  const [preview, setPreview] = useState(false);
  const [tag, setTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const { data: slugAvailable } = useSlugAvailable(post.slug, postId);
  const isExisting = Boolean(routeId);

  useEffect(() => {
    if (!data) return;
    setPost({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      categoryId: data.categoryId || "",
      tagNames: data.tags.map((item) => item.name),
      featuredMediaId: data.featuredMediaId,
      coverUrl: data.coverUrl,
      coverAlt: data.coverAlt,
      metaTitle: data.metaTitle || "",
      metaDescription: data.metaDescription || "",
      focusKeyword: data.focusKeyword || "",
      publishedAt: data.publishedAt,
      archivedAt: data.archivedAt,
    });
  }, [data]);

  const words = useMemo(() => post.content.trim().split(/\s+/).filter(Boolean).length, [post.content]);
  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setPost((current) => ({ ...current, [key]: value }));

  const addTag = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !tag.trim()) return;
    event.preventDefault();
    update("tagNames", [...new Set([...post.tagNames, tag.trim()])]);
    setTag("");
  };

  const toInput = (status: BlogPostStatus): BlogPostInput => ({
    title: post.title.trim(),
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featured_media_id: post.featuredMediaId,
    category_id: post.categoryId || null,
    status,
    published_at: status === "published" ? post.publishedAt || new Date().toISOString() : post.publishedAt,
    archived_at: status === "archived" ? post.archivedAt || new Date().toISOString() : null,
    meta_title: post.metaTitle.trim() || null,
    meta_description: post.metaDescription.trim() || null,
    focus_keyword: post.focusKeyword.trim() || null,
  });

  const save = async (status: BlogPostStatus) => {
    const input = toInput(status);
    if (!validPost(input, status === "published")) {
      return toast({ variant: "destructive", title: "Complete required fields", description: status === "published" ? "Add a title, slug, excerpt, and Markdown content before publishing." : "Add a title, valid slug, and Markdown content." });
    }
    if (slugAvailable === false) return toast({ variant: "destructive", title: "Slug already exists" });
    try {
      await savePost.mutateAsync({ id: postId, input, authorId: user!.id, tagNames: post.tagNames });
      setPost((current) => ({ ...current, publishedAt: input.published_at, archivedAt: input.archived_at }));
      toast({ title: status === "published" ? "Post published" : status === "archived" ? "Post archived" : "Draft saved" });
      if (!isExisting) navigate(`/admin/blogs/edit/${postId}`, { replace: true });
    } catch (error) {
      toast({ variant: "destructive", title: "Save failed", description: error instanceof Error ? error.message : "Try again." });
    }
  };

  const upload = async (file?: File) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const uploaded = await uploadFeaturedMedia(file, user.id, postId, post.coverAlt || post.title);
      setPost((current) => ({
        ...current,
        featuredMediaId: uploaded.id,
        coverUrl: publicMediaUrl(uploaded.storage_path, uploaded.bucket_name),
        coverAlt: uploaded.alt_text || current.coverAlt,
      }));
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setUploading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const created = await createCategory.mutateAsync(newCategory);
      update("categoryId", created.id);
      setNewCategory("");
    } catch (error) {
      toast({ variant: "destructive", title: "Could not create category", description: error instanceof Error ? error.message : "Try again." });
    }
  };

  if (routeId && isLoading) return <div className="surface-card p-8 text-center text-muted-foreground">Loading post…</div>;
  if (routeId && !isLoading && !data) return <div className="surface-card p-8 text-center text-muted-foreground">This post was not found.</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <Link to="/admin/blogs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All blogs</Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="subtle" onClick={() => void save("draft")} disabled={savePost.isPending}><Save className="h-4 w-4" /> Save draft</Button>
          <Button variant="subtle" onClick={() => void save("review")} disabled={savePost.isPending}>Submit review</Button>
          <Button variant="hero" onClick={() => void save("published")} disabled={savePost.isPending}><Send className="h-4 w-4" /> Publish</Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="surface-card space-y-5 p-5 md:p-7">
          <Input value={post.title} onChange={(e) => { if (!post.slug || post.slug === slugify(post.title)) update("slug", slugify(e.target.value)); update("title", e.target.value); }} placeholder="Untitled post" className="h-auto border-0 bg-transparent px-0 font-display text-3xl focus-visible:ring-0" />
          <div>
            <label className="text-xs tracking-caps text-muted-foreground">Slug</label>
            <Input value={post.slug} onChange={(e) => update("slug", slugify(e.target.value))} className="mt-1" />
            <p className={`mt-1 text-xs ${slugAvailable === false ? "text-destructive" : "text-muted-foreground"}`}>
              {slugAvailable === false ? "This slug is already used." : `/blog/${post.slug || "your-post"}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={!preview ? "secondary" : "ghost"} onClick={() => setPreview(false)}>Markdown</Button>
            <Button type="button" size="sm" variant={preview ? "secondary" : "ghost"} onClick={() => setPreview(true)}>Preview</Button>
          </div>
          {preview
            ? <div className="prose prose-invert min-h-[420px] max-w-none rounded-xl border border-border p-5"><Markdown>{post.content || "*Nothing to preview yet.*"}</Markdown></div>
            : <Textarea aria-label="Post content" value={post.content} onChange={(e) => update("content", e.target.value)} rows={18} placeholder="Write in Markdown…" className="min-h-[420px] font-mono" />}
          <div>
            <label className="text-xs tracking-caps text-muted-foreground">Excerpt</label>
            <Textarea value={post.excerpt} onChange={(e) => update("excerpt", e.target.value.slice(0, 160))} rows={2} className="mt-1" />
            <div className="text-right text-xs text-muted-foreground">{post.excerpt.length}/160</div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="surface-card space-y-4 p-5">
            <label className="text-xs tracking-caps text-muted-foreground">Featured image</label>
            {post.coverUrl && (
              <div className="relative">
                <img src={post.coverUrl} alt={post.coverAlt} className="aspect-video w-full rounded-lg object-cover" />
                <button type="button" onClick={() => setPost((current) => ({ ...current, featuredMediaId: null, coverUrl: null }))} className="absolute right-2 top-2 rounded-full bg-background p-1"><X className="h-4 w-4" /></button>
              </div>
            )}
            <Input value={post.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} placeholder="Alt text" />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Choose image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} disabled={uploading} />
            </label>
          </div>
          <div className="surface-card space-y-4 p-5">
            <label className="text-xs tracking-caps text-muted-foreground">Category</label>
            <Select value={post.categoryId || undefined} onValueChange={(value) => update("categoryId", value)}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" />
              <Button type="button" variant="subtle" onClick={() => void addCategory()} disabled={createCategory.isPending}>Add</Button>
            </div>
            <label className="text-xs tracking-caps text-muted-foreground">Tags</label>
            <div className="flex flex-wrap gap-2">
              {post.tagNames.map((item) => (
                <span key={item} className="rounded-full bg-accent px-2 py-1 text-xs">
                  {item} <button type="button" onClick={() => update("tagNames", post.tagNames.filter((value) => value !== item))}>×</button>
                </span>
              ))}
            </div>
            <Input list="existing-tags" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={addTag} placeholder="Type tag, press Enter" />
            <datalist id="existing-tags">
              {allTags.map((item) => <option key={item.id} value={item.name} />)}
            </datalist>
          </div>
          <div className="surface-card space-y-3 p-5">
            <div className="text-xs tracking-caps text-muted-foreground">SEO</div>
            <Input value={post.metaTitle} onChange={(e) => update("metaTitle", e.target.value.slice(0, 70))} placeholder="Meta title" />
            <Textarea value={post.metaDescription} onChange={(e) => update("metaDescription", e.target.value.slice(0, 160))} placeholder="Meta description" />
            <Input value={post.focusKeyword} onChange={(e) => update("focusKeyword", e.target.value)} placeholder="Focus keyword" />
          </div>
          <div className="surface-card space-y-3 p-5">
            <div className="text-sm text-muted-foreground">{words} words · {readTime(post.content)} min read</div>
            <Button variant="subtle" className="w-full" onClick={() => void save("archived")} disabled={savePost.isPending}>
              <Archive className="h-4 w-4" /> Archive
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
