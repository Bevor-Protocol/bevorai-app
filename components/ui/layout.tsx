import { authAction, bevorAction } from "@/actions";
import Container from "@/components/container";
import Header from "@/components/header";
import { AsyncComponent, CodeProjectSchema, TeamSchemaI } from "@/utils/types";

type LayoutProps = {
  children: React.ReactNode;
  teamSlug?: string;
};

const Layout: AsyncComponent<LayoutProps> = async ({ children }: LayoutProps) => {
  const currentUser = await authAction.getCurrentUser();
  let teams: TeamSchemaI[] = [];
  let projects: CodeProjectSchema[] = [];

  if (currentUser) {
    teams = await bevorAction.getTeams();
    projects = await bevorAction.getAllProjects();
  }

  const userObject = {
    isAuthenticated: !!currentUser,
    userId: currentUser?.userId,
    teams,
    projects,
  };

  return (
    <div className="min-h-screen bg-black">
      <Header userObject={userObject} />
      <Container>{children}</Container>
    </div>
  );
};

export default Layout;
