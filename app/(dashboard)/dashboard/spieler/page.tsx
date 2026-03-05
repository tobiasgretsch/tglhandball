"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Calendar, Users, User, FileText } from "lucide-react";

interface Plan {
  _id: string;
  title: string;
  description: string;
  date: string;
  assignedToTeam?: { _id: string; name: string };
  pdfFile?: { asset?: { url: string; originalFilename?: string } };
}

interface Profile {
  _id: string;
  name: string;
  position: string;
  number: number | null;
  team?: { _id: string; name: string };
}

type ClaimState = "loading" | "linked" | "unlinked" | "not-found";

export default function SpielerDashboard() {
  const { user, isLoaded } = useUser();
  const [claimState, setClaimState] = useState<ClaimState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [claiming, setClaiming] = useState(false);

  async function loadProfile() {
    setClaimState("loading");
    const res = await fetch("/api/spieler/profile");
    const data = await res.json();
    if (data.profile) {
      setProfile(data.profile);
      setPlans(data.plans ?? []);
      setClaimState("linked");
    } else {
      setClaimState("unlinked");
    }
  }

  useEffect(() => {
    if (isLoaded) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  async function claimProfile() {
    setClaiming(true);
    const res = await fetch("/api/claim-profile", { method: "POST" });
    const data = await res.json();
    if (data.profile) {
      await loadProfile();
    } else {
      setClaimState("not-found");
    }
    setClaiming(false);
  }

  if (claimState === "loading") {
    return <div className="p-8 text-gray-400">Laden…</div>;
  }

  if (claimState === "unlinked" || claimState === "not-found") {
    return (
      <div className="p-8 max-w-lg">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          Hallo, {user?.firstName ?? "Spieler"}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Dein Spielerprofil ist noch nicht verknüpft. Klicke auf den Button und wir
          suchen dein Profil automatisch anhand deiner E-Mail-Adresse.
        </p>
        <button
          onClick={claimProfile}
          disabled={claiming}
          className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {claiming ? "Suche Profil…" : "Profil verknüpfen"}
        </button>
        {claimState === "not-found" && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              Kein Profil für diese E-Mail-Adresse gefunden. Wende dich an deinen
              Trainer, damit er dein Spielerprofil mit deiner E-Mail anlegt.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
          Hallo, {profile?.name ?? user?.firstName}!
        </h1>
        <div className="flex flex-wrap gap-3 mt-3">
          {profile?.team && (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Users size={14} />
              {profile.team.name}
            </span>
          )}
          {profile?.position && (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <User size={14} />
              {profile.position}
              {profile.number ? ` · #${profile.number}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
        Meine Trainingspläne
      </h2>

      {plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
          <p className="text-gray-400 text-sm">
            Noch keine Pläne zugewiesen. Dein Trainer erstellt bald welche!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">{plan.title}</h3>
                  {plan.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {plan.assignedToTeam && (
                      <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent dark:text-blue-400 px-2 py-0.5 rounded-full">
                        <Users size={10} />
                        {plan.assignedToTeam.name}
                      </span>
                    )}
                    {plan.pdfFile?.asset?.url && (
                      <a
                        href={plan.pdfFile.asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <FileText size={11} />
                        {plan.pdfFile.asset.originalFilename ?? "PDF öffnen"}
                      </a>
                    )}
                  </div>
                </div>
                {plan.date && (
                  <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={12} />
                    {new Date(plan.date).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
