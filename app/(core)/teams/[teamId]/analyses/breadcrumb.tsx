"use client";

import { teamActions } from "@/actions/bevor";
import LucideIcon from "@/components/lucide-icon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QUERY_KEYS } from "@/utils/constants";
import { navigation } from "@/utils/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import React from "react";

const ContainerBreadcrumb: React.FC<{ teamId: string }> = ({ teamId }) => {
  const { data: team } = useQuery({
    queryKey: [QUERY_KEYS.TEAMS, teamId],
    queryFn: async () => teamActions.getTeam(teamId),
  });

  if (!team) {
    return <></>;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              href={navigation.team.overview({ teamId: team.id })}
              className="flex flex-row gap-2 items-center"
            >
              <LucideIcon assetType="team" className="size-4" />
              {team.name}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <LucideIcon assetType="analysis" className="size-4" />
            Analyses
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default ContainerBreadcrumb;
