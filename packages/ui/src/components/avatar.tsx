import { type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
}

const sizeClassName: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }

  const parts = trimmed.split(/\s+/);
  const firstInitial = parts[0]?.charAt(0) ?? "";
  const secondInitial = parts[1]?.charAt(0) ?? "";
  return (firstInitial + secondInitial).toUpperCase();
}

export function Avatar({ alt, className, name, size = "md", src, ...props }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] font-medium text-[var(--color-neutral-700)]",
        sizeClassName[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? `${name} avatar`} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={name}>{initials}</span>
      )}
    </div>
  );
}
