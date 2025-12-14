import { useEffect } from "react";

export const ThemeInitializer = () => {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") {
        document.documentElement.classList.add("dark");
      } else if (stored === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        // Check system preference
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        }
      }
    } catch {
      // Fallback - do nothing
    }
  }, []);

  return null;
};
