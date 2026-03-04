import { defineType, defineField } from "sanity";

export default defineType({
  name: "magazine",
  title: "Spieltagsheft",
  type: "document",
  fields: [
    defineField({
      name: "season",
      title: "Saison",
      type: "string",
      description: 'z.B. "2025/26"',
    }),
    defineField({
      name: "matchday",
      title: "Spieltag",
      type: "number",
    }),
    defineField({
      name: "opponent",
      title: "Gegner",
      type: "string",
    }),
    defineField({
      name: "date",
      title: "Datum",
      type: "date",
    }),
    defineField({
      name: "pdfFile",
      title: "PDF-Datei",
      type: "file",
      options: { accept: ".pdf" },
    }),
  ],
  orderings: [
    {
      title: "Neueste zuerst",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      season: "season",
      matchday: "matchday",
      opponent: "opponent",
      date: "date",
    },
    prepare({ season, matchday, opponent, date }) {
      return {
        title: opponent ? `vs. ${opponent}` : "Spieltagsheft",
        subtitle: [season, matchday ? `Spieltag ${matchday}` : null, date]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
});
