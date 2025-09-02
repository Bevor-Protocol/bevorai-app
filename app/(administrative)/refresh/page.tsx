"use client";

import { Loader } from "@/components/ui/loader";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const RefreshPageContent: React.FC = () => {
  const { getAccessToken } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!router) return;
    const waitToken = async (): Promise<void> => {
      // swap these, the redirect is in the server action.
      const accessToken = await getAccessToken();
      if (!accessToken) {
        router.push("/sign-in");
      } else {
        const redirect_uri = searchParams.get("redirect");
        if (redirect_uri) {
          router.push(redirect_uri);
        } else {
          router.push("/teams");
        }
      }
    };
    waitToken();
  }, [getAccessToken, router, searchParams]);

  return (
    <div className="flex justify-center items-center fill-remaining-height">
      <Loader className="w-10 h-10" />
    </div>
  );
};

const RefreshPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center fill-remaining-height">
          <Loader className="w-10 h-10" />
        </div>
      }
    >
      <RefreshPageContent />
    </Suspense>
  );
};

export default RefreshPage;
