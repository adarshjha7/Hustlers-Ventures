"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  timeoutMs?: number;
  redirectTo?: string;
}

export default function SessionTimeout({
  timeoutMs = 30 * 60 * 1000,
  redirectTo = "/login?reason=session_expired",
}: Props) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        router.replace(redirectTo);
      }, timeoutMs);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [router, timeoutMs, redirectTo]);

  return null;
}
