export function BatLogo({ size = 30, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={(size * 40) / 68} viewBox="0 0 68 40" fill="none" aria-hidden="true">
      <path
        d="M34 6 L38 16 L46 4 L48 18 C56 14 64 16 68 24 C58 22 52 26 48 34 C44 30 39 30 34 38 C29 30 24 30 20 34 C16 26 10 22 0 24 C4 16 12 14 20 18 L22 4 L30 16 Z"
        fill={color}
      />
    </svg>
  );
}
