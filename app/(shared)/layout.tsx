import { userActions } from "@/actions/bevor";
import { Profile } from "@/components/header";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent, TeamSchemaI } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import Image from "next/image";

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const queryClient = new QueryClient();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bevor-token")?.value;
  let currentUser = null;
  let teams: TeamSchemaI[] = [];
  if (sessionToken) {
    currentUser = await userActions.get();
    teams = await queryClient.fetchQuery({
      queryKey: generateQueryKey.teams(),
      queryFn: () => userActions.teams(),
    });
  }

  return (
    <div className="min-h-screen bg-black">
      <header
        className={cn(
          "bg-neutral-950 sticky top-0 z-50 backdrop-blur-sm",
          "px-6 flex items-center justify-between h-16",
        )}
      >
        <div className="flex items-center gap-6">
          <div className="aspect-423/564 relative h-[30px]">
            <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
          </div>
        </div>
        {!!currentUser && (
          <div className="gap-4 items-center relative flex">
            <HydrationBoundary state={dehydrate(queryClient)}>
              <Profile userId={currentUser.id} teams={teams} />
            </HydrationBoundary>
          </div>
        )}
      </header>
      {children}
    </div>
  );
};

export default Layout;
