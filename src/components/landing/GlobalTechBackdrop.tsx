import React from 'react';

interface GlobalTechBackdropProps {
  offsetX?: number;
  offsetY?: number;
}

/**
 * Architectural wireframe world globe & global campus connection arcs
 * anchored on Limkokwing University — Freetown, Sierra Leone.
 * Uses pure GPU-composited SVG + CSS animations with reduced-motion support.
 */
export const GlobalTechBackdrop: React.FC<GlobalTechBackdropProps> = ({
  offsetX = 0,
  offsetY = 0,
}) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Subtle Architectural Grid Base */}
      <div className="absolute inset-0 leap-geo-grid-dark opacity-70" />

      {/* Focused Atmospheric Teal/Navy Illumination Behind the Globe */}
      <div
        className="absolute -right-24 top-1/2 -translate-y-1/2 h-[640px] w-[640px] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(20, 184, 166, 0.38) 0%, rgba(14, 165, 233, 0.14) 45%, rgba(0, 43, 73, 0) 72%)',
          transform: `translate3d(${offsetX * -0.4}px, calc(-50% + ${offsetY * -0.4}px), 0)`,
          transition: 'transform 220ms ease-out',
        }}
      />

      {/* Left Edge Subtle Ambient Glow */}
      <div
        className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(45, 212, 191, 0.25) 0%, rgba(0, 43, 73, 0) 70%)',
        }}
      />

      {/* Wireframe World Globe + Global Network Arcs */}
      <div
        className="absolute right-[-140px] sm:right-[-90px] lg:right-[-40px] top-1/2 -translate-y-1/2 w-[540px] h-[540px] sm:w-[660px] sm:h-[660px] lg:w-[760px] lg:h-[760px] opacity-85"
        style={{
          transform: `translate3d(${offsetX}px, calc(-50% + ${offsetY}px), 0)`,
          transition: 'transform 260ms ease-out',
        }}
      >
        <svg
          viewBox="0 0 700 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="leapGlobeCore" cx="42%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.18" />
              <stop offset="55%" stopColor="#0a3c63" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#001a2e" stopOpacity="0.02" />
            </radialGradient>

            <linearGradient id="leapArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#5eead4" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
            </linearGradient>

            <clipPath id="leapGlobeClip">
              <circle cx="350" cy="350" r="225" />
            </clipPath>
          </defs>

          {/* Outer Rotating Orbital Reticle 1 */}
          <g className="leap-orbit-slow">
            <circle
              cx="350"
              cy="350"
              r="298"
              stroke="#5eead4"
              strokeOpacity="0.18"
              strokeWidth="1"
              strokeDasharray="4 10"
            />
            <circle cx="350" cy="52" r="3.5" fill="#2dd4bf" fillOpacity="0.8" />
            <circle cx="648" cy="350" r="2.5" fill="#38bdf8" fillOpacity="0.7" />
            <circle cx="139" cy="561" r="2.5" fill="#5eead4" fillOpacity="0.6" />
          </g>

          {/* Outer Counter-Rotating Orbital Reticle 2 */}
          <g className="leap-orbit-reverse">
            <circle
              cx="350"
              cy="350"
              r="262"
              stroke="#94bedc"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="18 14 4 14"
            />
            <path
              d="M350 84 L350 96 M350 604 L350 616 M84 350 L96 350 M604 350 L616 350"
              stroke="#2dd4bf"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
          </g>

          {/* Diagonal Orbital Satellite Plane */}
          <ellipse
            cx="350"
            cy="350"
            rx="315"
            ry="112"
            transform="rotate(-24 350 350)"
            stroke="#2dd4bf"
            strokeOpacity="0.16"
            strokeWidth="1.2"
          />

          {/* Main Globe Sphere Base */}
          <circle
            cx="350"
            cy="350"
            r="225"
            fill="url(#leapGlobeCore)"
            stroke="#5eead4"
            strokeOpacity="0.32"
            strokeWidth="1.4"
          />

          {/* Latitude & Longitude Wireframe Meridians (Clipped to Sphere) */}
          <g clipPath="url(#leapGlobeClip)" stroke="#94bedc" strokeOpacity="0.22" strokeWidth="1">
            {/* Vertical Longitude Ellipses */}
            <line x1="350" y1="125" x2="350" y2="575" />
            <ellipse cx="350" cy="350" rx="58" ry="225" />
            <ellipse cx="350" cy="350" rx="118" ry="225" />
            <ellipse cx="350" cy="350" rx="174" ry="225" />

            {/* Horizontal Latitude Parallels */}
            <line x1="125" y1="350" x2="575" y2="350" stroke="#2dd4bf" strokeOpacity="0.3" />
            <ellipse cx="350" cy="278" rx="212" ry="38" />
            <ellipse cx="350" cy="210" rx="174" ry="30" />
            <ellipse cx="350" cy="422" rx="212" ry="38" />
            <ellipse cx="350" cy="490" rx="174" ry="30" />

            {/* Stylized Dotted Continental Tech Clusters (West Africa, Europe, Asia, Southern Africa) */}
            <g fill="#5eead4" fillOpacity="0.35">
              {/* West Africa / Sierra Leone Hub Cluster */}
              <circle cx="294" cy="346" r="2.2" />
              <circle cx="304" cy="336" r="2" />
              <circle cx="316" cy="342" r="2.2" />
              <circle cx="308" cy="356" r="2" />
              <circle cx="324" cy="364" r="2.4" />
              <circle cx="332" cy="382" r="2" />
              <circle cx="344" cy="396" r="2.2" />
              <circle cx="354" cy="418" r="2.2" />
              <circle cx="348" cy="442" r="2" />
              <circle cx="336" cy="458" r="2.2" />

              {/* Europe / UK Cluster */}
              <circle cx="312" cy="242" r="2.2" />
              <circle cx="326" cy="234" r="2" />
              <circle cx="342" cy="240" r="2" />
              <circle cx="356" cy="250" r="2.2" />
              <circle cx="334" cy="256" r="1.8" />

              {/* Southeast Asia / Kuala Lumpur & Phnom Penh Cluster */}
              <circle cx="468" cy="340" r="2.2" />
              <circle cx="482" cy="330" r="2.4" />
              <circle cx="496" cy="346" r="2" />
              <circle cx="478" cy="362" r="2.2" />
              <circle cx="510" cy="368" r="2" />
              <circle cx="452" cy="316" r="2" />
              <circle cx="436" cy="296" r="2.2" />

              {/* Americas Edge Cluster */}
              <circle cx="192" cy="276" r="2" />
              <circle cx="206" cy="292" r="2" />
              <circle cx="218" cy="378" r="2.2" />
              <circle cx="232" cy="402" r="2" />
            </g>
          </g>

          {/* Static Faint Global Connection Arcs */}
          <g stroke="#2dd4bf" strokeOpacity="0.22" strokeWidth="1.2" fill="none">
            {/* Freetown -> London */}
            <path d="M294 346 Q272 276 318 238" />
            {/* Freetown -> Kuala Lumpur */}
            <path d="M294 346 Q395 240 486 346" />
            {/* Freetown -> Gaborone / Southern Africa */}
            <path d="M294 346 Q310 426 352 452" />
            {/* London -> Kuala Lumpur */}
            <path d="M318 238 Q426 218 486 346" />
            {/* Freetown -> Americas Tech Corridor */}
            <path d="M294 346 Q230 296 196 278" />
          </g>

          {/* Animated Signal Light Streams Along Global Arcs */}
          <g stroke="url(#leapArcGrad)" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M294 346 Q395 240 486 346" className="leap-signal-arc" />
            <path d="M294 346 Q272 276 318 238" className="leap-signal-arc-fast" />
            <path d="M294 346 Q310 426 352 452" className="leap-signal-arc-delayed" />
            <path d="M318 238 Q426 218 486 346" className="leap-signal-arc-delayed" />
          </g>

          {/* Pulsing Global Campus Beacons */}
          {/* Primary Hub: Freetown, Sierra Leone */}
          <g>
            <circle
              cx="294"
              cy="346"
              r="7"
              stroke="#2dd4bf"
              strokeWidth="1.8"
              className="leap-beacon-ring"
            />
            <circle cx="294" cy="346" r="4.5" fill="#2dd4bf" />
            <circle cx="294" cy="346" r="2" fill="#ffffff" />
          </g>

          {/* Kuala Lumpur Global Hub */}
          <g>
            <circle
              cx="486"
              cy="346"
              r="6"
              stroke="#5eead4"
              strokeWidth="1.5"
              className="leap-beacon-ring-delayed"
            />
            <circle cx="486" cy="346" r="3.5" fill="#5eead4" />
          </g>

          {/* London Hub */}
          <circle cx="318" cy="238" r="3.2" fill="#38bdf8" />
          {/* Gaborone / Southern Africa Hub */}
          <circle cx="352" cy="452" r="3.2" fill="#2dd4bf" />
          {/* Americas Partner Node */}
          <circle cx="196" cy="278" r="2.8" fill="#94bedc" />
        </svg>
      </div>

      {/* Subtle Coordinate Telemetry Watermark (bottom-right of hero on large screens) */}
      <div className="hidden lg:flex items-center gap-3 absolute bottom-5 right-8 text-[10px] font-mono tracking-widest text-teal-200/50 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span>8.4657° N, 13.2317° W • FREETOWN GLOBAL TECH HUB</span>
      </div>
    </div>
  );
};

