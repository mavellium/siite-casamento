"use client";

import dynamic from "next/dynamic";
import type { SectionId } from "@/types/section";

/**
 * Único lugar do projeto que chama next/dynamic com ssr:false — só é
 * permitido dentro de um Client Component (confirmado na doc do Next
 * embutida em node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
 * Isola o carregamento do canvas 3D (three/@react-three/fiber) do bundle
 * inicial e evita tentar criar um contexto WebGL no servidor.
 */
const Intro3DScene = dynamic(() => import("./Intro3DScene").then((mod) => mod.Intro3DScene), {
  ssr: false,
  loading: () => <div className="intro3d-placeholder" aria-hidden="true" />,
});

export function Intro3DClientBoundary({ onSelectSection }: { onSelectSection: (id: SectionId) => void }) {
  return <Intro3DScene onSelectSection={onSelectSection} />;
}
