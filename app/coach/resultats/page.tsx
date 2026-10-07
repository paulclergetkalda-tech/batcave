import { requireCoach } from "@/lib/session";
import { eur, todayISO } from "@/lib/format";
import { deletePayment, reviewPayment } from "../actions";
import { AddResultForm } from "../Forms";

export const metadata = { title: "Résultats & cagnotte — Coach Batcav" };
export const dynamic = "force-dynamic";

const STATUS = { pending: ["En attente", "warn"], approved: ["Validé", "ok"], rejected: ["Refusé", "bad"] } as const;

export default async function Resultats() {
  const { supabase } = await requireCoach();
  const [{ data: payments }, { data: profiles }, { data: totals }] = await Promise.all([
    supabase.from("payments").select("id,user_id,amount,note,paid_on,status").order("paid_on", { ascending: false }).order("id", { ascending: false }).limit(300),
    supabase.from("profiles").select("id,first_name,role").order("first_name"),
    supabase.rpc("batcav_totals").single<{ total: number; week_total: number }>(),
  ]);
  const students = (profiles || []).filter((p) => p.role === "student").map((p) => ({ id: p.id, name: p.first_name || "Sans prénom" }));
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name || "Élève";
  const pending = (payments || []).filter((p) => p.status === "pending");

  return (
    <main className="c-main">
      <h1 className="c-h1">Résultats & cagnotte. <span style={{ color: "var(--c-gold)" }}>{eur(Number(totals?.total || 0))}</span></h1>
      <AddResultForm students={students} today={todayISO()} />

      {pending.length > 0 && (
        <section className="c-box" aria-label="À valider">
          <h2>À valider <span className="c-count">{pending.length}</span></h2>
          <ul className="c-list">
            {pending.map((p) => (
              <li key={p.id}>
                <div><b>{nameOf(p.user_id)}</b> · <span className="mono">{eur(p.amount)}</span><div className="c-sub">{p.note || "Sans note"}</div></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <form action={reviewPayment.bind(null, p.id, "approved")}><button className="c-btn gold">Valider</button></form>
                  <form action={reviewPayment.bind(null, p.id, "rejected")}><button className="c-btn danger">Refuser</button></form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="c-box" aria-label="Historique">
        <h2>Historique des résultats</h2>
        {!payments?.length ? <p className="c-empty">Aucun résultat pour l&apos;instant.</p> : (
          <div className="sheet-wrap" style={{ maxHeight: "none" }}>
            <table className="sheet" style={{ minWidth: 720 }}>
              <thead><tr><th><span style={{ display: "block", padding: 10 }}>Date</span></th><th><span style={{ display: "block", padding: 10 }}>Élève</span></th><th><span style={{ display: "block", padding: 10 }}>Note</span></th><th><span style={{ display: "block", padding: 10 }}>Montant</span></th><th><span style={{ display: "block", padding: 10 }}>Statut</span></th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {payments.map((p) => {
                  const [label, cls] = STATUS[p.status as keyof typeof STATUS];
                  return (
                    <tr key={p.id}>
                      <td><div className="cell mono">{new Date(p.paid_on + "T12:00:00").toLocaleDateString("fr-FR")}</div></td>
                      <td><div className="cell"><b>{nameOf(p.user_id)}</b></div></td>
                      <td><div className="cell c-sub">{p.note || "—"}</div></td>
                      <td className="num"><div className="cell">{eur(p.amount)}</div></td>
                      <td><div className="cell"><span className={`c-pill ${cls}`}>{label}</span></div></td>
                      <td><div className="cell"><form action={deletePayment.bind(null, p.id)}><button className="c-btn danger">Supprimer</button></form></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
