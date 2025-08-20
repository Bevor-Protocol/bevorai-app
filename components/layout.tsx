import { bevorAction } from "@/actions";
import Breadcrumbs from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Notifications, Profile } from "@/components/header";
import { cn } from "@/lib/utils";
import { AsyncComponent, CodeProjectSchema, MemberInviteSchema, TeamSchemaI } from "@/utils/types";
import { cookies } from "next/headers";
import Image from "next/image";

type LayoutProps = {
  children: React.ReactNode;
  teamSlug?: string;
};

const Layout: AsyncComponent<LayoutProps> = async ({ children }: LayoutProps) => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bevor-token")?.value;
  let currentUser = null;
  let teams: TeamSchemaI[] = [];
  let projects: CodeProjectSchema[] = [];
  let invites: MemberInviteSchema[] = [];

  if (sessionToken) {
    currentUser = await bevorAction.getUser();
    if (currentUser) {
      teams = await bevorAction.getTeams();
      projects = await bevorAction.getAllProjects();
      invites = await bevorAction.getUserInvites();
    }
  }

  const userObject = {
    isAuthenticated: !!currentUser,
    userId: currentUser?.id,
    teams,
    projects,
    invites,
  };

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
          {!!currentUser && <Breadcrumbs userObject={userObject} />}
        </div>
        <div className="gap-4 items-center relative flex">
          {!!currentUser && <Notifications invites={invites} />}
          {!!currentUser && <Profile teams={teams} userId={currentUser.id} />}
        </div>
      </header>
      <Container>{children}</Container>
    </div>
  );
};

export default Layout;
