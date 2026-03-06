import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Skip-to-content link — invisible until focused by keyboard */}
      <a href="#main-content" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="main-content" className="pt-[68px] lg:pt-[76px]">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
