import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`cm-surface-interactive ${compact ? "px-2.5 py-1.5" : "px-3 py-2"} inline-flex items-center gap-2`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={15} className="text-cm-amber" /> : <Moon size={15} className="text-cm-primary" />}
      {!compact && (
        <span className="text-xs font-semibold text-cm-muted">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
