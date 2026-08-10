import type { CoverFrontLeaf } from "@/types/book";
import { LeafBranch } from "@/components/decor/LeafBranch";
import { WatercolorFlower } from "@/components/decor/WatercolorFlower";
import { PetalSprinkles } from "@/components/decor/PetalSprinkles";
import { SquiggleDoodle, CircleDoodle, SwashUnderline } from "@/components/decor/Doodles";

export function CoverFrontPage({ leaf, onOpen }: { leaf: CoverFrontLeaf; onOpen?: () => void }) {
  const [firstName, secondName] = leaf.coupleNames.split(" & ");

  return (
    <div className="cover-v2">
      <PetalSprinkles className="cover-sprinkles" />
      <SquiggleDoodle className="cover-doodle cover-doodle-tl" />
      <WatercolorFlower className="cover-bloom cover-bloom-tr" />
      <LeafBranch className="cover-branch cover-branch-bl" />
      <CircleDoodle className="cover-doodle cover-doodle-br" />

      <div className="cover-v2-content">
        <WatercolorFlower className="cover-v2-top-flower" />
        <p className="cover-v2-eyebrow">{leaf.eyebrow}</p>
        <p className="cover-v2-kicker">{leaf.tagline}</p>

        <h1 className="cover-v2-name">{firstName}</h1>

        <div className="cover-v2-amp-row">
          <LeafBranch className="cover-v2-amp-leaf" />
          <span className="cover-v2-amp">&amp;</span>
          <WatercolorFlower className="cover-v2-amp-flower" />
        </div>

        <h1 className="cover-v2-name">{secondName}</h1>
        <SwashUnderline className="cover-v2-swash" />

        <button type="button" onClick={onOpen} className="seal-button cover-v2-seal" aria-label="Abrir o livro">
          <span>{leaf.monogram}</span>
        </button>
        <p className="cover-instruction">{leaf.instruction}</p>
        <p className="cover-footer">{leaf.footer}</p>
      </div>
    </div>
  );
}
