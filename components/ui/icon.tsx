import { cn } from "@/lib/utils";
import { iconSizeMapper } from "@/utils/constants";
import { generateSlug } from "@/utils/helpers";
import React from "react";

interface IconI extends React.HTMLAttributes<HTMLElement> {
  size: string;
  image?: string | null;
  seed?: string | null;
  className?: string;
}

interface SocialI extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  size: string;
}

export const Icon: React.FC<IconI> = ({ size, image, seed, className, ...rest }) => {
  const { desktop, mobile } = iconSizeMapper[size];

  let urlUse = "";
  if (image && !seed) {
    urlUse = `url(${image})`;
  } else if (seed) {
    urlUse = `url(https://avatar.vercel.sh/${generateSlug(seed)})`;
  }
  return (
    <div
      className={cn("avatar", className)}
      style={
        {
          backgroundImage: urlUse,
          "--size-desktop": desktop,
          "--size-mobile": mobile,
        } as React.CSSProperties
      }
      {...rest}
    />
  );
};

export const Social: React.FC<SocialI> = ({ children, size, className, ...rest }) => {
  const { desktop, mobile } = iconSizeMapper[size];
  return (
    <div
      className={cn(
        "flex justify-center items-center p-1",
        "border border-transparent",
        "avatar",
        className,
      )}
      style={
        {
          "--size-desktop": desktop,
          "--size-mobile": mobile,
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
};
