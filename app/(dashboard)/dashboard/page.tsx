import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRootPage() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;

  if (role === "trainer") redirect("/dashboard/trainer");
  if (role === "spieler") redirect("/dashboard/spieler");
  redirect("/onboarding");
}
