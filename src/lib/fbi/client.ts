const FBI_BASE_URL = "https://extranet.ffbb.com/fbi";

/**
 * Client HTTP "à la main" pour FBI (FranceBasket Informations) : ce n'est pas
 * une API publique, juste le site de la fédération dont on rejoue les
 * formulaires. Pas de client HTTP réutilisable côté FFBB : on se logue et on
 * fait toutes nos requêtes dans la même exécution (une cookie jar en mémoire,
 * le temps d'un run de sync).
 */
export class FbiClient {
  private cookies = new Map<string, string>();

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

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${FBI_BASE_URL}/${path}`, {
      ...init,
      redirect: "manual",
      headers: {
        ...(init.headers ?? {}),
        Cookie: this.cookieHeader(),
      },
    });
    this.storeCookies(res);
    return res;
  }

  /**
   * Se logue sur FBI. IMPORTANT : ce login n'a jamais été testé en conditions
   * réelles (réseau sortant bloqué depuis l'environnement où ce code a été
   * écrit) — les noms de champs viennent du HTML de connexion.fbi fourni par
   * l'utilisateur, mais le champ caché `userName` (valeur fixe
   * "359770414357595" dans le JS observé) ressemble à un identifiant de
   * device/fingerprint généré par un script tiers non fourni. Si le login
   * échoue en prod, c'est le premier suspect : il faudra observer sa vraie
   * valeur générée dynamiquement dans un vrai navigateur.
   */
  async login(identifiant: string, motDePasse: string): Promise<void> {
    // Un premier GET pour récupérer les cookies de session initiaux
    await this.request("connexion.fbi");

    const body = new URLSearchParams({
      "identificationForm.identificationBean.identifiant": identifiant,
      "identificationForm.identificationBean.mdp": motDePasse,
      userName: "",
    });

    const res = await this.request("identification.fbi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (res.status >= 400) {
      throw new Error(`FBI login failed: HTTP ${res.status}`);
    }

    // Vérification a minima : une page encore connectee affiche l'email de
    // l'utilisateur dans le bandeau. Sans accès pour tester, on reste
    // prudent et on vérifie juste l'absence d'un retour vers connexion.fbi.
    const location = res.headers.get("location");
    if (location && location.includes("connexion.fbi")) {
      throw new Error("FBI login failed: redirected back to connexion.fbi (identifiants refusés ?)");
    }
  }

  async post(path: string, params: Record<string, string>): Promise<string> {
    const res = await this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    return res.text();
  }

  async get(path: string): Promise<string> {
    const res = await this.request(path);
    return res.text();
  }
}
