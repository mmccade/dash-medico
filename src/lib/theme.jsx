// src/lib/theme.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try { return localStorage.getItem("murev_tema") || "claro"; }
    catch { return "claro"; }
  });

  useEffect(() => {
    if (tema === "escuro") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("murev_tema", tema); } catch {}
  }, [tema]);

  const alternar = () => setTema((t) => (t === "escuro" ? "claro" : "escuro"));

  return <ThemeCtx.Provider value={{ tema, alternar }}>{children}</ThemeCtx.Provider>;
}

export const useTema = () => useContext(ThemeCtx);
