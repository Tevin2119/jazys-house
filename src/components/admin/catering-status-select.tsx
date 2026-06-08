"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCateringStatus } from "@/app/(admin)/admin/catering/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = ["new", "contacted", "booked", "declined"] as const;

/** Inline status changer for a catering inquiry — submits on selection. */
export function CateringStatusSelect({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      defaultValue={status}
      disabled={pending}
      onValueChange={(v) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", v);
        startTransition(async () => {
          await updateCateringStatus(fd);
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="w-[140px] capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
