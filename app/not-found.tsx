import SiteNotFound from "@/app/(site)/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export { metadata } from "@/app/(site)/not-found";

/** Unmatched URLs fall outside the (site) layout, so wrap them in the site chrome here. */
export default function RootNotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="pt-[68px] lg:pt-[76px]">
        <SiteNotFound />
      </main>
      <Footer />
    </>
  );
}
