import { defineType, defineField } from "sanity";

export default defineType({
  name: "ticketPriceRow",
  title: "Preiszeile",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Bezeichnung",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "normalPrice",
      title: "Normalpreis",
      type: "string",
    }),
    defineField({
      name: "discountedPrice",
      title: "Ermäßigter Preis",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "normalPrice" },
  },
});
