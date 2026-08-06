"use client";

import { Button } from "@next-js-notes-app/ui/components/button";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { memo } from "react";

import { api, emptyNote, notesUrl, type Note } from "@/lib/notes-api";

type NotesListProps = {
  q: string;
  tagsParam: string;
  dir: "asc" | "desc";
  hasFilters: boolean;
  selectedId: string | null;
  onSelect: (note: Note) => void;
  onClearFilters: () => void;
};

function NotesList({
  q,
  tagsParam,
  dir,
  hasFilters,
  selectedId,
  onSelect,
  onClearFilters,
}: NotesListProps) {
  const listUrl = notesUrl({ q, tags: tagsParam.split(",").filter(Boolean), dir });

  const { data: notes = [], isPending } = useQuery({
    queryKey: ["notes", listUrl],
    queryFn: () => api<Note[]>(listUrl),
    placeholderData: keepPreviousData,
  });

  return (
    <section
      aria-label="Notes"
      className="border-border flex h-full flex-col overflow-y-auto border-r p-3"
    >
      <Button className="mb-2 w-full" onClick={() => onSelect(emptyNote)}>
        + New note
      </Button>
      {isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : notes.length === 0 ? (
        hasFilters ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">No notes match your filters.</p>
            <Button variant="outline" className="w-full" onClick={onClearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">No notes yet.</p>
            <Button variant="outline" className="w-full" onClick={() => onSelect(emptyNote)}>
              Create your first note
            </Button>
          </div>
        )
      ) : (
        <ul className="space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                aria-pressed={note.id === selectedId}
                onClick={() => onSelect(note)}
                className={`w-full border px-3 py-2 text-left ${
                  note.id === selectedId
                    ? "border-ring bg-accent"
                    : "border-transparent hover:bg-muted"
                }`}
              >
                <span className="block truncate text-sm font-medium">
                  {note.title || "Untitled"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{note.body}</span>
                {note.tags.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default memo(NotesList);
