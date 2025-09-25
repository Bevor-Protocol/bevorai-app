"use client";

import { Loader } from "@/components/ui/loader";
import { useLogout, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LogoutPage: React.FC = () => {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { logout } = useLogout();
  useEffect(() => {
    if (!ready) return;
    const fullLogout = async (): Promise<void> => {
      // assume that user-initiated logouts contain their own logic.
      // middleware-determined logouts managed out session logic internally, and this is just a
      // pass through to log out of privy.
      if (authenticated) {
        // will throw an error otherwise.
        await logout();
      }
      await fetch("/api/token/revoke", { method: "POST" });
      router.push("/sign-in");
    };
    fullLogout();
  }, [ready, logout]);
  return (
    <div className="flex justify-center items-center min-h-remaining">
      <Loader className="w-10 h-10" />
    </div>
  );
};

export default LogoutPage;
