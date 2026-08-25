import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/features/marketing/components/layout/Navbar";
import { Footer } from "@/features/marketing/components/layout/Footer";
import { StickyMobileCTA } from "@/features/marketing/components/layout/StickyMobileCTA";
import { usePublishedPosts } from "@/features/blog/api";
import { readTime } from "@/features/blog/Markdown";

export default function Blog() {
  const { data: posts = [], isLoading, error } = usePublishedPosts();
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(posts.map((post) => post.categoryName))];
  const visible = category === "All" ? posts : posts.filter((post) => post.categoryName === category);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-32 md:pt-40">
        <section className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 text-xs tracking-caps text-primary-glow">Blog</div>
            <h1 className="font-display text-4xl font-medium leading-[1.05] md:text-6xl">
              Marketing thinking, <span className="italic text-gradient-violet">applied.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Tactics, frameworks, and case-led articles from our team — written for operators, not algorithms.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-2 text-xs tracking-caps ${
                  category === item ? "border-primary bg-accent/40" : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {isLoading && <p className="mt-12 text-center text-muted-foreground">Loading articles…</p>}
          {error && <p className="mt-12 text-center text-destructive">Could not load articles.</p>}
          {!isLoading && !error && visible.length === 0 && (
            <p className="mt-12 text-center text-muted-foreground">No published articles yet.</p>
          )}
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="surface-card group flex flex-col overflow-hidden">
                {post.coverUrl ? (
                  <img src={post.coverUrl} alt={post.coverAlt} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/40 to-primary-deep/40" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-[10px] tracking-caps text-primary-glow">{post.categoryName}</span>
                  <h2 className="mt-2 font-display text-xl group-hover:text-primary-glow">{post.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                  <div className="mt-5 flex justify-between text-xs text-muted-foreground">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}</span>
                    <span>{readTime(post.content)} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}
