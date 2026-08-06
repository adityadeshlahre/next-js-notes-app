import { auth } from "@next-js-notes-app/auth";
import { Button } from "@next-js-notes-app/ui/components/button";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">Notes that stay yours</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Create, tag, search, and organize your notes — private to you.
      </p>
      <div className="mt-6 flex gap-3">
        <Button render={<Link href="/login" />}>Create your first note</Button>
        <Button render={<Link href="/login?signin=1" />} variant="outline">
          Already a user? Sign in
        </Button>
      </div>
    </main>
  );
}
