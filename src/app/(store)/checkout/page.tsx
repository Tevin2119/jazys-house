import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { CheckoutForm } from "@/components/store/checkout-form";
import { SectionHeading } from "@/components/store/section";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Jazy's House order.",
};

export default async function CheckoutPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16">
      <SectionHeading title="Checkout" className="mb-12" />
      <CheckoutForm currency={tenant.currency} />
    </div>
  );
}
