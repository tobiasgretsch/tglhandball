import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { client } from "@/lib/sanity";
import Link from "next/link";

export default async function TrainerOverview() {
  const user = await currentUser();
  if (user?.publicMetadata?.role !== "trainer") redirect("/dashboard");

  const userId = user.id;

  const [playerCount, planCount] = await Promise.all([
    client
      .fetch<number>(
        `count(*[_type == "spielerProfil" && trainerClerkUserId == $id])`,
        { id: userId }
      )
      .catch(() => 0),
    client
      .fetch<number>(
        `count(*[_type == "trainingsplan" && trainerClerkUserId == $id])`,
        { id: userId }
      )
      .catch(() => 0),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
        Hallo, {user.firstName ?? "Trainer"}!
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
        Hier ist deine Übersicht.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <StatCard value={playerCount} label="Spieler" color="red" />
        <StatCard value={planCount} label="Trainingspläne" color="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <p
        className={`text-4xl font-black ${
          color === "red" ? "text-primary" : "text-accent"
        }`}
      >
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{label}</p>
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
      className="block bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary dark:hover:border-primary hover:shadow-md transition-all"
    >
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <span className="inline-block mt-3 text-xs font-semibold text-primary">
        Öffnen →
      </span>
    </Link>
  );
}
