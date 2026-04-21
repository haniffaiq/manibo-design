import { type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Render as a circle (avatar placeholder). Default: false. */
  circle?: boolean;
}

export function Skeleton({ circle = false, className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--color-neutral-200)]",
        circle ? "rounded-full" : "rounded-[var(--radius-md)]",
        className,
      )}
      {...props}
    />
  );
}
