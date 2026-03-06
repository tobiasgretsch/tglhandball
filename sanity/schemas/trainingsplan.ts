import { defineType, defineField } from "sanity";

export default defineType({
  name: "trainingsplan",
  title: "Trainingsplan",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titel",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "date",
      title: "Datum",
      type: "datetime",
    }),
    defineField({
      name: "validFrom",
      title: "Gültig ab",
      type: "date",
      description: "Spieler sehen den Plan erst ab diesem Tag (leer = sofort sichtbar).",
    }),
    defineField({
      name: "validUntil",
      title: "Gültig bis",
      type: "date",
      description: "Spieler sehen den Plan nicht mehr nach diesem Tag (leer = unbegrenzt sichtbar).",
    }),
    defineField({
      name: "description",
      title: "Beschreibung",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "content",
      title: "Inhalt / Übungen",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "trainerClerkUserId",
      title: "Trainer Clerk ID",
      type: "string",
    }),
    defineField({
      name: "assignedToTeam",
      title: "Zugewiesen an Mannschaft",
      type: "reference",
      to: [{ type: "team" }],
      description: "Weist den Plan der gesamten Mannschaft zu.",
    }),
    defineField({
      name: "assignedToPlayers",
      title: "Zugewiesen an Spieler",
      type: "array",
      of: [{ type: "reference", to: [{ type: "spielerProfil" }] }],
      description: "Weist den Plan einzelnen Spielern zu.",
    }),
    defineField({
      name: "pdfFile",
      title: "PDF-Datei",
      type: "file",
      options: { accept: "application/pdf" },
    }),
  ],
  orderings: [
    {
      title: "Datum (neueste zuerst)",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString("de-DE") : "Kein Datum",
      };
    },
  },
});
