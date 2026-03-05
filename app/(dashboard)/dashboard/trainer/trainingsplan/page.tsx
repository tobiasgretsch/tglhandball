"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Plus, Pencil, Trash2, X, Users, User, FileText, Upload } from "lucide-react";

interface Player {
  _id: string;
  name: string;
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
  assignedToTeam?: { _id: string; name: string };
  assignedToPlayers?: { _id: string; name: string }[];
  pdfFile?: { asset?: PdfAsset };
}

type AssignType = "team" | "players" | "none";

interface PlanForm {
  title: string;
  description: string;
  date: string;
  assignType: AssignType;
  teamId: string;
  playerIds: string[];
}

const EMPTY_FORM: PlanForm = {
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 16),
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/training-plans");
    setPlans(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    fetchPlans();
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers);
    fetch("/api/teams")
      .then((r) => r.json())
      .then(setTeams);
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
      date: p.date ? p.date.slice(0, 16) : EMPTY_FORM.date,
      assignType: p.assignedToTeam
        ? "team"
        : p.assignedToPlayers?.length
        ? "players"
        : "none",
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
    setSaving(true);

    // Upload PDF first if a new file was selected
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
      date: new Date(form.date).toISOString(),
      teamId: form.assignType === "team" ? form.teamId : null,
      playerIds: form.assignType === "players" ? form.playerIds : [],
      ...(pdfAssetId ? { pdfAssetId } : {}),
    };

    if (modal.editing) {
      await fetch(`/api/training-plans/${modal.editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/training-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    closeModal();
    fetchPlans();
  }

  async function handleDelete(id: string) {
    if (!confirm("Plan wirklich löschen?")) return;
    await fetch(`/api/training-plans/${id}`, { method: "DELETE" });
    fetchPlans();
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Trainingspläne
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Erstelle und verwalte Trainingspläne.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm"
        >
          <Plus size={15} />
          Neuer Plan
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Laden…</p>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Noch keine Trainingspläne.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-primary font-semibold hover:underline"
          >
            Ersten Plan erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-gray-900 dark:text-white">{plan.title}</h3>
                  {plan.date && (
                    <span className="text-xs text-gray-400">
                      {new Date(plan.date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {plan.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {plan.assignedToTeam && (
                    <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent dark:text-blue-400 px-2 py-0.5 rounded-full">
                      <Users size={10} />
                      {plan.assignedToTeam.name}
                    </span>
                  )}
                  {plan.assignedToPlayers?.map((pl) => (
                    <span
                      key={pl._id}
                      className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                    >
                      <User size={10} />
                      {pl.name}
                    </span>
                  ))}
                  {plan.pdfFile?.asset?.url && (
                    <a
                      href={plan.pdfFile.asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-primary px-2 py-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <FileText size={10} />
                      {plan.pdfFile.asset.originalFilename ?? "PDF"}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(plan)}
                  className="p-1.5 rounded text-gray-400 hover:text-accent dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="p-1.5 rounded text-gray-400 hover:text-primary dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {modal.editing ? "Plan bearbeiten" : "Neuer Trainingsplan"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Titel *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Datum
                </label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Beschreibung / Übungen
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* PDF upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  PDF-Datei
                </label>

                {/* Show existing PDF when editing */}
                {existingPdf?.url && !pdfFile && (
                  <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <FileText size={14} className="text-primary shrink-0" />
                    <a
                      href={existingPdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate"
                    >
                      {existingPdf.originalFilename ?? "Aktuelles PDF"}
                    </a>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">vorhanden</span>
                  </div>
                )}

                {/* New file selected preview */}
                {pdfFile && (
                  <div className="flex items-center gap-2 mb-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <FileText size={14} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-400 truncate">
                      {pdfFile.name}
                    </span>
                    <button
                      onClick={() => setPdfFile(null)}
                      className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:text-primary transition-colors w-full justify-center"
                >
                  <Upload size={14} />
                  {pdfFile
                    ? "Anderes PDF wählen"
                    : existingPdf
                    ? "PDF ersetzen"
                    : "PDF hochladen"}
                </button>
              </div>

              {/* Assignment type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zuweisen an
                </label>
                <div className="flex gap-2">
                  {(["none", "team", "players"] as AssignType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, assignType: t })}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        form.assignType === t
                          ? "bg-primary text-white border-primary"
                          : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary/50"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Mannschaft wählen
                  </label>
                  <select
                    value={form.teamId}
                    onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Mannschaft wählen —</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Player multi-select */}
              {form.assignType === "players" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Spieler wählen
                  </label>
                  {players.length === 0 ? (
                    <p className="text-sm text-gray-400">Keine Spieler vorhanden.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                      {players.map((p) => (
                        <label
                          key={p._id}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.playerIds.includes(p._id)}
                            onChange={() => togglePlayer(p._id)}
                            className="accent-primary w-3.5 h-3.5"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {p.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {saving ? (pdfFile ? "PDF wird hochgeladen…" : "Speichern…") : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
