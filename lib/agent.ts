import "server-only";
import { eur } from "@/lib/format";
import type { DashboardData } from "@/lib/dashboard";
import type { Profile } from "@/lib/session";

// Agent « mode simple » : réponses basées sur les vraies données de l'élève.
// Pour brancher une vraie IA plus tard, remplace agentReply() par un appel à l'API choisie
// en lui passant le même contexte (voir buildContext()).

export function buildContext(profile: Profile, data: DashboardData) {
  const rows = data.leaderboard.month;
  const meIdx = rows.findIndex((r) => r.is_me);
  const me = rows[meIdx];
  const ahead = meIdx > 0 ? rows[meIdx - 1] : null;
  return {
    name: profile.first_name || "toi",
    goal: profile.goal_amount,
    approved: data.me.approved,
    pending: data.me.pending,
    weekMessages: data.me.weekMessages,
    weeklyGoal: profile.weekly_messages_goal,
    weekClients: data.me.weekClients,
    streak: data.me.streak,
    rank: me ? me.rank : null,
    gap: ahead && me ? ahead.amount - me.amount : null,
    aheadName: ahead?.name || null,
    missionsLeft: data.missions.filter((m) => !m.done).map((m) => m.label),
    blocker: profile.blocker,
    collective: data.totals.total,
  };
}

type Ctx = ReturnType<typeof buildContext>;

export function agentGreeting(c: Ctx) {
  const parts: string[] = [];
  if (c.rank && c.gap !== null && c.gap > 0 && c.aheadName) {
    parts.push(`Tu es ${c.rank}e ce mois. ${c.aheadName} est à ${eur(c.gap)} devant toi.`);
  } else if (c.rank === 1) {
    parts.push(`Tu es 1er ce mois. Ne lâche rien, ils arrivent.`);
  }
  if (c.missionsLeft.length) parts.push(`Il te reste ${c.missionsLeft.length} mission${c.missionsLeft.length > 1 ? "s" : ""} aujourd'hui. On commence par : « ${c.missionsLeft[0]} » ?`);
  else parts.push(`Toutes tes missions du jour sont faites. Respect.`);
  return parts.join("\n");
}

export function agentReply(raw: string, c: Ctx) {
  const t = raw.toLowerCase();
  const left = Math.max(0, c.goal - c.approved);

  if (/(classement|devant|passer|rang)/.test(t)) {
    if (c.gap && c.aheadName) return `Pour passer devant ${c.aheadName} : ${eur(c.gap)}. Un acompte sur un site suffit souvent. Qui as-tu en attente de réponse en ce moment ? Relance-le aujourd'hui.`;
    return `Tu es devant. La seule façon de le rester : continuer à prospecter tous les jours.`;
  }
  if (/(perdu|sais pas|quoi faire|commence)/.test(t)) {
    const plan = c.missionsLeft.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join("\n");
    return plan ? `On remet de l'ordre. Aujourd'hui, seulement ça :\n${plan}\nRien d'autre ne compte.` : `Tes missions sont faites. Note tes chiffres du jour, puis repose-toi.`;
  }
  if (/(motiv|flemme|fatigu|crevé|envie)/.test(t)) {
    return `Regarde le chiffre en haut : ${eur(c.collective)} générés par la Batcav. Des gens comme toi l'ont fait. Toi, il te manque ${eur(left)} pour ton objectif. Pas besoin de motivation : besoin de 20 messages envoyés.`;
  }
  if (/(prix|factur|combien|tarif|devis)/.test(t)) {
    return `Pour un site vitrine de commerce local, vise entre 400 et 800 €, avec un acompte de 30 % à la signature. En dessous, tu te brades. Parles-en à ton coach au prochain appel pour l'ajuster à ta cible.`;
  }
  if (/(prospect|message|client)/.test(t)) {
    const rest = Math.max(0, c.weeklyGoal - c.weekMessages);
    return `Cette semaine : ${c.weekMessages} messages sur ${c.weeklyGoal}. ${rest ? `Il en reste ${rest}.` : "Objectif atteint, bravo."} Règle n°1 d'un bon message : parle de SON business, pas de toi.`;
  }
  if (/(objectif|combien il me manque|reste)/.test(t)) {
    return `Validé : ${eur(c.approved)} sur ${eur(c.goal)}.${c.pending ? ` En attente de validation : ${eur(c.pending)}.` : ""} Il te manque ${eur(left)}.`;
  }
  return `Noté. Ta prochaine action : « ${c.missionsLeft[0] || "noter tes chiffres du jour"} ». Tu me dis quand c'est fait.`;
}
