import type { CoverFrontLeaf } from "@/types/book";
import { PageChrome } from "../PageChrome";

export function CoverFrontPage({ leaf, onOpen }: { leaf: CoverFrontLeaf; onOpen?: () => void }) {
  return (
    <PageChrome>
      <p className="cover-label">{leaf.eyebrow}</p>
      <h1 className="cover-title">{leaf.coupleNames}</h1>
      <p className="cover-subtitle">{leaf.tagline}</p>
      <button type="button" onClick={onOpen} className="seal-button" aria-label="Abrir o livro">
        <span>{leaf.monogram}</span>
      </button>
      <p className="cover-instruction">{leaf.instruction}</p>
      <p className="cover-footer">{leaf.footer}</p>
    </PageChrome>
  );
}
