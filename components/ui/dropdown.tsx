"use client";
import { cloneElement, ReactElement, useReducer, useRef } from "react";

import { useClickOutside } from "@/hooks/useClickOutside";
import { cn, filterChildren } from "@/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface PropsWithClose extends Props {
  hasCloseTrigger?: boolean;
  close?: () => void;
}

export const genericToggleReducer = (s: boolean): boolean => !s;

export const Main: React.FC<Props> = ({ children, className, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isShowing, toggle] = useReducer(genericToggleReducer, false);

  useClickOutside(ref, isShowing ? toggle : undefined);

  const triggerChild = filterChildren(children, "Dropdown.Trigger");
  const contentChild = filterChildren(children, "Dropdown.Content");

  return (
    <div className={cn("relative", className)} ref={ref} {...rest}>
      {cloneElement(triggerChild, { onClick: toggle })}
      {isShowing && cloneElement(contentChild, { close: toggle })}
    </div>
  );
};

export const Trigger: React.FC<Props & { isDisabled?: boolean }> = ({
  children,
  onClick,
  isDisabled = false,
  className,
  ...rest
}) => {
  return (
    <div
      onClick={!isDisabled ? onClick : undefined}
      className={cn(isDisabled && "cursor-not-allowed", className)}
      {...rest}
    >
      {children}
    </div>
  );
};

Trigger.displayName = "Dropdown.Trigger";

export const Content: React.FC<PropsWithClose> = ({
  children,
  className,
  hasCloseTrigger = false,
  close,
  ...rest
}) => {
  return (
    <div
      className={cn("absolute z-999 cursor-default transition-all animate-appear", className)}
      {...rest}
    >
      {cloneElement(children as ReactElement, hasCloseTrigger ? { close } : {})}
    </div>
  );
};

Content.displayName = "Dropdown.Content";
