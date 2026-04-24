import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  // base styles applied to every button
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl border border-transparent transition-colors duration-150 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[#177b5a] text-white hover:bg-[#0e5a41]",
        secondary:
          "bg-emerald-50 text-[#0e5a41] hover:bg-emerald-100",
        ghost:
          "bg-black/5 text-[#14211c] hover:bg-black/10",
        danger:
          "bg-red-50 text-red-700 hover:bg-red-100",
        outline:
          "bg-transparent border-[#14211c]/15 text-[#14211c] hover:bg-black/5",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2.25 text-sm",
        lg: "px-5 py-2.75 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({ variant, size, className, children, ...props }) {
  return (
    <button
      className={twMerge(clsx(buttonVariants({ variant, size }), className))}
      {...props}
    >
      {children}
    </button>
  );
}
