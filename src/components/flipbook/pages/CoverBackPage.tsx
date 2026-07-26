import type { CoverBackLeaf } from "@/types/book";
import { PageChrome } from "../PageChrome";

export function CoverBackPage({ leaf }: { leaf: CoverBackLeaf }) {
  return (
    <PageChrome>
      <span className="seal-button seal-button-small" aria-hidden="true">
        <span>{leaf.monogram}</span>
      </span>
      <p className="page-signature">{leaf.signature}</p>
      <p className="cover-instruction">{leaf.message}</p>
    </PageChrome>
  );
}
