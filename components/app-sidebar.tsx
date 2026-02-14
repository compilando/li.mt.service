"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Organization, User } from "@/generated/prisma/client";

export interface SidebarItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export function AppSidebar({
  user,
  organizations,
  activeOrganization,
  setActiveOrganization,
  items,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActiveOrganization: (org: Organization | null) => void;
  items: SidebarItem[];
}) {
  return (
    <Sidebar
      collapsible="none"
      className="h-auto m-2 shadow-xs rounded-md bg-[var(--background)]"
      style={
        {
          "--sidebar-width": "20rem",
        } as React.CSSProperties
      }
      {...props}
    >
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
          setActiveOrganization={setActiveOrganization}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <NavMain items={items} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
