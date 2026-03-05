import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";

// "settings" is a singleton — only one document should ever exist.
const SINGLETON_TYPES = new Set(["settings"]);

export default defineConfig({
  name: "tgl-handball",
  title: "TG MIPA Handball",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",

  basePath: "/studio",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Inhalt")
          .items([
            // Singleton: settings always opens the same fixed document
            S.listItem()
              .title("Einstellungen")
              .id("settings")
              .child(
                S.document()
                  .schemaType("settings")
                  .documentId("settings")
              ),
            S.divider(),
            // All other document types shown normally
            ...S.documentTypeListItems().filter(
              (item) => !SINGLETON_TYPES.has(item.getId() ?? "")
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Prevent creating duplicate singleton or deleting/duplicating it
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter(
          (template) => !SINGLETON_TYPES.has(template.templateId)
        );
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      if (SINGLETON_TYPES.has(schemaType)) {
        return prev.filter(
          ({ action }) => action !== "duplicate" && action !== "delete"
        );
      }
      return prev;
    },
  },
});
