import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const badgeVariants = cva(
  "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[0.74rem] font-semibold",
  {
    variants: {
      variant: {
        default: "bg-emerald-50 text-[#0e5a41]",
        accent: "bg-emerald-100 text-[#0e5a41]",
        muted: "bg-black/5 text-[#63736b]",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ variant, className, children, ...props }) {
  return (
    <span
      className={twMerge(clsx(badgeVariants({ variant }), className))}
      {...props}
    >
      {children}
    </span>
  );
}
