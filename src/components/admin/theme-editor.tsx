"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/admin/submit-button";
import { ThemeFields, type ThemeFieldsValue } from "@/components/admin/theme-fields";

interface ThemeEditorProps {
  action: (formData: FormData) => void;
  name: string;
  theme: ThemeFieldsValue;
}

/** Branding form: store name, brand colors, display font, logo + live preview. */
export function ThemeEditor({ action, name, theme }: ThemeEditorProps) {
  return (
    <form
      action={action}
      className="rounded-lg border bg-card p-6 space-y-4 max-w-xl"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Store name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>

      <ThemeFields theme={theme} />

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
