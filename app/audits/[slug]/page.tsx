import { authAction } from "@/actions";
import Wrapper from "@/components/content";
import { Content } from "@/components/screens/audit";
import { LoadWaifu } from "@/components/ui/loader";
import { Suspense } from "react";

const Audit = async ({ auditId }: { auditId: string }): Promise<JSX.Element> => {
  const user = await authAction.getCurrentUser();

  return <Content auditId={auditId} address={user?.address ?? ""} />;
};

export default async function AuditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const auditId = (await params).slug;
  return (
    <Wrapper className="bg-black/90">
      <Suspense fallback={<LoadWaifu />}>
        <Audit auditId={auditId} />
      </Suspense>
    </Wrapper>
  );
}
