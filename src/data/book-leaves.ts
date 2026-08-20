import type { BookLeafData } from "@/types/book";
import { COUPLE_MONOGRAM, COUPLE_NAMES, WEDDING_DATE_ISO } from "@/data/site-config";
import { formatEventDateLabel } from "@/lib/date";
import { EVENT_INFO } from "@/data/event-info";
import { LOCATION } from "@/data/location";
import { FAQ_ITEMS } from "@/data/faq";
import { GALLERY_IMAGES } from "@/data/gallery";

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
  {
    id: "chapter-1-image",
    kind: "image",
    chapterLabel: "Capítulo I",
    image: {
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      alt: "Página de abertura da história do casal",
    },
    caption: "sálvia · começo",
  },
  {
    id: "chapter-1-text",
    kind: "text",
    chapterLabel: "Capítulo I",
    title: "Uma página que se abre",
    content:
      "Nossa história nunca foi escrita em pressa. Foi rascunhada nos detalhes, nas tardes de silêncio compartilhado e no brilho de um olhar que reconheceu, no outro, o seu lar. Convidamos você a testemunhar o momento em que as nossas páginas se tornam uma só — e a virar, com delicadeza, cada folha que nos trouxe até aqui.",
    signature: COUPLE_NAMES,
  },
  {
    id: "chapter-2-image",
    kind: "image",
    chapterLabel: "Capítulo II",
    image: {
      src: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop",
      alt: "Jardim florido representando o próximo capítulo da história",
    },
    caption: "blush · jardim",
  },
  {
    id: "chapter-2-text",
    kind: "text",
    chapterLabel: "Capítulo II",
    title: "O próximo capítulo",
    content:
      "A cada página virada, é como se nosso romance ganhasse uma nova margem. Um jardim de memórias floridas, cartas trocadas e pequenos gestos que nos convidam a seguir adiante juntos. Estamos abrindo mais um trecho para você ler e celebrar conosco.",
    signature: formatEventDateLabel(WEDDING_DATE_ISO),
  },
  {
    id: "countdown-date",
    kind: "countdown-date",
    targetIso: WEDDING_DATE_ISO,
  },
  {
    id: "countdown",
    kind: "countdown",
    chapterLabel: "Capítulo III",
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
    chapterLabel: "Capítulo VI",
    title: "Como chegar",
    venueName: LOCATION.venueName,
    address: LOCATION.address,
    howToArrive: LOCATION.howToArrive,
    mapEmbedUrl: LOCATION.mapEmbedUrl || undefined,
  },
  {
    id: "faq-1",
    kind: "faq",
    chapterLabel: "Capítulo VII",
    title: "Perguntas frequentes",
    items: FAQ_ITEMS.slice(0, 3),
  },
  {
    id: "faq-2",
    kind: "faq",
    chapterLabel: "Capítulo VII",
    title: "Perguntas frequentes",
    items: FAQ_ITEMS.slice(3),
  },
  {
    id: "rsvp",
    kind: "rsvp",
    chapterLabel: "Capítulo VIII",
    title: "Confirmação de presença",
  },
  {
    id: "gallery-1",
    kind: "gallery",
    chapterLabel: "Capítulo IX",
    title: "Galeria",
    images: GALLERY_IMAGES.slice(0, 3),
  },
  {
    id: "gallery-2",
    kind: "gallery",
    chapterLabel: "Capítulo IX",
    title: "Galeria",
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
