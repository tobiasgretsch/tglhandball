import { defineType, defineField, defineArrayMember } from "sanity";

export default defineType({
  name: "pricingSection",
  title: "Eintrittspreise",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Überschrift",
      type: "string",
      initialValue: "Eintrittspreise",
    }),
    defineField({
      name: "rows",
      title: "Preiszeilen",
      type: "array",
      of: [defineArrayMember({ type: "ticketPriceRow" })],
    }),
    defineField({
      name: "footnote",
      title: "Fußnote",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "infoBox",
      title: "Infobox",
      type: "text",
      rows: 3,
    }),
  ],
});
