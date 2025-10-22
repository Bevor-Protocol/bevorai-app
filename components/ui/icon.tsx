import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/utils/helpers";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

type IconI = React.ComponentProps<"div"> &
  VariantProps<typeof iconVariants> & {
    size: string;
    image?: string | null;
    seed?: string | null;
    className?: string;
  };

type SocialI = IconI & {
  children: React.ReactNode;
};

const iconVariants = cva("inline-flex items-center justify-center", {
  variants: {
    size: {
      default: "size-icon-sm",
      sm: "size-icon-sm",
      md: "size-icon-md",
      lg: "size-icon-lg",
    },
    shape: {
      default: "rounded-full",
      rounded: "rounded-full",
      block: "rounded-lg",
    },
  },
  defaultVariants: {
    size: "default",
    shape: "default",
  },
});

export const Icon: React.FC<IconI> = ({ size, shape, image, seed, className, ...props }) => {
  let urlUse = "";
  if (image && !seed) {
    urlUse = `url(${image})`;
  } else if (seed) {
    urlUse = `url(https://avatar.vercel.sh/${generateSlug(seed)})`;
  } else {
    return <Skeleton className={cn(iconVariants({ size, shape, className }))} />;
  }
  return (
    <div
      className={cn(iconVariants({ size, shape, className }))}
      style={
        {
          backgroundImage: urlUse,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export const IconEmpty: React.FC<IconI> = ({ size, shape, className, ...props }) => {
  return <Skeleton className={cn(iconVariants({ size, shape, className }))} {...props} />;
};

export const Social: React.FC<SocialI> = ({ children, size, shape, className, ...props }) => {
  return (
    <div
      className={cn(
        iconVariants({ size, shape, className }),
        "flex justify-center items-center p-1 border border-transparent",
      )}
      {...props}
    >
      {children}
    </div>
  );
};
