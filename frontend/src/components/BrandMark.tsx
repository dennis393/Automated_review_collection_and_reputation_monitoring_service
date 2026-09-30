interface BrandMarkProps {
  size?: number;
}

// Фирменный значок — градиент и звезда как в логотипе Replyo AI,
// используется как единая "точка идентичности" на экранах входа
export default function BrandMark({ size = 48 }: BrandMarkProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, var(--color-brand-start), var(--color-brand-end))",
      }}
    >
      <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5l2.55 5.94 6.45.6-4.88 4.27 1.45 6.32L12 16.6l-5.57 3.03 1.45-6.32L3 8.04l6.45-.6L12 2.5z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
