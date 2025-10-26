"use client";

import type { ReactNode } from "react";
import {
  SidebarProvider,
} from "@/hooks/use-sidebar";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Gem, LogOut } from "lucide-react";
import { UserMenu } from "./user-menu";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "../assets/image.png";

type DashboardLayoutProps = {
  children: ReactNode;
  navItems: { href: string; label: string; icon: ReactNode, active: boolean }[];
};

function LogoutButton() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
        await auth.signOut();
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
        router.push("/");
        } catch (error) {
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "An error occurred while logging out.",
        });
        }
    };

    return (
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut />
            <span>Log out</span>
        </Button>
    )
}

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 justify-center">
                      {/* <Vote className="h-10 w-10 text-primary" /> */}
                      <Image src={logo} alt="Maratha HEC Election Portal" width={40} height={40} />
                    </div>
            
                    <div className="flex items-center gap-2 justify-center">
                      {/* <Gem className="h-10 w-10 text-primary" /> */}
                      <h1 className="text-l font-bold tracking-tight text-foreground  font-headline">
                        HALL 12
                      </h1>
                    </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={item.active}>
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <LogoutButton />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:justify-end sm:px-8">
            <SidebarTrigger className="sm:hidden" />
            <UserMenu />
          </header>
          <main className="flex-1 p-4 sm:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
