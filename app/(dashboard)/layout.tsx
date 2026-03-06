import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = user.publicMetadata?.role as string | undefined;
  if (!role) redirect("/onboarding");

  const trainerNav = [
    { href: "/dashboard/trainer", label: "Übersicht" },
    { href: "/dashboard/trainer/spieler", label: "Spieler" },
    { href: "/dashboard/trainer/trainingsplan", label: "Trainingspläne" },
  ];

  const spielerNav = [
    { href: "/dashboard/spieler", label: "Meine Pläne" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role={role}
        navItems={role === "trainer" ? trainerNav : spielerNav}
        userName={[user.firstName, user.lastName].filter(Boolean).join(" ")}
        userEmail={user.emailAddresses[0]?.emailAddress ?? ""}
      />
      {/* pt-14 offsets the fixed mobile top bar; removed on md+ */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
