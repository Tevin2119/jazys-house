import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { CartView } from "@/components/store/cart-view";
import { SectionHeading } from "@/components/store/section";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the handmade pieces in your cart.",
};

export default async function CartPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16">
      <SectionHeading title="Your Cart" className="mb-12" />
      <CartView currency={tenant.currency} />
    </div>
  );
}
