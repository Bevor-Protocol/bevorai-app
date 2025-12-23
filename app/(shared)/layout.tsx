import { AsyncComponent } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <nav className="w-full bg-background flex items-center justify-between px-6 h-header">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <div className="h-6 relative">
              <Image
                src="/logo-small.png"
                alt="company logo"
                width={611}
                height={133}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
};

export default Layout;
