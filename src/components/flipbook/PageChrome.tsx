import type { ReactNode } from "react";

export function PageChrome({
  children,
  contentClassName,
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="leaf-chrome">
      <span className="leaf-corner leaf-corner-tl" />
      <span className="leaf-corner leaf-corner-tr" />
      <span className="leaf-corner leaf-corner-bl" />
      <span className="leaf-corner leaf-corner-br" />
      <div className={`leaf-content ${contentClassName ?? ""}`}>{children}</div>
    </div>
  );
}

export function OrnamentDivider() {
  return (
    <div className="leaf-divider" aria-hidden="true">
      <span className="leaf-divider-line" />
      <span className="leaf-divider-glyph">⚭</span>
      <span className="leaf-divider-line" />
    </div>
  );
}
