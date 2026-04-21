import type { HTMLAttributes } from "react";

import { cn } from "@grove/ui/cn";

type PageFrameWidth = "reading" | "standard" | "workspace" | "full";
type PageFrameElement = "main" | "div" | "section";

const WIDTH_CLASS_BY_VARIANT: Record<PageFrameWidth, string> = {
  reading: "max-w-3xl",
  standard: "max-w-6xl",
  workspace: "max-w-[1960px]",
  full: "max-w-none",
};

interface PageFrameProps extends HTMLAttributes<HTMLElement> {
  as?: PageFrameElement;
  width?: PageFrameWidth;
}

export function PageFrame({ as = "main", width = "standard", className, children, ...props }: PageFrameProps) {
  const Component = as;

  return (
    <Component
      className={cn("mx-auto flex min-h-[calc(100vh-56px)] w-full flex-col gap-4", WIDTH_CLASS_BY_VARIANT[width], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
