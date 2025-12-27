import { AsyncComponent } from "@/utils/types";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const PlansPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  return (
    <>
      <div className="mb-12">fix me! {teamSlug}</div>
    </>
  );
};

export default PlansPage;
