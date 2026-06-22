import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ORDER_STYLES: Record<string, string> = {
  PENDING:       "bg-amber-100 text-amber-800",
  PROCESSING:    "bg-blue-100 text-blue-800",
  LABEL_CREATED: "bg-sky-100 text-sky-800",
  SHIPPED:       "bg-indigo-100 text-indigo-800",
  IN_TRANSIT:    "bg-violet-100 text-violet-800",
  DELIVERED:     "bg-green-100 text-green-800",
  CANCELLED:     "bg-red-100 text-red-800",
  REFUNDED:      "bg-orange-100 text-orange-800",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING:       "Pending",
  PROCESSING:    "Processing",
  LABEL_CREATED: "Label Created",
  SHIPPED:       "Shipped",
  IN_TRANSIT:    "In Transit",
  DELIVERED:     "Delivered",
  CANCELLED:     "Cancelled",
  REFUNDED:      "Refunded",
};

const CATERING_STYLES: Record<string, string> = {
  new:       "bg-amber-100 text-amber-800",
  contacted: "bg-blue-100 text-blue-800",
  booked:    "bg-green-100 text-green-800",
  declined:  "bg-red-100 text-red-800",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        ORDER_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function CateringStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent capitalize",
        CATERING_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}
