export function BackgroundTexture() {
  return (
    <div className="texture-root" aria-hidden="true">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="paperDistort">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="texture-image-layer" />
      <div className="texture-wash" />
      <div className="texture-brushstrokes" />
      <div className="texture-grain" />
      <div className="texture-vignette" />
    </div>
  );
}
