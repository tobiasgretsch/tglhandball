import { defineType, defineField } from "sanity";

export default defineType({
  name: "settings",
  title: "Einstellungen",
  type: "document",
  // Singleton: only one document of this type should exist.
  // Enforced via sanity.config.ts structure configuration.
  fields: [
    defineField({
      name: "clubName",
      title: "Vereinsname",
      type: "string",
    }),
    defineField({
      name: "logo",
      title: "Vereinslogo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram-URL",
      type: "url",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook-URL",
      type: "url",
    }),
    defineField({
      name: "youtubeUrl",
      title: "YouTube-URL",
      type: "url",
    }),
    defineField({
      name: "contactEmail",
      title: "Kontakt-E-Mail",
      type: "string",
    }),
    defineField({
      name: "venueAddress",
      title: "Hallenadresse",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "venueLat",
      title: "Breitengrad (Latitude)",
      type: "number",
    }),
    defineField({
      name: "venueLng",
      title: "Längengrad (Longitude)",
      type: "number",
    }),
  ],
  preview: {
    select: { title: "clubName", media: "logo" },
  },
});
