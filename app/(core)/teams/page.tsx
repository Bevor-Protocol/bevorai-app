"use server";

import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { TeamCreate, TeamsCount, TeamsTable } from "./teams-client";

const TeamsPage: AsyncComponent = async () => {
  return (
    <Container>
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Teams</h3>
          <TeamsCount />
        </div>
        <TeamCreate />
      </div>
      <TeamsTable />
    </Container>
  );
};

export default TeamsPage;
