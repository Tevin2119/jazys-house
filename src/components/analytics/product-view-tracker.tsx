"use client";

import { useEffect } from "react";
import { capturePostHogEvent } from "@/lib/posthog";

export function ProductViewTracker({
  productId,
  name,
  category,
  price,
  currency,
  tenantId,
  tenantName,
}: {
  productId: string;
  name: string;
  category?: string | null;
  price: number;
  currency: string;
  tenantId?: string;
  tenantName?: string;
}) {
  useEffect(() => {
    capturePostHogEvent("product_viewed", {
      product_id: productId,
      product_name: name,
      category: category ?? null,
      price: price / 100,
      currency,
      ...(tenantId ? { tenant_id: tenantId } : {}),
      ...(tenantName ? { tenant_name: tenantName } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
