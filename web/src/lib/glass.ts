import type { CSSProperties } from "react";

// Блик по кромке «жидкого стекла» (таб-бар, плитка загрузки): градиентная рамка в 1px, середину вырезает маска.
// Ставится на отдельный слой absolute inset-0 с border-radius: inherit
export const GLASS_RIM: CSSProperties = {
  padding: 1,
  background:
    "linear-gradient(150deg, rgba(255,255,255,.98), rgba(255,255,255,.2) 32%, rgba(255,255,255,0) 55%, rgba(255,255,255,.35) 82%, rgba(255,255,255,.8))",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};
