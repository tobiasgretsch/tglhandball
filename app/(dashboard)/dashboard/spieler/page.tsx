"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Calendar, Users, User, FileText, X, ExternalLink, ChevronRight } from "lucide-react";

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
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);

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
        <h1 className="text-2xl font-black text-text mb-2">
          Hallo, {user?.firstName ?? "Spieler"}!
        </h1>
        <p className="text-muted mb-6 text-sm leading-relaxed">
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 md:px-6 py-4 mb-6">
        <h1 className="text-xl md:text-2xl font-black text-text">
          {profile?.name ?? user?.firstName}
        </h1>
        <div className="flex flex-wrap gap-3 mt-2">
          {profile?.team && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Users size={14} className="text-accent" />
              {profile.team.name}
            </span>
          )}
          {profile?.position && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <User size={14} className="text-primary" />
              {profile.position}
              {profile.number ? ` · #${profile.number}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-base font-bold text-text mb-3">
        Meine Trainingspläne
        {plans.length > 0 && (
          <span className="ml-2 text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">
            {plans.length}
          </span>
        )}
      </h2>

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <FileText size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-muted text-sm">
            Noch keine Pläne zugewiesen. Dein Trainer erstellt bald welche!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Plan info */}
              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-text">{plan.title}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted mt-1 leading-relaxed whitespace-pre-wrap">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {plan.date && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Calendar size={11} />
                          {new Date(plan.date).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {plan.assignedToTeam && (
                        <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          <Users size={10} />
                          {plan.assignedToTeam.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF action — full-width tap target on mobile */}
              {plan.pdfFile?.asset?.url && (
                <button
                  onClick={() =>
                    setPdfViewer({
                      url: plan.pdfFile!.asset!.url,
                      title: plan.title,
                    })
                  }
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-primary/5 border-t border-primary/10 hover:bg-primary/10 transition-colors text-left"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <FileText size={15} />
                    {plan.pdfFile.asset.originalFilename ?? "Trainingsplan ansehen"}
                  </span>
                  <ChevronRight size={16} className="text-primary/60 shrink-0" />
                </button>
              )}
            </div>
          ))}
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
