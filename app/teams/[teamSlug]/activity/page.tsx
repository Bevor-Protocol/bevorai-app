import { AsyncComponent } from "@/utils/types";
import React from "react";

interface ActivityPageProps {
  params: Promise<{ teamSlug: string }>;
}

const ActivityPage: AsyncComponent<ActivityPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  return <div>{teamSlug} soon</div>;
};

export default ActivityPage;
