import { useEffect, useState } from "react";

const STORAGE_KEY = "orbitwatch-theme";
const QUERY = "(prefers-color-scheme: light)";

export const THEME_OPTIONS = ["dark", "light", "system"];

function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return THEME_OPTIONS.includes(saved) ? saved : "dark";
  } catch {
    /* Private browsing or a blocked storage partition. */
    return "dark";
  }
}

function readSystemTheme() {
  try {
    return window.matchMedia(QUERY).matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState(readSystemTheme);

  /*
   * "System" has to keep tracking the OS while the app is open,
   * otherwise it only means "whatever the OS was at load time".
   */
  useEffect(() => {
    let query;

    try {
      query = window.matchMedia(QUERY);
    } catch {
      return undefined;
    }

    const handleChange = (event) => {
      setSystemTheme(event.matches ? "light" : "dark");
    };

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }

    /* Safari < 14 */
    if (typeof query.addListener === "function") {
      query.addListener(handleChange);
      return () => query.removeListener(handleChange);
    }

    return undefined;
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;

    /* Every colour in styles.css hangs off this one attribute. */
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Preference simply will not persist; the UI still works. */
    }
  }, [theme, resolvedTheme]);

  return { theme, resolvedTheme, setTheme };
}
