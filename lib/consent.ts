"use client";

import { useSyncExternalStore } from "react";

export type ConsentCategory = "statistics" | "external";

export interface ConsentChoices {
  statistics: boolean;
  external: boolean;
}

/** Persisted record; `version` lets us re-ask after a material change to the categories. */
interface ConsentRecord extends ConsentChoices {
  version: number;
  timestamp: string;
}

export const CONSENT_VERSION = 1;
const STORAGE_KEY = "tgl-consent";
const CHANGE_EVENT = "tgl-consent-change";
export const OPEN_SETTINGS_EVENT = "tgl-consent-open";

export const CONSENT_NONE: ConsentChoices = { statistics: false, external: false };
export const CONSENT_ALL: ConsentChoices = { statistics: true, external: true };

function readRecord(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" && parsed !== null &&
      (parsed as ConsentRecord).version === CONSENT_VERSION &&
      typeof (parsed as ConsentRecord).statistics === "boolean" &&
      typeof (parsed as ConsentRecord).external === "boolean"
    ) {
      return parsed as ConsentRecord;
    }
  } catch {
    // storage unavailable or corrupt — treat as "not decided"
  }
  return null;
}

export function saveConsent(choices: ConsentChoices): void {
  const record: ConsentRecord = { ...choices, version: CONSENT_VERSION, timestamp: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // storage unavailable — the choice then only lives for this page view
    memoryRecord = record;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

let memoryRecord: ConsentRecord | null = null;

// useSyncExternalStore needs a referentially stable snapshot, so cache by serialized value.
let cachedKey = "";
let cachedRecord: ConsentRecord | null = null;

function getSnapshot(): ConsentRecord | null {
  const record = readRecord() ?? memoryRecord;
  const key = record ? JSON.stringify(record) : "";
  if (key !== cachedKey) {
    cachedKey = key;
    cachedRecord = record;
  }
  return cachedRecord;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export type ConsentState =
  | { status: "unknown" } // before hydration — never load anything
  | { status: "undecided" }
  | ({ status: "decided" } & ConsentChoices);

const UNKNOWN: ConsentState = { status: "unknown" };
const UNDECIDED: ConsentState = { status: "undecided" };
let decidedCache: { source: ConsentRecord; state: ConsentState } | null = null;

function toState(record: ConsentRecord | null): ConsentState {
  if (!record) return UNDECIDED;
  if (decidedCache?.source !== record) {
    decidedCache = {
      source: record,
      state: { status: "decided", statistics: record.statistics, external: record.external },
    };
  }
  return decidedCache.state;
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(
    subscribe,
    () => toState(getSnapshot()),
    () => UNKNOWN,
  );
}

/** True only after the visitor explicitly opted in to the category. */
export function useHasConsent(category: ConsentCategory): boolean {
  const state = useConsent();
  return state.status === "decided" && state[category];
}
