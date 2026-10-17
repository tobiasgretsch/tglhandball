"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  FOERDERVEREIN,
  formatEuro,
  formatIban,
  isValidIban,
  maskIban,
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
type SetField = <K extends FieldName>(field: K, value: FormValues[K]) => void;

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
const FEE_PLACEHOLDER = "[Betrag]";

const REQUIRED_FIELDS: FieldName[] = [
  "anrede",
  "vorname",
  "nachname",
  "strasse",
  "plz",
  "ort",
  "email",
  "iban",
];

// Spring tuned to Apple's critically damped default: no overshoot, settles in ~0.4s.
const SETTLE_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

const fieldId = (name: FieldName) => `fv-${name}`;
const errorId = (name: FieldName) => `fv-${name}-error`;
const isRequired = (name: FieldName) => REQUIRED_FIELDS.includes(name);

// 16px text keeps iOS Safari from zooming on focus; the focus ring stays visible for keyboard users.
const inputClass =
  "w-full min-h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-base text-text dark:text-gray-100 placeholder:text-muted/60 transition-[border-color,box-shadow] duration-150 dark:[color-scheme:dark] focus:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 aria-[invalid=true]:border-primary";

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  for (const field of REQUIRED_FIELDS) {
    if (!String(values[field]).trim()) errors[field] = REQUIRED_MESSAGE;
  }
  if (!errors.email && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Bitte eine gültige E-Mail-Adresse eingeben";
  }
  if (!errors.plz && !PLZ_PATTERN.test(values.plz.trim())) {
    errors.plz = "Bitte eine 5-stellige PLZ eingeben";
  }
  if (!errors.iban && !isValidIban(values.iban)) {
    errors.iban = "Diese IBAN ist ungültig – bitte prüfe sie auf Tippfehler";
  }
  if (!values.mandat) errors.mandat = "Bitte erteile das SEPA-Lastschriftmandat";
  if (!values.datenschutz) errors.datenschutz = "Bitte stimme der Datenschutzerklärung zu";
  return errors;
}

/** Index in `formatted` right after the n-th IBAN character (spaces don't count). */
function caretAfterSignificantChars(formatted: string, count: number): number {
  if (count === 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== " " && ++seen === count) return i + 1;
  }
  return formatted.length;
}

export default function FoerdervereinForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const reduceMotion = useReducedMotion() ?? false;

  const ibanRef = useRef<HTMLInputElement>(null);
  const pendingIbanCaret = useRef<number | null>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Re-format the IBAN without the caret jumping to the end while editing mid-string.
  useLayoutEffect(() => {
    const caret = pendingIbanCaret.current;
    if (caret === null || !ibanRef.current) return;
    ibanRef.current.setSelectionRange(caret, caret);
    pendingIbanCaret.current = null;
  }, [values.iban]);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const set: SetField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Validate when the user leaves a filled field; required errors wait for submit.
  const validateOnLeave = (field: FieldName) => {
    if (!String(values[field]).trim()) return;
    setErrors((prev) => ({ ...prev, [field]: validate(values)[field] }));
  };

  const handleIbanChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, selectionStart } = event.target;
    const significantBeforeCaret = normalizeIban(value.slice(0, selectionStart ?? value.length)).length;
    const formatted = formatIban(value);
    pendingIbanCaret.current = caretAfterSignificantChars(formatted, significantBeforeCaret);
    set("iban", formatted);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = (Object.keys(INITIAL_VALUES) as FieldName[]).find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
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
      <motion.div
        role="status"
        className="text-center py-10"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0.2 } : SETTLE_SPRING}
      >
        <CheckCircle2 size={44} className="mx-auto mb-4 text-primary dark:text-primary-glow" aria-hidden="true" />
        <h3
          ref={successRef}
          tabIndex={-1}
          className="font-display font-bold italic uppercase text-2xl md:text-3xl tracking-[-0.02em] text-text dark:text-gray-100 mb-3 focus:outline-none"
        >
          Vielen Dank, {values.vorname.trim()}!
        </h3>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Deine Anmeldung ist eingegangen. Eine Bestätigung senden wir an{" "}
          <strong className="font-semibold text-text dark:text-gray-200">{values.email.trim()}</strong>.
        </p>
        <p className="mt-4 text-xs text-muted">
          Abbuchung per SEPA-Lastschrift von{" "}
          <span className="font-mono">{maskIban(values.iban)}</span>
        </p>
      </motion.div>
    );
  }

  const submitting = status === "submitting";
  const fee = FOERDERVEREIN.yearlyFeeEur > 0 ? formatEuro(FOERDERVEREIN.yearlyFeeEur) : FEE_PLACEHOLDER;

  const textProps = { values, errors, set, onLeave: validateOnLeave };

  return (
    <form onSubmit={handleSubmit} noValidate className="relative text-left space-y-10">
      <p className="text-xs text-muted">* Pflichtfeld</p>

      <Fieldset legend="Persönliche Daten">
        <Field name="anrede" label="Anrede" error={errors.anrede}>
          <select
            id={fieldId("anrede")}
            className={inputClass}
            value={values.anrede}
            aria-invalid={!!errors.anrede}
            aria-required="true"
            aria-describedby={errors.anrede ? errorId("anrede") : undefined}
            autoComplete="honorific-prefix"
            onChange={(e) => set("anrede", e.target.value)}
          >
            <option value="">Bitte wählen</option>
            <option value="Frau">Frau</option>
            <option value="Herr">Herr</option>
            <option value="Divers">Divers</option>
          </select>
        </Field>
        <TextField name="geburtsdatum" label="Geburtsdatum (optional)" type="date" autoComplete="bday" {...textProps} />
        <TextField name="vorname" label="Vorname" autoComplete="given-name" {...textProps} />
        <TextField name="nachname" label="Nachname" autoComplete="family-name" {...textProps} />
        <TextField name="strasse" label="Straße und Hausnummer" autoComplete="street-address" wide {...textProps} />
        <TextField name="plz" label="PLZ" autoComplete="postal-code" inputMode="numeric" {...textProps} />
        <TextField name="ort" label="Ort" autoComplete="address-level2" {...textProps} />
        <TextField name="email" label="E-Mail" type="email" autoComplete="email" {...textProps} />
        <TextField name="telefon" label="Telefon (optional)" type="tel" autoComplete="tel" {...textProps} />
      </Fieldset>

      <Fieldset legend="Jahresbeitrag">
        <div className="sm:col-span-2 rounded-xl bg-accent-tint dark:bg-accent/15 px-5 py-4 text-sm leading-relaxed text-text dark:text-gray-200">
          Der Jahresbeitrag beträgt <strong className="font-bold">{fee}</strong> und wird einmal jährlich
          per SEPA-Lastschrift eingezogen.
        </div>
      </Fieldset>

      <Fieldset legend="SEPA-Lastschriftmandat">
        <Field name="iban" label="IBAN" error={errors.iban} wide>
          <input
            ref={ibanRef}
            id={fieldId("iban")}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="DE00 0000 0000 0000 0000 00"
            className={`${inputClass} font-mono tracking-wide`}
            value={values.iban}
            aria-invalid={!!errors.iban}
            aria-required="true"
            aria-describedby={errors.iban ? errorId("iban") : undefined}
            onChange={handleIbanChange}
            onBlur={() => validateOnLeave("iban")}
          />
        </Field>
        <TextField name="kontoinhaber" label="Kontoinhaber (falls abweichend)" autoComplete="off" wide {...textProps} />
        <TextField name="bank" label="Kreditinstitut (optional)" autoComplete="off" wide {...textProps} />

        <div className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 text-[13px] leading-relaxed text-muted dark:text-gray-300">
          <p className="mb-2 font-semibold text-text dark:text-gray-100">
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

        <Checkbox name="mandat" checked={values.mandat} error={errors.mandat} onChange={(v) => set("mandat", v)}>
          Ich erteile das SEPA-Lastschriftmandat für den jährlichen Mitgliedsbeitrag. *
        </Checkbox>
        <Checkbox name="datenschutz" checked={values.datenschutz} error={errors.datenschutz} onChange={(v) => set("datenschutz", v)}>
          Ich habe die{" "}
          <a href="/datenschutz" className="underline underline-offset-2 hover:text-primary">
            Datenschutzerklärung
          </a>{" "}
          gelesen und stimme der Verarbeitung meiner Daten zu. *
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

      <div aria-live="polite">
        {status === "error" && (
          <p
            role="alert"
            className="rounded-xl bg-primary-tint dark:bg-primary/10 px-4 py-3 text-sm text-primary-dark dark:text-primary-glow"
          >
            Die Anmeldung konnte gerade nicht übermittelt werden. Deine Eingaben bleiben erhalten – bitte
            versuche es gleich noch einmal.
          </p>
        )}
      </div>

      <div className="text-center">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="btn btn-primary w-full sm:w-auto min-h-12 disabled:opacity-60 disabled:pointer-events-none"
        >
          {submitting && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
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
      <legend className="font-display font-bold italic uppercase text-lg tracking-[-0.01em] leading-tight text-text dark:text-gray-100 mb-4">
        {legend}
      </legend>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  name,
  label,
  error,
  wide,
  children,
}: {
  name: FieldName;
  label: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={fieldId(name)} className="block text-sm font-medium text-text dark:text-gray-200 mb-1.5">
        {label}
        {isRequired(name) && " *"}
      </label>
      {children}
      {error && (
        <p id={errorId(name)} className="mt-1.5 text-[13px] leading-snug text-primary-dark dark:text-primary-glow">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = {
  name: FieldName;
  label: string;
  values: FormValues;
  errors: Errors;
  set: SetField;
  onLeave: (field: FieldName) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  wide?: boolean;
};

function TextField({ name, label, values, errors, set, onLeave, type = "text", autoComplete, inputMode, wide }: TextFieldProps) {
  const error = errors[name];
  return (
    <Field name={name} label={label} error={error} wide={wide}>
      <input
        id={fieldId(name)}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={inputClass}
        value={String(values[name])}
        aria-invalid={!!error}
        aria-required={isRequired(name) || undefined}
        aria-describedby={error ? errorId(name) : undefined}
        onChange={(e) => set(name, e.target.value as FormValues[typeof name])}
        onBlur={() => onLeave(name)}
      />
    </Field>
  );
}

function Checkbox({
  name,
  checked,
  error,
  onChange,
  children,
}: {
  name: FieldName;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="sm:col-span-2">
      {/* Whole row is the hit target (≥44px) and reacts instantly on press. */}
      <label className="flex min-h-11 items-start gap-3 rounded-xl py-2 text-sm leading-relaxed text-text dark:text-gray-200 cursor-pointer select-none transition-transform duration-100 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100">
        <input
          id={fieldId(name)}
          type="checkbox"
          checked={checked}
          aria-invalid={!!error}
          aria-required="true"
          aria-describedby={error ? errorId(name) : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={errorId(name)} className="ml-8 text-[13px] leading-snug text-primary-dark dark:text-primary-glow">
          {error}
        </p>
      )}
    </div>
  );
}
