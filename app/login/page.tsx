import { BatLogo } from "@/components/BatLogo";
import { Landscape } from "@/components/Landscape";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Connexion — Batcav" };

export default function LoginPage() {
  return (
    <div className="auth">
      <header style={{ padding: "26px 28px" }}>
        <span className="brand"><BatLogo color="#1B2840" /><span>batcav</span></span>
      </header>
      <main className="auth-main">
        <LoginForm />
      </main>
      <Landscape height={200} />
      <div className="auth-foot" />
    </div>
  );
}
