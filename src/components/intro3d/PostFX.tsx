"use client";

import { EffectComposer, N8AO, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Pilha de pós-processamento, ajustada pro quarto de fim de tarde da foto de
 * referência: sol baixo entrando direto pela janela, pisca-pisca na hera,
 * velas e lanterna acesas.
 *
 * A ORDEM importa e não é arbitrária:
 *   AO → escurece as junções ANTES de qualquer coisa clarear a imagem
 *   Bloom → espalha o que ficou acima do limiar (sol, lâmpadas, chamas)
 *   ToneMapping → comprime o resultado inteiro pra faixa exibível
 *   Vignette → última coisa, sobre a imagem final
 *
 * ATENÇÃO AO LER OS MATERIAIS DA CENA: o renderer está em NoToneMapping e
 * quem aplica ACES é o passe <ToneMapping> abaixo, sobre o buffer INTEIRO.
 * Por isso `toneMapped={false}` num material não isenta nada nesta pilha, e
 * tudo que precisa "estourar" (disco do sol, bulbos, chamas) tem a cor
 * multiplicada por 3–6 na origem — só assim passa do limiar do Bloom depois
 * da compressão.
 *
 * Coisas testadas e REPROVADAS aqui, que não devem voltar:
 *
 *  - GodRays. Com ele, a única configuração em que a oclusão funcionava
 *    (`autoClear={false}` no EffectComposer, que o próprio efeito pede por
 *    aviso no console) fazia a máscara sobrescrever o vidro e a JANELA
 *    APAGAVA. As manchas de sol no piso desta cena não precisam dele: são
 *    sombra real da luz direcional passando pelos montantes.
 *  - `DepthOfField` com `focusDistance` normalizado: borrava tudo, inclusive o
 *    alvo. Se voltar, é com `worldFocusDistance`/`worldFocusRange` (unidades
 *    de mundo) e medindo.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      {/*
        quality="high" + resolução cheia deixava a página inteira travada
        (clique nos objetos parava de responder, confirmado em teste) — não é
        só "mais lento", ficava genuinamente quebrado. halfRes + quality menor
        corta o custo bastante sem sumir com o efeito.

        aoRadius 0.35: a cena é métrica (ver roomLayout.ts), e um raio de 60 cm
        num quarto de 4,6 m escurecia áreas inteiras em vez de marcar junções.
        O que se quer é a sombra de contato onde os objetos encostam no
        colchonete — é ela que desenha a silhueta deles no mergulho de cima.
        Se a hera (900 folhas pequenas) cintilar durante o scroll, a saída é
        baixar para 0.25, NUNCA subir a qualidade.
      */}
      <N8AO aoRadius={0.35} intensity={1.5} distanceFalloff={1} quality="performance" halfRes />

      {/*
        Limiar em 1.0, reservando o brilho pro que é FONTE de luz: sol (×6),
        bulbos do pisca-pisca (×3,2), lanterna (×3,4) e velas (×3), todos bem
        acima de 1. Abaixo disso o inimigo é a roupa de cama branca sob o sol
        direto, que encosta em 0,9 e, com limiar mais baixo, começa a
        florescer — o modo de falha "cena leitosa". Pra halo maior no sol,
        mexer em `radius`, não no limiar.
      */}
      <Bloom luminanceThreshold={1.0} luminanceSmoothing={0.2} intensity={0.7} radius={0.72} />

      {/*
        ACES: a curva padrão de cinema. É ela que segura o estouro do sol sem
        virar um branco chapado e dá o rolloff quente nas altas luzes que faz
        a imagem ler como foto e não como render.
      */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      {/*
        Vinheta discreta. A foto de referência tem o miolo claro com os cantos
        caindo suavemente pra penumbra quente, e é isso que concentra o olho na
        janela — mas pesada demais ela se somaria à sombra natural dos cantos
        e apagaria a cama e as prateleiras, que são planos da composição.
      */}
      <Vignette offset={0.34} darkness={0.3} />
    </EffectComposer>
  );
}
