import type { BlogPost } from "@/backend.d";
import { SEED_BLOG_POSTS } from "@/constants/blogPosts";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

function useBlogPost(slug: string) {
  const { actor, isFetching } = useActor();
  return useQuery<BlogPost | null>({
    queryKey: ["blogPost", slug],
    queryFn: async () => {
      if (!actor) return SEED_BLOG_POSTS.find((p) => p.slug === slug) ?? null;
      try {
        const result = await (actor as any).getBlogPost(slug);
        if (result) return result;
        return SEED_BLOG_POSTS.find((p) => p.slug === slug) ?? null;
      } catch {
        return SEED_BLOG_POSTS.find((p) => p.slug === slug) ?? null;
      }
    },
    enabled: !isFetching && !!slug,
    placeholderData: SEED_BLOG_POSTS.find((p) => p.slug === slug) ?? null,
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

type ContentNode =
  | { type: "ul"; items: string[]; id: string }
  | { type: "p"; parts: Array<{ bold: boolean; text: string }>; id: string };

function parseContent(content: string): ContentNode[] {
  return content.split(/\n\n+/).map((para, i) => {
    if (para.startsWith("- ")) {
      return {
        type: "ul" as const,
        items: para
          .split("\n")
          .filter((l) => l.startsWith("- "))
          .map((l) => l.slice(2)),
        id: `para-${i}`,
      };
    }
    const rawParts = para.split(/(\*\*[^*]+\*\*)/);
    return {
      type: "p" as const,
      parts: rawParts.map((part) =>
        part.startsWith("**") && part.endsWith("**")
          ? { bold: true, text: part.slice(2, -2) }
          : { bold: false, text: part },
      ),
      id: `para-${i}`,
    };
  });
}

function renderContent(content: string) {
  return parseContent(content).map((node) => {
    if (node.type === "ul") {
      return (
        <ul
          key={node.id}
          className="list-disc list-inside space-y-1 text-foreground/85 my-3 ml-2"
        >
          {node.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={node.id} className="text-foreground/85 leading-relaxed">
        {node.parts.map((part) =>
          part.bold ? (
            <strong key={part.text.slice(0, 20)}>{part.text}</strong>
          ) : (
            <span key={part.text.slice(0, 20)}>{part.text}</span>
          ),
        )}
      </p>
    );
  });
}

export default function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const { data: post, isLoading } = useBlogPost(slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Live Now Recovery`;
    }
  }, [post]);

  if (isLoading) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground"
        data-ocid="blogpost.loading_state"
      >
        <BookOpen
          className="h-8 w-8 mx-auto mb-3 opacity-30 animate-pulse"
          aria-hidden="true"
        />
        <p>Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground"
        data-ocid="blogpost.error_state"
      >
        <BookOpen
          className="h-8 w-8 mx-auto mb-4 opacity-30"
          aria-hidden="true"
        />
        <h1 className="text-xl font-bold text-foreground mb-2">
          Post not found
        </h1>
        <p className="mb-6">This article may have been moved or removed.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "oklch(0.78 0.10 218)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Recovery Insights
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="blogpost.back.link"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Recovery Insights
          </Link>
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span
              className="font-semibold"
              style={{ color: "oklch(0.78 0.10 218)" }}
            >
              {post.author}
            </span>
            {formatDate(post.publishedAt) && (
              <>
                <span>&middot;</span>
                <span>{formatDate(post.publishedAt)}</span>
              </>
            )}
          </div>
        </motion.header>

        <div
          className="h-px mb-8 rounded"
          style={{ background: "oklch(0.30 0.01 220)" }}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-5 text-base sm:text-lg"
          data-ocid="blogpost.content.section"
        >
          {renderContent(post.content)}
        </motion.div>

        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid oklch(0.30 0.01 220)" }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "oklch(0.78 0.10 218)" }}
            data-ocid="blogpost.back_bottom.link"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Recovery Insights
          </Link>
        </div>
      </article>
    </div>
  );
}
