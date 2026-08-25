import { Link } from "react-router-dom";
import { useState } from "react";
import { PlusCircle, Search, Edit3, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminPosts, useDeletePost } from "@/features/blog/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { BlogPostView } from "@/features/blog/types";

const filters = ["All", "Published", "Draft", "Review", "Archived"] as const;

const statusStyles: Record<string, string> = {
  published: "border-success/30 bg-success/10 text-success",
  draft: "border-warning/30 bg-warning/10 text-warning",
  review: "border-primary/30 bg-primary/10 text-primary",
  archived: "border-border bg-muted text-muted-foreground",
};

const AdminBlogs = () => {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<BlogPostView | null>(null);
  const { data: posts = [], isLoading, error } = useAdminPosts();
  const deletePost = useDeletePost();
  const filtered = posts.filter((p) => (filter === "All" || p.status === filter.toLowerCase()) && p.title.toLowerCase().includes(q.toLowerCase()));
  const confirmDelete = async () => {
    if (!deleting) return;
    await deletePost.mutateAsync(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts…" className="h-11 pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden gap-1 rounded-full border border-border bg-surface p-1 md:flex">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs tracking-caps transition-colors ${
                  filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button asChild variant="hero">
            <Link to="/admin/blogs/new"><PlusCircle className="h-4 w-4" /> New post</Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs tracking-caps transition-colors ${
              filter === f ? "border-primary bg-accent text-foreground" : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && <div className="surface-card p-8 text-center text-muted-foreground">Loading posts…</div>}
      {error && <div className="surface-card p-8 text-center text-destructive">Could not load posts.</div>}
      {!isLoading && !error && filtered.length === 0 && <div className="surface-card p-8 text-center text-muted-foreground">No posts match this view.</div>}
      <div className="surface-card hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] tracking-caps text-muted-foreground">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-accent/20 transition-colors">
                <td className="max-w-md px-5 py-4">
                  <Link to={`/admin/blogs/edit/${p.id}`} className="block truncate font-medium hover:text-primary-glow">{p.title}</Link>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{p.categoryName}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] tracking-caps ${statusStyles[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/admin/blogs/edit/${p.id}`} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit3 className="h-4 w-4" /></Link>
                    {p.status === "published" && <Link to={`/blog/${p.slug}`} target="_blank" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Eye className="h-4 w-4" /></Link>}
                    <button aria-label={`Delete ${p.title}`} onClick={() => setDeleting(p)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/admin/blogs/edit/${p.id}`} className="flex-1 text-sm font-medium leading-snug">{p.title}</Link>
              <button aria-label={`Delete ${p.title}`} onClick={() => setDeleting(p)} className="shrink-0 rounded-md p-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] tracking-caps ${statusStyles[p.status]}`}>{p.status}</span>
              <span className="text-[11px] text-muted-foreground">{p.categoryName} · {new Date(p.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>This hides “{deleting?.title}” from the public site. The record is kept in the database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} className="bg-destructive text-destructive-foreground">Delete post</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlogs;
