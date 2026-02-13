"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Organization, User } from "@/generated/prisma/client";

export function AppSidebar({
  user,
  organizations,
  activeOrganization,
  setActiveOrganization,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User; organizations: Organization[]; activeOrganization: Organization | null; setActiveOrganization: React.Dispatch<React.SetStateAction<Organization | null>> }) {
  return (
    <Sidebar collapsible="none" className="h-auto" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher organizations={organizations} activeOrganization={activeOrganization} setActiveOrganization={setActiveOrganization} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
