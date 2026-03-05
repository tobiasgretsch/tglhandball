"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type Status = "idle" | "loading" | "success" | "error";

const EMPTY_FORM: FormFields = { name: "", email: "", subject: "", message: "" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContactForm() {
  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const set = (key: keyof FormFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
        setFields(EMPTY_FORM);
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Unbekannter Fehler. Bitte erneut versuchen.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Netzwerkfehler. Bitte Internetverbindung prüfen.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <CheckCircle size={48} className="text-emerald-500" />
        <h3 className="text-xl font-black text-text dark:text-gray-100">Nachricht gesendet!</h3>
        <p className="text-muted dark:text-gray-400 text-sm max-w-sm">
          Vielen Dank für deine Nachricht. Wir melden uns so schnell wie möglich.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
        >
          Neue Nachricht senden
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Name *" htmlFor="cf-name">
          <input
            id="cf-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Max Mustermann"
            value={fields.name}
            onChange={set("name")}
            disabled={status === "loading"}
            className={inputCls}
          />
        </Field>
        <Field label="E-Mail *" htmlFor="cf-email">
          <input
            id="cf-email"
            type="email"
            required
            autoComplete="email"
            placeholder="max@beispiel.de"
            value={fields.email}
            onChange={set("email")}
            disabled={status === "loading"}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Betreff *" htmlFor="cf-subject">
        <input
          id="cf-subject"
          type="text"
          required
          placeholder="Worum geht es?"
          value={fields.subject}
          onChange={set("subject")}
          disabled={status === "loading"}
          className={inputCls}
        />
      </Field>

      <Field label="Nachricht *" htmlFor="cf-message">
        <textarea
          id="cf-message"
          required
          rows={6}
          placeholder="Deine Nachricht an uns …"
          value={fields.message}
          onChange={set("message")}
          disabled={status === "loading"}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-[13px] px-8 py-3.5 rounded-sm transition-colors shadow-sm shadow-primary/20"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Wird gesendet …
            </>
          ) : (
            <>
              <Send size={15} />
              Nachricht senden
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-text dark:text-gray-100 placeholder:text-muted/60 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-bold uppercase tracking-wide text-text/60 dark:text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}
