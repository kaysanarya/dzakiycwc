import React from "react";

interface VellumLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export function VellumLogoMark({
  className = "w-8 h-8",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VELLUM AI Agent Mark"
    >
      {/* Left heavy V-wing */}
      <polygon
        points="4,32 30,32 54,72 43,98 2,32"
        fill={color}
      />
      {/* Right dot (i-dot) */}
      <circle cx="68" cy="40" r="12" fill={color} />
      {/* Right lower angled bar */}
      <polygon
        points="57,59 75,59 60,94 43,98"
        fill={color}
      />
    </svg>
  );
}

export function VellumLogo({
  className = "h-8",
  iconSize = 32,
  showText = true,
}: {
  className?: string;
  iconSize?: number;
  showText?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Logo Mark Icon */}
      <div
        className="flex items-center justify-center shrink-0 text-white"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          {/* Left heavy V-wing */}
          <polygon
            points="3,32 30,32 53,74 42,97 3,32"
            fill="currentColor"
          />
          {/* Right dot */}
          <circle cx="68" cy="40" r="12" fill="currentColor" />
          {/* Right lower angled bar */}
          <polygon
            points="58,58 75,58 60,94 43,97"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Brand Text Lockup */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center">
            <span className="text-lg font-black tracking-[0.08em] text-white font-sans">
              VELLUM
            </span>
          </div>
          <span className="text-[11px] font-medium tracking-[0.06em] text-white/50 -mt-0.5">
            AI Agent
          </span>
        </div>
      )}
    </div>
  );
}

export default VellumLogo;
