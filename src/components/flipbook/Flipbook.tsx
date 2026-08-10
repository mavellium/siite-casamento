"use client";

import { useCallback, useMemo, useRef, useState, type ComponentProps, type ComponentType } from "react";
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
  flip: (pageIndex: number, corner?: "top" | "bottom") => void;
  getCurrentPageIndex: () => number;
  getPageCount: () => number;
}
interface FlipBookHandle {
  pageFlip: () => PageFlipInstance;
}

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
  const totalPages = bookLeaves.length;

  const goNext = useCallback(() => bookRef.current?.pageFlip().flipNext(), []);
  const goPrev = useCallback(() => bookRef.current?.pageFlip().flipPrev(), []);
  const goToChapter = useCallback((index: number) => bookRef.current?.pageFlip().flip(index), []);
  const handleFlip = useCallback((e: { data: number }) => setPageIndex(e.data), []);

  const activeChapterIndex = useMemo(() => {
    let active = -1;
    CHAPTERS.forEach((chapter, i) => {
      if (pageIndex >= chapter.index) active = i;
    });
    return active;
  }, [pageIndex]);

  return (
    <div className="flipbook-wrap">
      <div className="flipbook-stage">
        <button
          type="button"
          onClick={goPrev}
          disabled={pageIndex === 0}
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
        >
          {bookLeaves.map((leaf) => (
            <LeafPage key={leaf.id} leaf={leaf} onOpenCover={goNext} />
          ))}
        </HTMLFlipBook>

        <button
          type="button"
          onClick={goNext}
          disabled={pageIndex >= totalPages - 1}
          className="flipbook-arrow flipbook-arrow-right"
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>

      <nav className="chapter-index" aria-label="Capítulos do livro">
        {CHAPTERS.map((chapter, i) => (
          <button
            key={chapter.label}
            type="button"
            className={`chapter-index-item ${i === activeChapterIndex ? "is-active" : ""}`}
            onClick={() => goToChapter(chapter.index)}
            aria-current={i === activeChapterIndex ? "true" : undefined}
            title={chapter.label}
          >
            {chapter.shortLabel}
          </button>
        ))}
      </nav>
    </div>
  );
}
