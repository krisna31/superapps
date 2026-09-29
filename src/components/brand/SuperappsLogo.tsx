import React from 'react';

export interface SuperappsLogoProps {
  /** Size in pixels (applies to width & height) */
  size?: number;
  /** Extra CSS classes */
  className?: string;
  /** Whether to show the text wordmark 'Superapps OS' next to the emblem */
  showWordmark?: boolean;
  /** Style variant */
  variant?: 'badge' | 'icon';
  /** Extra CSS class for the wordmark text */
  wordmarkClassName?: string;
}

export const SuperappsLogo: React.FC<SuperappsLogoProps> = ({
  size = 36,
  className = '',
  showWordmark = false,
  variant = 'badge',
  wordmarkClassName = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        role="img"
        aria-label="Superapps OS Logo"
      >
        <defs>
          {/* Badge Background Gradient */}
          <linearGradient id="sa-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#0f172a" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>

          {/* Badge Outer Rim Border */}
          <linearGradient id="sa-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>

          {/* Electric Cyan to Blue (Upper Wing) */}
          <linearGradient id="sa-cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Violet to Magenta (Lower Wing) */}
          <linearGradient id="sa-violet-pink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>

          {/* Core Spark Node */}
          <linearGradient id="sa-spark-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>

          {/* Glow Shadow Filter */}
          <filter id="sa-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.35" />
          </filter>
        </defs>

        {variant === 'badge' && (
          <>
            {/* Outer Rounded Squircle Base */}
            <rect
              x="2"
              y="2"
              width="44"
              height="44"
              rx="13"
              fill="url(#sa-bg)"
              stroke="url(#sa-rim)"
              strokeWidth="1.5"
            />
            {/* Subtle inner highlight */}
            <rect
              x="3.5"
              y="3.5"
              width="41"
              height="41"
              rx="11.5"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          </>
        )}

        {/* --- Iconic Geometric Shield & Interlocking Nexus --- */}
        {/* Upper Wing: Top curve sweeping down to center */}
        <path
          d="M 14 16.5 C 14 12.8 17.5 9.5 22.8 9.5 L 31.5 9.5 C 35.2 9.5 38 12.2 38 15.6 C 38 19 35.5 21.5 31.4 22.3 L 24.8 23.8 C 20.6 24.7 18.2 27 18.2 30.6 L 18.2 31.8 L 13 31.8 L 13 29.5 C 13 24.2 16.4 20.5 21.7 19.3 L 28.5 17.8 C 30.6 17.3 31.8 16.3 31.8 15.1 C 31.8 13.8 30.2 13 28.1 13 L 22.2 13 C 19.8 13 18.2 14 17.7 15.8 Z"
          fill="url(#sa-cyan-blue)"
          filter="url(#sa-glow-filter)"
        />

        {/* Lower Wing: Bottom curve sweeping up to center */}
        <path
          d="M 34 31.5 C 34 35.2 30.5 38.5 25.2 38.5 L 16.5 38.5 C 12.8 38.5 10 35.8 10 32.4 C 10 29 12.5 26.5 16.6 25.7 L 23.2 24.2 C 27.4 23.3 29.8 21 29.8 17.4 L 29.8 16.2 L 35 16.2 L 35 18.5 C 35 23.8 31.6 27.5 26.3 28.7 L 19.5 30.2 C 17.4 30.7 16.2 31.7 16.2 32.9 C 16.2 34.2 17.8 35 19.9 35 L 25.8 35 C 28.2 35 29.8 34 30.3 32.2 Z"
          fill="url(#sa-violet-pink)"
        />

        {/* Central Core Spark Node (Dynamic diamond pulse) */}
        <polygon
          points="24,20.5 27.5,24 24,27.5 20.5,24"
          fill="url(#sa-spark-core)"
        />

        {/* Upper Left & Lower Right Precision Accent Dots */}
        <circle cx="16.5" cy="11.5" r="1.5" fill="#38bdf8" />
        <circle cx="31.5" cy="36.5" r="1.5" fill="#c026d3" />
      </svg>

      {showWordmark && (
        <div className={`flex items-center gap-2 ${wordmarkClassName}`}>
          <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
            Superapps<span className="text-blue-500">OS</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-semibold tracking-wider">
            CLIENT-SIDE
          </span>
        </div>
      )}
    </div>
  );
};

export default SuperappsLogo;
