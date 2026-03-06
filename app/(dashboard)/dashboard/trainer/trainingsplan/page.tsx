"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Plus, Pencil, Trash2, X, Users, User, FileText, Upload, ExternalLink, Calendar } from "lucide-react";

interface Player {
  _id: string;
  name: string;
  teams?: { _id: string; name: string }[];
}

interface Team {
  _id: string;
  name: string;
}

interface PdfAsset {
  url: string;
  originalFilename?: string;
}

interface Plan {
  _id: string;
  title: string;
  description: string;
  date: string;
  validFrom?: string;
  validUntil?: string;
  assignedToTeam?: { _id: string; name: string };
  assignedToPlayers?: { _id: string; name: string }[];
  pdfFile?: { asset?: PdfAsset };
}

type AssignType = "team" | "players" | "none";

interface PlanForm {
  title: string;
  description: string;
  date: string;
  validFrom: string;
  validUntil: string;
  assignType: AssignType;
  teamId: string;
  playerIds: string[];
}

type PlanStatus = "active" | "expired" | "upcoming" | "no-limit";

function getPlanStatus(plan: Plan): PlanStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (!plan.validFrom && !plan.validUntil) return "no-limit";
  if (plan.validUntil && plan.validUntil < today) return "expired";
  if (plan.validFrom && plan.validFrom > today) return "upcoming";
  return "active";
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  active: "Aktiv",
  expired: "Abgelaufen",
  upcoming: "Geplant",
  "no-limit": "Unbegrenzt",
};

const STATUS_CLASS: Record<PlanStatus, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-400",
  upcoming: "bg-amber-100 text-amber-700",
  "no-limit": "bg-blue-50 text-blue-600",
};

/** Format a YYYY-MM-DD or ISO datetime string as DD.MM.YYYY (day only). */
function formatDay(d: string): string {
  // Append noon UTC to avoid date shifting in any timezone
  const base = d.length === 10 ? `${d}T12:00:00Z` : d;
  return new Date(base).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const EMPTY_FORM: PlanForm = {
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  validFrom: "",
  validUntil: "",
  assignType: "none",
  teamId: "",
  playerIds: [],
};

export default function TrainingsplanPage() {
  const { isLoaded } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Plan | null }>({
    open: false,
    editing: null,
  });
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState<PdfAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePdfDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingPdf(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setPdfFile(file);
  }

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/training-plans");
    setPlans(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    fetchPlans();
    fetch("/api/players").then((r) => r.json()).then(setPlayers);
    fetch("/api/teams").then((r) => r.json()).then(setTeams);
  }, [isLoaded, fetchPlans]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setPdfFile(null);
    setExistingPdf(null);
    setModal({ open: true, editing: null });
  }

  function openEdit(p: Plan) {
    setForm({
      title: p.title,
      description: p.description ?? "",
      date: p.date ? p.date.slice(0, 10) : EMPTY_FORM.date,
      validFrom: p.validFrom ?? "",
      validUntil: p.validUntil ?? "",
      assignType: p.assignedToTeam ? "team" : p.assignedToPlayers?.length ? "players" : "none",
      teamId: p.assignedToTeam?._id ?? "",
      playerIds: p.assignedToPlayers?.map((pl) => pl._id) ?? [],
    });
    setPdfFile(null);
    setExistingPdf(p.pdfFile?.asset ?? null);
    setModal({ open: true, editing: p });
  }

  function closeModal() {
    setModal({ open: false, editing: null });
    setPdfFile(null);
    setExistingPdf(null);
    setSaveError(null);
  }

  function togglePlayer(id: string) {
    setForm((prev) => ({
      ...prev,
      playerIds: prev.playerIds.includes(id)
        ? prev.playerIds.filter((pid) => pid !== id)
        : [...prev.playerIds, id],
    }));
  }

  async function handleSave() {
    if (!form.title) return;
    if (form.assignType === "team" && !form.teamId) {
      setSaveError("Bitte eine Mannschaft auswählen.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    let pdfAssetId: string | null = null;
    if (pdfFile) {
      const fd = new FormData();
      fd.append("file", pdfFile);
      const uploadRes = await fetch("/api/upload-pdf", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        pdfAssetId = data.assetId;
      }
    }

    const body = {
      title: form.title,
      description: form.description,
      date: new Date(form.date + "T12:00:00Z").toISOString(),
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      teamId: form.assignType === "team" ? form.teamId : null,
      playerIds: form.assignType === "players" ? form.playerIds : [],
      ...(pdfAssetId ? { pdfAssetId } : {}),
    };

    const url = modal.editing
      ? `/api/training-plans/${modal.editing._id}`
      : "/api/training-plans";
    const method = modal.editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error ?? "Speichern fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }

    closeModal();
    fetchPlans();
  }

  async function handleDelete(id: string) {
    if (!confirm("Plan wirklich löschen?")) return;
    await fetch(`/api/training-plans/${id}`, { method: "DELETE" });
    fetchPlans();
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-text">Trainingspläne</h1>
          <p className="text-sm text-muted mt-0.5">Erstelle und verwalte Trainingspläne.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Neuer Plan</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Laden…</p>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-muted text-sm">Noch keine Trainingspläne.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-primary font-semibold hover:underline"
          >
            Ersten Plan erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const status = getPlanStatus(plan);
            return (
              <div
                key={plan._id}
                onClick={() => openEdit(plan)}
                className={`bg-white rounded-xl border shadow-sm px-4 py-4 cursor-pointer transition-colors hover:border-primary/40 ${
                  status === "expired" ? "border-gray-100 opacity-70" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-text">{plan.title}</h3>
                      {/* Status badge */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>

                    {/* Date + validity range */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      {plan.date && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Calendar size={11} />
                          {formatDay(plan.date)}
                        </span>
                      )}
                      {(plan.validFrom || plan.validUntil) && (
                        <span className="text-xs text-muted">
                          Gültig:{" "}
                          {plan.validFrom ? formatDay(plan.validFrom) : "–"}{" "}
                          bis{" "}
                          {plan.validUntil ? formatDay(plan.validUntil) : "unbegrenzt"}
                        </span>
                      )}
                    </div>

                    {plan.description && (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{plan.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {plan.assignedToTeam && (
                        <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          <Users size={10} />
                          {plan.assignedToTeam.name}
                        </span>
                      )}
                      {plan.assignedToPlayers?.map((pl) => (
                        <span
                          key={pl._id}
                          className="inline-flex items-center gap-1 text-xs bg-gray-100 text-muted px-2 py-0.5 rounded-full"
                        >
                          <User size={10} />
                          {pl.name}
                        </span>
                      ))}
                      {plan.pdfFile?.asset?.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfViewer({ url: plan.pdfFile!.asset!.url, title: plan.title });
                          }}
                          className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                        >
                          <FileText size={10} />
                          {plan.pdfFile.asset.originalFilename ?? "PDF ansehen"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(plan); }}
                      className="p-2 rounded-lg text-muted hover:text-accent hover:bg-gray-100 transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(plan._id); }}
                      className="p-2 rounded-lg text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Viewer Modal */}
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

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-bold text-text">
                {modal.editing ? "Plan bearbeiten" : "Neuer Trainingsplan"}
              </h2>
              <button onClick={closeModal} className="text-muted hover:text-text p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Datum</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Validity window */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Gültigkeitszeitraum
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Gültig ab</label>
                    <input
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Gültig bis</label>
                    <input
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Leer lassen = Plan ist zeitlich unbegrenzt für Spieler sichtbar. Nach „Gültig bis"
                  wird der Plan automatisch ausgeblendet.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Beschreibung / Übungen
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* PDF upload */}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">PDF-Datei</label>

                {existingPdf?.url && !pdfFile && (
                  <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <FileText size={14} className="text-primary shrink-0" />
                    <button
                      onClick={() =>
                        setPdfViewer({
                          url: existingPdf.url,
                          title: existingPdf.originalFilename ?? "PDF",
                        })
                      }
                      className="text-sm text-primary hover:underline truncate text-left"
                    >
                      {existingPdf.originalFilename ?? "Aktuelles PDF ansehen"}
                    </button>
                    <span className="text-xs text-muted ml-auto shrink-0">vorhanden</span>
                  </div>
                )}

                {pdfFile && (
                  <div className="flex items-center gap-2 mb-2 p-2.5 bg-green-50 rounded-lg border border-green-200">
                    <FileText size={14} className="text-green-600 shrink-0" />
                    <span className="text-sm text-green-700 truncate">{pdfFile.name}</span>
                    <button
                      onClick={() => setPdfFile(null)}
                      className="ml-auto text-muted hover:text-text shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setPdfFile(f);
                    e.target.value = "";
                  }}
                />
                <div
                  onDrop={handlePdfDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                  onDragLeave={() => setIsDraggingPdf(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors select-none ${
                    isDraggingPdf
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-300 text-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  <Upload size={20} />
                  <span className="text-sm font-medium text-center">
                    {isDraggingPdf
                      ? "Datei hier loslassen"
                      : pdfFile
                        ? "Anderes PDF wählen oder hierher ziehen"
                        : existingPdf
                          ? "PDF ersetzen — klicken oder ziehen"
                          : "PDF hierher ziehen oder klicken zum Auswählen"}
                  </span>
                  {!isDraggingPdf && (
                    <span className="text-xs opacity-60">nur PDF-Dateien</span>
                  )}
                </div>
              </div>

              {/* Assignment type */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">Zuweisen an</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["none", "team", "players"] as AssignType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setForm({ ...form, assignType: t });
                        setSaveError(null);
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        form.assignType === t
                          ? "bg-primary text-white border-primary"
                          : "border-gray-200 text-muted hover:border-primary/50"
                      }`}
                    >
                      {t === "none" ? "Niemanden" : t === "team" ? "Mannschaft" : "Spieler"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team selector */}
              {form.assignType === "team" && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Mannschaft wählen
                  </label>
                  {teams.length === 0 ? (
                    <p className="text-sm text-muted">
                      Dir ist noch keine Mannschaft zugewiesen. Bitte einen Admin bitten, deine
                      Clerk ID in Sanity Studio der Mannschaft zu hinterlegen.
                    </p>
                  ) : (
                    <select
                      value={form.teamId}
                      onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— Mannschaft wählen —</option>
                      {teams.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Player multi-select */}
              {form.assignType === "players" && (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Spieler wählen
                  </label>
                  {players.length === 0 ? (
                    <p className="text-sm text-muted">Keine Spieler vorhanden.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {players.map((p) => (
                        <label
                          key={p._id}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.playerIds.includes(p._id)}
                            onChange={() => togglePlayer(p._id)}
                            className="accent-primary w-4 h-4"
                          />
                          <span className="text-sm text-text">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
              {saveError ? (
                <p className="text-sm text-primary">{saveError}</p>
              ) : (
                <span />
              )}
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  {saving ? (pdfFile ? "Hochladen…" : "Speichern…") : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
