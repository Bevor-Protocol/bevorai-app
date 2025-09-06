import { clsx, type ClassValue } from "clsx";
import { Children, isValidElement, ReactElement, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};

export const filterChildren = (children: ReactNode, name: string): ReactElement => {
  return Children.toArray(children).find((child) => {
    if (isValidElement(child) && typeof child.type !== "string" && "displayName" in child.type) {
      return child.type.displayName == name;
    }
    return false;
  }) as ReactElement;
};

export const roundToDecimals = (value: number, decimals: number = 4): number => {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
};

export const prettyDate = (date: string | Date): string => {
  return new Date(date).toISOString().split("T")[0];
};

export const toTitleCase = (str: string): string => {
  // Convert the entire string to lowercase first to handle existing capitalization
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
