// Montagnes dans la brume (décor du haut de page)
export function Landscape({ height = 170 }: { height?: number }) {
  return (
    <div aria-hidden="true" className="landscape" style={{ height }}>
      <svg viewBox="0 0 1440 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B8C9E0" /><stop offset="1" stopColor="#DCE6F2" /></linearGradient>
          <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7F9BC3" /><stop offset="1" stopColor="#A9BDD8" /></linearGradient>
          <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A6A9A" /><stop offset="1" stopColor="#2A4068" /></linearGradient>
          <linearGradient id="m4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1D2E4D" /><stop offset="1" stopColor="#0B1220" /></linearGradient>
          <filter id="haze"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <path d="M0 150 L120 120 L230 140 L360 95 L470 130 L600 105 L720 135 L860 90 L990 125 L1110 100 L1240 130 L1360 110 L1440 125 V300 H0 Z" fill="url(#m1)" filter="url(#haze)" />
        <path d="M0 190 L140 160 L260 185 L400 150 L520 180 L650 155 L790 185 L930 145 L1060 175 L1200 150 L1330 180 L1440 165 V300 H0 Z" fill="url(#m2)" />
        <ellipse cx="720" cy="205" rx="760" ry="26" fill="#E6EEF7" opacity="0.55" filter="url(#haze)" />
        <path d="M0 230 C180 205 300 222 460 212 C640 200 760 228 930 214 C1100 200 1260 222 1440 208 V300 H0 Z" fill="url(#m3)" />
        <path d="M0 262 C220 246 420 258 640 250 C860 242 1080 262 1440 248 V302 H0 Z" fill="url(#m4)" />
      </svg>
    </div>
  );
}
