# Batcav — plateforme élèves + espace coach

Next.js 15 + Supabase.

- **Élèves** : connexion par code reçu par e-mail, onboarding, tableau de bord (cagnotte collective, classement, objectifs, missions), agent latéral, « Mes chiffres », « Mes appels » (réservation).
- **Coach** (`/coach`, design séparé) : vue d'ensemble, **tableur de suivi des élèves** (modifiable, triable, export Excel), **disponibilités et appels réservés**, **ajout de résultats** pour le classement et la cagnotte, validation des paiements déclarés.

Pas de mot de passe : à chaque connexion, on tape son e-mail et on reçoit un **code à usage unique**. Quand tu ajoutes un élève, il reçoit tout de suite son premier code.

---

## 1. Créer la base Supabase (≈ 15 min)

1. Crée un compte sur https://supabase.com puis **New project** (région : Europe).
2. **SQL Editor → New query** : colle tout `supabase/schema.sql` → **Run**.
   (Si tu avais déjà installé l'ancienne version, relance simplement tout le fichier : il ajoute ce qui manque.)
3. **Authentication → Sign In / Providers → Email** :
   - désactive **« Allow new users to sign up »** (seules les personnes que tu ajoutes peuvent entrer) ;
   - garde **Email** activé.
4. **Authentication → Emails → Magic Link** : remplace le contenu par un e-mail qui affiche le **code** :
   ```html
   <h2>Ton code Batcav</h2>
   <p>Voici ton code pour entrer dans la Batcav :</p>
   <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
   <p>Il expire dans 1 heure. Si tu n'as rien demandé, ignore cet e-mail.</p>
   ```
   Sujet conseillé : `Ton code d'accès Batcav`.
5. **Important — envoi d'e-mails** : le service d'e-mail gratuit de Supabase est limité à quelques e-mails par heure.
   Dès que tu as plusieurs élèves, branche un vrai fournisseur (gratuit au début) :
   **Project Settings → Authentication → SMTP Settings** avec par exemple Resend (https://resend.com) ou Brevo.

## 2. Ton compte coach

1. **Authentication → Users → Add user → Create new user** : ton e-mail (coche *Auto confirm user*). Pas besoin de mot de passe.
2. **SQL Editor** :
   ```sql
   update public.profiles set role = 'coach', onboarded = true, first_name = 'Ton prénom'
   where id = (select id from auth.users where email = 'TON_EMAIL');
   ```

## 3. Lancer en local

```bash
cp .env.example .env.local      # remplis les valeurs (Supabase → Project Settings → API)
npm install
npm run dev
```
Ouvre http://localhost:3000, tape ton e-mail, entre le code reçu → tu arrives dans **l'espace coach**.

## 4. Utilisation

**Ajouter un élève** : Coach → *Suivi élèves* → *Ajouter un élève* (prénom, e-mail, prix de l'accompagnement). Il reçoit son code par e-mail, se connecte, répond à l'onboarding.

**Tableur de suivi** : clique un titre de colonne pour trier. Les cellules *Étape, Prix coaching, Payé, Objectif, Notes* se modifient directement (sauvegarde automatique en quittant la cellule, la cellule clignote en vert). La colonne *Paiement* indique « Soldé » ou « Reste X € ». Bouton *Exporter* → fichier CSV qui s'ouvre dans Excel.

**Appels** : Coach → *Appels* → choisis un jour, une plage horaire et la durée → les créneaux sont créés (possibilité de répéter sur plusieurs semaines). Les élèves réservent depuis *Mes appels* (1 appel à venir max, annulation jusqu'à 2 h avant). Tu vois qui a réservé et son sujet.

**Résultats & cagnotte** : ajoute un résultat pour un élève → il compte tout de suite (validé) dans la cagnotte et le classement. Les paiements déclarés par les élèves arrivent « à valider ».

**Classement** : seuls les paiements validés comptent. Un élève qui n'a pas accepté d'être visible apparaît en « Membre anonyme ».

## Sécurité (gérée par la base, RLS)

- Un élève ne voit que ses propres données, ne peut pas valider ses paiements, ni devenir coach.
- Le tableur de suivi (prix, payé, notes) n'est visible que par toi.
- Un élève ne voit pas qui a réservé les autres créneaux.
- **Ne partage jamais `SUPABASE_SERVICE_ROLE_KEY`** (ni sur GitHub, ni à un élève). Elle sert uniquement à créer les comptes élèves et lire leurs e-mails.

## Agent IA

En **mode simple** (`lib/agent.ts`) : réponses basées sur les vraies données de l'élève. Pour brancher une vraie IA, remplace `agentReply()` par un appel à l'API choisie en lui passant `buildContext()`.

## Mettre en ligne

GitHub → https://vercel.com → *Import* → ajoute les variables de `.env.local` → *Deploy*. Mets ton domaine dans `NEXT_PUBLIC_SITE_URL` et dans Supabase → *Authentication → URL Configuration → Site URL*.

## Si tu avais la première version sur ton Bureau

Les dossiers `app/auth` et `app/(app)/admin` ne servent plus (ils redirigent juste vers la connexion / l'espace coach). Tu peux les supprimer.

## Structure

```
app/login                 connexion par code
app/onboarding            premier login élève
app/(app)/dashboard       tableau de bord élève
app/(app)/chiffres        déclarations + visibilité au classement
app/(app)/appels          réservation d'appels
app/coach                 espace coach (vue d'ensemble, eleves, appels, resultats)
app/api/agent             agent (mode simple)
components/, lib/         composants et logique
supabase/schema.sql       base de données + sécurité
```
