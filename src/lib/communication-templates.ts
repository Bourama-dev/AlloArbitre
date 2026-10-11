/**
 * Messages de communication auprès des arbitres (lancement d'AlloArbitre,
 * relances). Textes avec marqueurs {{LIEN}}, {{PRENOM}}, {{LICENCE}} remplacés
 * au moment de l'affichage. Fichier sans dépendance serveur : importé par la
 * page et par le composant client.
 */
export type MessageTemplate = {
  id: string;
  title: string;
  /** Quand l'envoyer. */
  when: string;
  text: string;
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "annonce",
    title: "Annonce",
    when: "Avant la mise en ligne, avec le tableau des licences en pièce jointe.",
    text: `🏀 AlloArbitre arrive bientôt !

Bonjour à tous,

Je suis heureux de vous annoncer l'arrivée prochaine d'AlloArbitre, l'application de gestion des désignations arbitrales du CD45.

🎯 Ce que l'application vous apporte :
• consulter vos prochaines désignations, avec l'adresse des gymnases,
• indiquer vos disponibilités directement en ligne,
• retrouver votre suivi de saison (matchs arbitrés, dossier).

📋 Comment créer votre compte ?
Vous trouverez ci-joint le tableau des numéros de licence FFBB. Pour activer votre compte, il vous faudra votre numéro de licence et votre date de naissance. Vous choisirez ensuite votre mot de passe. L'opération ne se fait qu'une seule fois.

Je vous enverrai très bientôt le lien de l'application. En cas de difficulté, contactez-moi directement.

Merci à tous pour votre implication dans l'arbitrage !

AlloArbitre : une nouvelle étape pour faciliter notre organisation. 🏀`,
  },
  {
    id: "lancement",
    title: "Lancement",
    when: "Le jour de la mise en ligne.",
    text: `🏀 AlloArbitre est en ligne !

Bonjour à tous,

L'application est disponible : 👉 {{LIEN}}

Pour activer votre compte, en 3 étapes :
1️⃣ Ouvrez le lien, puis appuyez sur « Activer mon compte ».
2️⃣ Saisissez votre numéro de licence (voir le tableau envoyé) et votre date de naissance.
3️⃣ Choisissez un mot de passe (8 caractères minimum). C'est tout !

Ensuite, connectez-vous avec votre adresse e-mail (ou votre numéro de licence) et votre mot de passe.

📱 Astuce : sur téléphone, ajoutez le site à votre écran d'accueil pour l'ouvrir comme une application.

Vous y retrouverez vos prochaines désignations, vos disponibilités à saisir (pensez à répondre avant la date limite) et votre suivi de saison.

❗ Un souci à l'activation ? Vérifiez votre numéro de licence et votre date de naissance. Après 5 essais incorrects, l'activation est bloquée une heure : contactez-moi alors pour recevoir un lien personnel.`,
  },
  {
    id: "relance",
    title: "Relance générale",
    when: "Environ une semaine après le lancement, au groupe.",
    text: `🏀 AlloArbitre : pensez à activer votre compte !

Bonjour à tous,

Merci à celles et ceux qui ont déjà activé leur compte AlloArbitre ! 🙌

Pour les autres, c'est rapide (2 minutes) : 👉 {{LIEN}}

1️⃣ Appuyez sur « Activer mon compte »
2️⃣ Saisissez votre n° de licence (tableau envoyé précédemment) et votre date de naissance
3️⃣ Choisissez un mot de passe (8 caractères minimum)

✅ Pourquoi c'est important :
• vous voyez vos désignations et l'adresse des gymnases sur votre téléphone,
• vous indiquez vos disponibilités sans passer par moi : sans réponse avant la date limite, vous risquez de ne pas être désigné,
• vous suivez votre saison (matchs arbitrés, dossier).

❗ Un souci ? Après 5 essais incorrects, l'activation est bloquée une heure. Écrivez-moi et je vous envoie un lien personnel.

Merci à tous ! 🏀`,
  },
];

/** Relance individuelle (message privé), générée pour chaque arbitre sans compte. */
export const INDIVIDUAL_REMINDER = `Bonjour {{PRENOM}}, je vois que tu n'as pas encore activé ton compte AlloArbitre. Il te faut ton n° de licence {{LICENCE}} et ta date de naissance, ici : {{LIEN}} → « Activer mon compte ». Si ça bloque, dis-moi et je t'envoie un lien personnel. Merci ! 🏀`;

export function fillTemplate(text: string, vars: { LIEN?: string; PRENOM?: string; LICENCE?: string }): string {
  return text
    .replaceAll("{{LIEN}}", vars.LIEN?.trim() || "[LIEN]")
    .replaceAll("{{PRENOM}}", vars.PRENOM ?? "")
    .replaceAll("{{LICENCE}}", vars.LICENCE ?? "[N° de licence]");
}
