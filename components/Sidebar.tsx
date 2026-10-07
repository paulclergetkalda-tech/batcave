"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BatLogo } from "./BatLogo";
import { signOut } from "@/app/login/actions";

type Props = {
  name: string;
  subtitle: string;
  crediaUrl?: string;
};

const Icon = {
  dash: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  agent: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>,
  chart: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  cal: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>,
};

export function Sidebar({ name, subtitle, crediaUrl }: Props) {
  const path = usePathname();
  const cur = (p: string) => (path.startsWith(p) ? ("page" as const) : undefined);

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><BatLogo color="#1B2840" /><span>batcav</span></Link>
      <nav className="nav" aria-label="Espace élève">
        <Link href="/dashboard" className="nav-item" aria-current={cur("/dashboard")}>{Icon.dash}Tableau de bord</Link>
        <button type="button" className="nav-item" onClick={() => window.dispatchEvent(new Event("batcav:agent"))}>
          {Icon.agent}Agent<span className="nav-dot" />
        </button>
        <Link href="/chiffres" className="nav-item" aria-current={cur("/chiffres")}>{Icon.chart}Mes chiffres</Link>
        <Link href="/appels" className="nav-item" aria-current={cur("/appels")}>{Icon.cal}Mes appels</Link>
      </nav>
      <div className="side-bottom">
        <Link className="btn" href="/appels">Réserver un appel</Link>
        {crediaUrl && <a className="link-quiet" href={crediaUrl} target="_blank" rel="noreferrer">Ouvrir crédIA <span aria-hidden="true">↗</span></a>}
        <div className="side-user">
          <span className="avatar">{(name[0] || "?").toUpperCase()}</span>
          <div><b>{name}</b><small>{subtitle}</small></div>
        </div>
        <form action={signOut}><button className="link-quiet">Se déconnecter</button></form>
      </div>
    </aside>
  );
}
