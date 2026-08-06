"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

import Loader from "@/components/loader";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginView({ initialSignIn }: { initialSignIn: boolean }) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [showSignIn, setShowSignIn] = useState(initialSignIn);

  useEffect(() => {
    let active = true;

    const showForm = () => {
      if (active) setCheckingSession(false);
    };
    const guard = setTimeout(showForm, 5000);

    authClient
      .getSession()
      .then(({ data }) => {
        showForm();
        if (data?.session) router.replace("/dashboard");
      })
      .catch((error) => {
        showForm();
        // [login-view] session check failed — log it, don't block the form
        console.error("[login-view] getSession failed", error);
      });
    return () => {
      active = false;
      clearTimeout(guard);
    };
  }, [router]);

  if (checkingSession) {
    return <Loader />;
  }

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
