import { cn } from "@/lib/utils";
import { AsyncComponent } from "@/utils/types";
import Image from "next/image";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <header
        className={cn(
          "sticky top-0 z-50 backdrop-blur-sm",
          "px-6 flex items-center justify-between h-16",
        )}
      >
        <div className="flex items-center gap-6">
          <div className="aspect-423/564 relative h-[30px]">
            <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
};

export default Layout;
