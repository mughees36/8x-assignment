import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-[#dbe4dc] bg-[#f6f9f5] px-2.5 py-1 text-[11px] font-semibold text-[#506057]", className)} {...props} />;
}
