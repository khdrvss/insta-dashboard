"use client";

import { useState } from "react";
import { Heart, MessageCircle, Eye, PlayCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Post {
  id: string;
  competitor_handle: string;
  caption?: string;
  hook_text?: string;
  hook_type?: string;
  engagement_score: number;
  likes_est?: number;
  comments_est?: number;
  views_est?: number;
  pacing_style?: string;
  content_format?: string;
  duration_secs?: number;
}

const HOOK_COLORS: Record<string, string> = {
  question: "bg-blue-500/20 text-blue-300 border-blue-500/20",
  shock: "bg-red-500/20 text-red-300 border-red-500/20",
  promise: "bg-violet-500/20 text-violet-300 border-violet-500/20",
  story: "bg-pink-500/20 text-pink-300 border-pink-500/20",
  statistic: "bg-orange-500/20 text-orange-300 border-orange-500/20",
};

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 85 ? "bg-green-500/20 text-green-300" : score >= 70 ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-white/40";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg}`}>{score.toFixed(0)}</span>;
}

export function TopPostsGallery({ posts }: { posts: Post[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-white/20 transition-all"
          onClick={() => setExpanded(expanded === post.id ? null : post.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Hook text */}
              {post.hook_text && (
                <p className="font-medium text-white text-sm leading-snug mb-2 line-clamp-2">
                  &ldquo;{post.hook_text}&rdquo;
                </p>
              )}
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white/30">@{post.competitor_handle}</span>
                {post.hook_type && (
                  <span className={`text-xs px-2 py-0.5 rounded-lg border capitalize ${HOOK_COLORS[post.hook_type] ?? "bg-white/5 text-white/40 border-white/10"}`}>
                    {post.hook_type}
                  </span>
                )}
                {post.content_format && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/40">
                    {post.content_format}
                  </span>
                )}
                {post.duration_secs && (
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <PlayCircle size={11} />{post.duration_secs}s
                  </span>
                )}
              </div>
            </div>
            {/* Score */}
            <ScoreBadge score={post.engagement_score} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            {post.likes_est && (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Heart size={11} className="text-pink-400" />{formatNumber(post.likes_est)}
              </span>
            )}
            {post.comments_est && (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <MessageCircle size={11} className="text-blue-400" />{formatNumber(post.comments_est)}
              </span>
            )}
            {post.views_est && (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Eye size={11} className="text-violet-400" />{formatNumber(post.views_est)}
              </span>
            )}
          </div>

          {/* Expanded: full caption */}
          {expanded === post.id && post.caption && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-white/50 leading-relaxed">{post.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
