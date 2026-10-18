import { redirect } from "next/navigation";
import { homeFor } from "@/lib/nav";
import { requireCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await requireCurrentUser();
  redirect(homeFor(user.currentView));
}
