import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const remoteAI = Boolean(process.env.AI_BACKEND_URL);
export function demoToken() {
  return createHmac("sha256", process.env.AI_BACKEND_SECRET || "disabled").update(process.env.AI_DEMO_ACCESS_CODE || "disabled").digest("hex");
}
export function equalSecret(a: string, b: string) {
  return a.length > 0 && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export async function demoAuthorized() {
  return Boolean(process.env.AI_DEMO_ACCESS_CODE && equalSecret((await cookies()).get("ai-demo")?.value || "", demoToken()));
}
export async function backendFetch(path: string, init: RequestInit = {}) {
  const base = new URL(process.env.AI_BACKEND_URL!);
  if (base.protocol !== "https:" && base.hostname !== "127.0.0.1") throw new Error("Gateway must use HTTPS");
  if (!process.env.AI_BACKEND_SECRET) throw new Error("Gateway credential missing");
  return fetch(new URL(path, base), { ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(45_000), headers: { ...Object.fromEntries(new Headers(init.headers)), authorization: `Bearer ${process.env.AI_BACKEND_SECRET}` } });
}
