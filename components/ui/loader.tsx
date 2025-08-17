"use client";

import coinAscii from "@/assets/ascii/coin";
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

export const LoadWaifu: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center animate-pulse-more">
      <pre className="text-blue-100 whitespace-pre-wrap text-[0.2rem] leading-tight">
        {coinAscii}
      </pre>
    </div>
  );
};

export const Skeleton: React.FC<{ className: string }> = ({ className }) => {
  return <div className={cn("bg-gray-800/50 animate-pulse rounded-md", className)} />;
};
