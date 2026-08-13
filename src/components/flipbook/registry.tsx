import { assertNever, type BookLeafData } from "@/types/book";
import { CoverFrontPage } from "./pages/CoverFrontPage";
import { CoverBackPage } from "./pages/CoverBackPage";
import { ImagePage } from "./pages/ImagePage";
import { TextPage } from "./pages/TextPage";
import { CountdownDatePage } from "./pages/CountdownDatePage";
import { CountdownPage } from "./pages/CountdownPage";
import { EventInfoPage } from "./pages/EventInfoPage";
import { LocationPage } from "./pages/LocationPage";
import { FaqPage } from "./pages/FaqPage";
import { RsvpPage } from "./pages/RsvpPage";
import { GalleryPage } from "./pages/GalleryPage";

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
    case "event-info":
      return <EventInfoPage leaf={leaf} />;
    case "location":
      return <LocationPage leaf={leaf} />;
    case "faq":
      return <FaqPage leaf={leaf} />;
    case "rsvp":
      return <RsvpPage leaf={leaf} />;
    case "gallery":
      return <GalleryPage leaf={leaf} />;
    default:
      return assertNever(leaf);
  }
}
