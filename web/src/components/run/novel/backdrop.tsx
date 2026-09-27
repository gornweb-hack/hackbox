import { useId } from "react";

// Ширина повторяющегося узора облаков; совпадает со сдвигом анимации car-speed (globals.css)
const SPEED_PERIOD = 100;

// Фон новеллы: салон с большим окном и спинками кресел. Рисуется «с запасом» и обрезается под
// квадратную сцену на телефоне и широкую на компьютере (preserveAspectRatio slice)
export function Backdrop({ station }: { station?: boolean }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0 h-full w-full">
      <rect width="400" height="400" fill="#e3e9f0" />
      <rect width="400" height="22" fill="#d3dbe4" />
      <rect x="10" y="18" width="380" height="6" rx="3" fill="#b3bec9" />
      <clipPath id={clip}>
        <rect x="34" y="58" width="332" height="150" rx="28" />
      </clipPath>
      <rect x="26" y="50" width="348" height="166" rx="34" fill="#a9bccd" />
      <rect x="34" y="58" width="332" height="150" rx="28" fill="#d7e7f3" />
      <g clipPath={`url(#${clip})`}>
        {station ? (
          <g>
            <rect x="34" y="150" width="332" height="58" fill="#aab3bd" />
            <rect x="34" y="146" width="332" height="5" fill="#e3c14a" />
            <rect x="196" y="58" width="12" height="90" fill="#7c8894" />
            <rect x="160" y="82" width="84" height="22" rx="4" fill="#1f5bff" />
            <text x="202" y="98" textAnchor="middle" fontSize="13" fontWeight="600" fill="#fff" fontFamily="sans-serif">
              Тверь
            </text>
          </g>
        ) : (
          <g>
            <path d="M34 165 Q120 150 200 165 T366 160 L366 208 L34 208 Z" fill="#a9cf9a" />
            <path d="M34 185 Q200 175 366 185 L366 208 L34 208 Z" fill="#86b77b" />
            <g className="motion-safe:animate-car-speed" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.85">
              {[0, 1, 2, 3, 4].map((copy) => (
                <g key={copy} transform={`translate(${34 + copy * SPEED_PERIOD} 0)`}>
                  <line x1="10" y1="88" x2="60" y2="88" />
                  <line x1="45" y1="110" x2="98" y2="110" />
                  <line x1="4" y1="130" x2="40" y2="130" />
                </g>
              ))}
            </g>
          </g>
        )}
      </g>
      <g fill="#3d5a87">
        <path d="M8 400 L12 262 Q14 240 36 240 L150 240 Q172 240 174 262 L178 400 Z" />
        <path d="M222 400 L226 262 Q228 240 250 240 L364 240 Q386 240 388 262 L392 400 Z" />
      </g>
      <rect x="52" y="248" width="82" height="32" rx="8" fill="#f3f5f7" />
      <rect x="266" y="248" width="82" height="32" rx="8" fill="#f3f5f7" />
    </svg>
  );
}
