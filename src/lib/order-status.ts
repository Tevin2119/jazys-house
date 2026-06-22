import type { OrderStatus } from "@prisma/client";

/** Canonical ordering of every order status — one source of truth for UI + queries. */
export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "LABEL_CREATED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

/**
 * The set of statuses an order may legally transition to from `current`.
 *
 * Forward path: PENDING → PROCESSING → LABEL_CREATED → SHIPPED → IN_TRANSIT → DELIVERED.
 * CANCELLED is allowed from PENDING, PROCESSING, and LABEL_CREATED.
 * REFUNDED is terminal and can be reached from DELIVERED (full) or CANCELLED (partial).
 */
export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case "PENDING":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return ["LABEL_CREATED", "CANCELLED"];
    case "LABEL_CREATED":
      return ["SHIPPED", "CANCELLED"];
    case "SHIPPED":
      return ["IN_TRANSIT"];
    case "IN_TRANSIT":
      return ["DELIVERED"];
    case "DELIVERED":
      return ["REFUNDED"];
    case "CANCELLED":
      return ["REFUNDED"];
    case "REFUNDED":
      return [];
    default:
      return [];
  }
}
