import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "cm_theme";

const THEME_VARS: Record<Theme, Record<string, string>> = {
  dark: {
    "--cm-bg": "22, 18, 23",
    "--cm-card": "34, 27, 34",
    "--cm-card-raised": "42, 33, 41",
    "--cm-border": "58, 48, 64",
    "--cm-primary": "138, 112, 255",
    "--cm-lime": "77, 215, 170",
    "--cm-emerald": "77, 215, 170",
    "--cm-amber": "243, 201, 113",
    "--cm-red": "255, 138, 138",
    "--cm-text": "247, 239, 230",
    "--cm-muted": "186, 169, 154",
    "--cm-accent": "200, 183, 255",
    "--cm-bg-subtle": "47, 38, 48",
    "--cm-focus-ring": "169, 146, 255",
  },
};

function resolveInitialTheme(): Theme {
  return "dark";
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  root.classList.add("dark");
  const vars = THEME_VARS[theme];
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = resolveInitialTheme();
    // Apply class synchronously so the first paint is correct
    applyThemeClass(t);
    return t;
  });

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: "dark",
      toggleTheme: () => setThemeState("dark"),
      setTheme: () => setThemeState("dark"),
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
