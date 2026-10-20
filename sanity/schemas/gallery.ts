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
      name: "team",
      title: "Mannschaft",
      description: "Das Bild erscheint auf der Mannschaftsseite. Leer lassen = Verein (Über-uns-Seite).",
      type: "reference",
      to: [{ type: "team" }],
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
    select: { title: "caption", subtitle: "team.name", media: "image" },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Kein Titel",
        subtitle: subtitle ?? "Verein",
        media,
      };
    },
  },
});
