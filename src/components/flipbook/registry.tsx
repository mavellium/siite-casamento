import { assertNever, type BookLeafData } from "@/types/book";
import { CoverFrontPage } from "./pages/CoverFrontPage";
import { CoverBackPage } from "./pages/CoverBackPage";
import { ImagePage } from "./pages/ImagePage";
import { TextPage } from "./pages/TextPage";
import { CountdownDatePage } from "./pages/CountdownDatePage";
import { CountdownPage } from "./pages/CountdownPage";

export function renderLeafContent(leaf: BookLeafData, onOpenCover?: () => void) {
  switch (leaf.kind) {
    case "cover-front":
      return <CoverFrontPage leaf={leaf} onOpen={onOpenCover} />;
    case "cover-back":
      return <CoverBackPage leaf={leaf} />;
    case "image":
      return <ImagePage leaf={leaf} />;
    case "text":
      return <TextPage leaf={leaf} />;
    case "countdown-date":
      return <CountdownDatePage leaf={leaf} />;
    case "countdown":
      return <CountdownPage leaf={leaf} />;
    default:
      return assertNever(leaf);
  }
}
