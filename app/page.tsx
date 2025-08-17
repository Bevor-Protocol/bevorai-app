"use client";

import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { usePrivy } from "@privy-io/react-auth";
import { BarChart3, FileText, Key, MessageSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MainPage: React.FC = () => {
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/sign-in");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <></>; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">BevorAI</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email?.address || "User"}
              </span>
              <Button variant="dark">Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Welcome to your BevorAI dashboard</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card.Main>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Audits</span>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">12</div>
            </Card.Content>
          </Card.Main>

          <Card.Main>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Chats</span>
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </div>
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">3</div>
            </Card.Content>
          </Card.Main>

          <Card.Main>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Keys</span>
                <Key className="h-4 w-4 text-gray-400" />
              </div>
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">2</div>
            </Card.Content>
          </Card.Main>

          <Card.Main>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Team Members</span>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">1</div>
            </Card.Content>
          </Card.Main>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/personal">
            <Card.Main hover className="cursor-pointer">
              <Card.Header>
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span className="font-medium">View Dashboard</span>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600">
                  Access your full dashboard with detailed analytics and team management
                </p>
              </Card.Content>
            </Card.Main>
          </Link>

          <Link href="/dashboard/personal/audits">
            <Card.Main hover className="cursor-pointer">
              <Card.Header>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  <span className="font-medium">Manage Audits</span>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600">View and manage your smart contract audits</p>
              </Card.Content>
            </Card.Main>
          </Link>

          <Link href="/dashboard/personal/team">
            <Card.Main hover className="cursor-pointer">
              <Card.Header>
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  <span className="font-medium">Team Settings</span>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600">Manage team members and settings</p>
              </Card.Content>
            </Card.Main>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
