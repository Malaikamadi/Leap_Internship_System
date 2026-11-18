import React from 'react';

interface GlobalHeroGlobeProps {
  offsetX?: number;
  offsetY?: number;
}

/**
 * Unobstructed, foreground-ready animated wireframe World Globe & Global Campus Network
 * for the Landing Page Hero right showcase column.
 */
export const GlobalHeroGlobe: React.FC<GlobalHeroGlobeProps> = ({
  offsetX = 0,
  offsetY = 0,
}) => {
  return (
    <div
      className="relative mx-auto w-full max-w-[460px] lg:max-w-[520px] aspect-square flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Focused Atmospheric Teal Illumination Behind the Globe */}
      <div
        className="pointer-events-none absolute inset-4 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(20, 184, 166, 0.42) 0%, rgba(14, 165, 233, 0.16) 45%, rgba(0, 43, 73, 0) 72%)',
          transform: `translate3d(${offsetX * -0.45}px, ${offsetY * -0.45}px, 0)`,
          transition: 'transform 220ms ease-out',
        }}
      />

      {/* Interactive Parallax Wireframe Sphere */}
      <div
        className="relative w-full h-full"
        style={{
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
          transition: 'transform 240ms ease-out',
        }}
      >
        <svg
          viewBox="0 0 620 620"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_28px_rgba(20,184,166,0.18)]"
        >
          <defs>
            <radialGradient id="leapHeroGlobeCore" cx="40%" cy="35%" r="62%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.28" />
              <stop offset="52%" stopColor="#083c63" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#001628" stopOpacity="0.08" />
            </radialGradient>

            <linearGradient id="leapHeroArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#5eead4" stopOpacity="1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
            </linearGradient>

            <clipPath id="leapHeroGlobeClip">
              <circle cx="310" cy="310" r="200" />
            </clipPath>
          </defs>

          {/* Outer Rotating Orbital Ring 1 */}
          <g className="leap-orbit-slow">
            <circle
              cx="310"
              cy="310"
              r="274"
              stroke="#5eead4"
              strokeOpacity="0.24"
              strokeWidth="1.2"
              strokeDasharray="4 10"
            />
            <circle cx="310" cy="36" r="4" fill="#2dd4bf" />
            <circle cx="584" cy="310" r="3" fill="#38bdf8" />
            <circle cx="116" cy="504" r="3" fill="#5eead4" />
          </g>

          {/* Counter-Rotating Precision Reticle Ring 2 */}
          <g className="leap-orbit-reverse">
            <circle
              cx="310"
              cy="310"
              r="240"
              stroke="#94bedc"
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="20 12 4 12"
            />
            <path
              d="M310 64 L310 78 M310 542 L310 556 M64 310 L78 310 M542 310 L556 310"
              stroke="#2dd4bf"
              strokeOpacity="0.6"
              strokeWidth="1.6"
            />
          </g>

          {/* Diagonal Orbital Plane */}
          <ellipse
            cx="310"
            cy="310"
            rx="288"
            ry="98"
            transform="rotate(-22 310 310)"
            stroke="#2dd4bf"
            strokeOpacity="0.24"
            strokeWidth="1.2"
          />

          {/* Main Globe Sphere */}
          <circle
            cx="310"
            cy="310"
            r="200"
            fill="url(#leapHeroGlobeCore)"
            stroke="#5eead4"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />

          {/* Latitude & Longitude Meridians */}
          <g clipPath="url(#leapHeroGlobeClip)" stroke="#94bedc" strokeOpacity="0.28" strokeWidth="1">
            <line x1="310" y1="110" x2="310" y2="510" />
            <ellipse cx="310" cy="310" rx="52" ry="200" />
            <ellipse cx="310" cy="310" rx="106" ry="200" />
            <ellipse cx="310" cy="310" rx="156" ry="200" />

            <line x1="110" y1="310" x2="510" y2="310" stroke="#2dd4bf" strokeOpacity="0.38" />
            <ellipse cx="310" cy="246" rx="188" ry="34" />
            <ellipse cx="310" cy="186" rx="154" ry="26" />
            <ellipse cx="310" cy="374" rx="188" ry="34" />
            <ellipse cx="310" cy="434" rx="154" ry="26" />

            {/* Stylized Continental Tech Matrix Nodes */}
            <g fill="#5eead4" fillOpacity="0.48">
              {/* West Africa & Africa Continent */}
              <circle cx="258" cy="306" r="2.6" />
              <circle cx="268" cy="296" r="2.2" />
              <circle cx="280" cy="302" r="2.4" />
              <circle cx="272" cy="316" r="2.2" />
              <circle cx="288" cy="324" r="2.5" />
              <circle cx="296" cy="340" r="2.2" />
              <circle cx="308" cy="354" r="2.4" />
              <circle cx="316" cy="374" r="2.4" />
              <circle cx="310" cy="396" r="2.2" />
              <circle cx="298" cy="410" r="2.4" />

              {/* Europe / UK */}
              <circle cx="276" cy="212" r="2.4" />
              <circle cx="290" cy="204" r="2.2" />
              <circle cx="304" cy="210" r="2.2" />
              <circle cx="318" cy="220" r="2.4" />
              <circle cx="296" cy="226" r="2" />

              {/* Asia / Malaysia / Cambodia */}
              <circle cx="418" cy="302" r="2.4" />
              <circle cx="432" cy="292" r="2.6" />
              <circle cx="446" cy="306" r="2.2" />
              <circle cx="428" cy="320" r="2.4" />
              <circle cx="458" cy="326" r="2.2" />
              <circle cx="404" cy="280" r="2.2" />
              <circle cx="390" cy="262" r="2.4" />

              {/* Americas Edge */}
              <circle cx="168" cy="244" r="2.2" />
              <circle cx="182" cy="258" r="2.2" />
              <circle cx="192" cy="336" r="2.4" />
              <circle cx="204" cy="358" r="2.2" />
            </g>
          </g>

          {/* Static Faint Global Connection Arcs */}
          <g stroke="#2dd4bf" strokeOpacity="0.28" strokeWidth="1.3" fill="none">
            <path d="M258 306 Q240 242 282 208" />
            <path d="M258 306 Q350 208 434 306" />
            <path d="M258 306 Q272 378 312 404" />
            <path d="M282 208 Q380 188 434 306" />
            <path d="M258 306 Q200 262 172 246" />
          </g>

          {/* Animated Signal Light Streams Along Global Arcs */}
          <g stroke="url(#leapHeroArcGrad)" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M258 306 Q350 208 434 306" className="leap-signal-arc" />
            <path d="M258 306 Q240 242 282 208" className="leap-signal-arc-fast" />
            <path d="M258 306 Q272 378 312 404" className="leap-signal-arc-delayed" />
            <path d="M282 208 Q380 188 434 306" className="leap-signal-arc-delayed" />
          </g>

          {/* Pulsing Global Campus Beacons + Crisp Telemetry Labels */}
          {/* Primary Hub: Freetown, Sierra Leone */}
          <g>
            <circle
              cx="258"
              cy="306"
              r="8"
              stroke="#2dd4bf"
              strokeWidth="2"
              className="leap-beacon-ring"
            />
            <circle cx="258" cy="306" r="5" fill="#2dd4bf" />
            <circle cx="258" cy="306" r="2.2" fill="#ffffff" />
            <rect
              x="126"
              y="293"
              width="120"
              height="24"
              rx="4"
              fill="#001628"
              fillOpacity="0.88"
              stroke="#2dd4bf"
              strokeOpacity="0.55"
            />
            <text
              x="186"
              y="309"
              textAnchor="middle"
              fill="#5eead4"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              FREETOWN HUB
            </text>
          </g>

          {/* Kuala Lumpur Hub */}
          <g>
            <circle
              cx="434"
              cy="306"
              r="6.5"
              stroke="#5eead4"
              strokeWidth="1.6"
              className="leap-beacon-ring-delayed"
            />
            <circle cx="434" cy="306" r="4" fill="#5eead4" />
            <rect
              x="444"
              y="294"
              width="104"
              height="22"
              rx="4"
              fill="#001628"
              fillOpacity="0.82"
              stroke="#5eead4"
              strokeOpacity="0.35"
            />
            <text
              x="496"
              y="309"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              KUALA LUMPUR
            </text>
          </g>

          {/* London Hub */}
          <g>
            <circle cx="282" cy="208" r="3.6" fill="#38bdf8" />
            <rect
              x="292"
              y="196"
              width="66"
              height="20"
              rx="4"
              fill="#001628"
              fillOpacity="0.78"
              stroke="#38bdf8"
              strokeOpacity="0.35"
            />
            <text
              x="325"
              y="209"
              textAnchor="middle"
              fill="#bae6fd"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              LONDON
            </text>
          </g>

          {/* Gaborone / Southern Africa Hub */}
          <g>
            <circle cx="312" cy="404" r="3.6" fill="#2dd4bf" />
            <rect
              x="322"
              y="393"
              width="82"
              height="20"
              rx="4"
              fill="#001628"
              fillOpacity="0.78"
              stroke="#2dd4bf"
              strokeOpacity="0.35"
            />
            <text
              x="363"
              y="406"
              textAnchor="middle"
              fill="#99f6e4"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              GABORONE
            </text>
          </g>
        </svg>
      </div>

      {/* Subtle Bottom Coordinate Tag */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-md border border-teal-400/25 bg-[#001628]/85 px-3 py-1 text-[10px] font-mono tracking-widest text-teal-200/80 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span>8.4657° N, 13.2317° W • GLOBAL CAMPUS NETWORK</span>
      </div>
    </div>
  );
};

/**
 * Compact animated wireframe orbital emblem for Auth panels and Role Dashboard dark headers.
 */
export const MiniTechOrbital: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`pointer-events-none select-none ${className}`}
  >
    <g className="leap-orbit-slow">
      <circle
        cx="120"
        cy="120"
        r="106"
        stroke="#2dd4bf"
        strokeOpacity="0.28"
        strokeWidth="1.2"
        strokeDasharray="4 8"
      />
      <circle cx="120" cy="14" r="3.5" fill="#2dd4bf" />
      <circle cx="226" cy="120" r="2.5" fill="#38bdf8" />
    </g>
    <g className="leap-orbit-reverse">
      <circle
        cx="120"
        cy="120"
        r="82"
        stroke="#94bedc"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="14 10"
      />
    </g>
    <circle cx="120" cy="120" r="58" stroke="#5eead4" strokeOpacity="0.32" strokeWidth="1.2" />
    <ellipse cx="120" cy="120" rx="28" ry="58" stroke="#94bedc" strokeOpacity="0.24" strokeWidth="1" />
    <line x1="62" y1="120" x2="178" y2="120" stroke="#2dd4bf" strokeOpacity="0.32" strokeWidth="1" />
    <path d="M84 114 Q120 74 158 118" stroke="#5eead4" strokeWidth="1.8" className="leap-signal-arc" />
    <circle cx="84" cy="114" r="3" fill="#2dd4bf" />
    <circle cx="158" cy="118" r="2.5" fill="#38bdf8" />
  </svg>
);
