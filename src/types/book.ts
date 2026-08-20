export interface BookImage {
  src: string;
  alt: string;
}

interface BookLeafBase {
  id: string;
}

export interface CoverFrontLeaf extends BookLeafBase {
  kind: "cover-front";
  eyebrow: string;
  coupleNames: string;
  tagline: string;
  monogram: string;
  instruction: string;
  footer: string;
}

export interface CoverBackLeaf extends BookLeafBase {
  kind: "cover-back";
  monogram: string;
  message: string;
  signature: string;
}

export interface ImageLeaf extends BookLeafBase {
  kind: "image";
  chapterLabel: string;
  image: BookImage;
  caption: string;
}

export interface TextLeaf extends BookLeafBase {
  kind: "text";
  chapterLabel: string;
  title: string;
  content: string;
  signature?: string;
}

export interface CountdownDateLeaf extends BookLeafBase {
  kind: "countdown-date";
  targetIso: string;
}

export interface CountdownLeaf extends BookLeafBase {
  kind: "countdown";
  chapterLabel: string;
  title: string;
  description?: string;
  targetIso: string;
}

export interface EventInfoLeaf extends BookLeafBase {
  kind: "event-info";
  chapterLabel: string;
  title: string;
  time: string;
  address: string;
  note?: string;
}

export interface LocationLeaf extends BookLeafBase {
  kind: "location";
  chapterLabel: string;
  title: string;
  venueName: string;
  address: string;
  howToArrive: string;
  mapEmbedUrl?: string;
}

export interface FaqLeaf extends BookLeafBase {
  kind: "faq";
  chapterLabel: string;
  title: string;
  items: { id: string; question: string; answer: string }[];
}

export interface RsvpLeaf extends BookLeafBase {
  kind: "rsvp";
  chapterLabel: string;
  title: string;
}

export interface GalleryLeaf extends BookLeafBase {
  kind: "gallery";
  chapterLabel: string;
  title: string;
  images: { src: string; alt: string; caption?: string }[];
}

export type BookLeafData =
  | CoverFrontLeaf
  | CoverBackLeaf
  | ImageLeaf
  | TextLeaf
  | CountdownDateLeaf
  | CountdownLeaf
  | EventInfoLeaf
  | LocationLeaf
  | FaqLeaf
  | RsvpLeaf
  | GalleryLeaf;

/** true para as capas (mais rígidas, não dobram como papel) */
export function isHardLeaf(leaf: BookLeafData): boolean {
  return leaf.kind === "cover-front" || leaf.kind === "cover-back";
}

export function getChapterLabel(leaf: BookLeafData): string | null {
  switch (leaf.kind) {
    case "image":
    case "text":
    case "countdown":
    case "event-info":
    case "location":
    case "faq":
    case "rsvp":
    case "gallery":
      return leaf.chapterLabel;
    case "cover-front":
    case "cover-back":
    case "countdown-date":
      return null;
    default:
      return assertNever(leaf);
  }
}

/** título legível do capítulo (para o sumário) — null quando a folha não carrega um título próprio */
export function getLeafTitle(leaf: BookLeafData): string | null {
  switch (leaf.kind) {
    case "text":
    case "countdown":
    case "event-info":
    case "location":
    case "faq":
    case "rsvp":
    case "gallery":
      return leaf.title;
    case "image":
    case "cover-front":
    case "cover-back":
    case "countdown-date":
      return null;
    default:
      return assertNever(leaf);
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled book leaf kind: ${JSON.stringify(value)}`);
}
