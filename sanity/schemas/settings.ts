import { defineType, defineField, defineArrayMember } from "sanity";

export default defineType({
  name: "settings",
  title: "Einstellungen",
  type: "document",
  // Singleton: only one document of this type should exist.
  // Enforced via sanity.config.ts structure configuration.
  fields: [
    // ─── Club ────────────────────────────────────────────────────────────────
    defineField({
      name: "clubName",
      title: "Vereinsname",
      type: "string",
    }),
    defineField({
      name: "logo",
      title: "Vereinslogo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "favicon",
      title: "Favicon",
      type: "image",
      description: "Wird als Browser-Tab-Icon angezeigt. Empfohlen: quadratisches PNG oder SVG, mind. 512×512 px.",
    }),
    defineField({
      name: "heroImage",
      title: "Hero-Bild (Startseite)",
      type: "image",
      options: { hotspot: true },
      description: "Großes Hintergrundbild für die Startseite",
    }),
    defineField({
      name: "pageHeroSlides",
      title: "Seitenheader – Foto-Slider",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Bildbeschreibung (Alt-Text)",
              type: "string",
            }),
          ],
        }),
      ],
      description:
        "Fotos für den Slider im Seitenheader (News, Teams, Spielplan usw.). Rechts voll sichtbar, links transparent hinterlegt.",
    }),

    // ─── About ───────────────────────────────────────────────────────────────
    defineField({
      name: "aboutText",
      title: "Vereinsgeschichte / Über uns",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      description: "Rich-Text-Inhalt für die 'Über uns'-Seite.",
    }),
    defineField({
      name: "aboutPhoto",
      title: "Foto (Über uns)",
      type: "image",
      options: { hotspot: true },
      description: "Optionales Foto neben dem Über-uns-Text.",
    }),

    // ─── Board members ────────────────────────────────────────────────────────
    defineField({
      name: "boardMembers",
      title: "Vorstand & Ansprechpartner",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "role",
              title: "Funktion / Amt",
              type: "string",
            }),
            defineField({
              name: "email",
              title: "E-Mail",
              type: "string",
            }),
            defineField({
              name: "photo",
              title: "Foto",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "role" },
          },
        }),
      ],
    }),

    // ─── Social ───────────────────────────────────────────────────────────────
    defineField({
      name: "instagramUrl",
      title: "Instagram-URL",
      type: "url",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook-URL",
      type: "url",
    }),
    defineField({
      name: "youtubeUrl",
      title: "YouTube-URL",
      type: "url",
    }),
    defineField({
      name: "tiktokUrl",
      title: "TikTok-URL",
      type: "url",
    }),

    // ─── Contact ─────────────────────────────────────────────────────────────
    defineField({
      name: "contactEmail",
      title: "Kontakt-E-Mail",
      type: "string",
    }),

    // ─── Partner page ────────────────────────────────────────────────────────
    defineField({
      name: "partnerPageText",
      title: "Partnerseite – Infotext",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      description:
        "Dieser Text erscheint auf der Partnerseite zwischen dem Hauptsponsor und den weiteren Partnerkategorien.",
    }),
    defineField({
      name: "partnerInfoPdf",
      title: "Partnerseite – Info-PDF",
      type: "file",
      options: { accept: ".pdf" },
      description:
        "PDF-Datei für das Partnerprogramm. Erscheint als Button auf der Partnerseite und wird inline angezeigt.",
    }),

    // ─── Venue ───────────────────────────────────────────────────────────────
    defineField({
      name: "venueName",
      title: "Hallenname",
      type: "string",
      description: 'z.B. "ERGOLD Energie Arena"',
    }),
    defineField({
      name: "venueAddress",
      title: "Hallenadresse",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "venueLat",
      title: "Breitengrad (Latitude)",
      type: "number",
    }),
    defineField({
      name: "venueLng",
      title: "Längengrad (Longitude)",
      type: "number",
    }),
  ],
  preview: {
    select: { title: "clubName", media: "logo" },
  },
});
