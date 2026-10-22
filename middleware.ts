import { NextRequest, NextResponse } from "next/server";

const seededShareIds = new Set(["product-launch-planning", "customer-discovery", "engineering-standup", "sales-discovery", "design-review", "weekly-product-sync", "one-on-one", "sprint-retrospective", "marketing-campaign-review", "quarterly-roadmap-planning"]);
const publicToken = /^[A-Za-z0-9_-]{43}$/;

export function middleware(request: NextRequest) {
  const key = request.nextUrl.pathname.slice("/share/".length);
  if (!seededShareIds.has(key) && !publicToken.test(key)) return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  return NextResponse.next();
}

export const config = { matcher: "/share/:path" };
