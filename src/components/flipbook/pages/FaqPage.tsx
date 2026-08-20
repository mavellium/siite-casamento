import type { FaqLeaf } from "@/types/book";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function FaqPage({ leaf }: { leaf: FaqLeaf }) {
  return (
    <PageChrome contentClassName="leaf-content-text">
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <div className="faq-list">
        {leaf.items.map((item) => (
          <details key={item.id} className="faq-item">
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </PageChrome>
  );
}
