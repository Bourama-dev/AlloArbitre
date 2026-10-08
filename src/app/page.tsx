import { redirect } from "next/navigation";
import { getPendingAccount } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Compte créé via /signup mais pas encore validé : page d'attente, jamais les écrans du staff.
  if (await getPendingAccount()) redirect("/en-attente");
  redirect("/matchs");
}
