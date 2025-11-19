import { dashboardActions } from "@/actions/bevor";
import Container from "@/components/container";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import NotificationsClient from "./notifications-client";

const NotificationsPage: React.FC = async () => {
  const queryClient = new QueryClient();
  const invites = await queryClient.fetchQuery({
    queryKey: generateQueryKey.userInvites(),
    queryFn: async () => dashboardActions.getInvites(),
  });

  const hasInvites = (invites.length ?? []) > 0;

  return (
    <Container>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="max-w-5xl m-auto mt-8 lg:mt-16">
          <div className="flex items-center justify-between my-6">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            {hasInvites && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {invites?.length} pending invitation{invites?.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {hasInvites ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Team Invitations</h2>
              <NotificationsClient />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You&apos;re all caught up! When you receive team invitations or other notifications,
                they&apos;ll appear here.
              </p>
            </div>
          )}
        </div>
      </HydrationBoundary>
    </Container>
  );
};

export default NotificationsPage;
