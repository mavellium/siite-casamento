"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { criarCordao, distribuirBulbos } from "../geometry/ivyPath";

/**
 * O pisca-pisca entrelaçado na hera.
 *
 * O BRILHO VEM DO BLOOM, NÃO DE LUZES. São 48 lâmpadas num único
 * InstancedMesh de material básico, com a cor guardada em `instanceColor`
 * MULTIPLICADA por 3,2 — acima de 1, portanto. `instanceColor` é um
 * Float32BufferAttribute e o EffectComposer usa buffer HalfFloat, então esses
 * valores sobrevivem intactos até o passe de Bloom, que os transforma em
 * halos. Quarenta e oito pontLights de verdade seriam impagáveis.
 *
 * Por que 3,2 e não 1,5: nesta pilha o renderer está em NoToneMapping e quem
 * aplica ACES é o passe do composer, sobre o buffer inteiro — `toneMapped`
 * num material não isenta nada. O ACES comprime forte, então a separação entre
 * "branco iluminado" e "lâmpada acesa" precisa ser feita bem acima de 1,0.
 *
 * TRÊS pointLights reais, e só. Cada point light entra num laço por fragmento
 * em TODOS os materiais iluminados da cena — e aqui há paredes cobrindo a tela
 * inteira. A função delas não é iluminar o quarto, é pôr queda de luz quente
 * no requadro e nas folhas vizinhas, que é o que integra o cordão à hera em
 * vez de deixá-lo flutuando por cima.
 */

const QUANTIDADE = 48;
const COR_BASE = new THREE.Color(1.0, 0.72, 0.38);
const GANHO = 3.2;

export function FairyLights() {
  const bulbosRef = useRef<THREE.InstancedMesh>(null);
  const cordao = useMemo(() => criarCordao(), []);
  const posicoes = useMemo(() => distribuirBulbos(cordao, QUANTIDADE), [cordao]);
  const fio = useMemo(() => new THREE.TubeGeometry(cordao, 200, 0.003, 3, true), [cordao]);

  /** Fase própria de cada lâmpada, derivada do índice — determinista. */
  const fases = useMemo(
    () => Array.from({ length: QUANTIDADE }, (_, i) => (i * 2.399963) % (Math.PI * 2)),
    []
  );

  const luzes = useMemo(
    () => [1 / 6, 1 / 2, 5 / 6].map((t) => cordao.getPointAt(t)),
    [cordao]
  );

  useLayoutEffect(() => {
    const malha = bulbosRef.current;
    if (!malha) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const cor = COR_BASE.clone().multiplyScalar(GANHO);

    posicoes.forEach((p, i) => {
      malha.setMatrixAt(i, m.compose(p, q, s));
      malha.setColorAt(i, cor);
    });
    malha.instanceMatrix.needsUpdate = true;
    if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
    malha.computeBoundingSphere();
  }, [posicoes]);

  /*
    Cintilar sem re-render: escreve direto no array de instanceColor, 144
    floats por frame. É o mesmo princípio do progressRef — mutação fora do
    ciclo do React, porque re-renderizar a árvore a 60fps pra piscar uma luz
    seria absurdo.
  */
  /*
    eslint-disable react-hooks/immutability -- padrão canônico do R3F, o mesmo
    já usado em CameraRig: useFrame roda FORA do ciclo de render do React (é o
    laço de animação da lib), e mutar objetos three.js dentro dele é a forma
    documentada de animar. A alternativa — setState a 60fps pra piscar 48
    lâmpadas — recriaria a árvore da cena inteira a cada quadro.
  */
  useFrame((state) => {
    const malha = bulbosRef.current;
    const atributo = malha?.instanceColor;
    if (!malha || !atributo) return;

    const t = state.clock.elapsedTime;
    const array = atributo.array as Float32Array;
    for (let i = 0; i < QUANTIDADE; i++) {
      // Oscilação pequena (±9%): lâmpada de fada respira, não pisca. Amplitude
      // maior leria como luz de natal defeituosa.
      const g = GANHO * (1 + Math.sin(t * 1.7 + fases[i]) * 0.09);
      array[i * 3] = COR_BASE.r * g;
      array[i * 3 + 1] = COR_BASE.g * g;
      array[i * 3 + 2] = COR_BASE.b * g;
    }
    atributo.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      <mesh geometry={fio}>
        <meshStandardMaterial color={0x3a3128} roughness={0.8} metalness={0.1} />
      </mesh>

      <instancedMesh ref={bulbosRef} args={[undefined, undefined, QUANTIDADE]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <meshBasicMaterial />
      </instancedMesh>

      {luzes.map((p, i) => (
        <pointLight key={i} position={p} color={0xffb765} intensity={0.7} distance={1.4} decay={2} />
      ))}
    </group>
  );
}
