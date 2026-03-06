import { redirect } from "next/navigation";

// The contact form lives on the Über uns page. Redirect for backwards compat.
export default function KontaktPage() {
  redirect("/ueberuns#kontakt");
}
