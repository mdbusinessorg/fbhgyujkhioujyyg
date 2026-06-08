import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppFloat } from "@/components/landing/WhatsAppFloat";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
