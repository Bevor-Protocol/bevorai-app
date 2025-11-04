"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-muted hover:text-muted-foreground",
        outline: "border border-input bg-transparent shadow-xs",
      },
      color: {
        default:
          "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        purple:
          "data-[state=on]:bg-purple data-[state=on]:text-purple-foreground hover:bg-purple hover:text-purple-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  color,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, color, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
