import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "InstaIntel — Instagram Marketing Intelligence",
    template: "%s | InstaIntel",
  },
  description:
    "Discover who's winning in your niche, why they're winning, and generate better content with AI.",
  keywords: ["Instagram marketing", "competitor analysis", "content strategy", "AI scripts"],
};

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const USE_CLERK =
  CLERK_KEY.startsWith("pk_") && !CLERK_KEY.includes("placeholder");

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (USE_CLERK) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    const { dark } = await import("@clerk/themes");

    return (
      <ClerkProvider
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#7C3AED",
            colorBackground: "#0d1117",
            colorInputBackground: "#161b22",
            colorInputText: "#e6edf3",
            borderRadius: "0.75rem",
          },
        }}
      >
        <html lang="uz" className="dark" suppressHydrationWarning>
          <body className={inter.className}>
            <LangProvider>{children}</LangProvider>
          </body>
        </html>
      </ClerkProvider>
    );
  }

  // Mock / dev mode — no Clerk provider needed
  return (
    <html lang="uz" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
