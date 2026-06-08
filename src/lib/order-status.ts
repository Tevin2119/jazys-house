import type { OrderStatus } from "@prisma/client";

/** Canonical ordering of every order status — one source of truth for UI + queries. */
export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/**
 * The set of statuses an order may legally transition to from `current`.
 *
 * Forward path: PENDING → PROCESSING → SHIPPED → DELIVERED.
 * Any non-terminal status may be CANCELLED.
 * DELIVERED and CANCELLED are terminal (no transitions out).
 */
export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case "PENDING":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return ["SHIPPED", "CANCELLED"];
    case "SHIPPED":
      return ["DELIVERED", "CANCELLED"];
    case "DELIVERED":
    case "CANCELLED":
      return [];
    default:
      return [];
  }
}
