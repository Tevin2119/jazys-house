import Image from "next/image";
import { cn } from "@/lib/utils";

/** Normalize a stored image path (e.g. "images/x.jpg") to a servable URL. */
export function resolveImageSrc(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return src.startsWith("/") ? src : `/${src}`;
}

/**
 * Product imagery with an emoji fallback. Renders the first image when present,
 * otherwise a large emoji glyph on a warm tint — mirroring the static site,
 * where most catalog items ship without photography.
 */
export function ProductImage({
  image,
  emoji,
  alt,
  className,
  sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
}: {
  image: string | null;
  emoji: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-secondary/50",
        className,
      )}
    >
      {image ? (
        <Image
          src={resolveImageSrc(image)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span className="select-none text-6xl" aria-hidden>
          {emoji ?? "🧡"}
        </span>
      )}
    </div>
  );
}
