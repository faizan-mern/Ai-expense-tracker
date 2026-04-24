import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Card({ className, soft, children, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-white border border-black/[0.08] rounded-[18px] shadow-[0_8px_18px_rgba(15,33,28,0.04)]",
          soft &&
            "bg-gradient-to-b from-[rgba(240,245,241,0.92)] to-white",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex items-start justify-between gap-4 px-5 pt-5 pb-3.5",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ eyebrow, className, children, ...props }) {
  return (
    <div className={twMerge(clsx("grid gap-1", className))} {...props}>
      {eyebrow && (
        <p className="m-0 text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-[#177b5a]">
          {eyebrow}
        </p>
      )}
      <h3 className="m-0 text-[1.02rem] font-bold tracking-tight text-[#14211c]">
        {children}
      </h3>
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div
      className={twMerge(clsx("px-5 pb-5", className))}
      {...props}
    >
      {children}
    </div>
  );
}

export function MetricCard({ eyebrow, value, description, className, ...props }) {
  return (
    <Card
      className={twMerge(clsx("p-5 grid gap-1.5", className))}
      {...props}
    >
      <p className="m-0 text-[0.72rem] font-extrabold tracking-[0.12em] uppercase text-[#177b5a]">
        {eyebrow}
      </p>
      <strong className="text-[clamp(1.2rem,1vw+0.85rem,1.65rem)] font-bold tracking-tight text-[#14211c] min-w-0 wrap-break-word leading-tight">
        {value}
      </strong>
      <span className="text-sm text-[#63736b]">{description}</span>
    </Card>
  );
}
