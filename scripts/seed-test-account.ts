const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
const email = process.env.SEED_EMAIL ?? "demo@notesapp.dev";
const password = process.env.SEED_PASSWORD ?? "DemoPass123!";

async function main() {
  const signIn = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (signIn.ok) {
    console.log(`Test account already exists: ${email}`);
    return;
  }

  const res = await fetch(`${base}/api/auth/sign-up`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, name: "Demo User" }),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Sign-up failed: ${res.status} ${await res.text()}`);
  }
  console.log(`Test account ready: ${email} / ${password}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
