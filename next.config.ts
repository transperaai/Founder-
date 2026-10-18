import type { NextConfig } from "next";

// Cache Components is off: every screen is per-user and dynamic, and the MVP
// doesn't need partial prerendering. Revisit if static shells become useful.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
