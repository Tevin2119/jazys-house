"use client";

import Link from "next/link";
import { X } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "Our Story" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#2a1f16" }}
    >
      <div className="flex items-center justify-between px-6 pb-4 pt-6">
        <span className="font-heading text-xl font-normal text-white">Menu</span>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="text-[#c79a55] transition-opacity hover:opacity-70"
        >
          <X className="size-6" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-center gap-0 px-8">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="border-b border-white/10 py-5 font-heading text-[2.5rem] font-normal leading-tight text-white transition-colors hover:text-[#c79a55]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-8 pb-12 pt-6">
        <p
          className="mb-3 text-[11px] font-bold uppercase tracking-[2px]"
          style={{ color: "#c79a55" }}
        >
          Get in Touch
        </p>
        <p className="text-sm text-[#cbb9a3]">hello@jazyshouse.com</p>
        <p className="mt-1 text-sm text-[#cbb9a3]">+44 7400 000000</p>
      </div>
    </div>
  );
}
