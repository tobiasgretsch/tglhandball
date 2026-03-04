import { defineType, defineField } from "sanity";

export default defineType({
  name: "gallery",
  title: "Galerie",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Bild",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternativtext",
          type: "string",
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Bildunterschrift",
      type: "string",
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
          { title: "Events", value: "events" },
        ],
      },
    }),
    defineField({
      name: "date",
      title: "Datum",
      type: "date",
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
    select: { title: "caption", subtitle: "category", media: "image" },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Kein Titel",
        subtitle,
        media,
      };
    },
  },
});
