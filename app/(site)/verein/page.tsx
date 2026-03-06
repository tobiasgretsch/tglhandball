import { redirect } from "next/navigation";

// Vereins-Informationen sind auf der Über-uns-Seite. Redirect für Abwärtskompatibilität.
export default function VereinsPage() {
  redirect("/ueberuns");
}
