import { navigation } from "@/utils/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  params: { teamId: string; projectId: string };
};

const StepHeader: React.FC<Props> = ({ params }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 text-sm">
        <Link
          href={navigation.project.codes(params)}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Version Method</span>
        </Link>
      </div>
    </div>
  );
};

export default StepHeader;
