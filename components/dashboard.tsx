"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Organization, User } from "@/generated/prisma/client";
import { useEffect, useState } from "react";
import { useListOrganizations } from "@/lib/auth-client";

export default function Dashboard({ user }: { user: User }) {
  const organizations = useListOrganizations();
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  useEffect(() => {
    let data = organizations.data;
    if (!data || activeOrganization) {
      return;
    }
    if (data.length > 0) {
      setActiveOrganization(data[0] as Organization);
    }
  }, [organizations]);
  return (
    <SidebarProvider>
      <AppSidebar user={user} organizations={organizations.data as Organization[] ?? []} activeOrganization={activeOrganization} setActiveOrganization={setActiveOrganization} />
      <main>test</main>
    </SidebarProvider>
  );
}
