/**
 * Renderiza um texto do casal que ainda termina com o marcador
 * "[a confirmar]" (ver data/location.ts, data/event-info.ts), trocando o
 * marcador por um selo.
 *
 * Existe porque o marcador cru no meio da interface lê como bug — parece
 * texto de desenvolvimento que vazou pra tela. Como selo, lê como decisão de
 * design, e continua dizendo honestamente ao convidado que aquele dado ainda
 * não está fechado. Quando o casal preencher o valor real e tirar o
 * marcador, o selo some sozinho, sem precisar mexer em componente nenhum.
 */

const MARCADOR = /\s*\[a confirmar\]\s*$/i;

export function TextoPendente({ children }: { children: string }) {
  const pendente = MARCADOR.test(children);
  const texto = children.replace(MARCADOR, "");

  return (
    <>
      {texto}
      {pendente && <span className="tag-confirmar">a confirmar</span>}
    </>
  );
}
