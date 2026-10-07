import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { BatLogo } from "@/components/BatLogo";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Bienvenue — Batcav" };

export default async function OnboardingPage() {
  const { profile } = await requireProfile({ allowNotOnboarded: true });
  if (profile.onboarded) redirect("/dashboard");
  return (
    <div className="auth">
      <header style={{ padding: "26px 28px" }}>
        <span className="brand"><BatLogo color="#1B2840" /><span>batcav</span></span>
      </header>
      <main className="auth-main" style={{ paddingBottom: 80, alignItems: "flex-start" }}>
        <OnboardingForm defaultFirstName={profile.first_name || ""} />
      </main>
    </div>
  );
}
