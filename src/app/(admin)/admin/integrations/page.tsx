export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { CarrierType } from "@prisma/client";

type ProviderStatus = "connected" | "error" | "notset";

type Provider = {
  key: string;
  name: string;
  description: string;
  status: ProviderStatus;
  detail: string | null;
  manageHref?: string;
};

const STATUS_BADGE: Record<ProviderStatus, { label: string; bg: string; color: string }> = {
  connected: { label: "Connected",      bg: "#d8ecd9", color: "#2f6b3a" },
  error:     { label: "Error",          bg: "#f3dad4", color: "#a3442e" },
  notset:    { label: "Not configured", bg: "#f0e8da", color: "#8a7c6a" },
};

const CARRIER_NAMES: Record<CarrierType, string> = {
  YAMATO:     "ヤマト運輸 (Yamato)",
  SAGAWA:     "佐川急便 (Sagawa)",
  JAPAN_POST: "日本郵便 (Japan Post)",
  OTHER:      "その他",
};

function ProviderCard({ provider }: { provider: Provider }) {
  const badge = STATUS_BADGE[provider.status];
  return (
    <div style={{
      background: "#fffdf9",
      border: "1px solid #ece2d2",
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#2a1f16", marginBottom: 3 }}>{provider.name}</div>
        <div style={{ fontSize: 12, color: "#8a7c6a", marginBottom: 8 }}>{provider.description}</div>
        {provider.detail && (
          <div style={{ fontSize: 11, color: "#6b5d4f", fontFamily: "monospace" }}>{provider.detail}</div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 16 }}>
        <span style={{ background: badge.bg, color: badge.color, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
          {badge.label}
        </span>
        {provider.manageHref && (
          <a
            href={provider.manageHref}
            style={{ fontSize: 11, fontWeight: 600, color: "#c0563d", textDecoration: "none" }}
          >
            Manage →
          </a>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#a39685",
      fontWeight: 700,
      marginBottom: 12,
      marginTop: 28,
    }}>
      {children}
    </div>
  );
}

export default async function IntegrationsPage(): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();

  // Shipping: read TenantCarrier records
  const carriers = await prisma.tenantCarrier.findMany({
    where:   { tenantId },
    orderBy: { carrier: "asc" },
  });
  const carrierMap: Partial<Record<CarrierType, typeof carriers[0]>> = {};
  for (const c of carriers) carrierMap[c.carrier] = c;

  // Payment providers — env-var based, no DB model yet
  const hasStripe = !!(
    process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  const paymentProviders: Provider[] = [
    {
      key: "stripe",
      name: "Stripe",
      description: "Credit card payments (international)",
      status: hasStripe ? "connected" : "notset",
      detail: hasStripe ? "API key configured via environment" : "Add STRIPE_SECRET_KEY to environment",
    },
    {
      key: "komoju",
      name: "KOMOJU",
      description: "PayPay, Konbini, Bank Transfer, Rakuten Pay",
      status: "notset",
      detail: "Integration coming soon — add KOMOJU_SECRET_KEY",
    },
    {
      key: "paypay",
      name: "PayPay for Business",
      description: "QR code payments (via KOMOJU)",
      status: "notset",
      detail: null,
    },
    {
      key: "rakuten",
      name: "Rakuten Pay",
      description: "Rakuten ecosystem payments (via KOMOJU)",
      status: "notset",
      detail: null,
    },
  ];

  const ALL_CARRIERS: CarrierType[] = ["YAMATO", "SAGAWA", "JAPAN_POST"];
  const shippingProviders: Provider[] = ALL_CARRIERS.map((carrier) => {
    const rec = carrierMap[carrier];
    return {
      key:         carrier,
      name:        CARRIER_NAMES[carrier],
      description: "Carrier for shipping labels and tracking",
      status:      rec?.enabled ? "connected" : "notset",
      detail:      rec?.enabled && rec.originPostalCode
        ? `Origin: 〒${rec.originPostalCode}`
        : rec
        ? "Disabled — enable in Shipping settings"
        : "Not configured",
      manageHref: "/admin/settings",
    };
  });

  const hasResend = !!process.env.RESEND_API_KEY;
  const emailProviders: Provider[] = [
    {
      key: "resend",
      name: "Resend",
      description: "Transactional email (order confirmations, shipping notices)",
      status: hasResend ? "connected" : "notset",
      detail: hasResend ? "API key configured via environment" : "Add RESEND_API_KEY to environment",
    },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 8px", fontWeight: 400 }}>
        Integrations
      </h1>
      <p style={{ fontSize: 13, color: "#8a7c6a", margin: "0 0 4px" }}>
        Manage payment, shipping, and email provider connections.
      </p>

      <SectionTitle>Payments</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {paymentProviders.map((p) => <ProviderCard key={p.key} provider={p} />)}
      </div>

      <SectionTitle>Shipping</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shippingProviders.map((p) => <ProviderCard key={p.key} provider={p} />)}
      </div>

      <SectionTitle>Email</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {emailProviders.map((p) => <ProviderCard key={p.key} provider={p} />)}
      </div>
    </div>
  );
}
