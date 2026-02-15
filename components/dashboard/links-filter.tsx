"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, Tag, Globe, User, X } from "lucide-react";
import { LinkFilters } from "@/lib/validations/links-display";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface LinksFilterProps {
  filters: LinkFilters;
  onFiltersChange: (filters: LinkFilters) => void;
  availableTags?: Array<{ id: string; name: string; color: string }>;
  availableDomains?: Array<{ id: string; name: string }>;
  availableCreators?: Array<{ id: string; name: string; email: string }>;
}

export function LinksFilter({
  filters,
  onFiltersChange,
  availableTags = [],
  availableDomains = [],
  availableCreators = [],
}: LinksFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activeFiltersCount =
    filters.tagIds.length + filters.domainIds.length + filters.creatorIds.length;

  const handleTagToggle = (tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];
    onFiltersChange({ ...filters, tagIds: newTagIds });
  };

  const handleDomainToggle = (domainId: string) => {
    const newDomainIds = filters.domainIds.includes(domainId)
      ? filters.domainIds.filter((id) => id !== domainId)
      : [...filters.domainIds, domainId];
    onFiltersChange({ ...filters, domainIds: newDomainIds });
  };

  const handleCreatorToggle = (creatorId: string) => {
    const newCreatorIds = filters.creatorIds.includes(creatorId)
      ? filters.creatorIds.filter((id) => id !== creatorId)
      : [...filters.creatorIds, creatorId];
    onFiltersChange({ ...filters, creatorIds: newCreatorIds });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      tagIds: [],
      domainIds: [],
      creatorIds: [],
      search: filters.search,
    });
  };

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDomains = availableDomains.filter((domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCreators = availableCreators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="size-4" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {/* Search input */}
          <div className="p-2">
            <Input
              placeholder="Filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          <DropdownMenuSeparator />

          {/* Tags */}
          {filteredTags.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="size-3" />
                Tag
              </DropdownMenuLabel>
              {filteredTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={filters.tagIds.includes(tag.id)}
                  onCheckedChange={() => handleTagToggle(tag.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Domains */}
          {filteredDomains.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="size-3" />
                Domain
              </DropdownMenuLabel>
              {filteredDomains.map((domain) => (
                <DropdownMenuCheckboxItem
                  key={domain.id}
                  checked={filters.domainIds.includes(domain.id)}
                  onCheckedChange={() => handleDomainToggle(domain.id)}
                >
                  {domain.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Creators */}
          {filteredCreators.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="size-3" />
                Creator
              </DropdownMenuLabel>
              {filteredCreators.map((creator) => (
                <DropdownMenuCheckboxItem
                  key={creator.id}
                  checked={filters.creatorIds.includes(creator.id)}
                  onCheckedChange={() => handleCreatorToggle(creator.id)}
                >
                  <div className="flex flex-col">
                    <span>{creator.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {creator.email}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}

          {/* Clear all */}
          {activeFiltersCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full justify-start gap-2 h-8"
                >
                  <X className="size-3" />
                  Clear all filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
