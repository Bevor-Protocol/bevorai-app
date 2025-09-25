"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { DropdownOption } from "@/utils/types";
import { ChevronDown, X } from "lucide-react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title: string;
  options: DropdownOption[];
  selectedOptions: DropdownOption[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<DropdownOption[]>>;
}

export const MultiSelect: React.FC<Props> = ({
  title,
  className,
  options,
  selectedOptions,
  setSelectedOptions,
}): JSX.Element => {
  const toggleOption = (option: DropdownOption): void => {
    setSelectedOptions((prev) =>
      prev.some((item) => item.value === option.value)
        ? prev.filter((item) => item.value !== option.value)
        : [...prev, option],
    );
  };

  const removeOption = (option: DropdownOption): void => {
    setSelectedOptions((prev) => prev.filter((item) => item.value !== option.value));
  };

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("flex justify-between w-full py-1", className)}>
            {title}
            <ChevronDown height="14px" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full max-h-40 overflow-y-auto">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.name}
              onClick={() => toggleOption(option)}
              className={cn(
                selectedOptions.some((item) => item.value === option.value) && "bg-accent",
              )}
            >
              {option.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 cursor-pointer w-full text-xs">
          {selectedOptions.map((option) => (
            <Pill
              key={option.value}
              className="flex items-center space-x-1"
              onClick={() => removeOption(option)}
            >
              <span>{option.name}</span>
              <X className="size-3" />
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
};
