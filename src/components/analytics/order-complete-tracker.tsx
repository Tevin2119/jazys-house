"use client";

import { useEffect } from "react";
import { capturePostHogEvent } from "@/lib/posthog";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function OrderCompleteTracker({
  orderId,
  total,
  currency,
  itemCount,
}: {
  orderId: string;
  total: number;
  currency: string;
  itemCount: number;
}) {
  useEffect(() => {
    capturePostHogEvent("order_completed", {
      order_id: orderId,
      value: total / 100,
      currency,
      items_count: itemCount,
    });

    window.gtag?.("event", "purchase", {
      transaction_id: orderId,
      value: total / 100,
      currency,
      items: [{ quantity: itemCount }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return null;
}
