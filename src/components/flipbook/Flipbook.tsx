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

/*
  Folhas de conteúdo, sem capa/contracapa — usadas em vez de bookLeaves
  quando startOpen (ver Flipbook abaixo): quem chega pela introdução 3D
  nunca deve poder folhear até ver a capa/contracapa em 2D (esses estados
  "não existem" nesse modo; bater no limite dispara o fechamento em 3D em
  vez disso, ver onOvershoot). Tirar essas duas folhas do array que o motor
  recebe garante isso pra QUALQUER forma de navegação (botão, teclado E
  arraste/toque) — a própria lib nunca deixa flipar além do que existe no
  array (page-flip/src/Flip/Flip.ts, checkDirection), sem precisar
  interceptar cada caminho de gesto por fora.
*/
const CONTENT_LEAVES = bookLeaves.slice(1, -1);

/**
 * startOpen: usado pela introdução 3D (IntroGate) — quando a capa já
 * "abriu" na cena 3D, o livro nasce direto no Capítulo I em vez de na
 * capa fechada, pra não repetir o mesmo gesto de abrir duas vezes.
 * react-pageflip só lê startPage na construção do motor, então isso só
 * funciona corretamente porque o IntroGate remonta o Flipbook (via key/
 * mount condicional) sempre que essa decisão muda — mudar a prop num
 * componente já montado não teria efeito.
 *
 * onOvershoot: só relevante junto com startOpen — chamado quando o usuário
 * tenta folhear além do primeiro/último capítulo (ver goNext/goPrev
 * abaixo), em vez de revelar a capa/contracapa em 2D. Quem usa o
 * fallback de prefers-reduced-motion (startOpen=false) nunca recebe essa
 * prop — não existe cena 3D pra devolver o controle nesse caso, então o
 * comportamento de sempre (setas desabilitando no limite) continua valendo.
 */
export function Flipbook({
  startOpen = false,
  onOvershoot,
}: { startOpen?: boolean; onOvershoot?: (direction: "prev" | "next") => void } = {}) {
  const bookRef = useRef<FlipBookHandle | null>(null);
  const tocTriggerRef = useRef<HTMLButtonElement>(null);
  const [pageIndex, setPageIndex] = useState(startOpen ? 1 : 0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isChapterJumping, setIsChapterJumping] = useState(false);
  const totalPages = bookLeaves.length;
  // Só startOpen muda o array de folhas (ver CONTENT_LEAVES acima) — e
  // startOpen nunca muda depois do mount (comentário acima), então esses
  // valores são constantes pro tempo de vida do componente.
  const leavesToRender = startOpen ? CONTENT_LEAVES : bookLeaves;
  const indexOffset = startOpen ? 1 : 0;
  /*
    pageIndex reflete sempre a folha ESQUERDA/de baixo índice da dupla
    visível (mesma convenção documentada em activeChapters, abaixo) — então
    o último valor alcançável não é totalPages-2 (a última folha em si),
    e sim o início do último PAR. Espelha a mesma conta de pareamento que
    PageCollection.createSpread faz com showCover=false (pares a partir do
    índice 0; se sobrar ímpar, a última folha fica solteira) — só que aqui é
    calculado sobre CONTENT_LEAVES.length e convertido pra numeração
    absoluta via indexOffset.
  */
  const lastContentPairStart =
    indexOffset +
    (CONTENT_LEAVES.length % 2 === 0 ? CONTENT_LEAVES.length - 2 : CONTENT_LEAVES.length - 1);
  // Trava contra um segundo onOvershoot disparar (ex: tecla repetida)
  // enquanto o fechamento em 3D já está a caminho — só reseta se o
  // Flipbook inteiro remontar (nova tentativa de abrir o livro).
  const hasOvershotRef = useRef(false);

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
    // hasOvershotRef trava TODA navegação (não só um segundo overshoot na
    // mesma direção) assim que o fechamento em 3D é pedido — evita que a
    // seta/tecla oposta ainda vire página de verdade no motor 2D durante a
    // janela de crossfade (~400ms) em que ele continua montado por baixo.
    if (isChapterJumping || hasOvershotRef.current) return;
    if (startOpen && onOvershoot && pageIndex >= lastContentPairStart) {
      hasOvershotRef.current = true;
      onOvershoot("next");
      return;
    }
    bookRef.current?.pageFlip().flipNext();
  }, [isChapterJumping, startOpen, onOvershoot, pageIndex, lastContentPairStart]);
  const goPrev = useCallback(() => {
    if (isChapterJumping || hasOvershotRef.current) return;
    if (startOpen && onOvershoot && pageIndex <= indexOffset) {
      hasOvershotRef.current = true;
      onOvershoot("prev");
      return;
    }
    bookRef.current?.pageFlip().flipPrev();
  }, [isChapterJumping, startOpen, onOvershoot, pageIndex, indexOffset]);
  const handleFlip = useCallback(
    (e: { data: number }) => setPageIndex(e.data + indexOffset),
    [indexOffset]
  );

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
    Pular para um capítulo folheia de verdade, do início ao fim, sempre —
    flipNext/flipPrev encadeados (a lib não tem um "flip até a página X
    passando pelas do meio"), sem atalho de pulo instantâneo. O capítulo
    mais distante possível (I ao IX) fica a 12 folhas, então o pior caso é
    ~12 × flippingTime (700ms) ≈ 8,4s — aceito de propósito, já que o pedido
    é sempre ver a virada de verdade, nunca um salto sem animação.
    getCurrentPageIndex()/turnToPage falam a língua do MOTOR (relativa a
    leavesToRender); +indexOffset/-indexOffset converte pra numeração
    absoluta (a mesma de CHAPTERS/target) nos dois pontos onde tocamos o
    motor diretamente — o resto da função já trabalha só com valores
    absolutos.
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

      const start = pf.getCurrentPageIndex() + indexOffset;
      if (start === target) return;

      setIsChapterJumping(true);

      const direction = target > start ? 1 : -1;
      const MAX_REAL_STEPS = 12;

      let steps = 0;
      while (steps < MAX_REAL_STEPS && !isCancelled()) {
        const current = pf.getCurrentPageIndex() + indexOffset;
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
        pf.turnToPage(target - indexOffset);
        setIsChapterJumping(false);
      }
    },
    [indexOffset, waitForFlipSettle]
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

  /*
    Ao entrar ou sair de uma dupla-solteira (capa/contracapa), a lib desenha
    a sombra do vinco (.stf__hardShadow/.stf__hardInnerShadow) na posição de
    uma folha que não existe mais nessa dupla — sobrando um retângulo
    fantasma sobre o fundo do palco enquanto a virada acontece. Esconder as
    sombras só nessas viradas específicas evita o artefato sem perder o
    efeito nas viradas normais entre duas folhas cheias. pageIndex aqui é o
    valor ANTES da virada terminar (só atualiza no fim), então cobre tanto
    sair de uma capa quanto se aproximar dela pelo lado — não dá pra saber
    a direção de viradas por arraste/toque (a lib trata isso por dentro,
    sem passar por goNext/goPrev), por isso o critério é só de proximidade.
    Em modo startOpen não existe mais dupla-solteira nenhuma (showCover=false
    abaixo, sem capa/contracapa no array) — o artefato não pode ocorrer,
    então a heurística fica desligada.
  */
  const nearCover = !startOpen && (pageIndex <= 1 || pageIndex >= totalPages - 2);
  const shadowClass = isFlipping && nearCover ? " is-flipping-near-cover" : "";

  // Em startOpen, capa/contracapa não são páginas navegáveis — o contador
  // mostra só o conteúdo (1 de 14), não a numeração absoluta (2 de 16).
  const displayTotal = startOpen ? totalPages - 2 : totalPages;
  const displayIndex = startOpen ? pageIndex - 1 : pageIndex;

  return (
    <div className={`flipbook-wrap${shadowClass}`}>
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
          showCover={!startOpen}
          startPage={0}
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
          {leavesToRender.map((leaf) => (
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
          {displayIndex + 1} de {displayTotal}
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
