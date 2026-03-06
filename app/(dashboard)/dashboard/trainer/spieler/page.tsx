"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Plus, Pencil, Trash2, X, User } from "lucide-react";

interface Player {
  _id: string;
  name: string;
  email: string;
  position: string;
  number: number | null;
  clerkUserId: string | null;
  team?: { _id: string; name: string };
}

interface Team {
  _id: string;
  name: string;
}

const EMPTY_FORM = { name: "", email: "", position: "", number: "", teamId: "" };

export default function SpielerPage() {
  const { isLoaded } = useUser();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Player | null }>({
    open: false,
    editing: null,
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/players");
    setPlayers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    fetchPlayers();
    fetch("/api/teams")
      .then((r) => r.json())
      .then(setTeams);
  }, [isLoaded, fetchPlayers]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  }

  function openEdit(p: Player) {
    setForm({
      name: p.name,
      email: p.email ?? "",
      position: p.position ?? "",
      number: p.number?.toString() ?? "",
      teamId: p.team?._id ?? "",
    });
    setModal({ open: true, editing: p });
  }

  function closeModal() {
    setModal({ open: false, editing: null });
  }

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    const body = { ...form, number: form.number ? parseInt(form.number) : null };
    const res = modal.editing
      ? await fetch(`/api/players/${modal.editing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Speichern fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    closeModal();
    fetchPlayers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Spieler wirklich löschen?")) return;
    setPlayers((prev) => prev.filter((p) => p._id !== id));
    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Löschen fehlgeschlagen.");
      fetchPlayers();
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-black text-text">Spieler</h1>
          <p className="text-sm text-muted mt-0.5">Verwalte deine Spielerprofile.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Neuer Spieler</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Laden…</p>
      ) : players.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-muted text-sm">Noch keine Spieler.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-primary font-semibold hover:underline"
          >
            Ersten Spieler hinzufügen
          </button>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {players.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.number != null && (
                        <span className="text-xs font-bold text-muted bg-gray-100 px-1.5 py-0.5 rounded">
                          #{p.number}
                        </span>
                      )}
                      <p className="font-semibold text-text">{p.name}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.clerkUserId
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.clerkUserId ? "Verknüpft" : "Ausstehend"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {p.position && (
                        <span className="text-xs text-muted">{p.position}</span>
                      )}
                      {p.team && (
                        <span className="text-xs text-accent font-medium">{p.team.name}</span>
                      )}
                      {p.email && (
                        <span className="text-xs text-muted">{p.email}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-lg text-muted hover:text-accent hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 rounded-lg text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Mannschaft</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Konto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted">{p.number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{p.name}</p>
                      {p.email && (
                        <p className="text-xs text-muted mt-0.5">{p.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text">{p.position || "—"}</td>
                    <td className="px-4 py-3 text-text">{p.team?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.clerkUserId
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.clerkUserId ? "Verknüpft" : "Ausstehend"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded text-muted hover:text-accent hover:bg-gray-100 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 rounded text-muted hover:text-primary hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <User size={16} className="text-primary" />
                <h2 className="font-bold text-text">
                  {modal.editing ? "Spieler bearbeiten" : "Neuer Spieler"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-muted hover:text-text transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <Field
                label="Name *"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <Field
                label="E-Mail"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                type="email"
                hint="Spieler erhält eine Einladungs-E-Mail und kann sein Profil verknüpfen."
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Position"
                  value={form.position}
                  onChange={(v) => setForm({ ...form, position: v })}
                />
                <Field
                  label="Trikotnummer"
                  value={form.number}
                  onChange={(v) => setForm({ ...form, number: v })}
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Mannschaft
                </label>
                <select
                  value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Keine Mannschaft —</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
