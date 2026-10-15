import { BatLogo } from "@/components/BatLogo";
import { Landscape } from "@/components/Landscape";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Connexion — Batcav" };

// Le bouton de l'e-mail mène à /login?email=... : on ouvre directement la saisie du code
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const prefill = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.toLowerCase() : "";
  return (
    <div className="auth">
      <header style={{ padding: "26px 28px" }}>
        <span className="brand"><BatLogo color="#1B2840" /><span>batcav</span></span>
      </header>
      <main className="auth-main">
        <LoginForm initialEmail={prefill} />
      </main>
      <Landscape height={200} />
      <div className="auth-foot" />
    </div>
  );
}
