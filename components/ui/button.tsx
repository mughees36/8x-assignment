import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-ink px-4 py-2.5 text-white shadow-sm hover:bg-[#293b31]",
      outline: "border bg-white px-4 py-2.5 text-ink hover:bg-[#f8faf7]",
      ghost: "px-3 py-2 text-[#58665e] hover:bg-[#edf1ec] hover:text-ink",
      green: "bg-moss-600 px-4 py-2.5 text-white hover:bg-moss-700"
    },
    size: { default: "h-10", sm: "h-8 px-3 text-xs", icon: "size-10 p-0" }
  },
  defaultVariants: { variant: "default", size: "default" }
});

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
