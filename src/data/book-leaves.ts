import type { BookLeafData } from "@/types/book";
import { COUPLE_MONOGRAM, COUPLE_NAMES, WEDDING_DATE_ISO } from "@/data/site-config";
import { formatEventDateLabel } from "@/lib/date";
import { STORY_SECTIONS } from "@/data/story";
import { EVENT_INFO } from "@/data/event-info";
import { LOCATION } from "@/data/location";
import { FAQ_ITEMS } from "@/data/faq";
import { GALLERY_IMAGES } from "@/data/gallery";

const CHAPTER_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export const bookLeaves: BookLeafData[] = [
  {
    id: "cover-front",
    kind: "cover-front",
    eyebrow: "O livro de",
    coupleNames: COUPLE_NAMES,
    tagline: "um romance em páginas",
    monogram: COUPLE_MONOGRAM,
    instruction: "toque no lacre para abrir",
    footer: formatEventDateLabel(WEDDING_DATE_ISO),
  },
  // Capítulos I-IV: história do casal — mesmo conteúdo/estrutura usado no
  // objeto "Livro" da mesa 3D (ver src/data/story.ts), só que aqui
  // paginado como folhas de livro pro fallback reduced-motion.
  ...STORY_SECTIONS.map(
    (section, i): BookLeafData => ({
      id: section.id,
      kind: "text",
      chapterLabel: `Capítulo ${CHAPTER_NUMERALS[i]}`,
      title: section.title,
      content: section.content,
    })
  ),
  {
    id: "countdown-date",
    kind: "countdown-date",
    targetIso: WEDDING_DATE_ISO,
  },
  {
    id: "countdown",
    kind: "countdown",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[4]}`,
    title: "A contagem regressiva",
    description:
      "Enquanto a última página não chega, contamos cada instante que nos aproxima do dia em que nossas histórias se tornam uma só.",
    targetIso: WEDDING_DATE_ISO,
  },
  ...EVENT_INFO.map(
    (item): BookLeafData => ({
      id: item.id,
      kind: "event-info",
      chapterLabel: item.label,
      title: item.title,
      time: item.time,
      address: item.address,
      note: item.note,
    })
  ),
  {
    id: "location",
    kind: "location",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[7]}`,
    title: "Como chegar",
    venueName: LOCATION.venueName,
    address: LOCATION.address,
    howToArrive: LOCATION.howToArrive,
    mapEmbedUrl: LOCATION.mapEmbedUrl || undefined,
  },
  {
    id: "faq-1",
    kind: "faq",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[8]}`,
    title: "Perguntas frequentes",
    items: FAQ_ITEMS.slice(0, 3),
  },
  {
    id: "faq-2",
    kind: "faq",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[8]}`,
    title: "Perguntas frequentes",
    items: FAQ_ITEMS.slice(3),
  },
  {
    id: "rsvp",
    kind: "rsvp",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[9]}`,
    title: "Confirmação de presença",
  },
  {
    id: "gallery-1",
    kind: "gallery",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[10]}`,
    title: "Banco de Imagens",
    images: GALLERY_IMAGES.slice(0, 3),
  },
  {
    id: "gallery-2",
    kind: "gallery",
    chapterLabel: `Capítulo ${CHAPTER_NUMERALS[10]}`,
    title: "Banco de Imagens",
    images: GALLERY_IMAGES.slice(3),
  },
  {
    id: "cover-back",
    kind: "cover-back",
    monogram: COUPLE_MONOGRAM,
    message: "até a próxima página da nossa história",
    signature: COUPLE_NAMES,
  },
];
