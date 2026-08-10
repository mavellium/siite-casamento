import { SiteNav } from "@/components/nav/SiteNav";
import { HeroSection } from "@/components/sections/HeroSection";
import { CountdownSection } from "@/components/sections/CountdownSection";
import { EventInfoSection } from "@/components/sections/EventInfoSection";
import { LocationSection } from "@/components/sections/LocationSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { StorySection } from "@/components/sections/StorySection";
import { RsvpSection } from "@/components/sections/RsvpSection";
import { GallerySection } from "@/components/sections/GallerySection";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <HeroSection />
        <CountdownSection />
        <EventInfoSection />
        <LocationSection />
        <FaqSection />
        <StorySection />
        <RsvpSection />
        <GallerySection />
      </main>
    </>
  );
}
