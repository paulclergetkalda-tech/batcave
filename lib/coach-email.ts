// Adresse(s) e-mail qui sont toujours coach. Modifiable via COACH_EMAILS dans .env.local
// (plusieurs adresses séparées par des virgules).
export const COACH_EMAILS = (process.env.COACH_EMAILS || "batcav.ecosysteme@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isCoachEmail = (email?: string | null) => !!email && COACH_EMAILS.includes(email.toLowerCase());
