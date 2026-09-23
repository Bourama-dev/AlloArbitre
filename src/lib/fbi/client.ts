const FBI_BASE_URL = "https://extranet.ffbb.com/fbi";

/** Présence du formulaire de connexion dans une page = on n'est pas (ou plus) connecté. */
const LOGIN_FORM_MARKER = "identificationForm.identificationBean.identifiant";

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
  private async request(path: string, init: RequestInit = {}): Promise<{ res: Response; body: string; finalPath: string }> {
    let url = `${FBI_BASE_URL}/${path}`;
    let currentInit = init;

    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(url, {
        ...currentInit,
        redirect: "manual",
        headers: {
          ...(currentInit.headers ?? {}),
          Cookie: this.cookieHeader(),
        },
      });
      this.storeCookies(res);

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        await this.dump(url.slice(FBI_BASE_URL.length + 1), res, "");
        url = new URL(location, url).toString();
        currentInit = {}; // un 302 après un POST se rejoue en GET
        continue;
      }

      const body = await res.text();
      await this.dump(url.slice(FBI_BASE_URL.length + 1), res, body);
      return { res, body, finalPath: url };
    }

    throw new Error(`FBI : trop de redirections en appelant ${path}`);
  }

  private assertLoggedIn(path: string, finalPath: string, body: string) {
    if (finalPath.includes("connexion.fbi") || body.includes(LOGIN_FORM_MARKER)) {
      throw new Error(`FBI : session non connectée en appelant ${path} (renvoyé vers la page de connexion)`);
    }
  }

  /**
   * Se logue sur FBI. Les noms de champs viennent du HTML de connexion.fbi
   * fourni par l'utilisateur. Le champ caché `userName` (valeur fixe
   * "359770414357595" dans le JS observé) ressemble à un identifiant de
   * device généré par un script tiers : s'il est requis, le login échouera
   * avec le message ci-dessous et le dump de 02-identification.fbi le montrera.
   */
  async login(identifiant: string, motDePasse: string): Promise<void> {
    // Un premier GET pour récupérer les cookies de session initiaux
    await this.request("connexion.fbi");

    const body = new URLSearchParams({
      "identificationForm.identificationBean.identifiant": identifiant,
      "identificationForm.identificationBean.mdp": motDePasse,
      userName: "",
    });

    const { res, body: html, finalPath } = await this.request("identification.fbi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

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

  async get(path: string): Promise<string> {
    const { body, finalPath } = await this.request(path);
    this.assertLoggedIn(path, finalPath, body);
    return body;
  }
}
