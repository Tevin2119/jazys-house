"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Submit button that disables itself and shows pending text while the enclosing
 * `<form action={serverAction}>` is in flight.
 */
export function SubmitButton({
  children,
  pendingText = "Saving…",
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
