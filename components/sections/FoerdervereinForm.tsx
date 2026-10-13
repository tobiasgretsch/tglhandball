"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  FOERDERVEREIN,
  formatEuro,
  formatIban,
  isValidIban,
  normalizeIban,
} from "@/lib/foerderverein";

type FormValues = {
  anrede: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  kontoinhaber: string;
  iban: string;
  bank: string;
  mandat: boolean;
  datenschutz: boolean;
  website: string; // honeypot — must stay empty
};

type FieldName = keyof FormValues;
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "success" | "error";

const INITIAL_VALUES: FormValues = {
  anrede: "",
  vorname: "",
  nachname: "",
  geburtsdatum: "",
  strasse: "",
  plz: "",
  ort: "",
  email: "",
  telefon: "",
  kontoinhaber: "",
  iban: "",
  bank: "",
  mandat: false,
  datenschutz: false,
  website: "",
};

const REQUIRED_MESSAGE = "Pflichtfeld";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLZ_PATTERN = /^\d{5}$/;

const REQUIRED_TEXT_FIELDS: FieldName[] = [
  "anrede",
  "vorname",
  "nachname",
  "strasse",
  "plz",
  "ort",
  "email",
  "iban",
];

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-base text-text dark:text-gray-100 placeholder:text-muted/60 transition-colors focus:border-primary focus:outline-none aria-[invalid=true]:border-primary";

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!String(values[field]).trim()) errors[field] = REQUIRED_MESSAGE;
  }
  if (!errors.email && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Bitte gültige E-Mail-Adresse eingeben";
  }
  if (!errors.plz && !PLZ_PATTERN.test(values.plz.trim())) {
    errors.plz = "5-stellige PLZ";
  }
  if (!errors.iban && !isValidIban(values.iban)) {
    errors.iban = "Ungültige IBAN";
  }
  if (!values.mandat) errors.mandat = "Bitte das SEPA-Lastschriftmandat erteilen";
  if (!values.datenschutz) errors.datenschutz = "Bitte der Datenschutzerklärung zustimmen";
  return errors;
}

export default function FoerdervereinForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = <K extends FieldName>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`fv-${first}`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      // TODO: backend (/api/foerderverein → Resend) is not implemented yet.
      const response = await fetch(FOERDERVEREIN.submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, iban: normalizeIban(values.iban) }),
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="text-center py-10">
        <CheckCircle2 size={44} className="mx-auto mb-4 text-primary dark:text-primary-glow" />
        <h3 className="font-display font-bold italic uppercase text-2xl md:text-3xl tracking-[-0.02em] text-text dark:text-gray-100 mb-3">
          Vielen Dank!
        </h3>
        <p className="text-muted dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
          Deine Anmeldung ist eingegangen. Du erhältst eine Bestätigung per E-Mail.
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="text-left space-y-10">
      <Fieldset legend="Persönliche Daten">
        <Field id="anrede" label="Anrede" error={errors.anrede}>
          <select
            id="fv-anrede"
            className={inputClass}
            value={values.anrede}
            aria-invalid={!!errors.anrede}
            autoComplete="honorific-prefix"
            onChange={(e) => set("anrede", e.target.value)}
          >
            <option value="">Bitte wählen</option>
            <option value="Frau">Frau</option>
            <option value="Herr">Herr</option>
            <option value="Divers">Divers</option>
          </select>
        </Field>
        <Field id="geburtsdatum" label="Geburtsdatum (optional)" error={errors.geburtsdatum}>
          <input
            id="fv-geburtsdatum"
            type="date"
            className={inputClass}
            value={values.geburtsdatum}
            autoComplete="bday"
            onChange={(e) => set("geburtsdatum", e.target.value)}
          />
        </Field>
        <TextField id="vorname" label="Vorname" autoComplete="given-name" values={values} errors={errors} set={set} />
        <TextField id="nachname" label="Nachname" autoComplete="family-name" values={values} errors={errors} set={set} />
        <TextField id="strasse" label="Straße und Hausnummer" autoComplete="street-address" values={values} errors={errors} set={set} wide />
        <TextField id="plz" label="PLZ" autoComplete="postal-code" inputMode="numeric" values={values} errors={errors} set={set} />
        <TextField id="ort" label="Ort" autoComplete="address-level2" values={values} errors={errors} set={set} />
        <TextField id="email" label="E-Mail" type="email" autoComplete="email" values={values} errors={errors} set={set} />
        <TextField id="telefon" label="Telefon (optional)" type="tel" autoComplete="tel" values={values} errors={errors} set={set} />
      </Fieldset>

      <Fieldset legend="Jahresbeitrag">
        <div className="sm:col-span-2 rounded-xl bg-accent-tint dark:bg-accent/15 px-5 py-4 text-sm text-text dark:text-gray-200">
          Der Jahresbeitrag beträgt{" "}
          <strong className="font-bold">{formatEuro(FOERDERVEREIN.yearlyFeeEur)}</strong> und wird
          einmal jährlich per SEPA-Lastschrift eingezogen.
        </div>
      </Fieldset>

      <Fieldset legend="SEPA-Lastschriftmandat">
        <TextField id="kontoinhaber" label="Kontoinhaber (falls abweichend)" autoComplete="off" values={values} errors={errors} set={set} wide />
        <Field id="iban" label="IBAN" error={errors.iban} wide>
          <input
            id="fv-iban"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="DE00 0000 0000 0000 0000 00"
            className={`${inputClass} font-mono tracking-wide`}
            value={values.iban}
            aria-invalid={!!errors.iban}
            aria-describedby={errors.iban ? "fv-iban-error" : undefined}
            onChange={(e) => set("iban", formatIban(e.target.value))}
          />
        </Field>
        <TextField id="bank" label="Kreditinstitut (optional)" autoComplete="off" values={values} errors={errors} set={set} wide />

        <div className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-xs leading-relaxed text-muted dark:text-gray-400">
          <p className="mb-2 font-semibold text-text dark:text-gray-200">
            Gläubiger: {FOERDERVEREIN.name}, {FOERDERVEREIN.street}, {FOERDERVEREIN.city}
            <br />
            Gläubiger-Identifikationsnummer: {FOERDERVEREIN.creditorId}
          </p>
          <p>
            Ich ermächtige den {FOERDERVEREIN.name}, Zahlungen von meinem Konto mittels SEPA-Basislastschrift
            einzuziehen. Zugleich weise ich mein Kreditinstitut an, die vom {FOERDERVEREIN.name} auf mein Konto
            gezogenen Lastschriften einzulösen. Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem
            Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem
            Kreditinstitut vereinbarten Bedingungen. Die Mandatsreferenz wird mir separat mitgeteilt.
          </p>
        </div>

        <Checkbox
          id="mandat"
          checked={values.mandat}
          error={errors.mandat}
          onChange={(v) => set("mandat", v)}
        >
          Ich erteile das SEPA-Lastschriftmandat für den jährlichen Mitgliedsbeitrag.
        </Checkbox>
        <Checkbox
          id="datenschutz"
          checked={values.datenschutz}
          error={errors.datenschutz}
          onChange={(v) => set("datenschutz", v)}
        >
          Ich habe die{" "}
          <a href="/datenschutz" className="underline hover:text-primary">
            Datenschutzerklärung
          </a>{" "}
          gelesen und stimme der Verarbeitung meiner Daten zu.
        </Checkbox>
      </Fieldset>

      {/* Honeypot — hidden from humans and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      {status === "error" && (
        <p role="alert" className="rounded-xl bg-primary-tint dark:bg-primary/10 px-4 py-3 text-sm text-primary-dark dark:text-primary-glow">
          Die Anmeldung konnte gerade nicht übermittelt werden. Bitte versuche es später erneut.
        </p>
      )}

      <div className="text-center">
        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-60">
          {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {submitting ? "Wird gesendet…" : "Verbindlich Mitglied werden"}
        </button>
      </div>
    </form>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-display font-bold italic uppercase text-lg tracking-[-0.01em] text-text dark:text-gray-100 mb-4">
        {legend}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  error,
  wide,
  children,
}: {
  id: FieldName;
  label: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={`fv-${id}`} className="block text-sm font-medium text-text dark:text-gray-200 mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p id={`fv-${id}-error`} className="mt-1.5 text-xs text-primary dark:text-primary-glow">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = {
  id: FieldName;
  label: string;
  values: FormValues;
  errors: Errors;
  set: <K extends FieldName>(field: K, value: FormValues[K]) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  wide?: boolean;
};

function TextField({ id, label, values, errors, set, type = "text", autoComplete, inputMode, wide }: TextFieldProps) {
  const error = errors[id];
  const labelText = REQUIRED_TEXT_FIELDS.includes(id) ? `${label} *` : label;
  return (
    <Field id={id} label={labelText} error={error} wide={wide}>
      <input
        id={`fv-${id}`}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={inputClass}
        value={String(values[id])}
        aria-invalid={!!error}
        aria-describedby={error ? `fv-${id}-error` : undefined}
        onChange={(e) => set(id, e.target.value as FormValues[typeof id])}
      />
    </Field>
  );
}

function Checkbox({
  id,
  checked,
  error,
  onChange,
  children,
}: {
  id: FieldName;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="flex items-start gap-3 text-sm text-text dark:text-gray-200 cursor-pointer">
        <input
          id={`fv-${id}`}
          type="checkbox"
          checked={checked}
          aria-invalid={!!error}
          className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 text-xs text-primary dark:text-primary-glow">{error}</p>}
    </div>
  );
}
