import { redirect } from "next/navigation";
import { homeFor } from "@/lib/nav";
import { requireOnboardedUser } from "@/lib/session";

export default async function Home() {
  const user = await requireOnboardedUser();
  redirect(homeFor(user.currentView));
}
