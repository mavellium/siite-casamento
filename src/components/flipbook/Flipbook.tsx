"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
} from "react";
import RawHTMLFlipBook from "react-pageflip";
import { BookMarked } from "lucide-react";
import { bookLeaves } from "@/data/book-leaves";
import { getChapterLabel, getLeafTitle } from "@/types/book";
import { LeafPage } from "./LeafPage";
import { TableOfContents, type ChapterEntry } from "./TableOfContents";

/**
 * react-pageflip's TS types mark every setting (width, height, drawShadow, ...)
 * as required, even though the underlying library applies its own defaults at
 * runtime for anything not passed (see page-flip/src/Settings.ts). Casting once
 * here avoids repeating that mismatch at every usage site.
 */
type FlipBookProps = Partial<ComponentProps<typeof RawHTMLFlipBook>> & {
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
};
const HTMLFlipBook = RawHTMLFlipBook as unknown as ComponentType<
  FlipBookProps & { ref?: React.Ref<FlipBookHandle> }
>;

interface PageFlipInstance {
  flipNext: (corner?: "top" | "bottom") => void;
  flipPrev: (corner?: "top" | "bottom") => void;
  turnToPage: (pageIndex: number) => void;
  getCurrentPageIndex: () => number;
  getPageCount: () => number;
}
interface FlipBookHandle {
  pageFlip: () => PageFlipInstance;
}

type FlippingState = "user_fold" | "fold_corner" | "flipping" | "read";

/*
  Cada capítulo pode se espalhar por várias folhas (ex: Capítulo I = folha de
  imagem + folha de texto). A folha da imagem vem primeiro e não tem título
  próprio — por isso varremos TODAS as folhas com aquele chapterLabel e
  usamos o primeiro título não-nulo encontrado, em vez de só olhar a
  primeira folha.
*/
const CHAPTERS: ChapterEntry[] = (() => {
  const byLabel = new Map<string, { index: number; title: string | null }>();
  bookLeaves.forEach((leaf, index) => {
    const label = getChapterLabel(leaf);
    if (!label) return;
    const title = getLeafTitle(leaf);
    const existing = byLabel.get(label);
    if (!existing) byLabel.set(label, { index, title });
    else if (!existing.title && title) existing.title = title;
  });
  return Array.from(byLabel.entries()).map(([label, { index, title }]) => ({
    label,
    shortLabel: label.split(" ").pop() ?? label,
    title: title ?? label,
    index,
  }));
})();

export function Flipbook() {
  const bookRef = useRef<FlipBookHandle | null>(null);
  const tocTriggerRef = useRef<HTMLButtonElement>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isChapterJumping, setIsChapterJumping] = useState(false);
  const totalPages = bookLeaves.length;

  // Resolvido quando o motor volta ao estado "read" — é o que permite à
  // animação de salto de capítulo (goToChapter) esperar um passo de flip
  // terminar antes de disparar o próximo, sem precisar de polling.
  const flipSettleResolverRef = useRef<(() => void) | null>(null);
  // Espelha isFlipping num ref (em vez de só state) porque goToChapter
  // precisa checar o estado mais recente do motor de forma síncrona, sem
  // esperar um re-render.
  const isFlippingRef = useRef(false);
  // Incrementado a cada nova chamada de goToChapter e no unmount; uma
  // sequência em andamento confere esse token a cada passo e aborta se ele
  // mudou — é o que permite cancelar de forma limpa se o usuário clicar
  // outro capítulo (ou navegar embora) no meio da animação.
  const chapterJumpTokenRef = useRef(0);

  const goNext = useCallback(() => {
    if (isChapterJumping) return;
    bookRef.current?.pageFlip().flipNext();
  }, [isChapterJumping]);
  const goPrev = useCallback(() => {
    if (isChapterJumping) return;
    bookRef.current?.pageFlip().flipPrev();
  }, [isChapterJumping]);
  const handleFlip = useCallback((e: { data: number }) => setPageIndex(e.data), []);

  const waitForFlipSettle = useCallback((timeoutMs = 1500): Promise<boolean> => {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        flipSettleResolverRef.current = null;
        resolve(false);
      }, timeoutMs);
      flipSettleResolverRef.current = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(true);
      };
    });
  }, []);

  /*
    Pular para um capítulo folheia de verdade (flipNext/flipPrev encadeados,
    a lib não tem um "flip até a página X passando pelas do meio") — mas de
    forma limitada: react-pageflip não permite mudar a duração do flip em
    tempo real, então folhear TODAS as folhas até um capítulo muito distante
    poderia levar vários segundos. Acima de FULL_ANIMATE_LEAF_BUDGET folhas
    de distância, pula quase direto pra perto do alvo (turnToPage) e anima
    de verdade só o trecho final (TAIL_LEAVES) — sempre rápido, ainda com a
    sensação de folhear até chegar.
  */
  const goToChapter = useCallback(
    async (target: number) => {
      const pf = bookRef.current?.pageFlip();
      if (!pf) return;

      const myToken = ++chapterJumpTokenRef.current;
      const isCancelled = () => chapterJumpTokenRef.current !== myToken;

      /*
        Se uma sequência anterior (cancelada por este clique) ou um flip do
        usuário ainda está fisicamente animando no motor, espera ela
        assentar antes de tocar em qualquer coisa. Chamar flipNext/flipPrev/
        turnToPage em cima de uma animação viva faz o motor "terminar à
        força" a antiga por dentro dessa mesma chamada — e o evento de
        conclusão dela fica fácil de confundir com o do nosso passo novo,
        derrubando o índice pra um valor errado no meio do caminho.
      */
      if (isFlippingRef.current) {
        await waitForFlipSettle();
        if (isCancelled()) return;
      }

      const start = pf.getCurrentPageIndex();
      if (start === target) return;

      setIsChapterJumping(true);

      const direction = target > start ? 1 : -1;
      const distance = Math.abs(target - start);
      const FULL_ANIMATE_LEAF_BUDGET = 6;
      const TAIL_LEAVES = 4;
      const MAX_REAL_STEPS = 12;

      if (distance > FULL_ANIMATE_LEAF_BUDGET) {
        const preIndex = Math.min(totalPages - 1, Math.max(0, target - direction * TAIL_LEAVES));
        pf.turnToPage(preIndex);
      }

      let steps = 0;
      while (steps < MAX_REAL_STEPS && !isCancelled()) {
        const current = pf.getCurrentPageIndex();
        const reached = direction > 0 ? current >= target : current <= target;
        if (reached) break;

        const settlePromise = waitForFlipSettle();
        if (direction > 0) pf.flipNext();
        else pf.flipPrev();
        steps += 1;

        const settled = await settlePromise;
        if (!settled || isCancelled()) break;
      }

      if (!isCancelled()) {
        pf.turnToPage(target);
        setIsChapterJumping(false);
      }
    },
    [totalPages, waitForFlipSettle]
  );

  useEffect(
    () => () => {
      chapterJumpTokenRef.current++;
    },
    []
  );

  // Trava os controles enquanto a página está virando — antes disso, clicar
  // duas vezes rápido numa seta/índice de capítulo podia disparar viradas
  // sobrepostas e quebrar a animação.
  const handleChangeState = useCallback((e: { data: FlippingState }) => {
    const flipping = e.data !== "read";
    setIsFlipping(flipping);
    isFlippingRef.current = flipping;
    if (e.data === "read" && flipSettleResolverRef.current) {
      const resolve = flipSettleResolverRef.current;
      flipSettleResolverRef.current = null;
      resolve();
    }
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      // Com o sumário aberto, as setas não devem virar página por baixo dele
      // (o próprio painel já trata Esc/Tab).
      if (isFlipping || isChapterJumping || isTocOpen) return;
      if (event.key === "ArrowRight") goNext();
      else if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [goNext, goPrev, isFlipping, isChapterJumping, isTocOpen]);

  /*
    react-pageflip mostra duas folhas por vez (dupla de página). Quando o
    capítulo alvo cai na folha da DIREITA de uma dupla (ex: III, V, VII, IX —
    índice par, pareado com a folha ímpar anterior), .flip(index) navega
    certo mas o evento onFlip reporta o índice da folha da ESQUERDA da
    dupla — então nunca dá pra comparar com "pageIndex >= chapter.index".
    Em vez disso, um capítulo está "ativo" se a sua folha é uma das duas
    visíveis agora (pageIndex ou pageIndex + 1) — o que também deixa os
    dois capítulos de uma dupla (ex: IV e V) acesos ao mesmo tempo, já que
    os dois estão realmente visíveis lado a lado.
  */
  const activeChapters = useMemo(
    () => CHAPTERS.filter((chapter) => chapter.index === pageIndex || chapter.index === pageIndex + 1),
    [pageIndex]
  );

  const currentLabel = useMemo(() => {
    if (pageIndex === 0) return "Capa";
    if (pageIndex === totalPages - 1) return "Contracapa";
    const exact = activeChapters.find((chapter) => chapter.index === pageIndex);
    return (exact ?? activeChapters[0])?.title ?? `Página ${pageIndex + 1}`;
  }, [pageIndex, totalPages, activeChapters]);

  const canGoPrev = pageIndex > 0 && !isFlipping && !isChapterJumping;
  const canGoNext = pageIndex < totalPages - 1 && !isFlipping && !isChapterJumping;

  return (
    <div className="flipbook-wrap">
      <div className="flipbook-stage">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flipbook-arrow flipbook-arrow-left"
          aria-label="Página anterior"
        >
          ‹
        </button>

        <HTMLFlipBook
          width={420}
          height={560}
          size="stretch"
          minWidth={240}
          maxWidth={620}
          minHeight={260}
          maxHeight={900}
          showCover
          autoSize={false}
          drawShadow
          maxShadowOpacity={0.55}
          flippingTime={700}
          usePortrait
          mobileScrollSupport
          swipeDistance={20}
          disableFlipByClick
          className="flipbook"
          style={{}}
          ref={bookRef}
          onFlip={handleFlip}
          onChangeState={handleChangeState}
        >
          {bookLeaves.map((leaf) => (
            <LeafPage key={leaf.id} leaf={leaf} onOpenCover={goNext} />
          ))}
        </HTMLFlipBook>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="flipbook-arrow flipbook-arrow-right"
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>

      <div className="flipbook-nav-footer">
        <button
          type="button"
          ref={tocTriggerRef}
          className="toc-trigger"
          aria-haspopup="dialog"
          aria-expanded={isTocOpen}
          aria-controls="book-toc-panel"
          aria-label="Abrir sumário do livro"
          onClick={() => setIsTocOpen(true)}
        >
          <BookMarked size={16} aria-hidden="true" /> Sumário
        </button>
        <p className="page-counter" aria-hidden="true">
          {pageIndex + 1} de {totalPages}
        </p>
      </div>

      <TableOfContents
        open={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        chapters={CHAPTERS}
        activeChapters={activeChapters}
        onSelect={goToChapter}
        triggerRef={tocTriggerRef}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {currentLabel}
      </p>
    </div>
  );
}
