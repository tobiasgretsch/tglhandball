import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "next-sanity";

// ─── Sanity client (server-only, no CDN) ──────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmpty(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { name, email, subject, message } = body as Record<string, unknown>;

  // Server-side validation
  if (!isNonEmpty(name)) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 422 });
  }
  if (!isNonEmpty(email) || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse eingeben." }, { status: 422 });
  }
  if (!isNonEmpty(subject)) {
    return NextResponse.json({ error: "Betreff ist erforderlich." }, { status: 422 });
  }
  if (!isNonEmpty(message)) {
    return NextResponse.json({ error: "Nachricht ist erforderlich." }, { status: 422 });
  }

  // Fetch contact email from Sanity settings
  const settings = await sanity
    .fetch<{ contactEmail?: string }>(`*[_type == "settings"][0] { contactEmail }`)
    .catch(() => null);

  const toEmail = settings?.contactEmail ?? process.env.CONTACT_EMAIL_FALLBACK;

  if (!toEmail) {
    console.error("No contact email configured in Sanity settings.");
    return NextResponse.json({ error: "Konfigurationsfehler. Bitte direkt per E-Mail kontaktieren." }, { status: 500 });
  }

  // Send via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `Kontaktanfrage: ${subject}`,
      text: [
        `Name: ${name}`,
        `E-Mail: ${email}`,
        `Betreff: ${subject}`,
        "",
        message,
      ].join("\n"),
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Betreff:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen." }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
