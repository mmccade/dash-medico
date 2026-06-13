// src/lib/toast.jsx
import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((texto) => {
    setMsg(texto);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={"toast" + (show ? " show" : "")}>{msg}</div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
