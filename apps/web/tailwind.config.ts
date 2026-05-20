import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand colors
        brand: {
          purple: "#6d68ff",
          pink:   "#c026d3",
          orange: "#F97316",
        },
        // Linear design system palette
        linear: {
          canvas:   "#08090a",
          panel:    "#0f1011",
          surface:  "#191a1b",
          elevated: "#1f2023",
          accent:   "#6d68ff",
          "accent-hover": "#8480ff",
          "text-primary":   "#f7f8f8",
          "text-secondary": "#d0d6e0",
          "text-tertiary":  "#8a8f98",
          "text-muted":     "#62666d",
          "border-subtle":  "rgba(255,255,255,0.05)",
          "border-std":     "rgba(255,255,255,0.08)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.25s ease-out both",
        "fade-up": "fade-up 0.35s ease-out both",
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight:   "-0.025em",
        snug:    "-0.015em",
        normal:  "0em",
      },
      boxShadow: {
        "card":     "rgba(0,0,0,0.2) 0px 0px 0px 1px, rgba(0,0,0,0.12) 0px 2px 8px",
        "elevated": "rgba(0,0,0,0.4) 0px 8px 24px, rgba(0,0,0,0.2) 0px 0px 0px 1px",
        "inset":    "rgba(0,0,0,0.2) 0px 0px 12px 0px inset",
        "glow":     "0 0 0 1px rgba(109,104,255,0.3), 0 0 16px rgba(109,104,255,0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
