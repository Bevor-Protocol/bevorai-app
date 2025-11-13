"use client";

import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Chrome, Github } from "lucide-react";
import Image from "next/image";

import { stytchClient } from "@/lib/config/stytch";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

const baseURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

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
  const searchParams = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isError, setIsError] = useState(false);
  const [email, setEmail] = useState("");
  const [isEmailError, setIsEmailError] = useState(false);
  const [isMagicLinkSuccess, setIsMagicLinkSuccess] = useState(false);
  const [isMagicLinkError, setIsMagicLinkError] = useState(false);

  const handleOAuthLogin = (provider: "google" | "github"): void => {
    setIsLoggingIn(true);
    if (provider === "google") {
      stytchClient.oauth.google.start({
        login_redirect_url: `${baseURL}/api/auth/callback`,
        signup_redirect_url: `${baseURL}/api/auth/callback`,
      });
    } else {
      stytchClient.oauth.github.start({
        login_redirect_url: `${baseURL}/api/auth/callback`,
        signup_redirect_url: `${baseURL}/api/auth/callback`,
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setEmail(value);
    // Only clear error if there was one and user is typing
    if (isEmailError) {
      setIsEmailError(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const isValidEmail = validateEmail(email);
    if (!isValidEmail) {
      setIsEmailError(true);
      return;
    }

    setIsLoggingIn(true);
    setIsError(false);
    setIsMagicLinkError(false);
    setIsMagicLinkSuccess(false);

    try {
      const response = await stytchClient.magicLinks.email.loginOrCreate(email, {
        login_magic_link_url: `${baseURL}/api/auth/callback`,
        login_expiration_minutes: 10,
        signup_magic_link_url: `${baseURL}/api/auth/callback`,
        signup_expiration_minutes: 10,
      });

      if (response.status_code < 200 || response.status_code >= 400) {
        throw new Error(`Magic link request failed with status ${response.status_code}`);
      }
      setIsMagicLinkSuccess(true);
    } catch {
      setIsMagicLinkError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBackToLogin = (): void => {
    setIsMagicLinkSuccess(false);
    setIsMagicLinkError(false);
    setIsError(false);
    setEmail("");
  };

  if (isMagicLinkSuccess) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-lg">
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
          Magic link sent! Check your email and click the link to sign in.
        </div>
        <Button onClick={handleBackToLogin} variant="outline">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <form onSubmit={handleMagicLinkLogin} noValidate>
        <FieldGroup>
          <Field className="relative pb-1">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={handleEmailChange}
              autoComplete="off"
              aria-invalid={isEmailError}
            />
            {isEmailError && (
              <FieldError className="absolute -bottom-5 left-0 right-0">
                Input a valid email
              </FieldError>
            )}
          </Field>
          <Field>
            <Button type="submit" disabled={isLoggingIn}>
              Send Magic Link
            </Button>
            <p className="text-center">or</p>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoggingIn}
            >
              <Chrome />
              Login with Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOAuthLogin("github")}
              disabled={isLoggingIn}
            >
              <Github />
              Login with Github
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {isMagicLinkError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-destructive text-sm text-center">
          Failed to send magic link. Please try again.
        </div>
      )}

      {(isError || searchParams.get("error")) && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-destructive text-sm text-center">
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
        className="pointer-events-none mask-radial-to-75% mask-radial-at-top-right lg:mask-radial-at-right top-0 bottom-0 left-0 right-0 lg:right-1/2"
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
