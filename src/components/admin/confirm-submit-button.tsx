"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Submit button for destructive form actions — asks for confirmation before the
 * enclosing `<form action={serverAction}>` is allowed to submit.
 */
export function ConfirmSubmitButton({
  confirmText,
  children,
  ...props
}: ButtonProps & { confirmText: string }) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
