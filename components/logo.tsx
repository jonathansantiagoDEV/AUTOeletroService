export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Autoserviços">
      <rect width="100" height="100" rx="12" fill="#F5F7FA" />
      <rect x="2" y="2" width="96" height="96" rx="10" stroke="#8B1A1A" strokeWidth="1.5" fill="none" />
      <text
        x="50"
        y="28"
        textAnchor="middle"
        fontFamily="Times New Roman, serif"
        fontSize="20"
        fontWeight="900"
        fill="#1A1A1A"
        letterSpacing="4"
      >
        TUDOR
      </text>
      <line x1="15" y1="36" x2="85" y2="36" stroke="#8B1A1A" strokeWidth="1.5" />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontWeight="800"
        fill="#1A1A1A"
        letterSpacing="4"
      >
        BATERIAS
      </text>
      <line x1="20" y1="60" x2="80" y2="60" stroke="#8B1A1A" strokeWidth="0.8" />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontWeight="600"
        fill="#1A1A1A"
        letterSpacing="3"
      >
        24 HORAS
      </text>
      <polygon points="50,80 47,89 50,86 53,95 56,86 53,89" fill="#8B1A1A" opacity="0.8" />
    </svg>
  )
}
