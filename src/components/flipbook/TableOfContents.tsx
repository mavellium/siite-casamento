"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { OrnamentDivider } from "./PageChrome";

export interface ChapterEntry {
  label: string;
  shortLabel: string;
  title: string;
  index: number;
}

interface TableOfContentsProps {
  open: boolean;
  onClose: () => void;
  chapters: ChapterEntry[];
  activeChapters: ChapterEntry[];
  onSelect: (index: number) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function TableOfContents({
  open,
  onClose,
  chapters,
  activeChapters,
  onSelect,
  triggerRef,
}: TableOfContentsProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>("a,button");
    focusable?.[0]?.focus();
    document.body.style.overflow = "hidden";

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeydown, true);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div className="toc-backdrop" onClick={onClose}>
      <div
        id="book-toc-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sumário do livro"
        className="toc-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="leaf-corner leaf-corner-tl" />
        <span className="leaf-corner leaf-corner-tr" />
        <span className="leaf-corner leaf-corner-bl" />
        <span className="leaf-corner leaf-corner-br" />

        <button type="button" className="toc-close" onClick={onClose} aria-label="Fechar sumário">
          <X size={18} aria-hidden="true" />
        </button>

        <h2 className="toc-heading">Sumário</h2>
        <OrnamentDivider />

        <ul className="toc-list">
          {chapters.map((chapter) => {
            const active = activeChapters.includes(chapter);
            return (
              <li key={chapter.label}>
                <button
                  type="button"
                  className={`toc-item ${active ? "is-active" : ""}`}
                  onClick={() => {
                    onSelect(chapter.index);
                    onClose();
                  }}
                  aria-current={active ? "true" : undefined}
                >
                  <span className="toc-item-roman">{chapter.shortLabel}</span>
                  <span className="toc-item-title">{chapter.title}</span>
                  <span className="toc-item-page">pág. {chapter.index + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
}
