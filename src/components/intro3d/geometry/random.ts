/**
 * PRNG determinístico compartilhado por toda a cena 3D.
 *
 * DETERMINISMO NÃO É PRECIOSISMO AQUI. Math.random() daria uma hera diferente,
 * um céu diferente e um tapete diferente a cada render — impossível de
 * calibrar olhando — e ainda faria o HTML do servidor divergir do cliente.
 * Com semente fixa, a mesma cena sai sempre igual.
 *
 * Vive em módulo próprio, e não copiado dentro de cada componente, por um
 * motivo prático além do óbvio: o `let seed` mutável declarado no corpo de um
 * componente dispara a regra react-hooks/immutability do ESLint ("Cannot
 * reassign variable after render completes"). Fechado dentro desta função de
 * módulo, o estado mutável não é do componente e a regra fica satisfeita — que
 * é o comportamento correto, já que o gerador é chamado só durante o useMemo.
 */
export function mulberry32(seed: number): () => number {
  let estado = seed | 0;
  return function () {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
