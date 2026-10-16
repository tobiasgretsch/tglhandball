import { defineType, defineField, defineArrayMember } from "sanity";

export default defineType({
  name: "team",
  title: "Mannschaft",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
    }),
    defineField({
      name: "league",
      title: "Liga",
      type: "string",
    }),
    defineField({
      name: "headerImage",
      title: "Headerbild",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "description",
      title: "Beschreibung",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "coaches",
      title: "Trainer",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({ name: "role", title: "Rolle", type: "string" }),
            defineField({
              name: "image",
              title: "Bild",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "role", media: "image" },
          },
        }),
      ],
    }),
    defineField({
      name: "betreuer",
      title: "Betreuer",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({ name: "role", title: "Rolle", type: "string" }),
            defineField({
              name: "image",
              title: "Bild",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "role", media: "image" },
          },
        }),
      ],
    }),
    defineField({
      name: "squad",
      title: "Kader",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "number", title: "Trikotnummer", type: "number" }),
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({ name: "position", title: "Position", type: "string" }),
            defineField({
              name: "image",
              title: "Bild",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "position", media: "image" },
          },
        }),
      ],
    }),
    defineField({
      name: "trainingTimes",
      title: "Trainingszeiten",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "day",
              title: "Wochentag",
              type: "string",
              options: {
                list: [
                  { title: "Montag", value: "mo" },
                  { title: "Dienstag", value: "di" },
                  { title: "Mittwoch", value: "mi" },
                  { title: "Donnerstag", value: "do" },
                  { title: "Freitag", value: "fr" },
                  { title: "Samstag", value: "sa" },
                  { title: "Sonntag", value: "so" },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "startTime",
              title: "Beginn",
              type: "string",
              description: 'Format HH:MM, z.B. "18:00"',
              validation: (Rule) =>
                Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "HH:MM" }),
            }),
            defineField({
              name: "endTime",
              title: "Ende",
              type: "string",
              description: 'Format HH:MM, z.B. "19:30"',
              validation: (Rule) =>
                Rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "HH:MM" }),
            }),
            defineField({
              name: "location",
              title: "Ort",
              type: "string",
              description: 'z.B. "Elektro-Ecker-Halle"',
            }),
            defineField({
              name: "note",
              title: "Hinweis",
              type: "string",
              description: 'z.B. "Torwarttraining" oder "Probetraining willkommen"',
            }),
          ],
          preview: {
            select: { day: "day", start: "startTime", end: "endTime", subtitle: "location" },
            prepare({ day, start, end, subtitle }) {
              return {
                title: `${(day ?? "").toUpperCase()} ${start ?? ""}${end ? `–${end}` : ""}`,
                subtitle,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "pricingSection",
      title: "Eintrittspreise",
      type: "pricingSection",
    }),
    defineField({
      name: "category",
      title: "Kategorie",
      type: "string",
      options: {
        list: [
          { title: "Herren", value: "herren" },
          { title: "Damen", value: "damen" },
          { title: "Jugend männlich", value: "jugend_m" },
          { title: "Jugend weiblich", value: "jugend_w" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "nuligaTableUrl",
      title: "nuLiga Ligatabelle (Link)",
      type: "url",
      description:
        "Link zur Tabellenseite der Liga auf bhv-handball.liga.nu (groupPage?championship=…&group=…). Die Tabelle erscheint automatisch auf der Mannschaftsseite.",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).custom((value) =>
          !value || new URL(value).hostname === "bhv-handball.liga.nu"
            ? true
            : "Nur Links von bhv-handball.liga.nu sind erlaubt."
        ),
    }),
    defineField({
      name: "nuligaLeagues",
      title: "nuLiga-Ligakürzel (Spielplan-Sync)",
      type: "array",
      of: [{ type: "string" }],
      description:
        'Ligakürzel so wie auf liga.nu angezeigt, z.B. "BOL WC" oder "RL M". Spiele dieser Liga werden automatisch dieser Mannschaft zugeordnet.',
    }),
    defineField({
      name: "order",
      title: "Reihenfolge",
      type: "number",
    }),
  ],
  orderings: [
    {
      title: "Reihenfolge",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "league", media: "headerImage" },
  },
});
