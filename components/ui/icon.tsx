import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
      xs: "size-icon-xs",
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

export const generateAvatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;

  const hash2 = seed.split("").reduce((acc, char, idx) => {
    return acc + char.charCodeAt(0) * (idx + 1);
  }, 0);

  const saturation = 50 + (Math.abs(hash2) % 30);
  const lightness1 = 40 + (Math.abs(hash >> 8) % 25);
  const lightness2 = lightness1 + 20;

  return `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness1}%), hsl(${hue2}, ${saturation}%, ${lightness2}%))`;
};

export const Icon: React.FC<IconI> = ({ size, shape, image, seed, className, ...props }) => {
  if (image) {
    return (
      <div
        className={cn(iconVariants({ size, shape, className }))}
        style={
          {
            backgroundImage: `url(${image})`,
          } as React.CSSProperties
        }
        {...props}
      />
    );
  }
  if (seed) {
    return (
      <div
        className={cn(iconVariants({ size, shape, className }))}
        style={
          {
            background: generateAvatarColor(seed),
          } as React.CSSProperties
        }
        {...props}
      />
    );
  }

  return <Skeleton className={cn(iconVariants({ size, shape, className }))} />;
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
