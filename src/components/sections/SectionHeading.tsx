import { OrnamentDivider } from "@/components/flipbook/PageChrome";

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-heading">
      <span className="chapter-label">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      <OrnamentDivider />
    </div>
  );
}
