"use client";

export function FoxAvatar({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ears */}
      <path d="M18 28L12 8L30 22Z" fill="#E8740C" stroke="#D2660A" strokeWidth="1.5"/>
      <path d="M62 28L68 8L50 22Z" fill="#E8740C" stroke="#D2660A" strokeWidth="1.5"/>
      <path d="M20 25L16 12L28 22Z" fill="#F5C18C"/>
      <path d="M60 25L64 12L52 22Z" fill="#F5C18C"/>
      {/* Head */}
      <ellipse cx="40" cy="42" rx="24" ry="22" fill="#E8740C"/>
      <ellipse cx="40" cy="46" rx="16" ry="14" fill="#FDEBD0"/>
      {/* Eyes */}
      <ellipse cx="30" cy="38" rx="4" ry="4.5" fill="#2D1B0E"/>
      <ellipse cx="50" cy="38" rx="4" ry="4.5" fill="#2D1B0E"/>
      <circle cx="31.5" cy="36.5" r="1.5" fill="white"/>
      <circle cx="51.5" cy="36.5" r="1.5" fill="white"/>
      {/* Nose */}
      <ellipse cx="40" cy="48" rx="3.5" ry="2.5" fill="#2D1B0E"/>
      <ellipse cx="40" cy="47.5" rx="1.5" ry="0.8" fill="#5C3D0E" opacity="0.5"/>
      {/* Mouth */}
      <path d="M37 50Q40 54 43 50" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Whiskers */}
      <line x1="12" y1="44" x2="28" y2="46" stroke="#D2660A" strokeWidth="1" opacity="0.6"/>
      <line x1="14" y1="48" x2="28" y2="48" stroke="#D2660A" strokeWidth="1" opacity="0.6"/>
      <line x1="52" y1="46" x2="68" y2="44" stroke="#D2660A" strokeWidth="1" opacity="0.6"/>
      <line x1="52" y1="48" x2="66" y2="48" stroke="#D2660A" strokeWidth="1" opacity="0.6"/>
      {/* Cheeks */}
      <circle cx="24" cy="46" r="4" fill="#F5A86B" opacity="0.5"/>
      <circle cx="56" cy="46" r="4" fill="#F5A86B" opacity="0.5"/>
    </svg>
  );
}

export function RabbitAvatar({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ears */}
      <ellipse cx="28" cy="18" rx="8" ry="20" fill="#F0E4D4" stroke="#D4C5A0" strokeWidth="1.5"/>
      <ellipse cx="52" cy="18" rx="8" ry="20" fill="#F0E4D4" stroke="#D4C5A0" strokeWidth="1.5"/>
      <ellipse cx="28" cy="16" rx="4" ry="14" fill="#F5C1C1"/>
      <ellipse cx="52" cy="16" rx="4" ry="14" fill="#F5C1C1"/>
      {/* Head */}
      <circle cx="40" cy="48" r="22" fill="#F0E4D4" stroke="#D4C5A0" strokeWidth="1.5"/>
      {/* Eyes */}
      <ellipse cx="32" cy="44" rx="3.5" ry="4" fill="#2D1B0E"/>
      <ellipse cx="48" cy="44" rx="3.5" ry="4" fill="#2D1B0E"/>
      <circle cx="33" cy="42.5" r="1.5" fill="white"/>
      <circle cx="49" cy="42.5" r="1.5" fill="white"/>
      {/* Nose */}
      <path d="M38 50L40 52L42 50Z" fill="#F5A0A0"/>
      {/* Mouth */}
      <path d="M36 53Q40 57 44 53" stroke="#BFA88A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <line x1="40" y1="52" x2="40" y2="55" stroke="#BFA88A" strokeWidth="1.2"/>
      {/* Cheeks */}
      <circle cx="24" cy="50" r="5" fill="#F5C1C1" opacity="0.4"/>
      <circle cx="56" cy="50" r="5" fill="#F5C1C1" opacity="0.4"/>
    </svg>
  );
}

export function TreeDecoration({ className = "" }: { className?: string }) {
  return (
    <svg width="120" height="160" viewBox="0 0 120 160" fill="none" className={className}>
      {/* Trunk */}
      <rect x="50" y="110" width="20" height="50" rx="4" fill="#8B6914"/>
      <rect x="54" y="115" width="4" height="40" rx="2" fill="#A07828" opacity="0.5"/>
      {/* Tree layers */}
      <path d="M60 10L100 60H20Z" fill="#4A7C23"/>
      <path d="M60 30L110 80H10Z" fill="#5A9A2A"/>
      <path d="M60 50L120 100H0Z" fill="#6B8E23"/>
      {/* Highlights */}
      <path d="M60 10L80 45L60 35Z" fill="#7BA828" opacity="0.4"/>
      <path d="M60 30L85 65L60 55Z" fill="#8FBC2D" opacity="0.3"/>
    </svg>
  );
}

export function SmallTree({ className = "" }: { className?: string }) {
  return (
    <svg width="40" height="50" viewBox="0 0 40 50" fill="none" className={className}>
      <rect x="17" y="35" width="6" height="15" rx="2" fill="#8B6914"/>
      <path d="M20 5L35 25H5Z" fill="#4A7C23"/>
      <path d="M20 12L38 32H2Z" fill="#5A9A2A"/>
      <path d="M20 20L40 40H0Z" fill="#6B8E23"/>
    </svg>
  );
}

export function LeafBranch({ className = "" }: { className?: string }) {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className={className}>
      <path d="M10 50Q40 20 70 30" stroke="#6B8E23" strokeWidth="2" fill="none"/>
      <ellipse cx="25" cy="38" rx="8" ry="5" fill="#7BA828" transform="rotate(-20 25 38)"/>
      <ellipse cx="40" cy="28" rx="9" ry="5" fill="#6B8E23" transform="rotate(-10 40 28)"/>
      <ellipse cx="55" cy="25" rx="8" ry="5" fill="#8FBC2D" transform="rotate(5 55 25)"/>
      <ellipse cx="65" cy="28" rx="7" ry="4" fill="#7BA828" transform="rotate(15 65 28)"/>
      {/* Veins */}
      <line x1="20" y1="38" x2="30" y2="36" stroke="#5A9A2A" strokeWidth="0.8" opacity="0.5"/>
      <line x1="35" y1="28" x2="45" y2="26" stroke="#4A7C23" strokeWidth="0.8" opacity="0.5"/>
    </svg>
  );
}

export function MushroomDecoration({ className = "" }: { className?: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="16" y="24" width="8" height="14" rx="3" fill="#F0E4D4"/>
      <ellipse cx="20" cy="22" rx="16" ry="12" fill="#C0392B"/>
      <circle cx="12" cy="18" r="3" fill="white" opacity="0.7"/>
      <circle cx="24" cy="14" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="18" cy="22" r="2" fill="white" opacity="0.7"/>
      <circle cx="28" cy="20" r="1.5" fill="white" opacity="0.7"/>
    </svg>
  );
}

export function ButterflyDecoration({ className = "" }: { className?: string }) {
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" className={className}>
      <path d="M15 8C10 0 2 2 2 8C2 14 10 16 15 12" fill="#6C5CE7" opacity="0.7"/>
      <path d="M15 8C20 0 28 2 28 8C28 14 20 16 15 12" fill="#A29BFE" opacity="0.7"/>
      <path d="M15 12C11 14 6 18 8 22C10 20 13 16 15 14" fill="#6C5CE7" opacity="0.5"/>
      <path d="M15 12C19 14 24 18 22 22C20 20 17 16 15 14" fill="#A29BFE" opacity="0.5"/>
      <line x1="15" y1="6" x2="15" y2="20" stroke="#5C3D0E" strokeWidth="1"/>
      <circle cx="13" cy="5" r="1" fill="#5C3D0E"/>
      <circle cx="17" cy="5" r="1" fill="#5C3D0E"/>
    </svg>
  );
}

export function HouseIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12L12 3L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10V20H19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="9" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="14" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function CoinIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" fontFamily="K2D">$</text>
    </svg>
  );
}

export function CheckIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function TrashIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 4V3C5 2.45 5.45 2 6 2H10C10.55 2 11 2.45 11 3V4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 4L3.5 13C3.5 13.55 3.95 14 4.5 14H11.5C12.05 14 12.5 13.55 12.5 13L13 4" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="6.5" y1="7" x2="6.5" y2="11" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="9.5" y1="7" x2="9.5" y2="11" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

export function PencilIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="9.5" y1="4.5" x2="11.5" y2="6.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

export function LogoutIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M6 16H3C2.45 16 2 15.55 2 15V3C2 2.45 2.45 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 13L16 9L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function FilterIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 3H14L9.5 8.5V13L6.5 15V8.5L2 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function ChartPieIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 2V9L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 9L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ChartBarIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="2" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="7.5" y="6" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="2" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
