import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Meal Planner",
    short_name: "Meal Planner",
    description: "Plan three family dinners and generate a smart shopping list.",
    start_url: "/this-week",
    display: "standalone",
    background_color: "#f8f3ee",
    theme_color: "#f8f3ee",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
