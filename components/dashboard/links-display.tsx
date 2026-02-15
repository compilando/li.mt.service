"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { LayoutGrid, List, SlidersHorizontal, ArrowUpDown, CalendarDays, Archive } from "lucide-react";
import { LinkDisplaySettings } from "@/lib/validations/links-display";
import { Badge } from "@/components/ui/badge";

interface LinksDisplayProps {
  settings: LinkDisplaySettings;
  onSettingsChange: (settings: LinkDisplaySettings) => void;
}

export function LinksDisplay({ settings, onSettingsChange }: LinksDisplayProps) {
  const updateSettings = (updates: Partial<LinkDisplaySettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateDisplayProperties = (
    property: keyof LinkDisplaySettings["displayProperties"],
    value: boolean
  ) => {
    onSettingsChange({
      ...settings,
      displayProperties: {
        ...settings.displayProperties,
        [property]: value,
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Display
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* View Mode */}
        <div className="p-3 space-y-2">
          <Label className="text-xs text-muted-foreground">View</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={settings.viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => updateSettings({ viewMode: "cards" })}
              className="justify-start gap-2"
            >
              <LayoutGrid className="size-4" />
              Cards
            </Button>
            <Button
              variant={settings.viewMode === "rows" ? "default" : "outline"}
              size="sm"
              onClick={() => updateSettings({ viewMode: "rows" })}
              className="justify-start gap-2"
            >
              <List className="size-4" />
              Rows
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Ordering */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpDown className="size-3" />
          Ordering
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => updateSettings({ sortBy: "createdAt" })}
          className="justify-between"
        >
          Date created
          {settings.sortBy === "createdAt" && (
            <Badge variant="secondary" className="text-xs">
              {settings.sortOrder === "desc" ? "Newest" : "Oldest"}
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateSettings({ sortBy: "clicks" })}
          className="justify-between"
        >
          Clicks
          {settings.sortBy === "clicks" && (
            <Badge variant="secondary" className="text-xs">
              {settings.sortOrder === "desc" ? "Most" : "Least"}
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateSettings({ sortBy: "title" })}
          className="justify-between"
        >
          Title
          {settings.sortBy === "title" && (
            <Badge variant="secondary" className="text-xs">
              {settings.sortOrder === "asc" ? "A-Z" : "Z-A"}
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sort Order */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3" />
          Date created
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => updateSettings({ sortBy: "createdAt", sortOrder: "desc" })}
          className="justify-between"
        >
          Newest first
          {settings.sortBy === "createdAt" && settings.sortOrder === "desc" && (
            <div className="size-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateSettings({ sortBy: "createdAt", sortOrder: "asc" })}
          className="justify-between"
        >
          Oldest first
          {settings.sortBy === "createdAt" && settings.sortOrder === "asc" && (
            <div className="size-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Show Archived */}
        <DropdownMenuCheckboxItem
          checked={settings.showArchived}
          onCheckedChange={(checked) => updateSettings({ showArchived: checked })}
        >
          <Archive className="size-4 mr-2" />
          Show archived links
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {/* Display Properties */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
          Display Properties
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.shortLink}
          onCheckedChange={(checked) => updateDisplayProperties("shortLink", checked)}
        >
          Short link
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.destinationUrl}
          onCheckedChange={(checked) => updateDisplayProperties("destinationUrl", checked)}
        >
          Destination URL
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.title}
          onCheckedChange={(checked) => updateDisplayProperties("title", checked)}
        >
          Title
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.description}
          onCheckedChange={(checked) => updateDisplayProperties("description", checked)}
        >
          Description
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.createdDate}
          onCheckedChange={(checked) => updateDisplayProperties("createdDate", checked)}
        >
          Created Date
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.creator}
          onCheckedChange={(checked) => updateDisplayProperties("creator", checked)}
        >
          Creator
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.tags}
          onCheckedChange={(checked) => updateDisplayProperties("tags", checked)}
        >
          Tags
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.displayProperties.analytics}
          onCheckedChange={(checked) => updateDisplayProperties("analytics", checked)}
        >
          Analytics
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
