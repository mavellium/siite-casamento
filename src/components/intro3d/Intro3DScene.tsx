"use client";

import { Suspense, useEffect, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CameraRig } from "./CameraRig";
import { Scene } from "./Scene";
import { PostFX } from "./PostFX";
import { QUARTO } from "./palette";
import { ProgressContext, type ProgressRef } from "./progress";
import type { SectionId } from "@/types/section";

function InvalidateBridge({ invalidateRef }: { invalidateRef: MutableRefObject<(() => void) | null> }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);
  return null;
}

/**
 * Cena 3D com câmera controlada por scroll (0–1 do percurso do spacer,
 * ver .intro3d-spacer). O percurso inteiro é só aproximação de câmera —
 * termina com a mesa funcionando como menu (ver Scene/InteractiveObject),
 * sem handoff automático pra nenhum outro componente: cada objeto da mesa
 * chama onSelectSection diretamente ao ser clicado.
 */
export function Intro3DScene({ onSelectSection }: { onSelectSection: (id: SectionId) => void }) {
  const spacerRef = useRef<HTMLDivElement>(null);
  // RefObject<number> em vez de desembrulhar .current aqui (que contava
  // como "ler ref durante o render" pro linter) — CameraRig só lê
  // progressRef.current dentro de useFrame, nunca durante render.
  const progressRef = useRef<ProgressRef["current"]>(0);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  /*
    Não há mais estado pra malha do vidro da janela. Ele existia porque o
    passe GodRays precisa receber a malha já construída (com um ref comum o
    efeito nascia com sun=null). Com a luz difusa da foto de referência não há
    mais GodRays — luz de fonte de área não desenha feixe —, então a malha
    voltou a ser só geometria (ver PostFX e WindowNook).
  */

  useEffect(() => {
    function updateNarrow() {
      setIsNarrow(window.innerWidth < 768);
    }
    updateNarrow();
    window.addEventListener("resize", updateNarrow);
    return () => window.removeEventListener("resize", updateNarrow);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!spacerRef.current) return;

    /*
      scrub:1 (sem pin) — o "prender" visual vem do CSS (.intro3d-stage é
      position:sticky dentro do spacer), não do mecanismo de pin do
      ScrollTrigger. Mais simples e evita o pin em JS brigar com layout do
      Next em dev (efeitos duplicados do StrictMode). O ScrollTrigger aqui
      só mede o progresso 0–1 da rolagem através do spacer.
    */
    const trigger = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        (window as unknown as { __prog?: number }).__prog = self.progress;
        invalidateRef.current?.();
      },
    });

    return () => {
      trigger.kill();
    };
  }, [progressRef]);

  return (
    <div className="intro3d-spacer" ref={spacerRef}>
      <div className="intro3d-stage">
        <Canvas
          /*
            PCF explícito. O padrão do R3F é PCFSoftShadowMap, que o
            three@0.185.1 DEPRECIOU e rebaixa sozinho pra PCFShadowMap com um
            aviso no console — declarar aqui é dizer em voz alta o que já
            acontecia.

            VSMShadowMap foi tentado como caminho pra sombra macia (já que o
            <SoftShadows>/PCSS do drei não compila nesta versão) e REPROVADO
            visualmente: o blur da variância vazava a sombra da parede e do
            nicho por cima da metade de trás da mesa, num borrão escuro que
            engolia o grão da madeira. Com radius 5 era grave, com 2.2
            continuava visível. A sombra nítida do PCF lê melhor; a maciez
            vem do N8AO (contato) e do rebote, não do mapa de sombra.
          */
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 2]}
          // Era "demand" (só renderiza quando algo muda, ver invalidate()
          // abaixo) enquanto desempenho era prioridade. O EffectComposer da
          // pilha de pós-processamento (PostFX) espera um laço de render
          // contínuo — com "demand" a tela ficava preta (confirmado em
          // teste: o composer nunca chegava a desenhar um frame de verdade).
          // Voltar pra contínuo é consistente com a decisão do usuário de
          // priorizar visual sobre performance nesta cena.
          camera={{ fov: 45, near: 0.1, far: 60 }}
          // toneMapping NoToneMapping: quem aplica a curva ACES agora é o
          // passe <ToneMapping> no fim do PostFX. O R3F liga ACES no renderer
          // por padrão — deixar os dois ativos aplicaria a curva duas vezes e
          // lavaria a imagem inteira.
          gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
          onCreated={({ scene }) => {
            // Fundo na cor da parede, e SEM nevoeiro. O nevoeiro existia
            // quando a cena era um palco aberto que precisava desbotar no
            // vazio; agora o quarto é fechado (piso, teto e quatro paredes,
            // ver Shell em Scene.tsx), então nada some ao longe — e um
            // nevoeiro aqui só lavaria a parede do fundo, que é justamente
            // onde está o assunto.
            scene.background = new THREE.Color(QUARTO.parede);
          }}
        >
          <InvalidateBridge invalidateRef={invalidateRef} />
          {/*
            drei's <SoftShadows> (PCSS) foi tentado aqui, mas o shader que
            ela injeta usa unpackRGBAToDepth de um jeito incompatível com o
            three@0.185.1 instalado (erro de compilação de shader,
            confirmado em teste) — removido. O mapa de sombra padrão (PCF)
            com resolução maior (2048, abaixo) já dá uma melhora visível
            sem essa quebra.
          */}
          {/*
            Mapa de ambiente — dá reflexo e luz indireta realista nos
            materiais. lythwood_room é um HDRI de INTERIOR claro e neutro,
            escolhido pra casar com a luz da foto de referência: dia difuso
            atrás de cortina de voil, sem cor quente e sem direção marcada.
            (Antes era venice_sunset, do fim de tarde alaranjado; ficou errado
            no minuto em que o quarto passou a ser este.)

            `files` local em vez de `preset=`: o preset do drei baixa o .hdr de
            raw.githack.com EM TEMPO DE EXECUÇÃO, e esse host se mostrou
            inacessível daqui (ERR_CONNECTION_RESET). Quando falha, a cena
            perde toda a luz indireta EM SILÊNCIO — sem erro visível, só um
            quarto chapado. Servir do próprio domínio tira essa dependência
            (ver scripts/assets-manifest.mjs).

            Suspense é obrigatório: Environment carrega o HDRI de forma
            assíncrona (useLoader por baixo) e, sem um limite de Suspense, a
            árvore inteira do Canvas ficava suspensa pra sempre sem pintar
            nada (tela preta, confirmado em teste).
          */}
          <Suspense fallback={null}>
            <Environment
              files="/3d/hdri/spaichingen_hill_1k.hdr"
              background={false}
              environmentIntensity={0.18}
              environmentRotation={[0, -1.05, 0]}
            />
          </Suspense>

          {/*
            ILUMINAÇÃO — sol baixo de fim de tarde entrando pela janela.

            É o oposto do que esta cena teve na versão anterior (dia difuso
            atrás de cortina de voil, sombras curtas e claras). Aqui a cortina
            não existe: o sol entra DIRETO pelo vão, e as manchas compridas que
            ele desenha no piso, riscadas pelos montantes, são o efeito central
            da foto de referência.

            A ELEVAÇÃO DE 26° NÃO É ARBITRÁRIA. O raio que passa pela borda de
            cima do vão (y = 2,30 em z = -3,6) cai no piso a Δz = 2,30/tan(e).
            Para a mancha terminar em z ≈ +1,0 — a folga entre o banco e a cama
            — é preciso tan(e) = 2,30/4,6, ou seja e ≈ 26°. Isso dá uma mancha
            de ~2,8 m de comprimento. Mexer na altura da janela ou na
            profundidade do quarto muda esse número.

            O azimute é ~19° à DIREITA do eixo da janela. Vem da direita porque
            a cama está à esquerda (ver ROOM.cama): com o sol vindo da esquerda
            ela ficaria no caminho e jogaria a própria sombra por cima das
            manchas, matando o efeito.
          */}
          {/*
            environmentIntensity BAIXO (0.18) e hemisférica alta, não o
            contrário. O HDRI é uma colina de GRAMA: o hemisfério inferior dele
            é verde, e toda superfície virada pra baixo — o teto, na prática —
            amostra justamente esse verde. Com intensidade 0.34 o teto do
            quarto renderizava verde-oliva e a parede da direita puxava pro
            esverdeado. O HDRI aqui serve pro reflexo especular; quem preenche
            a difusa é a hemisférica, que tem cor de chão controlada por nós.
          */}
          <hemisphereLight args={[0xffe9c8, 0xa08a6e, 0.42]} />
          <ambientLight intensity={0.15} color={0xffeacc} />

          {/*
            Frustum de sombra apertado, mas não MAIS apertado que o cômodo.
            Em ±3,4 m ele não cobria a pegada do quarto (4,6 × 7,0 m vistos na
            diagonal da luz): os pedaços de piso que caíam fora ficavam SEM
            sombra nenhuma — três da lib clampa a busca e devolve "iluminado" —
            e a mancha de sol saía como um borrão claro sem as listras dos
            montantes. ±4,2 m cobre, e com 2048 px ainda dá 4,1 mm por texel,
            o que resolve um montante de 35 mm e uma folha de hera de 6 cm.

            É por isso que a geometria do exterior (WindowView) tem castShadow
            desligado: se ela entrasse aqui o frustum teria que crescer pra
            ~20 m, o texel iria pra 10 mm e as manchas perderiam a borda — que
            é justamente o que se quer delas.
          */}
          <directionalLight
            position={[3.7, 6.7, -11.7]}
            target-position={[-0.5, 0.35, 0.6]}
            intensity={3.4}
            color={0xffc894}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-near={0.3}
            shadow-camera-far={24}
            shadow-camera-left={-4.2}
            shadow-camera-right={4.2}
            shadow-camera-top={4.2}
            shadow-camera-bottom={-4.2}
          />

          {/*
            Rebote do piso de madeira de volta pra cima. Num quarto de fim de
            tarde é essa luz que salva a face sombreada dos objetos virados pro
            observador — todos, aqui, já que a chave entra por trás deles.
          */}
          <pointLight position={[0.2, 0.5, -1.4]} color={0xffd9a8} intensity={0.5} distance={4.6} decay={2} />

          {/* Rebote frio da parede oposta — impede que a penumbra vire preto morto. */}
          <pointLight position={[-1.6, 1.9, 0.6]} color={0xc9d4e2} intensity={0.35} distance={4.6} decay={2} />

          <CameraRig progressRef={progressRef} isNarrow={isNarrow} />
          {/*
            Suspense próprio (não o do Environment): a Scene carrega texturas
            PBR com useTexture, que suspende. Sem um limite AQUI, a suspensão
            sobe até a raiz do Canvas e nada é pintado — o mesmo modo de falha
            de tela preta já visto com o Environment.
          */}
          {/*
            ProgressContext entrega o progressRef aos objetos interativos, que
            só ligam os alvos de clique no fim do percurso (ver
            InteractiveObject). Fica aqui dentro do Canvas pra não depender da
            ponte de contexto do R3F.
          */}
          <ProgressContext.Provider value={progressRef}>
            <Suspense fallback={null}>
              <Scene onSelectSection={onSelectSection} />
            </Suspense>
          </ProgressContext.Provider>
          <PostFX />
        </Canvas>
      </div>
    </div>
  );
}
