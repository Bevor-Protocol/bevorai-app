"use client";

import { cn, filterChildren } from "@/lib/utils";
import React, { useState } from "react";

interface ReferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  shouldShow?: boolean;
  position?: string;
}

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "left" | "bottom" | "right";
  align?: "start" | "end" | "center";
}

export const Reference: React.FC<ReferenceProps> = ({
  children,
  className,
  shouldShow = true,
  ...rest
}) => {
  const [show, setShow] = useState(false);
  const childContent = filterChildren(children, "Tooltip.Content");
  const childTrigger = filterChildren(children, "Tooltip.Trigger");

  return (
    <div
      className={cn("relative", className)}
      onMouseOver={() => setShow(shouldShow)}
      onMouseOut={() => setShow(false)}
      {...rest}
    >
      {childTrigger}
      {show && childContent}
    </div>
  );
};

export const Trigger: React.FC<ReferenceProps> = ({ children }) => {
  return children;
};

Trigger.displayName = "Tooltip.Trigger";

export const Content: React.FC<ContentProps> = ({
  children,
  className,
  side = "top",
  align = "center",
  ...rest
}) => {
  return (
    <div
      className={cn(
        "absolute z-999 text-xs bg-black shadow-sm rounded-lg cursor-default border border-neutral-400 px-2 py-1",
        "transition-all animate-appear",
        side == "top" && "bottom-[calc(100%+5px)]",
        side == "left" && "right-[calc(100%+5px)]",
        side == "bottom" && "top-[calc(100%+5px)]",
        side == "right" && "left-[calc(100%+5px)]",
        (side == "top" || side == "bottom") && align == "center" && "right-1/2 translate-x-1/2",
        (side == "top" || side == "bottom") && align == "start" && "left-0",
        (side == "top" || side == "bottom") && align == "end" && "right-0",
        (side == "left" || side == "right") && align == "center" && "bottom-1/2 translate-y-1/2",
        (side == "left" || side == "right") && align == "start" && "top-0",
        (side == "left" || side == "right") && align == "end" && "bottom-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

Content.displayName = "Tooltip.Content";
