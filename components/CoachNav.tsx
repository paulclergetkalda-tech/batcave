"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CoachNav({ pending, upcoming }: { pending: number; upcoming: number }) {
  const path = usePathname();
  const cur = (p: string, exact = false) => ((exact ? path === p : path.startsWith(p)) ? ("page" as const) : undefined);
  return (
    <nav className="c-nav" aria-label="Espace coach">
      <Link href="/coach" aria-current={cur("/coach", true)}>Vue d&apos;ensemble</Link>
      <Link href="/coach/eleves" aria-current={cur("/coach/eleves")}>Suivi élèves</Link>
      <Link href="/coach/appels" aria-current={cur("/coach/appels")}>Appels {upcoming > 0 && <span className="c-count">{upcoming}</span>}</Link>
      <Link href="/coach/resultats" aria-current={cur("/coach/resultats")}>Résultats & cagnotte {pending > 0 && <span className="c-count">{pending}</span>}</Link>
    </nav>
  );
}
