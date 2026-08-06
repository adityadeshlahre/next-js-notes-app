const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
const email = process.env.SEED_EMAIL ?? "demo@notesapp.dev";
const password = process.env.SEED_PASSWORD ?? "DemoPass123!";

// better-auth 1.6+ serves sign-up/email (a bare /sign-up 404s)
const SIGNUP_PATH = "/api/auth/sign-up/email";

async function main() {
  const signUp = await fetch(`${base}${SIGNUP_PATH}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, name: "Demo User" }),
  });

  if (signUp.ok) {
    console.log(`Test account seeded: ${email} / ${password}`);
    return;
  }

  let body: { code?: string } = {};
  try {
    body = (await signUp.json()) as { code?: string };
  } catch {
    /* non-JSON error body */
  }

  if (body.code === "user_already_exists") {
    console.log(`Test account already exists: ${email}`);
    return;
  }

  const signIn = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (signIn.ok) {
    console.log(`Test account already exists (verified via sign-in): ${email}`);
    return;
  }

  throw new Error(
    `Seeding failed: sign-up ${signUp.status} (${body.code ?? ""}), sign-in ${signIn.status}`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
