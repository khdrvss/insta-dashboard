"use client";

import { useEffect, useState } from "react";
import {
  Instagram, RefreshCw, ExternalLink, AlertCircle,
  Users, Heart, MessageCircle, Clock, TrendingUp, Loader2
} from "lucide-react";
import { formatNumber, formatEngagementRate } from "@/lib/utils";

interface IGAccount {
  username: string;
  name: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgComments: number;
  postingFreqPerWk: number;
  topHashtags: string[];
  contentMix: Record<string, number>;
  lastSyncedAt: string;
}

interface UserPost {
  id: string;
  igMediaId: string;
  mediaType: string;
  caption?: string;
  thumbnailUrl?: string;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  postedAt?: string;
  permalink?: string;
}

interface ProfileData {
  instagram?: IGAccount;
  connected: boolean;
  mock?: boolean;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: "Reels",
  image: "Photos",
  carousel_album: "Carousels",
  carousel: "Carousels",
  reel: "Reels",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  video: "bg-violet-500",
  reel: "bg-violet-500",
  image: "bg-pink-500",
  carousel_album: "bg-orange-500",
  carousel: "bg-orange-500",
};

export function ProfileOverview() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/profile/posts"),
      ]);
      if (!profileRes.ok) throw new Error("Failed to load profile");
      const profileData = await profileRes.json();
      const postsData = postsRes.ok ? await postsRes.json() : { posts: [] };
      setProfile(profileData);
      setPosts(postsData.posts ?? []);
    } catch (err) {
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/posts", { method: "POST" });
      const data = await res.json();
      if (data.tokenExpired) {
        setError("token_expired");
      } else if (data.redirect) {
        window.location.href = data.redirect;
      } else if (data.synced) {
        await loadProfile();
      } else {
        setError(data.error ?? "Sync failed — please try again");
      }
    } catch {
      setError("Sync failed — please try again");
    } finally {
      setSyncing(false);
    }
  }

  // --- Not connected state ---
  if (!loading && (!profile?.connected || !profile?.instagram)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-semibold text-white">Instagram Account</h2>
            <p className="text-white/40 text-sm mt-0.5">
              Connect to unlock profile analysis and competitor intelligence
            </p>
          </div>
          <a
            href="/api/auth/instagram"
            className="flex items-center gap-2 border border-violet-500/50 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Connect Instagram
          </a>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200/80">
            Requires an Instagram{" "}
            <span className="font-medium text-blue-300">Business or Creator</span> account
            connected to a Facebook Page. We request read-only access only.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/5 border border-white/5 shimmer"
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const ig = profile!.instagram!;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Mock banner */}
      {profile?.mock && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />
          Mock data — set USE_MOCK_DATA=false and connect Instagram for live data
        </div>
      )}

      {/* Error */}
      {error && error !== "token_expired" && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      {error === "token_expired" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-200">
              Instagram token expired. Reconnect to sync your latest posts.
            </p>
          </div>
          <a
            href="/api/auth/instagram"
            className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" />
            Reconnect
          </a>
        </div>
      )}

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          {ig.profilePictureUrl ? (
            <img
              src={ig.profilePictureUrl}
              alt={ig.username}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <Instagram className="h-7 w-7 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-lg">{ig.name || ig.username}</h3>
            <span className="text-white/40 text-sm">@{ig.username}</span>
          </div>
          {ig.biography && (
            <p className="text-white/50 text-sm mt-1 leading-relaxed line-clamp-2">
              {ig.biography}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 border border-white/20 text-white/50 hover:text-white hover:border-white/40 px-3 py-2 rounded-xl text-xs transition-colors disabled:opacity-40"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync
          </button>
          <a
            href={`https://instagram.com/${ig.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-white/20 text-white/50 hover:text-white hover:border-white/40 px-3 py-2 rounded-xl text-xs transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </a>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile icon={Users} label="Followers" value={formatNumber(ig.followersCount)} color="violet" />
        <MetricTile
          icon={TrendingUp}
          label="Avg Engagement"
          value={formatEngagementRate(ig.avgEngagementRate)}
          color="pink"
          note="AI-estimated"
        />
        <MetricTile icon={Heart} label="Avg Likes" value={formatNumber(ig.avgLikes)} color="orange" />
        <MetricTile
          icon={Clock}
          label="Posts / Week"
          value={ig.postingFreqPerWk.toFixed(1)}
          color="green"
        />
      </div>

      {/* Content mix */}
      <div>
        <h4 className="text-sm font-medium text-white/60 mb-3">Content Mix</h4>
        <div className="flex gap-2 items-center flex-wrap">
          {Object.entries(ig.contentMix).map(([type, count]) => {
            const total = Object.values(ig.contentMix).reduce((a, b) => a + b, 0);
            const pct = Math.round((count / total) * 100);
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${CONTENT_TYPE_COLORS[type] ?? "bg-white/30"}`} />
                <span className="text-sm text-white/60">
                  {CONTENT_TYPE_LABELS[type] ?? type} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top hashtags */}
      {ig.topHashtags?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-3">Top Hashtags Used</h4>
          <div className="flex flex-wrap gap-1.5">
            {ig.topHashtags.slice(0, 12).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top posts gallery */}
      {posts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white/60">
              Top Posts by Engagement
            </h4>
            <span className="text-xs text-white/30">Last 30 posts</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {posts.slice(0, 6).map((post) => (
              <PostThumbnail key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Last synced */}
      <p className="text-xs text-white/20">
        Last synced: {new Date(ig.lastSyncedAt).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        })}
      </p>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  color,
  note,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "violet" | "pink" | "orange" | "green";
  note?: string;
}) {
  const colors = {
    violet: "text-violet-400 bg-violet-500/10",
    pink: "text-pink-400 bg-pink-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    green: "text-green-400 bg-green-500/10",
  };
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 p-3">
      <div className={`h-7 w-7 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon size={14} className={colors[color].split(" ")[0]} />
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
      {note && <div className="text-xs text-white/20 mt-0.5">{note}</div>}
    </div>
  );
}

function PostThumbnail({ post }: { post: UserPost }) {
  const typeColors: Record<string, string> = {
    reel: "bg-violet-500",
    video: "bg-violet-500",
    image: "bg-pink-500",
    carousel: "bg-orange-500",
    carousel_album: "bg-orange-500",
  };

  return (
    <a
      href={post.permalink ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/20 transition-all"
    >
      {post.thumbnailUrl ? (
        <img
          src={post.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className={`h-2 w-2 rounded-full ${typeColors[post.mediaType] ?? "bg-white/20"}`} />
        </div>
      )}
      {/* Engagement overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
        <span className="flex items-center gap-1">
          <Heart size={10} />
          {formatNumber(post.likeCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={10} />
          {formatNumber(post.commentCount)}
        </span>
      </div>
      {/* Type badge */}
      <div className={`absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full ${typeColors[post.mediaType] ?? "bg-white/30"}`} />
    </a>
  );
}
