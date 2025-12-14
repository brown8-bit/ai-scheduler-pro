import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

interface UseThemeResult {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useTheme = (): UseThemeResult => {
  const [theme, setThemeState] = useState<Theme>("light");

  // Initialize from localStorage / system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        return;
      }
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    } catch {
      // Fallback to light
      setThemeState("light");
    }
  }, []);

  // Apply theme to document and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (value: Theme) => {
    setThemeState(value);
  };

  return { theme, setTheme };
};
