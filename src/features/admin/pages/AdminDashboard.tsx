import { Link } from "react-router-dom";
import { FileText, Eye, Edit3, PlusCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminPosts } from "@/features/blog/api";

const AdminDashboard = () => {
  const { data: posts = [], isLoading } = useAdminPosts();
  const published = posts.filter((post) => post.status === "published").length;
  const drafts = posts.filter((post) => post.status === "draft" || post.status === "review").length;
  const stats = [
    { label: "Total posts", value: String(posts.length), delta: "All content", icon: FileText },
    { label: "Published", value: String(published), delta: "Live now", icon: Eye },
    { label: "Drafts", value: String(drafts), delta: "Awaiting review", icon: Edit3 },
  ];
  const recent = posts.slice(0, 5);
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary-glow">
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-caps text-muted-foreground">{s.delta}</span>
            </div>
            <div className="mt-5 font-mono text-3xl font-medium">{s.value}</div>
            <div className="mt-1 text-xs tracking-caps text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <div className="text-xs tracking-caps text-muted-foreground">Recent activity</div>
              <h2 className="mt-1 font-display text-lg font-medium">Latest posts</h2>
            </div>
            <Link to="/admin/blogs" className="text-sm text-primary-glow hover:text-foreground">View all →</Link>
          </div>
          <ul className="divide-y divide-border">
            {isLoading && <li className="p-5 text-sm text-muted-foreground">Loading posts…</li>}
            {!isLoading && recent.length === 0 && <li className="p-5 text-sm text-muted-foreground">No posts yet.</li>}
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 p-5 hover:bg-accent/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/blogs/edit/${r.id}`} className="truncate text-sm font-medium hover:text-primary-glow">{r.title}</Link>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(r.updatedAt).toLocaleDateString()}</div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] tracking-caps ${
                  r.status === "published"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-warning/30 bg-warning/10 text-warning"
                }`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-6">
          <div className="text-xs tracking-caps text-muted-foreground">Quick actions</div>
          <h2 className="mt-1 font-display text-lg font-medium">Get going</h2>
          <div className="mt-5 space-y-2.5">
            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/admin/blogs/new"><PlusCircle className="h-4 w-4" /> New blog post</Link>
            </Button>
            <Button asChild variant="subtle" size="lg" className="w-full">
              <Link to="/admin/blogs">Manage all posts</Link>
            </Button>
            <Button asChild variant="subtle" size="lg" className="w-full">
              <Link to="/admin/media">Media library</Link>
            </Button>
          </div>
          <div className="mt-6 rounded-xl border border-border bg-surface-elevated p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ArrowUpRight className="h-4 w-4 text-primary-glow" /> Tip
            </div>
            <p className="mt-1.5 leading-relaxed">Posts with a featured image and a 150-character meta description get 2× more clicks from search.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
