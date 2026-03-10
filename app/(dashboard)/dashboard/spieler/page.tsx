"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Calendar, Users, User, FileText, X, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";

interface Plan {
  _id: string;
  title: string;
  description: string;
  date: string;
  validFrom?: string;
  validUntil?: string;
  assignedToTeam?: { _id: string; name: string };
  pdfFile?: { asset?: { url: string; originalFilename?: string } };
}

interface ArchivePlan {
  _id: string;
  title: string;
  description: string;
  validFrom?: string;
  validUntil?: string;
}

/** Format a YYYY-MM-DD or ISO datetime string as DD.MM.YYYY (day only). */
function formatDay(d: string): string {
  const base = d.length === 10 ? `${d}T12:00:00Z` : d;
  return new Date(base).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Profile {
  _id: string;
  name: string;
  position: string;
  number: number | null;
  teams?: { _id: string; name: string; league?: string; slug?: { current: string } }[];
}

type ClaimState = "loading" | "linked" | "unlinked" | "not-found";

export default function SpielerDashboard() {
  const { user, isLoaded } = useUser();
  const [claimState, setClaimState] = useState<ClaimState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [archivePlans, setArchivePlans] = useState<ArchivePlan[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);

  async function loadProfile() {
    setClaimState("loading");
    const res = await fetch("/api/spieler/profile");
    const data = await res.json();
    if (data.profile) {
      setProfile(data.profile);
      setPlans(data.plans ?? []);
      setArchivePlans(data.archivePlans ?? []);
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
    return (
      <div className="p-4 md:p-8 flex items-center gap-2 text-muted text-sm">
        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Laden…
      </div>
    );
  }

  if (claimState === "unlinked" || claimState === "not-found") {
    return (
      <div className="p-4 md:p-8 max-w-lg">
        <h1 className="text-2xl font-black text-text dark:text-gray-100 mb-2">
          Hallo, {user?.firstName ?? "Spieler"}!
        </h1>
        <p className="text-muted dark:text-gray-400 mb-6 text-sm leading-relaxed">
          Dein Spielerprofil ist noch nicht verknüpft. Klicke auf den Button – wir suchen dein
          Profil automatisch anhand deiner E-Mail-Adresse.
        </p>
        <button
          onClick={claimProfile}
          disabled={claiming}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {claiming ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Suche Profil…
            </>
          ) : (
            "Profil verknüpfen"
          )}
        </button>
        {claimState === "not-found" && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 leading-relaxed">
              Kein Profil für diese E-Mail-Adresse gefunden. Wende dich an deinen Trainer, damit
              er dein Spielerprofil mit deiner E-Mail anlegt.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Profile header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 md:px-6 py-4 mb-6">
        <h1 className="text-xl md:text-2xl font-black text-text dark:text-gray-100">
          {profile?.name ?? user?.firstName}
        </h1>
        {profile?.position && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted dark:text-gray-400 mt-2">
            <User size={14} className="text-primary" />
            {profile.position}
            {profile.number ? ` · #${profile.number}` : ""}
          </span>
        )}
      </div>

      {/* My teams */}
      {profile?.teams && profile.teams.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted dark:text-gray-400 mb-3">
            Meine Mannschaften
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.teams.map((team) => (
              <Link
                key={team._id}
                href={team.slug?.current ? `/teams/${team.slug.current}` : "/teams"}
                className="inline-flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:border-primary hover:shadow-sm transition-all"
              >
                <span className="inline-flex items-center gap-1.5 font-bold text-sm text-text dark:text-gray-100">
                  <Users size={13} className="text-accent shrink-0" />
                  {team.name}
                </span>
                {team.league && (
                  <span className="text-xs text-muted dark:text-gray-400 mt-0.5 pl-5">{team.league}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active plans */}
      <h2 className="text-base font-bold text-text dark:text-gray-100 mb-3">
        Meine Trainingspläne
        {plans.length > 0 && (
          <span className="ml-2 text-xs font-medium text-muted dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {plans.length}
          </span>
        )}
      </h2>

      {plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
          <FileText size={32} className="text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-muted dark:text-gray-400 text-sm">
            Noch keine Pläne zugewiesen. Dein Trainer erstellt bald welche!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              onClick={() => {
                if (plan.pdfFile?.asset?.url) {
                  setPdfViewer({ url: plan.pdfFile.asset.url, title: plan.title });
                }
              }}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors ${
                plan.pdfFile?.asset?.url
                  ? "cursor-pointer hover:border-primary/40"
                  : ""
              }`}
            >
              <div className="px-4 py-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-text dark:text-gray-100">{plan.title}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted dark:text-gray-400 mt-1 leading-relaxed whitespace-pre-wrap">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {plan.date && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted dark:text-gray-400">
                        <Calendar size={11} />
                        {formatDay(plan.date)}
                      </span>
                    )}
                    {plan.assignedToTeam && (
                      <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        <Users size={10} />
                        {plan.assignedToTeam.name}
                      </span>
                    )}
                    {plan.validUntil && (
                      <span className="text-xs text-muted dark:text-gray-400">
                        Gültig bis {formatDay(plan.validUntil)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PDF indicator — card click opens viewer, this is visual only */}
              {plan.pdfFile?.asset?.url && (
                <div className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-primary/5 border-t border-primary/10">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <FileText size={15} />
                    {plan.pdfFile.asset.originalFilename ?? "Trainingsplan ansehen"}
                  </span>
                  <ChevronRight size={16} className="text-primary/60 shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archive section — old (expired) and upcoming plans */}
      {archivePlans.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setArchiveOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-semibold text-muted dark:text-gray-400 hover:text-text dark:hover:text-gray-100 transition-colors"
          >
            <span>
              Ältere &amp; geplante Pläne
              <span className="ml-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400 px-2 py-0.5 rounded-full">
                {archivePlans.length}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-200 ${archiveOpen ? "rotate-180" : ""}`}
            />
          </button>

          {archiveOpen && (
            <div className="mt-2 space-y-2">
              {archivePlans.map((plan) => {
                const today = new Date().toISOString().slice(0, 10);
                const isExpired = plan.validUntil && plan.validUntil < today;
                return (
                  <div
                    key={plan._id}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-text dark:text-gray-100">{plan.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isExpired
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isExpired ? "Abgelaufen" : "Geplant"}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted dark:text-gray-400 mt-1 leading-relaxed whitespace-pre-wrap">
                        {plan.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Modal — fullscreen */}
      {pdfViewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] shrink-0 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={16} className="text-primary shrink-0" />
              <span className="text-white text-sm font-semibold truncate">{pdfViewer.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={pdfViewer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="In neuem Tab öffnen"
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => setPdfViewer(null)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <iframe
            src={pdfViewer.url}
            className="flex-1 w-full border-0"
            title={pdfViewer.title}
          />
        </div>
      )}
    </div>
  );
}
