"use client";

import { bevorAction } from "@/actions";
import { Loader } from "@/components/ui/loader";
import { useLogout, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

const LogoutPage: React.FC = () => {
  const { ready } = usePrivy();
  const { logout } = useLogout();
  useEffect(() => {
    if (!ready) return;
    const fullLogout = async (): Promise<void> => {
      // swap these, the redirect is in the server action.
      await bevorAction.logout();
      await logout();
    };
    fullLogout();
  }, [ready]);
  return (
    <div className="flex justify-center items-center fill-remaining-height">
      <Loader className="w-10 h-10" />
    </div>
  );
};

export default LogoutPage;
