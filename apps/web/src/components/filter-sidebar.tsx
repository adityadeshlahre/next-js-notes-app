"use client";

import { Button } from "@next-js-notes-app/ui/components/button";
import { Input } from "@next-js-notes-app/ui/components/input";
import { memo } from "react";

type FilterSidebarProps = {
  name: string;
  allTags: string[];
  qDraft: string;
  tagsParam: string;
  dir: "asc" | "desc";
  hasFilters: boolean;
  onQDraftChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
  onDirChange: (dir: "asc" | "desc") => void;
  onClearFilters: () => void;
};

function FilterSidebar({
  name,
  allTags,
  qDraft,
  tagsParam,
  dir,
  hasFilters,
  onQDraftChange,
  onToggleTag,
  onDirChange,
  onClearFilters,
}: FilterSidebarProps) {
  const activeTags = tagsParam.split(",").filter(Boolean);

  return (
    <nav
      aria-label="Filters"
      className="border-border overflow-y-auto border-b p-3 md:border-b-0 md:border-r"
    >
      <p className="mb-2 truncate px-1 text-xs text-muted-foreground">{name}</p>
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="search-notes" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="search-notes"
            placeholder="Search by title…"
            value={qDraft}
            maxLength={200}
            onChange={(e) => onQDraftChange(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="sort-notes" className="text-xs font-medium text-muted-foreground">
            Sort
          </label>
          <select
            id="sort-notes"
            value={dir}
            onChange={(e) => onDirChange(e.target.value as "asc" | "desc")}
            className="border-input bg-background h-9 w-full border px-2 text-sm"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Tags</p>
          {allTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags yet.</p>
          ) : (
            <ul className="space-y-1">
              {allTags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    aria-pressed={activeTags.includes(tag)}
                    onClick={() => onToggleTag(tag)}
                    className="border-border w-full border px-2 py-1 text-left text-sm hover:bg-muted"
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hasFilters && (
            <Button variant="outline" size="sm" className="w-full" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default memo(FilterSidebar);
