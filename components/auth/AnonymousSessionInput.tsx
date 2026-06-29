"use client";

import { useEffect, useState } from "react";

export function AnonymousSessionInput() {
  const [anonymousSessionId, setAnonymousSessionId] = useState("");

  useEffect(() => {
    setAnonymousSessionId(window.localStorage.getItem("sci-test-anonymous-session-id") || "");
  }, []);

  return <input type="hidden" name="anonymousSessionId" value={anonymousSessionId} />;
}
