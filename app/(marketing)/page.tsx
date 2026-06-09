import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaBand } from "@/components/landing/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services compact />
      <StatsBar />
      <CtaBand />
    </>
  );
}
