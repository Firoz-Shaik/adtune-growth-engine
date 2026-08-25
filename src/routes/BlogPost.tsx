import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Navbar } from "@/features/marketing/components/layout/Navbar";
import { Footer } from "@/features/marketing/components/layout/Footer";
import { StickyMobileCTA } from "@/features/marketing/components/layout/StickyMobileCTA";
import { FinalCTA } from "@/features/marketing/components/sections/FinalCTA";
import { usePublishedPost } from "@/features/blog/api";
import { Markdown, readTime } from "@/features/blog/Markdown";
import { SeoMeta } from "@/features/marketing/components/layout/SeoMeta";

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading, error } = usePublishedPost(slug);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-12 pt-32 md:pt-40">
        {isLoading && <p className="container text-center text-muted-foreground">Loading article…</p>}
        {error && <p className="container text-center text-destructive">This article could not be loaded.</p>}
        {!isLoading && !error && !post && (
          <div className="container py-20 text-center">
            <h1 className="font-display text-4xl">Article not found</h1>
            <Link to="/blog" className="mt-4 inline-block text-primary-glow">Browse all articles</Link>
          </div>
        )}
        {post && (
          <>
            <SeoMeta
              title={post.metaTitle || post.title}
              description={post.metaDescription || post.excerpt}
              keywords={post.focusKeyword ? [post.focusKeyword, ...post.tags.map((tag) => tag.name)] : post.tags.map((tag) => tag.name)}
              image={post.coverUrl || undefined}
            />
            <article className="container">
              <div className="mx-auto max-w-3xl">
                <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-glow">
                  <ArrowLeft className="h-4 w-4" /> Back to all articles
                </Link>
                <header className="mt-8">
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-[10px] tracking-caps text-primary-glow">
                    {post.categoryName}
                  </span>
                  <h1 className="mt-5 font-display text-3xl font-medium leading-[1.1] md:text-5xl">{post.title}</h1>
                  <div className="mt-5 flex gap-5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {readTime(post.content)} min read
                    </span>
                  </div>
                </header>
                {post.coverUrl && (
                  <img src={post.coverUrl} alt={post.coverAlt} className="mt-10 aspect-video w-full rounded-2xl object-cover" />
                )}
                <div className="prose prose-invert mt-12 max-w-none">
                  <Markdown>{post.content}</Markdown>
                </div>
                {post.tags.length > 0 && (
                  <div className="mt-10 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag.id} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
            <FinalCTA />
          </>
        )}
      </main>
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}
