import { bevorAction } from "@/actions";
import Content from "@/components/content";
import MultiTimeSeriesPlot from "@/components/screens/analytics/multi-plot";
import TimeSeriesPlot from "@/components/screens/analytics/plot";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/ui/metric-card";
import { cn } from "@/lib/utils";
import { AsyncComponent } from "@/utils/types";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

const Stats: AsyncComponent = async () => {
  const data = await bevorAction.getStats();
  const auditsTs = await bevorAction.getTimeseriesAudits();
  const usersTs = await bevorAction.getTimeseriesUsers();
  const securityFindingsTs = await bevorAction.getTimeseriesFindings("security");
  const gasFindingsTs = await bevorAction.getTimeseriesFindings("gas");

  return (
    <>
      <div
        className={cn(
          "size-full gap-4",
          "grid md:grid-cols-4 md:grid-rows-[min-content_min-content_min-content_1fr]",
          "grid-cols-2 grid-rows-[min-content_min-content_min-content_min-content_1fr]",
          "*:bg-black/90",
        )}
      >
        <MetricCard title="Total Users" Icon={BarChart3} stat={data.n_users} />
        <MetricCard title="Registered Apps" Icon={BarChart3} stat={data.n_apps} />
        <MetricCard title="Audits Requested" Icon={BarChart3} stat={data.n_audits} />
        <MetricCard title="Smart Contracts" Icon={BarChart3} stat={data.n_contracts} />
        <MultiTimeSeriesPlot data={securityFindingsTs} title="security findings" />
        <MultiTimeSeriesPlot data={gasFindingsTs} title="gas findings" />
        <TimeSeriesPlot data={auditsTs} title="# audits" />
        <TimeSeriesPlot data={usersTs} title="# users" />
        <div className="col-span-full h-fit">
          <Link href="/analytics/history">
            <Button className="w-full">See All Audits</Button>
          </Link>
        </div>
      </div>
    </>
  );
};

const AnalyticsPage: React.FC = () => {
  return (
    <Content>
      <Suspense>
        <Stats />
      </Suspense>
    </Content>
  );
};

export default AnalyticsPage;
