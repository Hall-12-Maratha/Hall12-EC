"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@/lib/types";
import { Spinner } from "./ui/spinner";

export function AuthGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/");
        return;
      }
      if (user.role !== role) {
        // Redirect to their own dashboard if they try to access the wrong one
        const destination = user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
        router.replace(destination);
      }
    }
  }, [user, loading, router, role]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="large"/>
      </div>
    );
  }

  return <>{children}</>;
}
