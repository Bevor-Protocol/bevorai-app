import { AsyncComponent } from "@/utils/types";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return <div className="min-h-screen bg-black">{children}</div>;
};

export default Layout;
