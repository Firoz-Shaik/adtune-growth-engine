import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Bold, ChevronDown, Code, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, MoreHorizontal, Quote, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { upsertPostKeepalive, useAdminPost, useCategories, useCreateCategory, useDeletePost, useMediaLibrary, useSavePost, useSlugAvailable, useTags } from "@/features/blog/api";
import { Markdown, readTime } from "@/features/blog/Markdown";
import { uploadFeaturedMedia } from "@/features/blog/media";
import { clearComposerDraft, isBlankComposer, readComposerDraft, writeComposerDraft } from "@/features/blog/draftStorage";
import { publicMediaUrl } from "@/lib/supabase/client";
import type { BlogPostInput, BlogPostStatus } from "@/lib/supabase/types";
import { formatSaveError } from "@/features/blog/errors";
import { draftIssues, publishIssues, slugify, validDraft, validPost } from "@/features/blog/validation";
import { cn } from "@/lib/utils";

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

type EditorMode = "write" | "preview" | "split";

const empty: EditorState = {
  title: "", slug: "", excerpt: "", content: "", categoryId: "", tagNames: [],
  featuredMediaId: null, coverUrl: null, coverAlt: "", metaTitle: "", metaDescription: "", focusKeyword: "",
  publishedAt: null, archivedAt: null,
};

const serialize = (post: EditorState, status: BlogPostStatus) => JSON.stringify({ post, status });

function toInputFrom(state: EditorState, nextStatus: BlogPostStatus): BlogPostInput {
  return {
    title: state.title.trim(), slug: state.slug, excerpt: state.excerpt, content: state.content,
    featured_media_id: state.featuredMediaId, category_id: state.categoryId, status: nextStatus,
    published_at: nextStatus === "published" ? state.publishedAt || new Date().toISOString() : state.publishedAt,
    archived_at: nextStatus === "archived" ? state.archivedAt || new Date().toISOString() : null,
    meta_title: state.metaTitle.trim() || null, meta_description: state.metaDescription.trim() || null, focus_keyword: state.focusKeyword.trim() || null,
  };
}

function insertAtCursor(content: string, start: number, end: number, before: string, after = "") {
  const selected = content.slice(start, end) || "text";
  return {
    next: content.slice(0, start) + before + selected + after + content.slice(end),
    cursor: start + before.length + selected.length + after.length,
  };
}

function savedCopy(at: Date | null, status: BlogPostStatus) {
  if (!at) return status === "published" ? "Not published yet" : "Not saved yet";
  const seconds = Math.round((Date.now() - at.getTime()) / 1000);
  const when = seconds < 20 ? "just now" : seconds < 60 ? "a moment ago" : at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (status === "published") return `Published · Saved ${when}`;
  if (status === "archived") return `Archived · Saved ${when}`;
  return `Draft saved ${when}`;
}

export default function AdminBlogEditor() {
  const { id: routeId } = useParams();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opened] = useState(() => {
    if (routeId) return { postId: routeId, post: empty, status: "draft" as BlogPostStatus, resumed: false, savedAt: null as number | null };
    const stored = readComposerDraft();
    if (stored && !isBlankComposer(stored.post) && stored.status !== "published" && stored.status !== "archived") {
      return { postId: stored.postId, post: stored.post, status: stored.status, resumed: true, savedAt: stored.updatedAt };
    }
    return { postId: crypto.randomUUID(), post: empty, status: "draft" as BlogPostStatus, resumed: false, savedAt: null as number | null };
  });
  const [postId, setPostId] = useState(opened.postId);
  const { data, isLoading } = useAdminPost(routeId);
  const { data: categories = [] } = useCategories();
  const { data: allTags = [] } = useTags();
  const { data: library = [] } = useMediaLibrary();
  const savePost = useSavePost();
  const deletePost = useDeletePost();
  const createCategory = useCreateCategory();
  const [post, setPost] = useState<EditorState>(opened.post);
  const [status, setStatus] = useState<BlogPostStatus>(opened.status);
  const [resumed, setResumed] = useState(opened.resumed);
  const [mode, setMode] = useState<EditorMode>("write");
  const [tag, setTag] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [manageCategories, setManageCategories] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(opened.savedAt ? new Date(opened.savedAt) : null);
  const [tick, setTick] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const snapshot = useRef("");
  const { data: slugAvailable } = useSlugAvailable(post.slug, postId);
  const isExisting = Boolean(routeId) || Boolean(data);

  useEffect(() => {
    if (!data) return;
    const next: EditorState = {
      title: data.title, slug: data.slug, excerpt: data.excerpt, content: data.content,
      categoryId: data.categoryId || "", tagNames: data.tags.map((item) => item.name),
      featuredMediaId: data.featuredMediaId, coverUrl: data.coverUrl, coverAlt: data.coverAlt,
      metaTitle: data.metaTitle || "", metaDescription: data.metaDescription || "", focusKeyword: data.focusKeyword || "",
      publishedAt: data.publishedAt, archivedAt: data.archivedAt,
    };
    setPost(next);
    setStatus(data.status);
    setSavedAt(new Date(data.updatedAt));
    snapshot.current = serialize(next, data.status);
  }, [data]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const words = useMemo(() => post.content.trim().split(/\s+/).filter(Boolean).length, [post.content]);
  const seoReady = Boolean(post.metaTitle.trim() && post.metaDescription.trim());
  const selectedCategory = categories.find((item) => item.id === post.categoryId);
  const tagSuggestions = allTags.filter((item) => item.name.toLowerCase().includes(tag.trim().toLowerCase()) && !post.tagNames.includes(item.name)).slice(0, 6);
  const filteredCategories = categories.filter((item) => item.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()));
  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setPost((current) => ({ ...current, [key]: value }));

  const toInput = (nextStatus: BlogPostStatus) => toInputFrom(post, nextStatus);

  const canDraft = validDraft(toInput("draft"));
  const canPublish = validPost(toInput("published")) && slugAvailable !== false;
  const blockingPublish = publishIssues(toInput("published"))[0] || (slugAvailable === false ? "This slug is already used." : "");

  const save = async (nextStatus: BlogPostStatus, silent = false) => {
    const input = toInput(nextStatus);
    const issues = nextStatus === "published" ? publishIssues(input) : draftIssues(input);
    if (issues.length) {
      if (!silent) toast({ variant: "destructive", title: nextStatus === "published" ? "Cannot publish yet" : "Cannot save draft", description: issues[0] });
      return false;
    }
    if (slugAvailable === false) {
      if (!silent) toast({ variant: "destructive", title: "Slug already exists" });
      return false;
    }
    try {
      await savePost.mutateAsync({ id: postId, input, authorId: user!.id, tagNames: post.tagNames });
      const nextPost = { ...post, publishedAt: input.published_at, archivedAt: input.archived_at };
      setStatus(nextStatus);
      setPost((current) => ({ ...current, publishedAt: input.published_at, archivedAt: input.archived_at }));
      setSavedAt(new Date());
      snapshot.current = serialize(nextPost, nextStatus);
      if (nextStatus === "published" || nextStatus === "archived") clearComposerDraft(postId);
      else writeComposerDraft({ postId, status: nextStatus, post: nextPost });
      if (!silent) toast({ title: nextStatus === "published" ? "Post published" : nextStatus === "archived" ? "Post archived" : "Draft saved" });
      if (!routeId) navigate(`/admin/blogs/edit/${postId}`, { replace: true });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Save failed", description: formatSaveError(error) });
      return false;
    }
  };

  const saveRef = useRef(save);
  saveRef.current = save;
  const latestRef = useRef({ post, status, postId, user, session, routeId });
  latestRef.current = { post, status, postId, user, session, routeId };

  const persistLocal = (state = post, nextStatus = status, id = postId) => {
    if (nextStatus === "published" || nextStatus === "archived") {
      clearComposerDraft(id);
      return;
    }
    if (isBlankComposer(state)) return;
    const stored = readComposerDraft();
    if (routeId && stored && stored.postId !== id) return;
    if (routeId && !stored) return;
    writeComposerDraft({ postId: id, status: nextStatus, post: state });
  };

  useEffect(() => {
    persistLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, status, postId, routeId]);

  useEffect(() => {
    if (!user || serialize(post, status) === snapshot.current) return;
    if (status === "published" ? !validPost(toInput("published")) : !canDraft) return;
    const timer = window.setTimeout(() => { void saveRef.current(status === "published" ? "published" : "draft", true); }, 2000);
    return () => window.clearTimeout(timer);
    // Autosave once required draft fields exist; unmount/pagehide flush uses refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, status, user, canDraft]);

  useEffect(() => {
    const persistFromLatest = () => {
      const current = latestRef.current;
      if (current.status === "published" || current.status === "archived") {
        clearComposerDraft(current.postId);
        return;
      }
      if (isBlankComposer(current.post)) return;
      const stored = readComposerDraft();
      if (current.routeId && stored && stored.postId !== current.postId) return;
      if (current.routeId && !stored) return;
      writeComposerDraft({ postId: current.postId, status: current.status, post: current.post });
    };
    const canSave = (state: EditorState, nextStatus: BlogPostStatus) => (
      nextStatus === "published" ? validPost(toInputFrom(state, "published")) : validDraft(toInputFrom(state, "draft"))
    );
    const flushKeepalive = () => {
      const current = latestRef.current;
      persistFromLatest();
      if (!current.user || serialize(current.post, current.status) === snapshot.current) return;
      if (!canSave(current.post, current.status)) return;
      const nextStatus = current.status === "published" ? "published" : "draft";
      const token = current.session?.access_token;
      if (token) {
        upsertPostKeepalive({
          id: current.postId,
          input: toInputFrom(current.post, nextStatus),
          authorId: current.user.id,
          accessToken: token,
        });
      }
    };
    const flushFull = () => {
      const current = latestRef.current;
      persistFromLatest();
      if (!current.user || serialize(current.post, current.status) === snapshot.current) return;
      if (!canSave(current.post, current.status)) return;
      void saveRef.current(current.status === "published" ? "published" : "draft", true);
    };
    const onHidden = () => { if (document.visibilityState === "hidden") flushKeepalive(); };
    window.addEventListener("pagehide", flushKeepalive);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flushKeepalive);
      document.removeEventListener("visibilitychange", onHidden);
      flushFull();
    };
  }, []);

  const startNew = () => {
    clearComposerDraft(postId);
    const nextId = crypto.randomUUID();
    setPostId(nextId);
    setPost(empty);
    setStatus("draft");
    setSavedAt(null);
    setResumed(false);
    snapshot.current = serialize(empty, "draft");
    if (routeId) navigate("/admin/blogs/new");
  };

  const applyFormat = (before: string, after = "") => {
    const field = editorRef.current;
    const start = field?.selectionStart ?? post.content.length;
    const end = field?.selectionEnd ?? post.content.length;
    const { next, cursor } = insertAtCursor(post.content, start, end, before, after);
    update("content", next);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(cursor, cursor);
    });
  };

  const addTagName = (value: string) => {
    const next = value.trim();
    if (!next || post.tagNames.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    update("tagNames", [...post.tagNames, next]);
    setTag("");
  };

  const onTagKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTagName(tag);
    }
    if (event.key === "Backspace" && !tag && post.tagNames.length) update("tagNames", post.tagNames.slice(0, -1));
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

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const created = await createCategory.mutateAsync(newCategory);
      update("categoryId", created.id);
      setNewCategory("");
      setCategoryOpen(false);
      setManageCategories(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not create category", description: error instanceof Error ? error.message : "Try again." });
    }
  };

  if (routeId && isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading post…</div>;
  if (routeId && !isLoading && !data) return <div className="py-16 text-center text-sm text-muted-foreground">This post was not found.</div>;

  return (
    <div className="pb-16">
      <div className="sticky top-16 z-10 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Link to="/admin/blogs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Posts
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline" key={tick}>{savedCopy(savedAt, status)}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMode((current) => current === "preview" ? "write" : "preview")}>
            {mode === "preview" ? "Write" : "Preview"}
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={() => void save("published")}
            disabled={savePost.isPending || !canPublish}
            title={!canPublish ? blockingPublish : undefined}
          >
            Publish
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void save(status === "published" ? "published" : "draft")}>Save now</DropdownMenuItem>
              {isExisting && status === "published" && <DropdownMenuItem onClick={() => void save("draft")}>Unpublish</DropdownMenuItem>}
              {isExisting && status !== "archived" && <DropdownMenuItem onClick={() => void save("archived")}>Archive</DropdownMenuItem>}
              {isExisting && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={async () => {
                    await deletePost.mutateAsync(postId);
                    clearComposerDraft(postId);
                    navigate("/admin/blogs");
                  }}>Delete</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <section className="mx-auto w-full max-w-[740px]">
          {resumed && !routeId && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-accent/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Resumed your draft.</span>
              <button type="button" className="shrink-0 text-primary hover:underline" onClick={startNew}>Start new post</button>
            </div>
          )}
          <label className="mb-2 block text-xs text-muted-foreground">Title <RequiredStar /></label>
          <input
            value={post.title}
            onChange={(event) => {
              if (!post.slug || post.slug === slugify(post.title)) update("slug", slugify(event.target.value));
              update("title", event.target.value);
            }}
            placeholder="Add a clear, compelling title"
            aria-required
            className="w-full bg-transparent font-display text-4xl font-medium leading-tight text-foreground outline-none placeholder:text-muted-foreground/50 md:text-5xl"
          />
          <div className="mt-3 text-sm text-muted-foreground">
            <span className="mr-2 text-xs">Slug <RequiredStar /></span>
            {slugAvailable === false ? <span className="text-destructive">This slug is already used.</span> : editingSlug ? (
              <span className="inline-flex items-center gap-2">
                adtunedigital.in/blog/
                <input value={post.slug} onChange={(event) => update("slug", slugify(event.target.value))} className="w-56 border-b border-border bg-transparent outline-none focus:border-primary" />
                <button type="button" className="text-primary" onClick={() => setEditingSlug(false)}>Done</button>
              </span>
            ) : (
              <span>
                adtunedigital.in/blog/{post.slug || "your-post"}
                <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setEditingSlug(true)}>Edit</button>
              </span>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-b border-border pb-2">
            <div className="flex rounded-md bg-muted/40 p-0.5 text-xs">
              {(["write", "preview"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn("rounded px-2.5 py-1 capitalize", mode === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  {item}
                </button>
              ))}
              <button type="button" onClick={() => setMode("split")} className={cn("hidden rounded px-2.5 py-1 xl:inline", mode === "split" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Split</button>
            </div>
            {mode !== "preview" && <FormatBar onFormat={applyFormat} />}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Body <RequiredStar /></div>

          <div className={cn("mt-3", mode === "split" && "grid gap-6 xl:grid-cols-2")}>
            {mode !== "preview" && (
              <Textarea
                ref={editorRef}
                aria-label="Post content"
                aria-required
                value={post.content}
                onChange={(event) => update("content", event.target.value)}
                placeholder="Start writing…"
                className="min-h-[520px] resize-none border-0 bg-transparent p-0 text-base leading-8 shadow-none focus-visible:ring-0"
              />
            )}
            {mode !== "write" && (
              <div className="prose prose-invert min-h-[520px] max-w-none">
                <Markdown>{post.content || "*Nothing to preview yet.*"}</Markdown>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-muted-foreground">{words} words · {readTime(post.content)} min read</div>

          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-8 border-t border-border pt-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground">
              Post details
              <ChevronDown className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <label className="text-xs text-muted-foreground">Excerpt <span className="text-muted-foreground/70">(optional)</span></label>
              <Textarea value={post.excerpt} onChange={(event) => update("excerpt", event.target.value.slice(0, 160))} rows={3} className="mt-2" placeholder="A short summary for listings and search." />
              <div className="mt-1 text-right text-xs text-muted-foreground">{post.excerpt.length}/160</div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-xl border border-border/70 bg-background/40 px-4 xl:w-[300px]">
            <RailSection title="Featured image" defaultOpen>
              {post.coverUrl ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-lg">
                    <img src={post.coverUrl} alt={post.coverAlt} className="aspect-video w-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <label className="cursor-pointer text-xs text-primary hover:underline">
                      Replace
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
                    </label>
                    <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setPost((current) => ({ ...current, featuredMediaId: null, coverUrl: null, coverAlt: "" }))}>Remove</button>
                  </div>
                  <Input value={post.coverAlt} onChange={(event) => update("coverAlt", event.target.value)} placeholder="Alt text" />
                </div>
              ) : (
                <div
                  onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn("rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground", dragging && "border-primary bg-accent/30")}
                >
                  <Upload className="mx-auto mb-2 h-4 w-4" />
                  <p>{uploading ? "Uploading…" : "Drag an image here"}</p>
                  <p className="mt-1 text-xs">1600 × 900 recommended · JPEG, PNG, WebP · 4 MB</p>
                  <div className="mt-3 flex justify-center gap-3 text-xs">
                    <label className="cursor-pointer text-primary hover:underline">
                      Upload
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} disabled={uploading} />
                    </label>
                    <button type="button" className="text-primary hover:underline" onClick={() => setLibraryOpen(true)}>Media library</button>
                  </div>
                </div>
              )}
            </RailSection>

            <RailSection title="Organization" defaultOpen>
              <label className="text-xs text-muted-foreground">Category <RequiredStar /></label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="mt-1 h-10 w-full justify-between font-normal" aria-required>
                    {selectedCategory?.name || "Select a category"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[268px] p-2">
                  <Input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Search categories" className="h-9" />
                  <div className="mt-2 max-h-48 overflow-auto">
                    {filteredCategories.map((item) => (
                      <button key={item.id} type="button" className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { update("categoryId", item.id); setCategoryOpen(false); setCategoryQuery(""); }}>
                        {item.name}
                      </button>
                    ))}
                    {filteredCategories.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No matches</p>}
                  </div>
                  <button type="button" className="mt-2 text-xs text-primary hover:underline" onClick={() => { setCategoryOpen(false); setManageCategories(true); }}>Manage categories</button>
                </PopoverContent>
              </Popover>
              {!post.categoryId && (
                <p className="mt-2 text-xs text-warning">
                  {categories.length === 0 ? (
                    <>
                      Create a category to save this as a draft.{" "}
                      <button type="button" className="text-primary hover:underline" onClick={() => setManageCategories(true)}>Create one</button>
                    </>
                  ) : (
                    "Select a category to save this as a draft."
                  )}
                </p>
              )}

              <label className="mt-4 block text-xs text-muted-foreground">Tags</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {post.tagNames.map((item) => (
                  <span key={item} className="rounded-full bg-accent px-2 py-0.5 text-xs">
                    {item}
                    <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => update("tagNames", post.tagNames.filter((value) => value !== item))} aria-label={`Remove ${item}`}>×</button>
                  </span>
                ))}
              </div>
              <Input value={tag} onChange={(event) => setTag(event.target.value)} onKeyDown={onTagKey} placeholder="Add a tag" className="mt-2 h-9" />
              {tag && tagSuggestions.length > 0 && (
                <div className="mt-1 rounded-md border border-border bg-background p-1">
                  {tagSuggestions.map((item) => (
                    <button key={item.id} type="button" className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-accent" onClick={() => addTagName(item.name)}>{item.name}</button>
                  ))}
                </div>
              )}
            </RailSection>

            <RailSection title="SEO" hint={seoReady ? "Configured" : "Not configured"}>
              <Input value={post.metaTitle} onChange={(event) => update("metaTitle", event.target.value.slice(0, 70))} placeholder="Meta title" />
              <Textarea value={post.metaDescription} onChange={(event) => update("metaDescription", event.target.value.slice(0, 160))} placeholder="Meta description" className="mt-2" rows={3} />
              <Input value={post.focusKeyword} onChange={(event) => update("focusKeyword", event.target.value)} placeholder="Focus keyword" className="mt-2" />
            </RailSection>
          </div>
        </aside>
      </div>

      <Dialog open={manageCategories} onOpenChange={setManageCategories}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage categories</DialogTitle>
            <DialogDescription>Create a category without leaving the editor.</DialogDescription>
          </DialogHeader>
          <ul className="max-h-48 space-y-1 overflow-auto text-sm">
            {categories.map((item) => <li key={item.id} className="rounded-md px-2 py-1.5 hover:bg-accent/40">{item.name}</li>)}
            {categories.length === 0 && <li className="px-2 py-3 text-muted-foreground">No categories yet.</li>}
          </ul>
          <div className="flex gap-2">
            <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category name" />
            <Button type="button" onClick={() => void addCategory()} disabled={createCategory.isPending}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
            <DialogDescription>Select an existing image for this post.</DialogDescription>
          </DialogHeader>
          {library.length === 0 ? <p className="text-sm text-muted-foreground">No images uploaded yet.</p> : (
            <div className="grid max-h-80 grid-cols-3 gap-3 overflow-auto">
              {library.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="overflow-hidden rounded-lg border border-border hover:border-primary"
                  onClick={() => {
                    setPost((current) => ({ ...current, featuredMediaId: item.id, coverUrl: item.url, coverAlt: item.alt_text || current.coverAlt }));
                    setLibraryOpen(false);
                  }}
                >
                  <img src={item.url || ""} alt={item.alt_text || item.file_name} className="aspect-video w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequiredStar() {
  return <span className="text-destructive" aria-hidden="true">*</span>;
}

function RailSection({ title, hint, defaultOpen = false, children }: { title: string; hint?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border py-3 last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
        <span>{title}</span>
        <span className="flex items-center gap-2">
          {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function FormatBar({ onFormat }: { onFormat: (before: string, after?: string) => void }) {
  const tools = [
    { icon: Heading2, label: "Heading", before: "## ", after: "" },
    { icon: Bold, label: "Bold", before: "**", after: "**" },
    { icon: Italic, label: "Italic", before: "_", after: "_" },
    { icon: Link2, label: "Link", before: "[", after: "](url)" },
    { icon: ImagePlus, label: "Image", before: "![", after: "](url)" },
    { icon: List, label: "List", before: "- ", after: "" },
    { icon: ListOrdered, label: "Numbered list", before: "1. ", after: "" },
    { icon: Quote, label: "Quote", before: "> ", after: "" },
    { icon: Code, label: "Code", before: "`", after: "`" },
  ] as const;
  return (
    <div className="hidden gap-0.5 sm:flex">
      {tools.map((tool) => (
        <Button key={tool.label} type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label={tool.label} onClick={() => onFormat(tool.before, tool.after)}>
          <tool.icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
}
