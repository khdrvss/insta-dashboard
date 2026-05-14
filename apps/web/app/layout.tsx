import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
