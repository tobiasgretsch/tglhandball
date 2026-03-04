import { defineType, defineField } from "sanity";

export default defineType({
  name: "news",
  title: "Aktuelles",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titel",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Veröffentlicht am",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategorie",
      type: "string",
      options: {
        list: [
          { title: "Herren", value: "herren" },
          { title: "Damen", value: "damen" },
          { title: "Jugend", value: "jugend" },
          { title: "Verein", value: "verein" },
        ],
      },
    }),
    defineField({
      name: "mainImage",
      title: "Hauptbild",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternativtext",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "teaser",
      title: "Teaser",
      type: "string",
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "body",
      title: "Inhalt",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "string",
    }),
  ],
  orderings: [
    {
      title: "Neueste zuerst",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "publishedAt",
      media: "mainImage",
    },
  },
});
