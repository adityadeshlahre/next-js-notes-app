// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import NotesDashboard from "@/app/dashboard/dashboard";
import LoginView from "@/app/login/login-view";
import type { Note } from "@/lib/notes-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ isPending: false }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
  },
}));

function mockFetch(notes: Note[], tags: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/")) {
        return Response.json({ user: null, session: null, error: null });
      }
      if (url.includes("/api/tags")) {
        return Response.json(tags.map((name) => ({ name })));
      }
      if (url.includes("/api/notes")) {
        return Response.json(notes);
      }
      return Response.json({ message: "Not found" }, { status: 404 });
    }),
  );
}

async function assertNoViolations(container: HTMLElement) {
  const result = await axe.run(container);
  expect(result.violations).toEqual([]);
}

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    title: "Buy milk",
    body: "And eggs",
    tags: ["work"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <NotesDashboard name="Test User" />
    </QueryClientProvider>,
  );
  return queryClient;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a11y — axe", () => {
  it("login view has no axe violations (sign-in and sign-up)", async () => {
    mockFetch([], []);
    const user = userEvent.setup();

    const { container } = render(<LoginView initialSignIn />);
    await screen.findByLabelText("Email");
    await assertNoViolations(container);

    await user.click(screen.getByRole("button", { name: /need an account/i }));
    await screen.findByLabelText(/name/i);
    await assertNoViolations(container);
  });

  it("dashboard empty state has no axe violations", async () => {
    mockFetch([], []);
    renderDashboard();
    await screen.findByText(/no notes yet/i);
    await assertNoViolations(document.body);
  });

  it("dashboard with notes + open editor has no axe violations", async () => {
    mockFetch([makeNote()], ["work", "personal"]);
    const user = userEvent.setup();
    renderDashboard();
    const noteButton = await screen.findByRole("button", { name: /buy milk/i });
    await user.click(noteButton);
    await screen.findByLabelText("Note title");
    await assertNoViolations(document.body);
  });

  it("tag combobox opens an accessible listbox", async () => {
    mockFetch([makeNote()], ["work", "travel"]);
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole("button", { name: /buy milk/i });

    const combobox = screen.getByRole("combobox", { name: /add a tag/i });
    await user.click(combobox);
    await user.type(combobox, "tr");

    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: /tag suggestions/i })).toBeDefined();
    });
    const option = screen.getByRole("option", { name: /travel/i });
    expect(option).toBeDefined();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect((combobox as HTMLInputElement).value).toBe("");
  });
});
