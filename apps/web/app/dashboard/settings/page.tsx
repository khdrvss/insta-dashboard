"use client";

import { useState } from "react";
import {
  Instagram, Key, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Copy, RefreshCw, ChevronRight,
} from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function SettingsPage() {
  const [token, setToken]       = useState("");
  const [status, setStatus]     = useState<Status>("idle");
  const [result, setResult]     = useState<{ username?: string; followers?: number; synced?: number } | null>(null);
  const [errMsg, setErrMsg]     = useState("");
  const [copied, setCopied]     = useState(false);

  async function handleSave() {
    if (!token.trim()) return;
    setStatus("loading");
    setErrMsg("");
    setResult(null);

    try {
      const res  = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrMsg(data.error ?? "Something went wrong — please try again.");
        setStatus("error");
      } else {
        setResult(data);
        setStatus("success");
        setToken("");
      }
    } catch {
      setErrMsg("Network error — check your connection.");
      setStatus("error");
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(window.location.origin + "/api/auth/instagram/callback");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/50 mt-1">Manage your Instagram connection and account preferences.</p>
      </div>

      {/* Success banner */}
      {status === "success" && result && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">Connected successfully!</p>
            <p className="text-xs text-green-300/70 mt-1">
              @{result.username} · {result.followers?.toLocaleString()} followers · {result.synced} posts synced
            </p>
          </div>
        </div>
      )}

      {/* Manual token card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Instagram className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Instagram Access Token</h2>
            <p className="text-xs text-white/40 mt-0.5">Paste a token directly — no OAuth flow needed</p>
          </div>
        </div>

        {/* How-to steps */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs font-medium text-white/60 uppercase tracking-wide">How to get a token</p>
          {[
            {
              n: 1,
              text: "Open Meta Graph API Explorer",
              href: "https://developers.facebook.com/tools/explorer",
            },
            {
              n: 2,
              text: 'Select your app → click "Generate Access Token"',
              href: null,
            },
            {
              n: 3,
              text: "Grant: instagram_basic, pages_read_engagement",
              href: null,
            },
            {
              n: 4,
              text: 'Run: GET /me?fields=id,username — confirm it works',
              href: null,
            },
            {
              n: 5,
              text: "For a 60-day token: use the Access Token Debugger → Extend",
              href: "https://developers.facebook.com/tools/debug/accesstoken",
            },
          ].map(({ n, text, href }) => (
            <div key={n} className="flex items-start gap-3">
              <span className="h-5 w-5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {n}
              </span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1 transition-colors"
                >
                  {text}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-xs text-white/50">{text}</p>
              )}
            </div>
          ))}
        </div>

        {/* Token input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" />
            Access Token
          </label>
          <div className="relative">
            <textarea
              value={token}
              onChange={(e) => { setToken(e.target.value); setStatus("idle"); }}
              placeholder="IGAAAt7PdViAMJBZAGEw..."
              rows={3}
              className="w-full rounded-xl bg-black/30 border border-white/10 focus:border-violet-500/50 focus:ring-0 focus:outline-none px-4 py-3 text-sm text-white/80 placeholder-white/20 font-mono resize-none transition-colors"
            />
          </div>
          {status === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{errMsg}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!token.trim() || status === "loading"}
            className="flex items-center gap-2 gradient-brand text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {status === "loading" ? "Validating…" : "Save & Sync"}
          </button>

          <a
            href="/api/auth/instagram"
            className="flex items-center gap-2 border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try OAuth
          </a>
        </div>
      </div>

      {/* OAuth Redirect URI helper */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Key className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Meta App Configuration</h2>
            <p className="text-xs text-white/40 mt-0.5">Required redirect URI for your Meta developer app</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-white/50">
            Add this URI in your Meta App → Instagram → Business Login Settings → Valid OAuth Redirect URIs:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-violet-300 font-mono truncate">
              {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}
              /api/auth/instagram/callback
            </code>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 border border-white/15 text-white/50 hover:text-white px-3 py-2 rounded-lg text-xs transition-colors flex-shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200/80">
            Your Instagram account must be a <strong className="text-blue-300">Business or Creator</strong> account
            linked to a Facebook Page for the Graph API to work.
          </p>
        </div>

        <a
          href="https://developers.facebook.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Open Meta Developer Console
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
