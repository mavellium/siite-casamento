import type { FaqItem } from "@/types/content";

// TODO(casal): revisar respostas conforme os detalhes finais do evento forem confirmados.
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "presenca",
    question: "Até quando posso confirmar presença?",
    answer:
      "Pedimos que a confirmação seja feita até 30 dias antes do casamento [a confirmar], pelo formulário desta própria página.",
  },
  {
    id: "acompanhante",
    question: "Posso levar acompanhante?",
    answer:
      "Cada convite é nominal. Se o seu incluir acompanhante, o campo aparecerá no formulário de confirmação de presença.",
  },
  {
    id: "criancas",
    question: "A festa é para todas as idades?",
    answer: "Detalhe a confirmar [a confirmar] — atualizaremos esta resposta assim que decidirmos.",
  },
  {
    id: "traje",
    question: "Qual o traje ideal?",
    answer: "Passeio completo [a confirmar]. Em tons de blush, sálvia ou neutros, você está entre amigos.",
  },
  {
    id: "presentes",
    question: "Vocês têm lista de presentes?",
    answer: "Sim — os detalhes serão adicionados aqui em breve [a confirmar].",
  },
];
