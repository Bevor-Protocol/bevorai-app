"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handleClick = (): void => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "relative py-0.5 h-5 w-10 shrink-0 cursor-pointer items-center",
          "rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-green-500 focus-visible:ring-offset-2",
          checked ? "bg-green-600" : "bg-gray-700",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full",
            "bg-white shadow-lg transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </div>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
