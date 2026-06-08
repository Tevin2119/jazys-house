"use client";

import { useEffect } from "react";

/**
 * Registers the service worker — production only. In development we skip
 * registration so the SW cache never serves stale code while iterating.
 * Renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration is a progressive enhancement — ignore failures.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
