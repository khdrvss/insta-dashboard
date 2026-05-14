/**
 * Meta Graph API client
 * Handles Instagram Business account data via official Meta Graph API.
 * All data fetched is from the authenticated user's own account only.
 */

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

export interface IGMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface IGAccount {
  id: string;
  username: string;
  name: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

export interface IGInsight {
  id: string;
  impressions?: number;
  reach?: number;
  engagement?: number;
}

/** Exchange short-lived code for a short-lived user access token */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: process.env.META_OAUTH_REDIRECT_URI!,
    code,
  });

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

/** Exchange a short-lived token for a 60-day long-lived token */
export async function getLongLivedToken(shortToken: string): Promise<{ token: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`Long-lived token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return { token: data.access_token, expiresIn: data.expires_in };
}

/** Get the Facebook Pages managed by this user */
export async function getFacebookPages(accessToken: string): Promise<Array<{ id: string; name: string; access_token: string }>> {
  const res = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${accessToken}`);
  if (!res.ok) throw new Error(`Pages fetch failed: ${await res.text()}`);
  const data = await res.json();
  return data.data ?? [];
}

/** Get the Instagram Business Account connected to a Facebook Page */
export async function getIGBusinessAccount(pageId: string, pageToken: string): Promise<{ id: string } | null> {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.instagram_business_account ?? null;
}

/** Fetch Instagram Business account profile */
export async function getIGProfile(igUserId: string, accessToken: string): Promise<IGAccount> {
  const fields = "id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count";
  const res = await fetch(
    `${GRAPH_BASE}/${igUserId}?fields=${fields}&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error(`Profile fetch failed: ${await res.text()}`);
  return res.json();
}

/** Fetch recent media (up to 30 posts) */
export async function getIGMedia(igUserId: string, accessToken: string, limit = 30): Promise<IGMedia[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const res = await fetch(
    `${GRAPH_BASE}/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error(`Media fetch failed: ${await res.text()}`);
  const data = await res.json();
  return data.data ?? [];
}

/** Calculate baseline engagement metrics from a list of posts */
export function calculateEngagementMetrics(posts: IGMedia[], followersCount: number) {
  if (!posts.length || !followersCount) {
    return { avgEngagementRate: 0, avgLikes: 0, avgComments: 0, postingFreqPerWk: 0, contentMix: {} };
  }

  const totalLikes = posts.reduce((s, p) => s + (p.like_count ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
  const avgLikes = totalLikes / posts.length;
  const avgComments = totalComments / posts.length;
  const avgEngagementRate = ((avgLikes + avgComments) / followersCount) * 100;

  // Posting frequency: compare oldest and newest post dates
  const dates = posts
    .map((p) => new Date(p.timestamp).getTime())
    .filter(Boolean)
    .sort((a, b) => a - b);

  let postingFreqPerWk = 0;
  if (dates.length >= 2) {
    const rangeMs = dates[dates.length - 1] - dates[0];
    const rangeWeeks = rangeMs / (7 * 24 * 60 * 60 * 1000);
    postingFreqPerWk = rangeWeeks > 0 ? posts.length / rangeWeeks : 0;
  }

  const contentMix = posts.reduce<Record<string, number>>((acc, p) => {
    const type = p.media_type.toLowerCase();
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    postingFreqPerWk: Math.round(postingFreqPerWk * 10) / 10,
    contentMix,
  };
}

/** Extract hashtags from a caption string */
export function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\wЀ-ӿ]+/g) ?? [];
  return matches.map((h) => h.slice(1).toLowerCase());
}

/** Build the OAuth authorization URL */
export function buildOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_OAUTH_REDIRECT_URI!,
    scope: "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}
