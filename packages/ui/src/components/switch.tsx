"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef, useCallback, useState, type ComponentPropsWithoutRef, type ComponentRef } from "react";
import { cn } from "../lib/cn";

export interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  "data-testid"?: string;
}

const TRACK_OFF = "#9ca3af";
const TRACK_ON = "#7c3aed";

export const Switch = forwardRef<ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  function Switch({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) {
    const [internalChecked, setInternalChecked] = useState(checked ?? defaultChecked ?? false);
    const isOn = checked !== undefined ? checked : internalChecked;

    const handleChange = useCallback(
      (next: boolean) => {
        setInternalChecked(next);
        onCheckedChange?.(next);
      },
      [onCheckedChange],
    );

    return (
      <SwitchPrimitive.Root
        ref={ref}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={handleChange}
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={{
          width: 44,
          height: 24,
          backgroundColor: isOn ? TRACK_ON : TRACK_OFF,
        }}
        {...props}
      >
        <SwitchPrimitive.Thumb
          style={{
            width: 20,
            height: 20,
            borderRadius: 9999,
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "transform 150ms",
            transform: isOn ? "translateX(22px)" : "translateX(2px)",
          }}
        />
      </SwitchPrimitive.Root>
    );
  },
);
