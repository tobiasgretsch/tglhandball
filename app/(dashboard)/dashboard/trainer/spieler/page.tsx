"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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
    let res: Response;
    if (modal.editing) {
      res = await fetch(`/api/players/${modal.editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
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

    // Optimistically remove from list so the UI feels instant
    setPlayers((prev) => prev.filter((p) => p._id !== id));

    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Löschen fehlgeschlagen. Bitte erneut versuchen.");
      // Restore list on failure
      fetchPlayers();
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Spieler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Verwalte deine Spielerprofile.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm"
        >
          <Plus size={15} />
          Neuer Spieler
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Laden…</p>
      ) : players.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Noch keine Spieler.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-primary font-semibold hover:underline"
          >
            Ersten Spieler hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Mannschaft</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Konto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-gray-50 dark:border-gray-700/40 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400">{p.number ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                    {p.email && (
                      <p className="text-xs text-gray-400 mt-0.5">{p.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.position || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.team?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.clerkUserId
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {p.clerkUserId ? "Verknüpft" : "Ausstehend"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded text-gray-400 hover:text-accent dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 rounded text-gray-400 hover:text-primary dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
      )}

      {/* Create / Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {modal.editing ? "Spieler bearbeiten" : "Neuer Spieler"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                hint="Wird zur automatischen Profil-Verknüpfung verwendet."
              />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mannschaft
                </label>
                <select
                  value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
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

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
