"use client";

import { useRouter } from "next/navigation";
import { setLanguageCookie } from "@/app/(store)/account/actions";
import type { Lang } from "@/lib/i18n";

export function LanguageSwitcher({ current }: { current: Lang }) {
  const router = useRouter();

  async function switchTo(lang: Lang) {
    await setLanguageCookie(lang);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {(["ja", "en"] as Lang[]).map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            current === lang
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {lang === "ja" ? "日本語" : "English"}
        </button>
      ))}
    </div>
  );
}
