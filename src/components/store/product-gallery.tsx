"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/store/product-image";

/**
 * Product image gallery with thumbnail selection. Falls back to the emoji glyph
 * when the product has no photography.
 */
export function ProductGallery({
  images,
  emoji,
  name,
}: {
  images: string[];
  emoji: string | null;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const selected = images[active] ?? null;

  return (
    <div>
      <ProductImage
        image={selected}
        emoji={emoji}
        alt={name}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
        className="aspect-[3/4] w-full rounded-xl text-8xl"
      />
      {images.length > 1 ? (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${name}`}
              className={cn(
                "overflow-hidden rounded-md border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <ProductImage
                image={img}
                emoji={emoji}
                alt=""
                sizes="80px"
                className="h-20 w-20"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
