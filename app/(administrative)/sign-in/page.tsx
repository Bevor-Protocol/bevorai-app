"use client";

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to BevorAI</h1>
          <p className="mt-2 text-gray-400">AI Agent Smart Contract Auditor</p>
        </div>

        <div className="rounded-lg border border-neutral-800 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In</h2>
            <p className="text-sm text-gray-400 mb-6">
              Connect your wallet or sign in with email to continue
            </p>
            {isError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                Authentication failed. Please try again.
              </div>
            )}
            <Button onClick={login} disabled={!ready || isLoggingIn}>
              {isLoggingIn ? "Signing in..." : "sign in"}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <Building2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-xs text-gray-400">Team Management</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-xs text-gray-400">Smart Contract Audits</p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-xs text-gray-400">AI-Powered Analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
