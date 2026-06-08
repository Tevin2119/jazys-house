"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/app/(admin)/admin/orders/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Human label for an order status (Title-case). */
function label(status: OrderStatus): string {
  return status[0] + status.slice(1).toLowerCase();
}

/**
 * Inline status mutator for the order detail page. Renders the legal next
 * statuses as a Select; choosing one submits the server action and refreshes.
 */
export function OrderStatusChanger({
  id,
  current: _current,
  nextOptions,
}: {
  id: string;
  current: OrderStatus;
  nextOptions: OrderStatus[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (nextOptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No further changes</p>
    );
  }

  function onChange(value: string) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", value);
    startTransition(async () => {
      await updateOrderStatus(formData);
      router.refresh();
    });
  }

  return (
    <Select onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Change status…" />
      </SelectTrigger>
      <SelectContent>
        {nextOptions.map((s) => (
          <SelectItem key={s} value={s}>
            {label(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
