"use client";

import { Telegram, Twitter, Virtuals } from "@/assets/icons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FileTextIcon,
  Home,
  LineChart,
  Terminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const navItems = [
  { name: "terminal", path: "/terminal", icon: <Terminal size={18} /> },
  { name: "analytics", path: "/analytics", icon: <LineChart size={18} /> },
  { name: "audits", path: "/audits", icon: <FileText size={18} /> },
  { name: "dashboard", path: "/dashboard", icon: <Home size={18} /> },
];

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  useEffect(() => {
    // initially should be closed on mobile.
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <>
      {isMobile && (
        <div
          className={cn(
            "inset-0 bg-black opacity-50 z-200 w-14",
            isOpen && "fixed w-full",
            !isOpen && "hidden",
          )}
          onClick={() => setIsOpen(!isOpen)}
        />
      )}
      <aside
        className={cn(
          "flex flex-col h-screen bg-black border-r border-gray-800",
          "transition-all duration-300 z-300",
          "font-mono fixed md:static",
          isOpen && "w-64",
          !isOpen && "w-14 md:w-20",
        )}
      >
        <div className="flex justify-between items-center h-24 p-4">
          <div className={cn("w-full aspect-1430/498 relative", isOpen ? "block" : "hidden")}>
            <Image src="/logo.png" alt="BevorAI logo" fill priority />
          </div>

          <div className={cn("w-[30px] aspect-141/188 relative", isOpen ? "hidden" : "block")}>
            <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn("text-gray-400 hover:text-white cursor-pointer", !isOpen && "hidden")}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-grow py-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-300",
                    "hover:bg-gray-800 hover:text-white transition-colors",
                    pathname === item.path && "bg-gray-800 text-white",
                    !isOpen && "justify-center",
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isOpen && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {isOpen && (
          <div className="p-4 h-24">
            <div className="size-full flex justify-between items-center *:cursor-pointer">
              <Link
                href="https://x.com/CertaiK_Agent"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Twitter />
              </Link>
              <Link
                href="https://t.me/CertaiKVirtuals"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Telegram />
              </Link>
              <Link
                href="https://app.virtuals.io/virtuals/9776"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Virtuals style={{ background: "rgb(68 188 195)", borderRadius: "12px" }} />
              </Link>
              <Link
                href="https://docs.certaik.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <FileTextIcon height="24" width="24" />
              </Link>
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="p-4 flex justify-center h-24">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
