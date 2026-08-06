"use client";

import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@next-js-notes-app/ui/components/alert-dialog";
import { Button } from "@next-js-notes-app/ui/components/button";
import { Input } from "@next-js-notes-app/ui/components/input";
import { Textarea } from "@next-js-notes-app/ui/components/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const emptyNote: Note = {
  id: "",
  title: "",
  body: "",
  tags: [],
  createdAt: "",
  updatedAt: "",
};

async function doFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

const inflight = new Map<string, Promise<unknown>>();

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const key = `${init?.method ?? "GET"} ${url}`;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = doFetch<T>(url, init).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export default function NotesDashboard({ name }: { name: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const activeTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [qDraft, setQDraft] = useState(q);
  const loadSeq = useRef(0);

  useEffect(() => {
    setQDraft(q);
  }, [q]);

  const pushParams = useCallback(
    (
      changes: Record<string, string | string[] | null>,
      behavior: "replace" | "push" = "replace",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else {
          params.set(key, Array.isArray(value) ? value.join(",") : value);
        }
      }
      const qs = params.toString();
      const href = (qs ? `/dashboard?${qs}` : "/dashboard") as Route;
      if (behavior === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [router, searchParams],
  );

  const hasFilters = q !== "" || activeTags.length > 0 || dir !== "desc";

  const listUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeTags.length > 0) params.set("tags", activeTags.join(","));
    if (dir !== "desc") params.set("dir", dir);
    const qs = params.toString();
    return qs ? `/api/notes?${qs}` : "/api/notes";
  }, [q, activeTags, dir]);

  const loadNotes = useCallback(async () => {
    const seq = ++loadSeq.current;
    const list = await api<Note[]>(listUrl());
    if (seq !== loadSeq.current) return;
    setNotes(list);
    setLoading(false);
  }, [listUrl]);

  const loadTags = useCallback(async () => {
    const tagList = await api<{ name: string }[]>("/api/tags");
    setAllTags(tagList.map((t) => t.name));
  }, []);

  useEffect(() => {
    loadNotes().catch((e: Error) => toast.error(e.message));
  }, [loadNotes]);

  useEffect(() => {
    loadTags().catch(() => undefined);
  }, [loadTags]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (qDraft !== q) pushParams({ q: qDraft || null });
    }, 300);
    return () => clearTimeout(timer);
  }, [qDraft, q, pushParams]);

  const toggleTag = (tag: string) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];
    pushParams({ tags: next }, "push");
  };

  const clearFilters = () => pushParams({ q: null, tags: null, dir: null });

  const select = (note: Note) => {
    setSelectedId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setTags(note.tags);
    setTagInput("");
  };

  const addTag = () => {
    const name = tagInput.trim().toLowerCase();
    if (!name) return;
    if (!tags.includes(name)) setTags((prev) => [...prev, name]);
    setTagInput("");
  };

  const save = useCallback(async () => {
    if (saving) return;
    if (!title.trim() && !body.trim()) {
      toast.error("Nothing to save — add a title or some text");
      return;
    }
    setSaving(true);
    try {
      if (selectedId) {
        const updated = await api<Note>(`/api/notes/${selectedId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body, tags }),
        });
        setAllTags((prev) => [...new Set([...prev, ...updated.tags])]);
        if (hasFilters) {
          await loadNotes();
        } else {
          setNotes((prev) => prev.map((n) => (n.id === selectedId ? updated : n)));
        }
        toast.success("Note saved");
      } else {
        const created = await api<Note>("/api/notes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body, tags }),
        });
        setAllTags((prev) => [...new Set([...prev, ...created.tags])]);
        setSelectedId(created.id);
        if (hasFilters) {
          await loadNotes();
        } else {
          setNotes((prev) => [created, ...prev]);
        }
        toast.success("Note created");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [selectedId, title, body, tags, saving, hasFilters, loadNotes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/api/notes/${deleteTarget.id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setTitle("");
        setBody("");
        setTags([]);
        setTagInput("");
      }
      setDeleteTarget(null);
      toast.success("Note deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[220px_280px_1fr]">
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
              onChange={(e) => setQDraft(e.target.value)}
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
              onChange={(e) => pushParams({ dir: e.target.value }, "push")}
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
                      onClick={() => toggleTag(tag)}
                      className="border-border w-full border px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      {tag}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {hasFilters && (
              <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </nav>

      <section
        aria-label="Notes"
        className="border-border flex h-full flex-col overflow-y-auto border-r p-3"
      >
        <Button className="mb-2 w-full" onClick={() => select(emptyNote)}>
          + New note
        </Button>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : notes.length === 0 ? (
          hasFilters ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">No notes match your filters.</p>
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">No notes yet.</p>
              <Button variant="outline" className="w-full" onClick={() => select(emptyNote)}>
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
                  onClick={() => select(note)}
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

      <section aria-label="Note editor" className="flex h-full flex-col p-4">
        <Input
          aria-label="Note title"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2 text-base font-medium"
        />
        <Textarea
          aria-label="Note body"
          placeholder="Write your note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-64 flex-1 text-sm"
        />
        <div className="mt-3 space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border-border bg-muted flex items-center gap-1 px-2 py-0.5 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              aria-label="Add tag"
              placeholder="Add a tag…"
              list="tag-suggestions"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="max-w-56 text-sm"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              Add
            </Button>
            <datalist id="tag-suggestions">
              {allTags
                .filter((t) => !tags.includes(t) && t.includes(tagInput.trim().toLowerCase()))
                .map((t) => (
                  <option key={t} value={t} />
                ))}
            </datalist>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Ctrl/⌘+S to save</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={!selectedId}
              onClick={() =>
                setDeleteTarget(
                  notes.find((n) => n.id === selectedId) ??
                    (selectedId ? { ...emptyNote, id: selectedId, title } : null),
                )
              }
            >
              Delete
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : selectedId ? "Save changes" : "Create note"}
            </Button>
          </div>
        </div>
      </section>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogPopup>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
          <AlertDialogDescription>
            “{deleteTarget?.title || "Untitled"}” will be permanently deleted.
          </AlertDialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
