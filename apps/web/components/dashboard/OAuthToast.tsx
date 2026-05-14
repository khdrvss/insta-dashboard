"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

const IG_ERRORS: Record<string, string> = {
  access_denied: "Instagram access was denied. Please try connecting again.",
  no_pages: "No Facebook Pages found. Make sure your Instagram is connected to a Facebook Page.",
  no_ig_business: "No Instagram Business account found on your Facebook Pages.",
  invalid_state: "Security check failed. Please try again.",
  server_error: "Something went wrong. Please try again.",
};

export function OAuthToast() {
  const params = useSearchParams();
  const router = useRouter();
  const connected = params.get("ig_connected");
  const error = params.get("ig_error");

  useEffect(() => {
    if (connected || error) {
      const timer = setTimeout(() => {
        router.replace("/dashboard");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [connected, error, router]);

  if (!connected && !error) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl max-w-sm ${
          connected
            ? "border-green-500/30 bg-green-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}
      >
        {connected ? (
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <div className={`text-sm font-medium ${connected ? "text-green-300" : "text-red-300"}`}>
            {connected ? "Instagram connected!" : "Connection failed"}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {connected
              ? "Your profile and posts have been synced."
              : IG_ERRORS[error ?? ""] ?? "Unknown error"}
          </div>
        </div>
      </div>
    </div>
  );
}
