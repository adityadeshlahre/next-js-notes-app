export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Filters = { q: string; tags: string[]; dir: "asc" | "desc" };

export function notesUrl(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.dir !== "desc") params.set("dir", filters.dir);
  const qs = params.toString();
  return qs ? `/api/notes?${qs}` : "/api/notes";
}

export const emptyNote: Note = {
  id: "",
  title: "",
  body: "",
  tags: [],
  createdAt: "",
  updatedAt: "",
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}
