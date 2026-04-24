import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Card({ className, soft, children, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-white/90 border border-black/[0.08] rounded-[22px] shadow-[0_10px_30px_rgba(15,33,28,0.06)] backdrop-blur-lg",
          soft &&
            "bg-gradient-to-b from-[rgba(231,239,233,0.84)] to-[rgba(255,255,255,0.95)]",
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
          "flex items-start justify-between gap-4 px-5 pt-5 pb-4",
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
    <div className={twMerge(clsx("grid gap-0.5", className))} {...props}>
      {eyebrow && (
        <p className="m-0 text-[0.74rem] font-extrabold tracking-[0.14em] uppercase text-[#177b5a]">
          {eyebrow}
        </p>
      )}
      <h3 className="m-0 text-lg font-bold tracking-tight text-[#14211c]">
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
      className={twMerge(clsx("p-5 grid gap-1", className))}
      {...props}
    >
      <p className="m-0 text-[0.74rem] font-extrabold tracking-[0.14em] uppercase text-[#177b5a]">
        {eyebrow}
      </p>
      <strong className="text-[clamp(1.55rem,1.2vw+1rem,2.15rem)] font-bold tracking-tight text-[#14211c]">
        {value}
      </strong>
      <span className="text-sm text-[#63736b]">{description}</span>
    </Card>
  );
}
