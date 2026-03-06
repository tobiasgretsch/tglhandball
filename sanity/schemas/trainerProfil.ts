import { defineType, defineField } from "sanity";

export default defineType({
  name: "trainerProfil",
  title: "Trainerprofil",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "E-Mail",
      type: "string",
      description: "E-Mail-Adresse des Trainers.",
    }),
    defineField({
      name: "phone",
      title: "Telefon",
      type: "string",
    }),
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
      description:
        "Clerk User ID des Trainers — im Clerk Dashboard unter Users nachschlagen (beginnt mit user_…). Wird für die Dashboard-Zugriffskontrolle benötigt.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
