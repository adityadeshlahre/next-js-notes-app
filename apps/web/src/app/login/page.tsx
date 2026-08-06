import { auth } from "@next-js-notes-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import LoginView from "./login-view";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  const { signup } = await searchParams;
  return <LoginView initialSignIn={signup !== "1"} />;
}
