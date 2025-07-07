import { bevorAction } from "@/actions";
import Content from "@/components/content";
import ApiContent from "@/components/screens/api-keys";
import { ApiKeyManagement, AppManagement, CreditMetric } from "@/components/screens/dashboard";
import { LoadWaifu } from "@/components/ui/loader";
import MetricCard from "@/components/ui/metric-card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, BarChart3, DollarSign } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const Dashboard = async (): Promise<JSX.Element> => {
  const user = await bevorAction.getUserInfo();

  return (
    <div
      className={cn(
        "grid gap-4 w-full auto-rows-auto overflow-y-scroll max-h-full",
        "md:grid-cols-4 grid-cols-2 relative *:bg-black/90",
      )}
    >
      <MetricCard title="Total Audits" Icon={BarChart3} stat={user.n_audits}>
        <Link href={`/analytics/history?user_address=${user.address}`} className="text-sm">
          View <ArrowUpRight size={16} className="inline-block align-baseline" color="gray" />
        </Link>
      </MetricCard>
      {/* <MetricCard title="# Projects" Icon={BarChart3} stat={user.n_projects} /> */}
      <MetricCard title="# Contracts" Icon={BarChart3} stat={user.n_versions} />
      <CreditMetric credits={user.total_credits} />
      <MetricCard title="Remaining Credits" Icon={DollarSign} stat={user.remaining_credits} />
      <ApiKeyManagement userAuth={user.auth} />
      <AppManagement userApp={user.app} />
      <div className="col-span-full">
        <ApiContent />
      </div>
    </div>
  );
};

export default function DashboardPage(): JSX.Element {
  return (
    <Content>
      <Suspense fallback={<LoadWaifu />}>
        <Dashboard />
      </Suspense>
    </Content>
  );
}
