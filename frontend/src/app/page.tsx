import { FreshSets } from "@/components/fresh-sets";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Marquee } from "@/components/marquee";
import { Menu } from "@/components/menu";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <HowItWorks />
        <Menu />
        <FreshSets />
      </main>
      <SiteFooter />
    </>
  );
}
