import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ORDER_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const CATERING_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-blue-100 text-blue-800",
  booked: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent capitalize",
        ORDER_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.toLowerCase()}
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
