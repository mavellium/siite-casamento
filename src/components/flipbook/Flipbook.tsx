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
import { bookLeaves } from "@/data/book-leaves";
import { getChapterLabel } from "@/types/book";
import { LeafPage } from "./LeafPage";

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

interface ChapterEntry {
  label: string;
  shortLabel: string;
  index: number;
}

const CHAPTERS: ChapterEntry[] = bookLeaves.reduce<ChapterEntry[]>((entries, leaf, index) => {
  const label = getChapterLabel(leaf);
  if (label && !entries.some((entry) => entry.label === label)) {
    entries.push({ label, shortLabel: label.split(" ").pop() ?? label, index });
  }
  return entries;
}, []);

export function Flipbook() {
  const bookRef = useRef<FlipBookHandle | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const totalPages = bookLeaves.length;

  const goNext = useCallback(() => bookRef.current?.pageFlip().flipNext(), []);
  const goPrev = useCallback(() => bookRef.current?.pageFlip().flipPrev(), []);
  const handleFlip = useCallback((e: { data: number }) => setPageIndex(e.data), []);

  /*
    Pular para um capítulo distante usa turnToPage (instantâneo), não flip
    (animado): pedir pra virar página por página até um capítulo muitas
    folhas à frente podia travar a virada no meio do caminho — sobretudo no
    modo retrato do mobile. Um sumário de livro de verdade também pula
    direto para o capítulo, sem folhear todas as páginas até lá.
  */
  const goToChapter = useCallback((index: number) => {
    bookRef.current?.pageFlip().turnToPage(index);
    setPageIndex(index);
  }, []);

  // Trava os controles enquanto a página está virando — antes disso, clicar
  // duas vezes rápido numa seta/índice de capítulo podia disparar viradas
  // sobrepostas e quebrar a animação.
  const handleChangeState = useCallback((e: { data: FlippingState }) => {
    setIsFlipping(e.data !== "read");
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (isFlipping) return;
      if (event.key === "ArrowRight") goNext();
      else if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [goNext, goPrev, isFlipping]);

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
    return (exact ?? activeChapters[0])?.label ?? `Página ${pageIndex + 1}`;
  }, [pageIndex, totalPages, activeChapters]);

  const canGoPrev = pageIndex > 0 && !isFlipping;
  const canGoNext = pageIndex < totalPages - 1 && !isFlipping;

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
          width={480}
          height={640}
          size="stretch"
          minWidth={260}
          maxWidth={780}
          minHeight={360}
          maxHeight={1020}
          showCover
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
        <nav className="chapter-index" aria-label="Capítulos do livro">
          {CHAPTERS.map((chapter) => {
            const active = activeChapters.includes(chapter);
            return (
              <button
                key={chapter.label}
                type="button"
                disabled={isFlipping}
                className={`chapter-index-item ${active ? "is-active" : ""}`}
                onClick={() => goToChapter(chapter.index)}
                aria-current={active ? "true" : undefined}
                title={chapter.label}
              >
                {chapter.shortLabel}
              </button>
            );
          })}
        </nav>
        <p className="page-counter" aria-hidden="true">
          {pageIndex + 1} de {totalPages}
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {currentLabel}
      </p>
    </div>
  );
}
