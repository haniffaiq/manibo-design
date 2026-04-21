import { redirect } from "next/navigation";

import { getSession, resolveSessionLandingRoute } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  redirect(await resolveSessionLandingRoute(session));
}
