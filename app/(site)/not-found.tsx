import type { Metadata } from "next";
import ErrorPanel from "@/components/ui/ErrorPanel";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

export default function SiteNotFound() {
  return (
    <ErrorPanel
      code="404"
      title="Diese Seite gibt es nicht"
      message="Der Link ist veraltet oder die Seite wurde verschoben. Hier geht es weiter:"
    />
  );
}
