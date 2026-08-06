"use client";

import { useId, useRef, useState } from "react";

type TagComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  /** existing tag suggestions (already excludes user's selected tags) */
  options: string[];
  /** commit a specific suggestion */
  onCommit?: (tag: string) => void;
  /** commit whatever is currently typed (no suggestion picked) */
  onCommitNew?: () => void;
};

export default function TagCombobox({
  value,
  onChange,
  options,
  onCommit,
  onCommitNew,
}: TagComboboxProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = value.trim().toLowerCase();
  const matches = options.filter((tag) => tag.includes(query));
  const showList = open && matches.length > 0;

  const handleChange = (next: string) => {
    onChange(next);
    setOpen(true);
    setActive(0);
  };

  const select = (tag: string, commitNew = false) => {
    if (commitNew) onCommitNew?.();
    else if (onCommit) onCommit(tag);
    onChange("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (showList ? Math.min(i + 1, matches.length - 1) : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showList && active >= 0) select(matches[active]);
      else onCommitNew?.();
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="relative flex-1">
      <input
        aria-label="Add a tag"
        placeholder="Add a tag…"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        value={value}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 100);
        }}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="border-input bg-background h-9 w-full max-w-56 border px-2 text-sm"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Tag suggestions"
          className="border-border bg-background absolute left-0 right-0 top-full z-10 max-h-40 overflow-y-auto border"
        >
          {matches.map((tag, i) => (
            <li key={tag} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(tag)}
                className={`w-full px-2 py-1 text-left text-sm ${
                  i === active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
