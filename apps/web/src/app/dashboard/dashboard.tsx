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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Note = { id: string; title: string; body: string; createdAt: string; updatedAt: string };

const emptyNote: Note = { id: "", title: "", body: "", createdAt: "", updatedAt: "" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export default function NotesDashboard({ name }: { name: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const load = useCallback(async () => {
    const list = await api<Note[]>("/api/notes");
    setNotes(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((e: Error) => toast.error(e.message));
  }, [load]);

  const select = (note: Note) => {
    setSelectedId(note.id);
    setTitle(note.title);
    setBody(note.body);
  };

  const save = useCallback(async () => {
    if (saving || (!title.trim() && !body.trim())) return;
    setSaving(true);
    try {
      if (selectedId) {
        const updated = await api<Note>(`/api/notes/${selectedId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body }),
        });
        setNotes((prev) => prev.map((n) => (n.id === selectedId ? updated : n)));
        toast.success("Note saved");
      } else {
        const created = await api<Note>("/api/notes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body }),
        });
        setNotes((prev) => [created, ...prev]);
        setSelectedId(created.id);
        toast.success("Note created");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [selectedId, title, body, saving]);

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
      }
      setDeleteTarget(null);
      toast.success("Note deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr]">
      <aside aria-label="Notes list" className="border-border overflow-y-auto border-r p-3">
        <p className="mb-2 truncate px-1 text-xs text-muted-foreground">{name}</p>
        <Button className="w-full" onClick={() => select(emptyNote)}>
          + New note
        </Button>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
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
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main aria-label="Note editor" className="flex h-full flex-col p-4">
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
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Ctrl/⌘+S to save</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={!selectedId}
              onClick={() => setDeleteTarget(notes.find((n) => n.id === selectedId) ?? null)}
            >
              Delete
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : selectedId ? "Save changes" : "Create note"}
            </Button>
          </div>
        </div>
      </main>

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
