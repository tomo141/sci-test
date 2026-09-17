"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Count return visits separately from starting another exam. No URL, referrer, answer,
// or email is sent. The server only records visitors that already have a science cookie.
export function ScienceVisit() {
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false, inFlight = false;
    const record = async () => {
      if (stopped || inFlight || document.visibilityState !== "visible") return;
      const hour = new Date().toISOString().slice(0, 13);
      try { if (sessionStorage.getItem("science-visit-hour") === hour) return; } catch {}
      inFlight = true;
      try {
        const response = await fetch("/api/science/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", referrerPolicy: "no-referrer" });
        if (response.ok) { try { sessionStorage.setItem("science-visit-hour", hour); } catch {} }
      } catch { /* A measurement failure must not interrupt taking an exam. */ }
      finally { inFlight = false; }
    };
    const onVisible = () => { void record(); };
    // Keep visit measurement out of the initial page's critical work.
    const timer = setTimeout(onVisible, 2000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [pathname]);
  return null;
}
