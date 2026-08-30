import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePublishedPosts } from "@/features/blog/api";
import { readTime } from "@/features/blog/Markdown";

export function BlogTeaser() {
  const { data: blogs = [] } = usePublishedPosts(3);
  if (!blogs.length) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="mb-3 text-xs text-primary-glow tracking-caps">Insights</div>
            <h2 className="font-display text-3xl font-medium leading-tight md:text-4xl">
              Marketing thinking, <span className="italic text-gradient-violet">applied.</span>
            </h2>
          </div>
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-primary-glow hover:text-foreground transition-colors">
            All articles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {blogs.map((b) => (
            <Link key={b.slug} to={`/blog/${b.slug}`} className="surface-card group flex flex-col overflow-hidden">
              <div className="relative h-44 bg-gradient-to-br from-primary/40 to-primary-deep/40">
                {b.coverUrl && <img src={b.coverUrl} alt={b.coverAlt} className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent,hsl(var(--background))_120%)]" />
                <span className="absolute left-4 top-4 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[10px] tracking-caps text-foreground backdrop-blur">
                  {b.categoryName}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-medium leading-snug transition-colors group-hover:text-primary-glow md:text-xl">
                  {b.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : ""}</span>
                  <span>{readTime(b.content)} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
