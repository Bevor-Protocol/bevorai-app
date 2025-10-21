"use client";

import { Loader } from "@/components/ui/loader";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const RefreshPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!router) return;
    const checkAuth = async (): Promise<void> => {
      try {
        const response = await fetch("/api/token/validate", { method: "GET" });
        if (!response.ok) {
          router.push("/sign-in");
        } else {
          const redirect_uri = searchParams.get("redirect");
          if (redirect_uri) {
            router.push(redirect_uri);
          } else {
            router.push("/teams");
          }
        }
      } catch {
        router.push("/sign-in");
      }
    };
    checkAuth();
  }, [router, searchParams]);

  return (
    <div className="flex justify-center items-center min-h-remaining">
      <Loader className="w-10 h-10" />
    </div>
  );
};

const RefreshPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-remaining">
          <Loader className="w-10 h-10" />
        </div>
      }
    >
      <RefreshPageContent />
    </Suspense>
  );
};

export default RefreshPage;
