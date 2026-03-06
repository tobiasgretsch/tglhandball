import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { client } from "@/lib/sanity";
import Link from "next/link";

export default async function TrainerOverview() {
  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") redirect("/dashboard");

  const userId = user.id;

  const [playerCount, planCount, teamCount] = await Promise.all([
    client
      .fetch<number>(
        `count(*[_type == "spielerProfil" && (trainerClerkUserId == $id || team->trainerClerkUserId == $id)])`,
        { id: userId }
      )
      .catch(() => 0),
    client
      .fetch<number>(
        `count(*[_type == "trainingsplan" && trainerClerkUserId == $id])`,
        { id: userId }
      )
      .catch(() => 0),
    client
      .fetch<number>(
        `count(*[_type == "team" && trainerClerkUserId == $id])`,
        { id: userId }
      )
      .catch(() => 0),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-black text-text mb-1">
        Hallo, {user.firstName ?? "Trainer"}!
      </h1>
      <p className="text-muted mb-6 text-sm">Hier ist deine Übersicht.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
        <StatCard value={teamCount} label="Mannschaften" color="red" />
        <StatCard value={playerCount} label="Spieler" color="blue" />
        <StatCard value={planCount} label="Trainingspläne" color="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <QuickLink
          href="/dashboard/trainer/spieler"
          title="Spieler verwalten"
          description="Spieler hinzufügen, bearbeiten und Mannschaften zuweisen."
        />
        <QuickLink
          href="/dashboard/trainer/trainingsplan"
          title="Trainingspläne"
          description="Neue Pläne erstellen und Spielern oder Mannschaften zuweisen."
        />
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "red" | "blue";
}) {
  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
      <p
        className={`text-3xl md:text-4xl font-black ${
          color === "red" ? "text-primary" : "text-accent"
        }`}
      >
        {value}
      </p>
      <p className="text-muted text-sm mt-1">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm hover:border-primary hover:shadow-md transition-all"
    >
      <h3 className="font-bold text-text mb-1">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
      <span className="inline-block mt-3 text-xs font-semibold text-primary">
        Öffnen →
      </span>
    </Link>
  );
}
