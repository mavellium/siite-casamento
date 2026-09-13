import type { LocationLeaf } from "@/types/book";
import { LocationInfo } from "@/components/sections/LocationInfo";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function LocationPage({ leaf }: { leaf: LocationLeaf }) {
  return (
    <PageChrome contentClassName="leaf-content-text">
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <LocationInfo
        venueName={leaf.venueName}
        address={leaf.address}
        howToArrive={leaf.howToArrive}
        mapEmbedUrl={leaf.mapEmbedUrl}
      />
    </PageChrome>
  );
}
