import { defineType, defineField } from "sanity";

export default defineType({
  name: "match",
  title: "Spiel",
  type: "document",
  fields: [
    defineField({
      name: "date",
      title: "Datum & Uhrzeit",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "homeTeam",
      title: "Heimmannschaft",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "awayTeam",
      title: "Gastmannschaft",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "result",
      title: "Ergebnis",
      type: "string",
      description: 'z.B. "28:24"',
    }),
    defineField({
      name: "team",
      title: "TGL-Mannschaft",
      type: "reference",
      to: [{ type: "team" }],
    }),
    defineField({
      name: "venue",
      title: "Spielstätte",
      type: "string",
    }),
    defineField({
      name: "isHomeGame",
      title: "Heimspiel",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Datum aufsteigend",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
    {
      title: "Datum absteigend",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      homeTeam: "homeTeam",
      awayTeam: "awayTeam",
      date: "date",
      result: "result",
    },
    prepare({ homeTeam, awayTeam, date, result }) {
      const dateStr = date ? new Date(date).toLocaleDateString("de-DE") : "";
      return {
        title: `${homeTeam} – ${awayTeam}`,
        subtitle: result ? `${dateStr} | ${result}` : dateStr,
      };
    },
  },
});
