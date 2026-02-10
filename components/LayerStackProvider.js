"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const LayerStackContext = createContext(null);

export function LayerStackProvider({ children }) {
  const [stack, setStack] = useState([]);
  const closeHandlersRef = useRef({});

  const register = useCallback((id) => {
    setStack((s) => (s.includes(id) ? s : [...s, id]));
  }, []);

  const unregister = useCallback((id) => {
    setStack((s) => (s.includes(id) ? s.filter((x) => x !== id) : s));
    delete closeHandlersRef.current[id];
  }, []);

  const bringToTop = useCallback((id) => {
    setStack((s) => {
      if (!s.includes(id)) return [...s, id];
      if (s[s.length - 1] === id) return s;
      return [...s.filter((x) => x !== id), id];
    });
  }, []);

  const registerClose = useCallback((id, closeFn) => {
    closeHandlersRef.current[id] = closeFn;
  }, []);

  const unregisterClose = useCallback((id) => {
    delete closeHandlersRef.current[id];
  }, []);

  const closeTopLayer = useCallback(() => {
    setStack((currentStack) => {
      if (currentStack.length === 0) return currentStack;
      const topId = currentStack[currentStack.length - 1];
      const closeFn = closeHandlersRef.current[topId];
      if (closeFn) {
        setTimeout(() => closeFn(), 0);
      }
      return currentStack;
    });
  }, []);

  const value = useMemo(
    () => ({
      stack,
      register,
      unregister,
      bringToTop,
      registerClose,
      unregisterClose,
      closeTopLayer,
    }),
    [stack, register, unregister, bringToTop, registerClose, unregisterClose, closeTopLayer]
  );

  return <LayerStackContext.Provider value={value}>{children}</LayerStackContext.Provider>;
}

export function useLayerStack() {
  return useContext(LayerStackContext);
}
