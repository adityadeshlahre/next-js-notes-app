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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import FilterSidebar from "@/components/filter-sidebar";
import NotesList from "@/components/notes-list";
import TagCombobox from "@/components/tag-combobox";
import { api, emptyNote, type Note } from "@/lib/notes-api";

function NotesDashboard({ name }: { name: string }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [tagsParam, setTagsParam] = useState("");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const hasFilters = q !== "" || tagsParam !== "" || dir !== "desc";

  const { data: allTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const list = await api<{ name: string }[]>("/api/tags");
      return list.map((t) => t.name);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setQ(qDraft), 300);
    return () => clearTimeout(timer);
  }, [qDraft]);

  const toggleTag = useCallback((tag: string) => {
    setTagsParam((prev) => {
      const list = prev.split(",").filter(Boolean);
      const next = list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag];
      return next.join(",");
    });
  }, []);

  const clearFilters = useCallback(() => {
    setQDraft("");
    setQ("");
    setTagsParam("");
    setDir("desc");
  }, []);

  const select = useCallback((note: Note) => {
    setSelectedId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setTags(note.tags);
    setTagInput("");
  }, []);

  const addTag = useCallback(
    (name?: string) => {
      const tag = (name ?? tagInput).trim().toLowerCase();
      if (!tag) return;
      if (!tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    },
    [tagInput, tags],
  );

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const backToList = useCallback(() => {
    setSelectedId(null);
    setTitle("");
    setBody("");
    setTags([]);
    setTagInput("");
  }, []);

  const requestDelete = useCallback(() => {
    setDeleteTarget(selectedId ? { ...emptyNote, id: selectedId, title } : null);
  }, [selectedId, title]);

  const save = useCallback(async () => {
    if (saving) return;
    if (!title.trim() && !body.trim()) {
      toast.error("Nothing to save — add a title or some text");
      return;
    }
    setSaving(true);
    try {
      if (selectedId) {
        await api<Note>(`/api/notes/${selectedId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body, tags }),
        });
        toast.success("Note saved");
      } else {
        const created = await api<Note>("/api/notes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body, tags }),
        });
        setSelectedId(created.id);
        toast.success("Note created");
      }
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [selectedId, title, body, tags, saving]);

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
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setTitle("");
        setBody("");
        setTags([]);
        setTagInput("");
      }
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Note deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[220px_280px_1fr]">
      <FilterSidebar
        name={name}
        allTags={allTags}
        qDraft={qDraft}
        tagsParam={tagsParam}
        dir={dir}
        hasFilters={hasFilters}
        onQDraftChange={setQDraft}
        onToggleTag={toggleTag}
        onDirChange={setDir}
        onClearFilters={clearFilters}
      />

      <NotesList
        q={q}
        tagsParam={tagsParam}
        dir={dir}
        hasFilters={hasFilters}
        selectedId={selectedId}
        onSelect={select}
        onClearFilters={clearFilters}
      />

      <NoteEditor
        selectedId={selectedId}
        title={title}
        body={body}
        tags={tags}
        tagInput={tagInput}
        allTags={allTags}
        saving={saving}
        onTitleChange={setTitle}
        onBodyChange={setBody}
        onTagInputChange={setTagInput}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onSave={save}
        onRequestDelete={requestDelete}
        onBackToList={backToList}
      />

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

type NoteEditorProps = {
  selectedId: string | null;
  title: string;
  body: string;
  tags: string[];
  tagInput: string;
  allTags: string[];
  saving: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onAddTag: (tag?: string) => void;
  onRemoveTag: (tag: string) => void;
  onSave: () => void;
  onRequestDelete: () => void;
  onBackToList: () => void;
};

const NoteEditor = memo(function NoteEditor({
  selectedId,
  title,
  body,
  tags,
  tagInput,
  allTags,
  saving,
  onTitleChange,
  onBodyChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onSave,
  onRequestDelete,
  onBackToList,
}: NoteEditorProps) {
  const tagSuggestions = allTags.filter((t) => !tags.includes(t));

  return (
    <section aria-label="Note editor" className="flex h-full flex-col p-4">
      {selectedId && (
        <button
          type="button"
          onClick={onBackToList}
          className="text-muted-foreground hover:text-foreground mb-2 self-start text-sm md:hidden"
        >
          ← Back to notes
        </button>
      )}
      <Input
        aria-label="Note title"
        placeholder="Note title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="mb-2 text-base font-medium"
      />
      <Textarea
        aria-label="Note body"
        placeholder="Write your note…"
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
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
                  onClick={() => onRemoveTag(tag)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <TagCombobox
            value={tagInput}
            onChange={onTagInputChange}
            options={tagSuggestions}
            onCommit={onAddTag}
            onCommitNew={() => onAddTag()}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => onAddTag()}>
            Add
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Ctrl/⌘+S to save</p>
        <div className="flex gap-2">
          <Button variant="destructive" disabled={!selectedId} onClick={onRequestDelete}>
            Delete
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : selectedId ? "Save changes" : "Create note"}
          </Button>
        </div>
      </div>
    </section>
  );
});

export default memo(NotesDashboard);
