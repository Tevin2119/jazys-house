"use server";

import { cookies } from "next/headers";

export async function setLanguageCookie(lang: string): Promise<void> {
  const safe = lang === "en" ? "en" : "ja";
  (await cookies()).set("lang", safe, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
    httpOnly: false, // readable by client for future client-side i18n use
  });
}
