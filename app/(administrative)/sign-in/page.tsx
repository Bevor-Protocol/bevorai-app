"use client";

import LogoDots from "@/assets/logo/dots";
import { Button } from "@/components/ui/button";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import React, { useState } from "react";

const SignInPage: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isError, setIsError] = useState(false);
  const { ready } = usePrivy();
  const { logout } = useLogout();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { login } = useLogin({
    onComplete: async () => {
      setIsLoggingIn(true);
      setIsError(false);
      try {
        const response = await fetch("/api/token/issue", { method: "POST" });
        const data = await response.json();
        if (!data.success) {
          throw new Error("bad");
        }
        await queryClient.invalidateQueries();
        router.push("/teams");
      } catch {
        console.log("bad, logging out.");
        await logout();
        setIsLoggingIn(false);
        setIsError(true);
      }
    },
  });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-background relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-center text-foreground p-12 h-full w-full">
          <div className="text-center space-y-8 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold">BevorAI</h1>
              <p className="text-xl text-muted-foreground max-w-md">
                AI-powered smart contract auditing platform that combines advanced security analysis
                with intelligent automation
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-12">
              <div className="flex items-center space-x-4 bg-card rounded-lg p-4 border border-border">
                <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage projects and collaborate with your team
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-card rounded-lg p-4 border border-border">
                <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Security Auditing</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive smart contract security analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 bg-card rounded-lg p-4 border border-border">
                <Zap className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-card-foreground">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced AI algorithms for vulnerability detection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-8 right-8 w-32 h-40">
            <LogoDots />
          </div>
          <div className="absolute bottom-16 left-8 w-24 h-32">
            <LogoDots />
          </div>
          <div className="absolute top-1/2 left-1/4 w-20 h-26 opacity-60">
            <LogoDots />
          </div>
          <div className="absolute top-1/3 right-1/4 w-16 h-20 opacity-40">
            <LogoDots />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <div className="space-y-6">
            {isError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                Authentication failed. Please try again.
              </div>
            )}
            <Button
              onClick={login}
              disabled={!ready || isLoggingIn}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Connect your wallet or sign in with email
              </p>
            </div>
          </div>

          <div className="lg:hidden space-y-4 pt-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">Why choose BevorAI?</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-card rounded-lg">
                <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-sm text-card-foreground">Team Management</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-card rounded-lg">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-sm text-card-foreground">Smart Contract Audits</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-card rounded-lg">
                <Zap className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-sm text-card-foreground">AI-Powered Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
