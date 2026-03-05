import { defineType, defineField } from "sanity";

export default defineType({
  name: "spielerProfil",
  title: "Spielerprofil",
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
      description: "Wird zur automatischen Verknüpfung mit dem Clerk-Konto des Spielers verwendet.",
    }),
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
      description: "Wird automatisch gesetzt, wenn der Spieler sein Profil verknüpft.",
      readOnly: false,
    }),
    defineField({
      name: "trainerClerkUserId",
      title: "Trainer Clerk ID",
      type: "string",
      description: "Clerk ID des Trainers, der dieses Profil erstellt hat.",
    }),
    defineField({
      name: "position",
      title: "Position",
      type: "string",
    }),
    defineField({
      name: "number",
      title: "Trikotnummer",
      type: "number",
    }),
    defineField({
      name: "team",
      title: "Mannschaft",
      type: "reference",
      to: [{ type: "team" }],
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "position" },
  },
});
