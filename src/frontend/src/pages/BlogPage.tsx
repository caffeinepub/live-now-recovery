import type { BlogPost } from "@/backend.d";
import { SEED_BLOG_POSTS } from "@/constants/blogPosts";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

function useBlogPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<BlogPost[]>({
    queryKey: ["publishedBlogPosts"],
    queryFn: async () => {
      if (!actor) return SEED_BLOG_POSTS;
      try {
        const posts = await (actor as any).getPublishedBlogPosts();
        return posts.length > 0 ? posts : SEED_BLOG_POSTS;
      } catch {
        return SEED_BLOG_POSTS;
      }
    },
    enabled: !isFetching,
    placeholderData: SEED_BLOG_POSTS,
  });
}

function formatDate(publishedAt: bigint): string {
  const ms = Number(publishedAt / BigInt(1_000_000));
  if (!ms || ms <= 0) return "";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPage() {
  const { data: posts = SEED_BLOG_POSTS, isLoading } = useBlogPosts();

  useEffect(() => {
    document.title = "Recovery Insights | Live Now Recovery";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.62 0.12 218 / 0.10) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen
                className="h-5 w-5"
                style={{ color: "oklch(0.78 0.10 218)" }}
                aria-hidden="true"
              />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "oklch(0.78 0.10 218)" }}
              >
                Recovery Insights
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Recovery Insights
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
              Evidence-based education on MAT, recovery, and community health.
              Written by peers who have lived it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border h-56 animate-pulse"
                style={{ background: "oklch(0.18 0.01 220)" }}
                data-ocid="blog.loading_state"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="text-center py-20 text-muted-foreground"
            data-ocid="blog.empty_state"
          >
            <BookOpen
              className="h-10 w-10 mx-auto mb-4 opacity-30"
              aria-hidden="true"
            />
            <p className="font-semibold text-foreground mb-1">No posts yet.</p>
            <p className="text-sm">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                className="group rounded-2xl border border-border flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "oklch(0.17 0.01 220)" }}
                data-ocid={`blog.item.${i + 1}`}
              >
                <div
                  className="h-1 w-full flex-shrink-0"
                  style={{
                    background:
                      i % 2 === 0
                        ? "oklch(0.62 0.12 218)"
                        : "oklch(0.62 0.17 155)",
                  }}
                  aria-hidden="true"
                />
                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "oklch(0.70 0.08 220)" }}
                    >
                      {post.author}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      &middot;
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug mb-3 group-hover:text-white transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div
                    className="mt-4 pt-4"
                    style={{ borderTop: "1px solid oklch(0.30 0.01 220)" }}
                  >
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                      style={{ color: "oklch(0.78 0.10 218)" }}
                      data-ocid={`blog.read_more.button.${i + 1}`}
                    >
                      Read More
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
