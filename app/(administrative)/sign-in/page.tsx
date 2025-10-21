"use client";

import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";

import React, { useState } from "react";

const CompanyContent: React.FC = () => {
  return (
    <div className="z-10 flex flex-col justify-center items-center w-full text-center gap-6 lg:gap-8 max-w-lg">
      <div className="flex flex-row gap-4 lg:gap-6 items-center justify-center">
        <div className="aspect-423/564 relative h-[50px] lg:h-[80px]">
          <Image src="/logo-small.png" alt="BevorAI logo" fill priority />
        </div>
        <h1 className="text-[55px] lg:text-[85px] font-semibold leading-none">BevorAI</h1>
      </div>
      <p className="text-base lg:text-lg px-4 lg:px-0">
        Smart contract security analysis platform that leverages AI and automation to optimize your
        workflows
      </p>
    </div>
  );
};

const SigninContent: React.FC = () => {
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
        await logout();
        setIsLoggingIn(false);
        setIsError(true);
      }
    },
  });

  return (
    <div className="flex flex-col justify-center items-center w-full gap-6 lg:gap-8 max-w-lg">
      <h2 className="hidden lg:block text-2xl lg:text-3xl text-center font-semibold">
        Welcome Back
      </h2>
      <Button
        onClick={login}
        disabled={!ready || isLoggingIn}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {isLoggingIn ? "Signing in..." : "Sign In"}
      </Button>

      {isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-destructive text-sm">
          Authentication failed. Please try again.
        </div>
      )}
    </div>
  );
};

const SignInPage: React.FC = () => {
  return (
    <div className="h-svh flex flex-col items-center lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-background relative items-center justify-center min-h-[50vh] lg:min-h-0">
        <CompanyContent />
      </div>
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-6 lg:p-8 bg-background min-h-[50vh] lg:min-h-0">
        <SigninContent />
      </div>
      <div className="flex flex-col gap-8 lg:hidden items-center size-full justify-center px-8">
        <CompanyContent />
        <SigninContent />
      </div>

      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-100% lg:mask-radial-to-75% mask-radial-at-top-right lg:mask-radial-at-right top-0 bottom-0 left-0 right-0 lg:right-1/2"
        opacity={0.75}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--primary"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />
    </div>
  );
};

export default SignInPage;
