"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toggleWishlist } from "@/lib/wishlist-actions";

export function WishlistButton({
  productId,
  initialWishlisted = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
}) {
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  // Only customers see the wishlist button
  if (!session || session.user.role !== "CUSTOMER") return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId);
        setWishlisted(result.wishlisted);
      } catch {
        // silently ignore — user isn't redirected, button just doesn't update
      }
    });
  }

  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      disabled={isPending}
      onClick={handleClick}
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-base shadow transition-transform hover:scale-110 disabled:opacity-60"
    >
      {wishlisted ? "♥" : "♡"}
    </button>
  );
}
