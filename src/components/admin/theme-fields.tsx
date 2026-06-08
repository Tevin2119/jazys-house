"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_OPTIONS, DEFAULT_THEME } from "@/lib/theme";

export interface ThemeFieldsValue {
  primary?: string;
  secondary?: string;
  font?: string;
  logoUrl?: string | null;
}

/**
 * Branding inputs (colors, font, logo) with a live preview. Controlled locally
 * so the preview updates instantly before the form is submitted; the inputs are
 * named (`primary` / `secondary` / `font` / `logoUrl`) so the surrounding
 * <form> posts them to a server action. Reused by the settings editor and the
 * super-admin tenant create/edit form.
 */
export function ThemeFields({ theme }: { theme: ThemeFieldsValue }) {
  const [primary, setPrimary] = useState(theme.primary ?? DEFAULT_THEME.primary);
  const [secondary, setSecondary] = useState(
    theme.secondary ?? DEFAULT_THEME.secondary,
  );
  const [font, setFont] = useState(theme.font ?? DEFAULT_THEME.font);
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl ?? "");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="primary">Primary color</Label>
          <Input
            id="primary"
            type="color"
            name="primary"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-9 w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondary">Secondary color</Label>
          <Input
            id="secondary"
            type="color"
            name="secondary"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className="h-9 w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="font">Display font</Label>
        <Select value={font} onValueChange={setFont}>
          <SelectTrigger id="font" className="w-full">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="font" value={font} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://… or /images/logo.png"
        />
        <p className="text-xs text-muted-foreground">
          Relative path (/…) or an https URL. Leave blank for the default logo.
        </p>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div
          className="flex items-center gap-3 rounded-lg border p-4"
          style={{ backgroundColor: secondary, fontFamily: font }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied dynamic URL, not statically known
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-md text-lg font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              A
            </span>
          )}
          <div>
            <div className="text-lg font-bold" style={{ color: primary }}>
              Your Store
            </div>
            <button
              type="button"
              className="mt-1 rounded-md px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
