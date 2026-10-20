import { defineField } from "sanity";

/** Front and back photo for a person card (Trainer, Kader, Betreuer). */
export function personImageFields() {
  return [
    defineField({
      name: "image",
      title: "Bild",
      type: "image",
      options: { hotspot: true },
      description:
        "Hochformat (4:5) funktioniert am besten. Große Originale sind ok – die Website lädt automatisch eine verkleinerte Version.",
    }),
    defineField({
      name: "imageBack",
      title: "Zweites Bild (Rückseite)",
      type: "image",
      options: { hotspot: true },
      description:
        "Optional. Wird beim Hover (Desktop) bzw. Antippen (Handy) mit einer Flip-Animation gezeigt.",
    }),
  ];
}
