import { defineType, defineField } from "sanity";

/** Written by the website (lib/live/archiveWrite.ts) once a game is over; editors never create these. */
export default defineType({
  name: "matchArchive",
  title: "Spielarchiv",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "meetingId", title: "nuLiga-Spiel-ID", type: "string" }),
    defineField({ name: "homeTeam", title: "Heimmannschaft", type: "string" }),
    defineField({ name: "awayTeam", title: "Gastmannschaft", type: "string" }),
    defineField({ name: "date", title: "Anwurf", type: "datetime" }),
    defineField({ name: "league", title: "Liga", type: "string" }),
    defineField({ name: "scoreHome", title: "Tore Heim", type: "number" }),
    defineField({ name: "scoreGuest", title: "Tore Gast", type: "number" }),
    defineField({
      name: "indexable",
      title: "Für Suchmaschinen sichtbar",
      type: "boolean",
      description: "Jugendspiele werden ohne Spielernamen archiviert und nicht indexiert.",
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "schemaVersion", title: "Schema-Version", type: "number" }),
    defineField({ name: "archivedAt", title: "Archiviert am", type: "datetime" }),
    defineField({
      name: "payload",
      title: "Rohdaten (JSON)",
      type: "text",
      rows: 4,
      description: "nuLiga-Rohdaten des Spiels. Daraus wird die Spielseite berechnet.",
    }),
  ],
  orderings: [{ title: "Anwurf absteigend", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: {
    select: { home: "homeTeam", away: "awayTeam", scoreHome: "scoreHome", scoreGuest: "scoreGuest", date: "date" },
    prepare({ home, away, scoreHome, scoreGuest, date }) {
      const day = date ? new Date(date).toLocaleDateString("de-DE") : "";
      return { title: `${home} – ${away}`, subtitle: `${day} | ${scoreHome}:${scoreGuest}` };
    },
  },
});
