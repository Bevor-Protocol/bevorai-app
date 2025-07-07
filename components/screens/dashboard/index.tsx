"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MetricCard from "@/components/ui/metric-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";
import { UserInfoResponseI } from "@/utils/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppWindowIcon, BarChart3, Check, Copy, DollarSign, Key, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export const Dashboard = () => {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview"></TabsTrigger>
        <TabsTrigger value="projects"></TabsTrigger>
        <TabsTrigger value="management"></TabsTrigger>
      </TabsList>
      <TabsContent value="overview"></TabsContent>
      <TabsContent value="projects"></TabsContent>
      <TabsContent value="management"></TabsContent>
    </Tabs>
  );
};

const Overview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: async () => bevorAction.getUserInfo(),
  });

  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ["timeseries"],
    queryFn: async () => bevorAction.getUserTimeSeries(),
  });

  return (
    <div
      className={cn(
        "grid gap-4 w-full auto-rows-auto overflow-y-scroll max-h-full",
        "md:grid-cols-4 grid-cols-2 relative *:bg-black/90",
      )}
    >
      <MetricCard title="Total Audits" Icon={BarChart3} stat={data.n_audits}>
        <Link href={`/analytics/history?user_address=${data.address}`} className="text-sm">
          View <ArrowUpRight size={16} className="inline-block align-baseline" color="gray" />
        </Link>
      </MetricCard>
      {/* <MetricCard title="# Projects" Icon={BarChart3} stat={user.n_projects} /> */}
      <MetricCard title="# Contracts" Icon={BarChart3} stat={data.n_versions} />
      <CreditMetric credits={data.total_credits} />
      <MetricCard title="Remaining Credits" Icon={DollarSign} stat={data.remaining_credits} />
      <ApiKeyManagement userAuth={data.auth} />
      <AppManagement userApp={data.app} />
    </div>
  );
};

export const CreditMetric = ({ credits }: { credits: number }): JSX.Element => {
  const { mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: bevorAction.syncCredits,
  });

  const handleSubmit = async (): Promise<void> => {
    await mutateAsync();
  };

  return (
    <MetricCard title="Total Credits" Icon={DollarSign} stat={credits}>
      <div className="text-sm cursor-pointer">
        {isPending ? (
          <span className="flex items-center">
            syncing <RefreshCcw size={14} className="inline-block animate-spin ml-1" color="gray" />
          </span>
        ) : isSuccess ? (
          <span className="flex items-center">
            synced <Check size={14} className="inline-block ml-1" color="green" />
          </span>
        ) : (
          <span className="flex items-center" onClick={handleSubmit}>
            sync <RefreshCcw size={14} className="inline-block ml-1" color="gray" />
          </span>
        )}
      </div>
    </MetricCard>
  );
};

export const ApiKeyManagement: React.FC<{ userAuth: UserInfoResponseI["auth"] }> = ({
  userAuth,
}) => {
  const { isCopied, copy } = useCopyToClipboard();
  const { mutateAsync, isPending, data, isSuccess } = useMutation({
    mutationFn: bevorAction.generateApiKey,
  });

  const handleSubmit = async (): Promise<void> => {
    if (!userAuth.can_create) return;
    await mutateAsync("user");
  };

  return (
    <div className="border border-gray-800 rounded-md p-4 col-span-2">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <p className="text-lg font-medium">API Key Management</p>
          <Key size={16} />
        </div>
        <p className="text-sm text-gray-400">
          {userAuth.exists ? "you have an api key" : "create an api key"}
        </p>
        {!isSuccess ? (
          <Button
            variant="transparent"
            disabled={!userAuth.can_create || isPending}
            className="px-5 w-fit mt-1 md:mt-4 h-8 text-sm"
            onClick={handleSubmit}
          >
            {isPending
              ? "generating..."
              : userAuth.exists
                ? "regenerate api key"
                : "generate api key"}
          </Button>
        ) : (
          <div
            className={cn(
              "flex items-center gap-2 mt-4 h-8 px-5 bg-gray-900",
              "rounded-md max-w-full overflow-hidden",
            )}
          >
            <code
              className={cn(
                "text-sm font-mono text-gray-300 grow",
                "overflow-x-scroll whitespace-nowrap",
              )}
            >
              {data}
            </code>
            <div
              className="p-1 hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
              onClick={() => copy(data)}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AppManagement: React.FC<{ userApp: UserInfoResponseI["app"] }> = ({ userApp }) => {
  const router = useRouter();
  const { isCopied, copy } = useCopyToClipboard();
  const [appName, setAppName] = useState(userApp.name ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const {
    mutateAsync: generateApiKey,
    data,
    isSuccess,
  } = useMutation({
    mutationFn: bevorAction.generateApiKey,
  });
  const { mutateAsync: generateApp } = useMutation({
    mutationFn: bevorAction.generateApp,
  });
  const { mutateAsync: updateApp } = useMutation({
    mutationFn: bevorAction.updateApp,
  });

  const handleUpsert = async (): Promise<void> => {
    if (!userApp.can_create || !appName) return;
    if (!userApp.exists) {
      await generateApp(appName);
    } else {
      await updateApp(appName);
    }
    router.refresh();
    setIsEditing(false);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!userApp.can_create_auth) return;
    await generateApiKey("app");
  };

  return (
    <div className="border border-gray-800 rounded-md p-4 col-span-2">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <p className="text-lg font-medium">App Management</p>
          <AppWindowIcon size={16} />
        </div>
        <p className="text-sm text-gray-400">{userApp.exists ? userApp.name : "no app exists"}</p>
        <div className="flex mt-1 md:mt-4 items-center gap-4">
          {!userApp.exists && !isEditing && !isSuccess && (
            <Button
              variant="transparent"
              disabled={!userApp.can_create}
              className="px-5 w-fit h-8 text-sm"
              onClick={() => setIsEditing(true)}
            >
              create app
            </Button>
          )}
          {userApp.exists && !isEditing && !isSuccess && (
            <>
              <Button
                variant="transparent"
                disabled={!userApp.can_create}
                className="px-5 w-fit h-8 text-sm"
                onClick={() => setIsEditing(true)}
              >
                edit app
              </Button>
              <Button
                variant="transparent"
                disabled={!userApp.can_create}
                className="px-5 w-fit h-8 text-sm"
                onClick={handleSubmit}
              >
                {userApp.exists_auth ? "regenerate api key" : "generate api key"}
              </Button>
            </>
          )}
          {isEditing && !isSuccess && (
            <>
              <Input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.currentTarget.value)}
                placeholder="App name"
                className="bg-gray-900 rounded px-3 py-1 text-sm"
                disabled={!userApp.can_create}
              />
              <Button
                variant="transparent"
                disabled={!userApp.can_create}
                className="px-5 w-fit h-8"
                onClick={() => handleUpsert()}
              >
                {userApp.exists ? "update" : "create"}
              </Button>
            </>
          )}
          {isSuccess && (
            <div
              className={cn(
                "flex items-center gap-2 h-8 px-5 bg-gray-900",
                "rounded-md max-w-full overflow-hidden",
              )}
            >
              <code
                className={cn(
                  "text-sm font-mono text-gray-300 grow",
                  "overflow-x-scroll whitespace-nowrap",
                )}
              >
                {data}
              </code>
              <div
                className="p-1 hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                onClick={() => copy(data)}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
