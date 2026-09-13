"use client";

import { QUARTO } from "../palette";
import { ROOM } from "../roomLayout";

/**
 * A janela panorâmica de três folhas da foto de referência: caixilho branco
 * fino, dois montantes verticais dividindo o vão, e a espessura da parede
 * aparecendo em volta como requadro.
 *
 * SUBSTITUIU um nicho com cortinas de voil. As cortinas eram a fonte de luz
 * daquela cena (difusa, de dia claro); aqui a luz é o SOL DIRETO de fim de
 * tarde entrando pelo vão, e é por isso que os montantes importam: são eles
 * que riscam as manchas compridas no piso. Com cortina não haveria mancha
 * nenhuma, só um brilho uniforme.
 *
 * Tudo aqui projeta sombra (`castShadow`), inclusive o requadro. A geometria
 * do EXTERIOR (ver WindowView) é que não projeta — se projetasse, o frustum
 * de sombra teria que crescer de 3,4 m para 20 m e as manchas perderiam a
 * borda nítida.
 */
export function PictureWindow() {
  const { janela, zFundo, espessuraParede } = ROOM;
  const meiaLargura = janela.largura / 2;
  const alturaVao = janela.topo - janela.base;
  const centroY = (janela.topo + janela.base) / 2;
  const zRequadro = zFundo - espessuraParede / 2;
  const perfil = janela.espessuraCaixilho;

  // Posições dos montantes: divide o vão em (montantes + 1) folhas iguais.
  const folgas = janela.montantes + 1;
  const montanteXs = Array.from(
    { length: janela.montantes },
    (_, i) => -meiaLargura + (janela.largura / folgas) * (i + 1)
  );

  return (
    <group>
      {/*
        Requadro: a espessura da parede revelada no vão. São 4 peças (verga,
        peitoril e duas ombreiras) em vez de um plano, porque é justamente a
        PROFUNDIDADE delas que projeta a sombra em L na quina — o detalhe que
        diz "buraco numa parede grossa" em vez de "adesivo".
      */}
      <mesh position={[0, janela.topo + perfil / 2, zRequadro]} castShadow receiveShadow>
        <boxGeometry args={[janela.largura + perfil * 2, perfil, espessuraParede]} />
        <meshStandardMaterial color={QUARTO.caixilho} roughness={0.75} />
      </mesh>
      <mesh position={[0, janela.base - perfil / 2, zRequadro]} castShadow receiveShadow>
        <boxGeometry args={[janela.largura + perfil * 2, perfil, espessuraParede]} />
        <meshStandardMaterial color={QUARTO.caixilho} roughness={0.75} />
      </mesh>
      <mesh position={[-meiaLargura - perfil / 2, centroY, zRequadro]} castShadow receiveShadow>
        <boxGeometry args={[perfil, alturaVao, espessuraParede]} />
        <meshStandardMaterial color={QUARTO.caixilho} roughness={0.75} />
      </mesh>
      <mesh position={[meiaLargura + perfil / 2, centroY, zRequadro]} castShadow receiveShadow>
        <boxGeometry args={[perfil, alturaVao, espessuraParede]} />
        <meshStandardMaterial color={QUARTO.caixilho} roughness={0.75} />
      </mesh>

      {/*
        Montantes. Finos (35 mm) e no plano do vidro. A sombra deles é o
        assunto: com o sol a 26° de elevação, cada um risca o piso ao longo de
        quase 3 m. Com o frustum de sombra apertado em ±3,4 m e 2048 px, o
        texel dá 3,3 mm — resolve um montante de 35 mm com folga.
      */}
      {montanteXs.map((x) => (
        <mesh key={x} position={[x, centroY, janela.zVidro + 0.01]} castShadow receiveShadow>
          <boxGeometry args={[janela.espessuraMontante, alturaVao, 0.05]} />
          <meshStandardMaterial color={QUARTO.caixilho} roughness={0.6} metalness={0.05} />
        </mesh>
      ))}

      {/* Travessa horizontal baixa, como na foto (uma só, perto da base). */}
      <mesh position={[0, janela.base + alturaVao * 0.02, janela.zVidro + 0.01]} castShadow receiveShadow>
        <boxGeometry args={[janela.largura, janela.espessuraMontante, 0.05]} />
        <meshStandardMaterial color={QUARTO.caixilho} roughness={0.6} metalness={0.05} />
      </mesh>

      {/*
        NÃO HÁ VIDRO MODELADO, de propósito.

        Houve: um quad por folha com opacity 0.06, só pra carregar o reflexo
        especular do mapa de ambiente. Resultado medido: DOIS SÓIS no quadro. O
        HDRI de fim de tarde tem o disco solar em valores HDR altíssimos, e
        mesmo atenuado a 6% pela opacidade o reflexo dele no painel passava do
        limiar do Bloom e aparecia como um segundo sol branco, acima do sol de
        verdade da vista (ver WindowView).

        Numa janela de hora dourada com a vista limpa, a ausência do vidro
        passa despercebida; um reflexo errado, não.

        (Se voltar a existir: NÃO usar MeshTransmissionMaterial do drei nem
        meshPhysicalMaterial com `transmission` — os dois renderizam numa
        passada própria que briga com o composer e dão borrão escuro. E zerar
        o envMapIntensity, que é de onde veio o sol duplicado.)
      */}
    </group>
  );
}
