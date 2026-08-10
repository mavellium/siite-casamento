export interface NavItem {
  id: string;
  label: string;
  href: `#${string}`;
}

export interface EventInfoItem {
  id: string;
  label: string;
  title: string;
  time: string;
  address: string;
  note?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface RsvpFormValues {
  name: string;
  attending: "sim" | "nao";
  guestCount: number;
  message: string;
}
