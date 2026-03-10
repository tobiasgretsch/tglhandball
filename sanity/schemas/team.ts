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
      name: "nuligaTeamId",
      title: "nuLiga Team-ID (Tabelle & Spielplan Widget)",
      type: "string",
      description:
        'Team-ID aus handball.net, z.B. "nuliga.bhv.1678219". Wird für die eingebetteten Tabellen- und Spielplan-Widgets verwendet.',
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
