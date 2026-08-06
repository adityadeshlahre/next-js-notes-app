"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginView({ initialSignIn }: { initialSignIn: boolean }) {
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(initialSignIn);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data }) => {
        if (active && data?.session) router.replace("/dashboard");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
