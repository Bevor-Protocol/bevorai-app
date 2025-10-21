"use client";

import { cn } from "@/lib/utils";

export const Loader: React.FC<{ className: string }> = ({ className }) => {
  return <div className={cn("conic animate-spin duration-1250", className)} />;
};

export const LoaderFull: React.FC<{ className: string }> = ({ className }) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <Loader className={className} />
    </div>
  );
};
