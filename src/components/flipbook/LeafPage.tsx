import { forwardRef } from "react";
import { isHardLeaf, type BookLeafData } from "@/types/book";
import { renderLeafContent } from "./registry";

interface LeafPageProps {
  leaf: BookLeafData;
  onOpenCover?: () => void;
}

/**
 * react-pageflip clona cada filho e precisa de acesso ao nó DOM real
 * (ver README: "you should use React.forwardRef... ref required").
 */
export const LeafPage = forwardRef<HTMLDivElement, LeafPageProps>(function LeafPage(
  { leaf, onOpenCover },
  ref
) {
  const hard = isHardLeaf(leaf);
  return (
    <div
      ref={ref}
      className={`leaf ${hard ? "leaf-hard" : "leaf-soft"}`}
      data-density={hard ? "hard" : "soft"}
    >
      {renderLeafContent(leaf, onOpenCover)}
    </div>
  );
});
