import { requireStudent } from "@/lib/session";
import { eur, startOfWeekISO, todayISO } from "@/lib/format";
import { ActivityForm, DeletePending, PaymentForm, SettingsForm } from "./Forms";

export const metadata = { title: "Mes chiffres — Batcav" };
export const dynamic = "force-dynamic";

const STATUS = { pending: "En attente", approved: "Validé", rejected: "Refusé" } as const;

export default async function ChiffresPage() {
  const { supabase, profile } = await requireStudent();
  const [{ data: payments }, { data: activity }] = await Promise.all([
    supabase.from("payments").select("id,amount,note,paid_on,status").eq("user_id", profile.id).order("paid_on", { ascending: false }).limit(50),
    supabase.from("activity").select("id,kind,qty,note,day").eq("user_id", profile.id).order("day", { ascending: false }).order("id", { ascending: false }).limit(50),
  ]);
  const p = payments || [];
  const a = activity || [];
  const approved = p.filter((x) => x.status === "approved").reduce((s, x) => s + x.amount, 0);
  const pending = p.filter((x) => x.status === "pending").reduce((s, x) => s + x.amount, 0);
  const week = startOfWeekISO();
  const weekMsgs = a.filter((x) => x.kind === "messages" && x.day >= week).reduce((s, x) => s + x.qty, 0);
  const clients = a.filter((x) => x.kind === "client").reduce((s, x) => s + x.qty, 0);
  const totalMsgs = a.filter((x) => x.kind === "messages").reduce((s, x) => s + x.qty, 0);

  return (
    <main className="page">
      <div className="page-inner">
        <h1>Mes chiffres.<br /><span>Ils ne mentent pas.</span></h1>

        <section className="grid-stats" aria-label="Totaux">
          <div className="stat"><b>{eur(approved)}</b><span>validés sur {eur(profile.goal_amount)}</span></div>
          <div className="stat"><b>{eur(pending)}</b><span>en attente de validation</span></div>
          <div className="stat"><b>{weekMsgs}</b><span>messages cette semaine</span></div>
          <div className="stat"><b>{clients}</b><span>clients signés{clients ? ` · ${Math.round(totalMsgs / clients)} messages par client` : ""}</span></div>
        </section>

        <div className="row-wrap">
          <PaymentForm today={todayISO()} />
          <ActivityForm />
        </div>

        <section className="panel" aria-label="Mes paiements">
          <h2>Mes paiements</h2>
          {p.length === 0 ? <p className="small" style={{ margin: 0, color: "var(--muted)" }}>Aucun paiement déclaré pour l'instant.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">DATE</th><th scope="col">NOTE</th><th scope="col">MONTANT</th><th scope="col">STATUT</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {p.map((x) => (
                    <tr key={x.id}>
                      <td className="mono">{new Date(x.paid_on + "T12:00:00").toLocaleDateString("fr-FR")}</td>
                      <td>{x.note || "—"}</td>
                      <td className="mono">{eur(x.amount)}</td>
                      <td><span className={`tag ${x.status}`}>{STATUS[x.status as keyof typeof STATUS]}</span></td>
                      <td>{x.status === "pending" && <DeletePending id={x.id} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel" aria-label="Mon activité">
          <h2>Mon activité</h2>
          {a.length === 0 ? <p className="small" style={{ margin: 0, color: "var(--muted)" }}>Note tes messages envoyés chaque jour : c'est ce qui fait monter ta série.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">JOUR</th><th scope="col">TYPE</th><th scope="col">NOTE</th><th scope="col">NOMBRE</th></tr></thead>
                <tbody>
                  {a.map((x) => (
                    <tr key={x.id}>
                      <td className="mono">{new Date(x.day + "T12:00:00").toLocaleDateString("fr-FR")}</td>
                      <td>{x.kind === "client" ? "Client signé" : "Prospection"}</td>
                      <td>{x.note || "—"}</td>
                      <td className="mono">{x.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <SettingsForm pseudo={profile.pseudo || ""} visible={profile.show_in_leaderboard} />
      </div>
    </main>
  );
}
