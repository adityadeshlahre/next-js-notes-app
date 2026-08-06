import LoginView from "./login-view";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string }>;
}) {
  const { signin } = await searchParams;
  return <LoginView initialSignIn={signin === "1"} />;
}
