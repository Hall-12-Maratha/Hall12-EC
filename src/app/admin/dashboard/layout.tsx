import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Users, BarChart } from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/admin/dashboard", label: "Vote Tally", icon: <BarChart />, active: true },
    // In a multi-page admin dashboard, we would have more items and handle active state dynamically
  ];

  return (
    <AuthGuard role="admin">
      <DashboardLayout navItems={navItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
