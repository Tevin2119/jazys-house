import posthogJs from "posthog-js";

let initialized = false;

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined" || initialized) return;

  posthogJs.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export function capturePostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthogJs.capture(event, properties);
}

export { posthogJs as posthog };
