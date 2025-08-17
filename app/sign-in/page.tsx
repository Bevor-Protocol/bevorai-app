"use client";

import { Building2, Shield, Zap } from "lucide-react";
import React from "react";

const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to BevorAI</h1>
          <p className="mt-2 text-gray-400">AI Agent Smart Contract Auditor</p>
        </div>

        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In</h2>
            <p className="text-sm text-gray-400 mb-6">
              Connect your wallet or sign in with email to continue
            </p>
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
