import type { CoverBackLeaf } from "@/types/book";
import { LeafBranch } from "@/components/decor/LeafBranch";
import { WatercolorFlower } from "@/components/decor/WatercolorFlower";
import { PetalSprinkles } from "@/components/decor/PetalSprinkles";
import { SquiggleDoodle, CircleDoodle, SwashUnderline } from "@/components/decor/Doodles";

export function CoverBackPage({ leaf }: { leaf: CoverBackLeaf }) {
  return (
    <div className="cover-v2">
      <PetalSprinkles className="cover-sprinkles" />
      <CircleDoodle className="cover-doodle cover-doodle-tr" />
      <WatercolorFlower className="cover-bloom cover-bloom-tl" />
      <LeafBranch className="cover-branch cover-branch-br" />
      <SquiggleDoodle className="cover-doodle cover-doodle-bl" />

      <div className="cover-v2-content">
        <WatercolorFlower className="cover-v2-top-flower" />
        <p className="cover-v2-eyebrow">fim deste capítulo</p>

        <span className="seal-button seal-button-small cover-v2-seal" aria-hidden="true">
          <span>{leaf.monogram}</span>
        </span>

        <p className="page-signature">{leaf.signature}</p>
        <SwashUnderline className="cover-v2-swash" />
        <p className="cover-instruction">{leaf.message}</p>
      </div>
    </div>
  );
}
