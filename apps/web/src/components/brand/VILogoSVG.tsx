'use client';
import { useId } from 'react';
interface VILogoSVGProps {
  size?: number
  showWordmark?: boolean
  showTagline?: boolean
  className?: string
  tone?: 'dark' | 'light' | 'inherit'
}

/**
 * Version D — static fallback of the approved Virtual Ink VI monogram.
 * Rendered when WebGL is unavailable or reduced-motion / static mode is requested.
 */
export default function VILogoSVG({
  size = 320,
  showWordmark = true,
  showTagline = true,
  className,
  tone = 'light',
}: VILogoSVGProps) {
  const id = useId().replaceAll(':', '');
  const textH = showWordmark ? (showTagline ? 118 : 84) : 0
  const vbH = 400 + textH
  return (
    <svg
      viewBox={`0 0 480 ${vbH}`}
      width={size}
      height={(size * vbH) / 480}
      className={className}
      role="img"
      aria-label="Virtual Ink logo"
    >
      <defs>
        <linearGradient id={`${id}-vi-v`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C2FF" />
          <stop offset="38%" stopColor="#007BFF" />
          <stop offset="72%" stopColor="#7A3BFF" />
          <stop offset="100%" stopColor="#FF2D8B" />
        </linearGradient>
        <linearGradient id={`${id}-vi-i`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#00C2FF" />
          <stop offset="42%" stopColor="#007BFF" />
          <stop offset="100%" stopColor="#161E33" />
        </linearGradient>
        <linearGradient id={`${id}-vi-drop`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF2D8B" />
          <stop offset="100%" stopColor="#7A3BFF" />
        </linearGradient>
        <linearGradient id={`${id}-vi-px`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C2FF" />
          <stop offset="100%" stopColor="#007BFF" />
        </linearGradient>
      </defs>

      {/* pixels */}
      <g fill={`url(#${id}-vi-px)`}>
        <rect x="80" y="86" width="30" height="30" rx="7" />
        <rect x="132" y="40" width="20" height="20" rx="5" />
        <rect x="44" y="36" width="23" height="23" rx="6" />
        <rect x="46" y="140" width="15" height="15" rx="4" />
        <rect x="126" y="120" width="13" height="13" rx="4" />
      </g>

      {/* V ribbon */}
      <path
        fill={`url(#${id}-vi-v)`}
        d="M 78 96
           Q 66 96 72 110
           L 188 318
           Q 200 342 212 318
           L 328 110
           Q 334 96 322 96
           L 282 96
           Q 271 96 266 108
           L 212 232
           Q 200 256 188 232
           L 134 108
           Q 129 96 118 96
           Z"
      />

      {/* I column */}
      <rect x="368" y="118" width="68" height="212" rx="19" fill={`url(#${id}-vi-i)`} />

      {/* droplet */}
      <path
        fill={`url(#${id}-vi-drop)`}
        d="M 402 26
           C 389 51 377 65 377 79
           a 25 25 0 0 0 50 0
           C 427 65 415 51 402 26 Z"
      />
      <ellipse cx="393" cy="72" rx="6" ry="10" fill="#FFFFFF" opacity="0.35" transform="rotate(-18 393 72)" />

      {showWordmark && (
        <text
          x="240"
          y={400 + 52}
          textAnchor="middle"
          fontFamily="'Space Grotesk', 'Segoe UI', sans-serif"
          fontWeight="700"
          fontSize="46"
          letterSpacing="6"
        >
          <tspan fill={tone === 'inherit' ? 'currentColor' : tone === 'dark' ? '#FFFFFF' : '#0B0F17'}>VIRTUAL</tspan>
          <tspan fill={`url(#${id}-vi-v)`} dx="14">INK</tspan>
        </text>
      )}
      {showWordmark && showTagline && (
        <text
          x="240"
          y={400 + 94}
          textAnchor="middle"
          fontFamily="'Space Grotesk', 'Segoe UI', sans-serif"
          fontWeight="400"
          fontSize="15"
          letterSpacing="7"
          fill={tone === 'inherit' ? 'currentColor' : tone === 'dark' ? '#FFFFFF' : '#0B0F17'}
          opacity="0.75"
        >
          DESIGN · PRINT · ORDER · DELIVER
        </text>
      )}
    </svg>
  )
}
