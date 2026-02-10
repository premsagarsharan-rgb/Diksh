"use client";

import { useEffect, useRef } from "react";
import { useLayerStack } from "@/components/LayerStackProvider";

export default function DashboardBackGuard() {
  const stackApi = useLayerStack();
  const initializedRef = useRef(false);
  const stackApiRef = useRef(stackApi);
  stackApiRef.current = stackApi;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // ✅ Replace current history with dashboard state
    try {
      window.history.replaceState({ page: "dashboard" }, "", window.location.href);
      window.history.pushState({ page: "dashboard", buffer: true }, "", window.location.href);
    } catch {}

    function onPopState() {
      const api = stackApiRef.current;

      // Modal open → close topmost
      if (api && api.stack && api.stack.length > 0) {
        api.closeTopLayer();
      }

      // ✅ Always push buffer back — prevents leaving dashboard
      try {
        window.history.pushState({ page: "dashboard", buffer: true }, "", window.location.href);
      } catch {}
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return null;
}
