
import React from 'react';

interface FootballLogoProps {
  className?: string;
}

const FootballLogo: React.FC<FootballLogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sphereGradient" cx="40%" cy="40%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset dx="1" dy="1" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
          <feFlood floodColor="#000" floodOpacity="0.3" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>
      
      {/* Ball Shadow */}
      <ellipse cx="50" cy="95" rx="40" ry="5" fill="black" opacity="0.1" />
      
      {/* Main Sphere */}
      <circle cx="50" cy="50" r="48" fill="url(#sphereGradient)" stroke="#cbd5e1" strokeWidth="0.5" />
      
      {/* Patches (Pentagons & Hexagons) */}
      <g fill="#1e293b" filter="url(#innerShadow)">
        {/* Center Pentagon */}
        <path d="M50 35 L62 43 L58 57 L42 57 L38 43 Z" />
        
        {/* Surrounding Patches */}
        <path d="M50 10 L60 20 L50 35 L40 20 Z" />
        <path d="M15 40 L25 35 L38 43 L32 55 L15 50 Z" />
        <path d="M85 40 L75 35 L62 43 L68 55 L85 50 Z" />
        <path d="M25 80 L35 75 L42 57 L32 55 L18 65 Z" />
        <path d="M75 80 L65 75 L58 57 L68 55 L82 65 Z" />
        <path d="M50 90 L60 85 L58 57 L42 57 L40 85 Z" />
      </g>
      
      {/* Seams / Lines */}
      <g fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.6">
        <circle cx="50" cy="50" r="48" />
        <path d="M50 35 V10" />
        <path d="M62 43 L85 40" />
        <path d="M58 57 L75 80" />
        <path d="M42 57 L25 80" />
        <path d="M38 43 L15 40" />
      </g>
      
      {/* Shine Overlay */}
      <circle cx="50" cy="50" r="48" fill="white" opacity="0.05" />
    </svg>
  );
};

export default FootballLogo;
