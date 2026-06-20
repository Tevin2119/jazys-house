"use client";

import { useState } from "react";
import { updateTenantSettings } from "@/app/(admin)/admin/settings/actions";

const THEME_SWATCHES = [
  { color: "#c0563d", label: "Terracotta" },
  { color: "#5e7a4a", label: "Forest" },
  { color: "#2f5d8a", label: "Ocean" },
  { color: "#9a4f8a", label: "Plum" },
];

const CURRENCIES = [
  { value: "gbp", label: "£ GBP" },
  { value: "jpy", label: "¥ JPY" },
  { value: "usd", label: "$ USD" },
  { value: "eur", label: "€ EUR" },
];

interface SettingsFormProps {
  name: string;
  currency: string;
  primary: string;
  slug: string;
  domain: string | null;
}

export function SettingsForm({
  name,
  currency: initialCurrency,
  primary: initialPrimary,
  slug,
  domain,
}: SettingsFormProps) {
  const [currency, setCurrency] = useState(initialCurrency.toLowerCase());
  const [primary, setPrimary] = useState(initialPrimary || "#c0563d");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(formData: FormData) {
    setSaving(true);
    setSaved(false);
    formData.set("primary", primary);
    formData.set("currency", currency);
    await updateTenantSettings(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      style={{
        background: "#fffdf9",
        border: "1px solid #ece2d2",
        borderRadius: 13,
        padding: 26,
        maxWidth: 560,
      }}
    >
      <form action={handleSave}>
        {/* Store Name */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "#6b5d4f",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 7,
            }}
          >
            Store Name
          </label>
          <input
            name="name"
            defaultValue={name}
            required
            style={{
              display: "block",
              width: "100%",
              background: "#f6efe4",
              border: "1px solid #e6dccb",
              borderRadius: 9,
              padding: "11px 14px",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              color: "#2a1f16",
            }}
          />
        </div>

        {/* Domain (read-only) */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "#6b5d4f",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 7,
            }}
          >
            Domain
          </label>
          <input
            readOnly
            value={domain ?? `${slug}.jazyshouse.com`}
            style={{
              display: "block",
              width: "100%",
              background: "#f0e8da",
              border: "1px solid #e6dccb",
              borderRadius: 9,
              padding: "11px 14px",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              color: "#8a7c6a",
              cursor: "default",
            }}
          />
        </div>

        {/* Currency */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "#6b5d4f",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 8,
            }}
          >
            Currency
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CURRENCIES.map((c) => {
              const active = currency === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCurrency(c.value)}
                  style={{
                    background: active ? "#c0563d" : "#f6efe4",
                    color: active ? "#fff" : "#2a1f16",
                    border: `1px solid ${active ? "#c0563d" : "#e6dccb"}`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: active ? 700 : 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Theme swatches */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "#6b5d4f",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: 8,
            }}
          >
            Brand Theme
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {THEME_SWATCHES.map((s) => {
              const active = primary === s.color;
              return (
                <button
                  key={s.color}
                  type="button"
                  title={s.label}
                  onClick={() => setPrimary(s.color)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: s.color,
                    border: active ? "3px solid #2a1f16" : "2px solid transparent",
                    cursor: "pointer",
                    outline: "none",
                    transition: "border 0.15s",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? "#9a7060" : "#c0563d",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "12px 26px",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
