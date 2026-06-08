"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initialsFor(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Platform admin",
  TENANT_ADMIN: "Store admin",
};

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string;
  role: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none ring-ring focus-visible:ring-2"
          aria-label="Account menu"
        >
          <Avatar className="size-9">
            <AvatarFallback>{initialsFor(name, email)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{name ?? email}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
          <span className="mt-1 text-xs font-normal text-muted-foreground">
            {ROLE_LABEL[role] ?? role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => signOutAction());
          }}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
