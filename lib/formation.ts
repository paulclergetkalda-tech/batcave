// ============================================================
// FORMATION BATCAV — le programme
// C'est ici que tu modifies les modules, les leçons, les vidéos,
// les quiz et les résumés. Rien d'autre à toucher.
//
// - video : lien de la vidéo (YouTube non répertoriée, Vimeo, ou lien .mp4).
//           Laisse "" tant que la vidéo n'est pas tournée.
// - after : "quiz" ou "resume" (ce qui s'affiche sous la vidéo).
// - Les quiz et résumés ci-dessous sont des BROUILLONS à réécrire
//   une fois les vidéos tournées.
// ============================================================

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number; // index de la bonne réponse (0 = première)
  why?: string;   // explication affichée après la réponse
};

export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  video: string;
  after: "quiz" | "resume";
  resume?: string[];
  quiz?: QuizQuestion[];
};

export type Module = {
  id: string;
  label: string;   // "Module 1"
  title: string;
  pitch: string;
  lessons: Lesson[];
};

export const FORMATION: Module[] = [
  {
    id: "bienvenue",
    label: "Introduction",
    title: "Bienvenue",
    pitch: "Comment marche la Batcav et ce que tu vas vraiment faire.",
    lessons: [
      {
        slug: "bienvenue",
        title: "Bienvenue dans la Batcav",
        minutes: 2,
        video: "",
        after: "resume",
        resume: [
          "Ton objectif : tes premiers 1 500 € avec la création de sites web.",
          "Chaque leçon = une vidéo de 2-3 min, puis un quiz ou un résumé.",
          "Note tes chiffres chaque jour dans « Mes chiffres » : c'est comme ça qu'on suit ta progression.",
          "Bloqué ? Ouvre l'agent ou réserve un appel avec moi.",
        ],
      },
      {
        slug: "creation-site-concretement",
        title: "La création de site web, concrètement",
        minutes: 3,
        video: "",
        after: "quiz",
        quiz: [
          {
            q: "Qui sont tes premiers clients idéaux ?",
            options: ["Des grandes entreprises", "Des commerces près de chez toi sans site (ou avec un vieux site)", "D'autres créateurs de sites"],
            answer: 1,
            why: "Les commerces locaux ont un vrai besoin et tu peux aller les voir en personne.",
          },
          {
            q: "Qu'est-ce que tu vends vraiment à un commerçant ?",
            options: ["Du code", "Plus de clients et une image plus pro", "Un abonnement à un logiciel"],
            answer: 1,
            why: "Le commerçant n'achète pas un site, il achète ce que le site lui rapporte.",
          },
        ],
      },
    ],
  },
  {
    id: "creation",
    label: "Module 1",
    title: "La création de site web",
    pitch: "De zéro à un site en ligne, avec Claude.",
    lessons: [
      {
        slug: "claude-comment-ca-marche",
        title: "Claude, comment ça fonctionne",
        minutes: 3,
        video: "",
        after: "quiz",
        quiz: [
          {
            q: "Pour avoir un bon résultat avec une IA, le plus important c'est…",
            options: ["Écrire le moins possible", "Expliquer clairement ce que tu veux, avec des exemples", "Répéter la même demande"],
            answer: 1,
          },
        ],
      },
      {
        slug: "programmer-son-claude",
        title: "Comment programmer son Claude",
        minutes: 3,
        video: "",
        after: "resume",
        resume: ["[Résumé à écrire après la vidéo]", "Point clé 2", "Point clé 3"],
      },
      {
        slug: "les-autres-sites",
        title: "Les autres sites dont tu vas avoir besoin",
        minutes: 2,
        video: "",
        after: "resume",
        resume: ["[Liste des outils présentés dans la vidéo, avec à quoi sert chacun]"],
      },
      {
        slug: "premier-site-claude-design",
        title: "Créer son premier site sur Claude Design",
        minutes: 3,
        video: "",
        after: "quiz",
        quiz: [
          {
            q: "[Question sur la vidéo]",
            options: ["Réponse A", "Réponse B", "Réponse C"],
            answer: 0,
          },
        ],
      },
      {
        slug: "finir-sur-claude-code",
        title: "Le finir sur Claude Code",
        minutes: 3,
        video: "",
        after: "resume",
        resume: ["[Résumé à écrire après la vidéo]"],
      },
      {
        slug: "publier-son-site",
        title: "Publier son site",
        minutes: 3,
        video: "",
        after: "quiz",
        quiz: [
          {
            q: "Une fois ton site publié, tu vérifies quoi en premier ?",
            options: ["Qu'il s'affiche bien sur téléphone", "Le nombre de couleurs", "Rien, c'est fini"],
            answer: 0,
            why: "La plupart des clients de ton client vont le voir sur leur téléphone.",
          },
        ],
      },
    ],
  },
  {
    id: "vente",
    label: "Module 2",
    title: "Vendre ton site",
    pitch: "Trouver le client, le convaincre, encaisser.",
    lessons: [
      {
        slug: "aller-voir-le-restaurant",
        title: "Aller voir le restaurant",
        minutes: 3,
        video: "",
        after: "resume",
        resume: ["[Résumé à écrire après la vidéo]"],
      },
      {
        slug: "technique-de-vente-1",
        title: "Technique de vente 1",
        minutes: 3,
        video: "",
        after: "quiz",
        quiz: [{ q: "[Question sur la vidéo]", options: ["Réponse A", "Réponse B", "Réponse C"], answer: 0 }],
      },
      {
        slug: "technique-de-vente-2",
        title: "Technique de vente 2",
        minutes: 3,
        video: "",
        after: "quiz",
        quiz: [{ q: "[Question sur la vidéo]", options: ["Réponse A", "Réponse B", "Réponse C"], answer: 0 }],
      },
      {
        slug: "la-vente-nom-de-domaine",
        title: "La vente + le nom de domaine",
        minutes: 3,
        video: "",
        after: "resume",
        resume: ["[Résumé à écrire après la vidéo]"],
      },
    ],
  },
];

// ---------- Aides ----------
export const ALL_LESSONS = FORMATION.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title, moduleLabel: m.label })));
export const TOTAL_LESSONS = ALL_LESSONS.length;

export function findLesson(slug: string) {
  const i = ALL_LESSONS.findIndex((l) => l.slug === slug);
  if (i < 0) return null;
  return { lesson: ALL_LESSONS[i], index: i, prev: ALL_LESSONS[i - 1] || null, next: ALL_LESSONS[i + 1] || null };
}

export function nextLesson(done: Set<string>) {
  return ALL_LESSONS.find((l) => !done.has(l.slug)) || null;
}
