import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const getSystemTheme = () =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

  const [dark, setDark] = useState(() => {
    const manual = localStorage.getItem("lms-manual-theme");
    if (manual === "dark") return true;
    if (manual === "light") return false;
    return getSystemTheme();
  });

  // Listen for OS system theme changes
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const handleChange = (e) => {
      const manual = localStorage.getItem("lms-manual-theme");
      if (!manual) {
        setDark(e.matches);
      }
    };

    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("lms-manual-theme", next ? "dark" : "light");
      return next;
    });
  };

  const resetToSystem = () => {
    localStorage.removeItem("lms-manual-theme");
    setDark(getSystemTheme());
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
