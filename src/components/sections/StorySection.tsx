import { Flipbook } from "@/components/flipbook/Flipbook";
import { SectionHeading } from "./SectionHeading";

export function StorySection() {
  return (
    <section id="historia" className="site-section story-section">
      <SectionHeading eyebrow="Capítulo I" title="Nossa história" />
      <Flipbook />
    </section>
  );
}
