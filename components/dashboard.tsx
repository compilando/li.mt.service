"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Organization, User } from "@/generated/prisma/client";
import { useEffect } from "react";
import { useListOrganizations } from "@/lib/auth-client";
import { BarChart3, Link } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const items = [
  {
    title: "Links",
    url: "/app/links",
    icon: Link,
  },
  {
    title: "Analytics",
    url: "/app/analytics",
    icon: BarChart3,
  },
];

export default function Dashboard({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const organizations = useListOrganizations();
  const { activeOrganization, setActiveOrganization } = useActiveOrganization();

  useEffect(() => {
    const data = organizations.data;
    if (!data || activeOrganization) {
      return;
    }
    if (data.length > 0) {
      setActiveOrganization(data[0] as Organization);
    }
  }, [organizations.data]);

  return (
    <div className="bg-[var(--secondary)]">
      <SidebarProvider>
        <AppSidebar
          items={items}
          user={user}
          organizations={(organizations.data as Organization[]) ?? []}
          activeOrganization={activeOrganization}
          setActiveOrganization={setActiveOrganization}
        />
        <main className="min-h-screen w-full p-2 relative pl-0">
          <div className="shadow-xs p-8 w-full h-full rounded-md bg-[var(--background)]">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
