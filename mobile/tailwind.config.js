/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "./App.tsx"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        vida: {
          bg: "#0A0A0F",
          surface: "#12141A",
          green: "#10B981",
          emerald: "#059669",
          cyan: "#06B6D4",
          amber: "#F59E0B",
          ink: "#E6FFF8",
          muted: "#94A3B8",
          dim: "#64748B",
          line: "rgba(255,255,255,0.08)",
          glass: "rgba(255,255,255,0.05)",
        },
      },
      fontFamily: {
        sans: ["System"],
        display: ["System"],
      },
    },
  },
  plugins: [],
};
