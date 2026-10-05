const FBI_BASE_URL = "https://extranet.ffbb.com/fbi";

/**
 * Présence du champ mot de passe = page de connexion = on n'est pas (ou plus)
 * connecté. Pas le champ `identifiant` : il existe aussi, caché, dans le
 * formulaire d'en-tête `identificationEntete` de toutes les pages connectées.
 */
const LOGIN_FORM_MARKER = "identificationForm.identificationBean.mdp";

// FBI coupe par moments une connexion au milieu d'un envoi groupé ("fetch
// failed", aucune réponse reçue) alors que la requête suivante passe : un
// seul raté faisait échouer tout un match. On retente les erreurs réseau
// (jamais une réponse HTTP reçue, même en erreur). Sans risque pour
// l'enregistrement d'une désignation : il renvoie l'état complet de la fiche.
// Une page FBI simplement lente (15-25 s aux heures chargées) n'est PAS
// retentée : l'abandonner puis la relancer ne faisait que doubler l'attente.
const NETWORK_RETRIES = 3;
// 90 s : la recherche des désignations sur 14 jours dépasse parfois 45 s
// quand FBI est chargé ; les routes FBI disposent de 300 s au total.
const REQUEST_TIMEOUT_MS = 90_000;

// Espacement minimal entre deux requêtes vers FBI (par instance) : FBI
// coupe puis refuse les connexions d'une adresse qui l'interroge en rafale
// (« terminated », puis UND_ERR_CONNECT_TIMEOUT pendant un moment).
const MIN_INTERVAL_MS = 350;
let nextRequestAt = 0;

// Quand FBI ne laisse même plus établir la connexion (UND_ERR_CONNECT_TIMEOUT),
// retenter n'aide pas et prolonge le blocage : on arrête aussitôt et on
// n'envoie plus aucune requête pendant ce délai (par instance de fonction).
const CONNECT_COOLDOWN_MS = 2 * 60_000;
let blockedUntil = 0;

function cooldownError(): Error {
  const minutes = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 60_000));
  return Object.assign(
    new Error(`fetch failed [connexion refusée par FBI, nouvelle tentative possible dans ${minutes} min, 0 essai(s)]`),
    { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } }
  );
}

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextRequestAt - now);
  nextRequestAt = Math.max(now, nextRequestAt) + MIN_INTERVAL_MS;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

type BodyMode = "text" | "buffer" | "none";
type FetchedResponse = { res: Response; text: string; buffer?: ArrayBuffer };

/**
 * GET/POST vers FBI avec reprise sur coupure réseau. La LECTURE du corps est
 * dans la boucle de reprise : FBI coupe parfois la connexion en plein envoi
 * d'une grosse page (« terminated »), après que les en-têtes sont arrivés - une
 * lecture faite hors de la boucle faisait échouer tout l'import sans nouvel
 * essai.
 */
async function fetchWithRetry(url: string, init: RequestInit, body: BodyMode = "text"): Promise<FetchedResponse> {
  if (Date.now() < blockedUntil) throw cooldownError();
  for (let attempt = 0; ; attempt++) {
    await throttle();
    try {
      const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
      const res = await fetch(url, { ...init, signal });
      if (body === "buffer") return { res, text: "", buffer: await res.arrayBuffer() };
      if (body === "text") return { res, text: await res.text() };
      return { res, text: "" };
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      const connectRefused =
        (error as { cause?: { code?: string } } | null)?.cause?.code === "UND_ERR_CONNECT_TIMEOUT";
      if (connectRefused) blockedUntil = Date.now() + CONNECT_COOLDOWN_MS;
      if (timedOut || connectRefused || attempt >= NETWORK_RETRIES - 1) {
        // Message enrichi : page FBI concernée + code réseau (ECONNRESET,
        // UND_ERR_CONNECT_TIMEOUT...), sans les paramètres de l'URL. Commence
        // toujours par le message d'origine (« fetch failed », « terminated »...).
        const e = error as Error & { cause?: { code?: string; message?: string } };
        const page = new URL(url).pathname.split("/").pop();
        const code = e.cause?.code ?? e.cause?.message;
        const wrapped = new Error(`${e.message} [${page}${code ? ` - ${code}` : ""}, ${attempt + 1} essai(s)]`, {
          cause: e.cause,
        });
        wrapped.name = e.name;
        throw wrapped;
      }
      // Pause croissante (3 s, puis 6 s) : relancer aussitôt une adresse que
      // FBI vient de couper prolonge le blocage.
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

/**
 * Client HTTP "à la main" pour FBI (FranceBasket Informations) : ce n'est pas
 * une API publique, juste le site de la fédération dont on rejoue les
 * formulaires. Pas de client HTTP réutilisable côté FFBB : on se logue et on
 * fait toutes nos requêtes dans la même exécution (une cookie jar en mémoire,
 * le temps d'un run de sync).
 *
 * Debug : si `onDump` est fourni, chaque réponse brute lui est transmise
 * (cf. /api/fbi-sync?debug=1 qui les stocke dans la table FbiDebugDump) pour
 * pouvoir caler le login et le parseur sur le vrai HTML.
 */
export type FbiDump = { seq: number; path: string; status: number; location: string | null; body: string };

export class FbiClient {
  private cookies = new Map<string, string>();
  private dumpCounter = 0;

  constructor(private readonly onDump?: (dump: FbiDump) => Promise<void>) {}

  private cookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  private storeCookies(res: Response) {
    // `Response.headers.get("set-cookie")` ne renvoie qu'un seul header côté
    // fetch standard ; getSetCookie() (Node 18.14+/undici) renvoie la liste
    // complète, nécessaire car FBI pose plusieurs cookies (JSESSIONID, etc.)
    const headers = res.headers as Headers & { getSetCookie?: () => string[] };
    const raw = headers.getSetCookie ? headers.getSetCookie() : [];
    for (const cookieStr of raw) {
      const [pair] = cookieStr.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  private async dump(path: string, res: Response, body: string) {
    if (!this.onDump) return;
    this.dumpCounter += 1;
    await this.onDump({ seq: this.dumpCounter, path, status: res.status, location: res.headers.get("location"), body });
  }

  /**
   * Requête brute, redirections suivies à la main (pour garder les cookies
   * posés à chaque saut, ce que `redirect: "follow"` ne permet pas).
   */
  private async request(
    path: string,
    init: RequestInit = {},
    binary = false
  ): Promise<{ res: Response; body: string; buffer?: ArrayBuffer; finalPath: string }> {
    let url = `${FBI_BASE_URL}/${path}`;
    let currentInit = init;

    for (let hop = 0; hop < 5; hop++) {
      const { res, text, buffer } = await fetchWithRetry(
        url,
        {
          ...currentInit,
          redirect: "manual",
          headers: {
            ...(currentInit.headers ?? {}),
            Cookie: this.cookieHeader(),
          },
        },
        // Une redirection n'a pas de corps utile ; sinon texte ou binaire.
        binary ? "buffer" : "text"
      );
      this.storeCookies(res);

      const next = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && next) {
        await this.dump(url.slice(FBI_BASE_URL.length + 1), res, "");
        url = new URL(next, url).toString();
        currentInit = {}; // un 302 après un POST se rejoue en GET
        continue;
      }

      if (binary) {
        const buf = buffer ?? new ArrayBuffer(0);
        await this.dump(url.slice(FBI_BASE_URL.length + 1), res, `[binaire, ${buf.byteLength} octets]`);
        return { res, body: "", buffer: buf, finalPath: url };
      }

      await this.dump(url.slice(FBI_BASE_URL.length + 1), res, text);
      return { res, body: text, finalPath: url };
    }

    throw new Error(`FBI : trop de redirections en appelant ${path}`);
  }

  private assertLoggedIn(path: string, finalPath: string, body: string) {
    if (finalPath.includes("connexion.fbi") || body.includes(LOGIN_FORM_MARKER)) {
      throw new Error(`FBI : session non connectée en appelant ${path} (renvoyé vers la page de connexion)`);
    }
  }

  /**
   * Se logue sur FBI. Attention : FBI refuse la connexion par e-mail quand
   * plusieurs comptes partagent cette adresse ("Veuillez utiliser votre
   * login") — FBI_USERNAME doit alors être le login FBI, pas l'e-mail.
   */
  async login(identifiant: string, motDePasse: string): Promise<void> {
    // Un premier GET pour récupérer les cookies de session initiaux
    await this.request("connexion.fbi");

    const body = new URLSearchParams({
      "identificationForm.identificationBean.identifiant": identifiant,
      "identificationForm.identificationBean.mdp": motDePasse,
      // Valeur fixe ajoutée par la fonction JS connexion() de la page FBI
      // juste avant l'envoi du formulaire (vérifié sur le HTML réel).
      userName: "359770414357595",
    });

    const { res, body: html, finalPath } = await this.request("identification.fbi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(`FBI est momentanément indisponible (HTTP ${res.status}) - réessayez dans quelques minutes.`);
    }
    if (res.status >= 400) {
      throw new Error(`FBI login failed: HTTP ${res.status}`);
    }

    // Une page qui affiche encore le formulaire de connexion = identifiants
    // refusés (FBI répond en 200 avec un message d'erreur, pas en 401).
    if (finalPath.includes("connexion.fbi") || html.includes(LOGIN_FORM_MARKER)) {
      // FBI liste ses erreurs dans <ul class="errorMessage"><li><span>...</span></li></ul>
      // (dupliqué dans la page, d'où le Set) : on les remonte telles quelles.
      const messages = new Set(
        Array.from(html.matchAll(/<ul class="errorMessage">([\s\S]*?)<\/ul>/g))
          .flatMap((ul) => Array.from(ul[1].matchAll(/<span>([\s\S]*?)<\/span>/g), (s) => s[1].trim()))
          .filter(Boolean)
      );
      const detail = messages.size > 0 ? Array.from(messages).join(" / ") : "identifiants refusés ?";
      throw new Error(`FBI login failed: ${detail}`);
    }
  }

  async post(path: string, params: Record<string, string>): Promise<string> {
    const { body, finalPath } = await this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    this.assertLoggedIn(path, finalPath, body);
    return body;
  }

  /** Téléchargement binaire (ex. export Excel) ; une redirection vers la connexion = session perdue. */
  async getBuffer(path: string): Promise<ArrayBuffer> {
    const { finalPath, buffer } = await this.request(path, {}, true);
    if (finalPath.includes("connexion.fbi")) {
      throw new Error(`FBI : session non connectée en appelant ${path} (renvoyé vers la page de connexion)`);
    }
    return buffer ?? new ArrayBuffer(0);
  }

  async get(path: string): Promise<string> {
    const { body, finalPath } = await this.request(path);
    this.assertLoggedIn(path, finalPath, body);
    return body;
  }
}
