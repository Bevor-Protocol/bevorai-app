"use client";

import { Loader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LogoutPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async (): Promise<void> => {
      try {
        await fetch("/api/token/revoke", { method: "POST" });
      } catch (error) {
        console.error("Logout error:", error);
      }

      router.push("/sign-in");
    };

    handleLogout();
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-remaining">
      <Loader className="w-10 h-10" />
    </div>
  );
};

export default LogoutPage;
