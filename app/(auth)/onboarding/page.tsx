"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<"trainer" | "spieler" | null>(null);

  if (!isLoaded) return null;

  async function chooseRole(role: "trainer" | "spieler") {
    setSelected(role);
    setLoading(true);
    await fetch("/api/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    // Reload session so publicMetadata is fresh
    await user?.reload();
    router.push(`/dashboard/${role}`);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
            TG MIPA Landshut
          </p>
          <h1 className="text-2xl font-black text-text dark:text-white">Willkommen!</h1>
          <p className="text-muted dark:text-gray-400 mt-1 text-sm">
            Wähle deine Rolle, um fortzufahren.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => chooseRole("trainer")}
            disabled={loading}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
              selected === "trainer"
                ? "border-primary bg-primary/8"
                : "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5"
            } disabled:opacity-60`}
          >
            <span className="text-4xl">🏋️</span>
            <div className="text-center">
              <p className="font-bold text-text dark:text-white text-sm">Trainer</p>
              <p className="text-xs text-muted dark:text-gray-400 mt-0.5">
                Spieler & Pläne verwalten
              </p>
            </div>
          </button>

          <button
            onClick={() => chooseRole("spieler")}
            disabled={loading}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
              selected === "spieler"
                ? "border-accent bg-accent/8"
                : "border-gray-200 dark:border-gray-700 hover:border-accent hover:bg-accent/5"
            } disabled:opacity-60`}
          >
            <span className="text-4xl">🤾</span>
            <div className="text-center">
              <p className="font-bold text-text dark:text-white text-sm">Spieler</p>
              <p className="text-xs text-muted dark:text-gray-400 mt-0.5">
                Meine Pläne ansehen
              </p>
            </div>
          </button>
        </div>

        {loading && (
          <p className="text-center text-sm text-muted dark:text-gray-400 mt-6">
            Weiterleitung…
          </p>
        )}
      </div>
    </div>
  );
}
