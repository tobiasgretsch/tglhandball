import { defineType, defineField } from "sanity";

export default defineType({
  name: "partner",
  title: "Partner",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "websiteUrl",
      title: "Website-URL",
      type: "url",
    }),
    defineField({
      name: "tier",
      title: "Kategorie",
      type: "string",
      options: {
        list: [
          { title: "Premium", value: "premium" },
          { title: "Standard", value: "standard" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "isPartnerOfTheDay",
      title: "Partner des Tages",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "active",
      title: "Aktiv",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "tier", media: "logo" },
  },
});
