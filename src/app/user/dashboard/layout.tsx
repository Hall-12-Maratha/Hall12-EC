import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BarChart, Vote } from "lucide-react";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/user/dashboard", label: "Vote", icon: <Vote />, active: true },
  ];

  return (
    <AuthGuard role="user">
      <DashboardLayout navItems={navItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
