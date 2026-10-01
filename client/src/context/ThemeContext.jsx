import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "lms-manual-theme";

const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
const readMode = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "light" ? v : "system";
  } catch {
    return "system";
  }
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(readMode);
  const [sys, setSys] = useState(systemDark);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onChange = (e) => setSys(e.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  const dark = mode === "system" ? sys : mode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const setTheme = (next) => {
    setMode(next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* storage blocked */
    }
  };

  const toggleDark = () => setTheme(dark ? "light" : "dark");

  return <ThemeContext.Provider value={{ dark, mode, setTheme, toggleDark }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
