import { bevorAction } from "@/actions";
import Breadcrumbs from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Notifications, Profile } from "@/components/header";
import { cn } from "@/lib/utils";
import { AsyncComponent, TeamSchemaI } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import Image from "next/image";

const BreadcrumbsHydration: AsyncComponent<{ userId: string; teams: TeamSchemaI[] }> = async ({
  userId,
  teams,
}) => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["projects"],
    queryFn: () => bevorAction.getAllProjects(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Breadcrumbs userId={userId} teams={teams} />
    </HydrationBoundary>
  );
};

const NotificationHydration: AsyncComponent = async () => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["user-invites"],
    queryFn: () => bevorAction.getUserInvites(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Notifications />
    </HydrationBoundary>
  );
};

const Layout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  const queryClient = new QueryClient();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bevor-token")?.value;
  let currentUser = null;
  let teams: TeamSchemaI[] = [];
  if (sessionToken) {
    currentUser = await bevorAction.getUser();
    teams = await queryClient.fetchQuery({
      queryKey: ["teams"],
      queryFn: () => bevorAction.getTeams(),
    });
  }

  return (
    <div className="min-h-screen bg-black">
      <header
        className={cn(
          "sticky top-0 z-50 backdrop-blur-sm",
          "px-6 flex items-center justify-between h-16",
        )}
      >
        <div className="flex items-center gap-6 h-">
          <div className="aspect-423/564 relative h-[30px]">
            <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
          </div>
          {!!currentUser && <BreadcrumbsHydration userId={currentUser.id} teams={teams} />}
        </div>
        {!!currentUser && (
          <div className="gap-4 items-center relative flex">
            <NotificationHydration />
            <HydrationBoundary state={dehydrate(queryClient)}>
              <Profile userId={currentUser.id} teams={teams} />
            </HydrationBoundary>
          </div>
        )}
      </header>
      <Container>{children}</Container>
    </div>
  );
};

export default Layout;
