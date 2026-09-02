import React from 'react';

interface NauticalOceanBackgroundProps {
  layerGrid?: boolean;
  zoomScale?: number;
  showDecorations?: boolean;
}

export const NauticalOceanBackground: React.FC<NauticalOceanBackgroundProps> = React.memo(({
  layerGrid = false,
  zoomScale = 1.0,
  showDecorations = true
}) => {
  return (
    <g id="nautical-ocean-master-layer" className="select-none pointer-events-none">
      <defs>
        {/* Deep Ocean Multilayer Gradient */}
        <radialGradient id="deepOceanRadial" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#03487f" />
          <stop offset="45%" stopColor="#023868" />
          <stop offset="75%" stopColor="#02284d" />
          <stop offset="100%" stopColor="#011b35" />
        </radialGradient>

        {/* Micro Wave Texture Pattern */}
        <pattern id="nauticalWavePattern" width="16" height="8" patternUnits="userSpaceOnUse">
          <path
            d="M 0,4 Q 4,2 8,4 T 16,4"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.18"
            strokeOpacity="0.35"
          />
          <path
            d="M 4,7 Q 8,5.5 12,7"
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.12"
            strokeOpacity="0.25"
          />
        </pattern>

        {/* Ocean Current Arrow Marker */}
        <marker
          id="currentArrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" fillOpacity="0.6" />
        </marker>
      </defs>

      {/* 1. BASE DEEP OCEAN WATER RECT (Infinite Map Canvas) */}
      <rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#deepOceanRadial)" />
      
      {/* 2. REPEATING WAVE TEXTURE OVERLAY */}
      <rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#nauticalWavePattern)" opacity="0.6" />

      {/* 3. SUBTLE NAVIGATIONAL LATITUDE/LONGITUDE & SECTOR LINES */}
      <g id="rhumb-compass-lines" stroke="#7dd3fc" strokeWidth="0.12" opacity="0.10" fill="none">
        {/* Equator & Parallels */}
        <line x1="-2000" y1="-35" x2="4000" y2="-35" strokeDasharray="4,4" />
        <line x1="-2000" y1="0" x2="4000" y2="0" strokeDasharray="4,4" />
        <line x1="-2000" y1="35" x2="4000" y2="35" strokeDasharray="4,4" />
        <line x1="-2000" y1="70" x2="4000" y2="70" strokeWidth="0.2" stroke="#bae6fd" opacity="0.25" />
        <line x1="-2000" y1="105" x2="4000" y2="105" strokeDasharray="4,4" />
        <line x1="-2000" y1="140" x2="4000" y2="140" strokeDasharray="4,4" />
        <line x1="-2000" y1="175" x2="4000" y2="175" strokeDasharray="4,4" />
        
        {/* Meridians */}
        <line x1="-60" y1="-2000" x2="-60" y2="4000" strokeDasharray="4,4" />
        <line x1="0" y1="-2000" x2="0" y2="4000" strokeDasharray="4,4" />
        <line x1="60" y1="-2000" x2="60" y2="4000" strokeDasharray="4,4" />
        <line x1="120" y1="-2000" x2="120" y2="4000" strokeWidth="0.2" stroke="#bae6fd" opacity="0.25" />
        <line x1="180" y1="-2000" x2="180" y2="4000" strokeDasharray="4,4" />
        <line x1="240" y1="-2000" x2="240" y2="4000" strokeDasharray="4,4" />
        <line x1="300" y1="-2000" x2="300" y2="4000" strokeDasharray="4,4" />
      </g>

      {/* 5. VINTAGE NAUTICAL ARTWORK (Antike Schiffe & Verzierungen) */}
      {showDecorations && (
        <g id="vintage-nautical-decorations" opacity="0.45">
          {/* Classic Sailing Ship 1 (East) */}
          <g transform="translate(290, 45) scale(0.65)">
            <path d="M -6,4 Q 0,7 8,4 L 6,1 L -5,1 Z" fill="#451a03" stroke="#d97706" strokeWidth="0.3" />
            <line x1="-1" y1="1" x2="-1" y2="-7" stroke="#92400e" strokeWidth="0.4" />
            <line x1="4" y1="1" x2="4" y2="-5" stroke="#92400e" strokeWidth="0.3" />
            <path d="M -1,-1 Q 2,-3 -1,-5 Q -3,-3 -1,-1 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="0.2" />
            <path d="M 4,0 Q 6,-2 4,-4 Q 2,-2 4,0 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="0.2" />
            <path d="M -1,-7 L -3,-6 L -1,-5 Z" fill="#38bdf8" />
          </g>

          {/* Classic Sailing Ship 2 (West) */}
          <g transform="translate(-40, 130) scale(0.55)">
            <path d="M -5,3 Q 0,6 7,3 L 5,1 L -4,1 Z" fill="#451a03" stroke="#d97706" strokeWidth="0.3" />
            <line x1="1" y1="1" x2="1" y2="-6" stroke="#92400e" strokeWidth="0.4" />
            <path d="M 1,0 Q 4,-2 1,-4 Q -1,-2 1,0 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="0.2" />
          </g>

          {/* Classic Sea Monster / Serpent in the deep south-east */}
          <g transform="translate(280, 160) scale(0.6)" opacity="0.35">
            <path d="M -15,0 Q -10,-8 -5,0 Q 0,8 5,0 Q 10,-8 15,0" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeLinecap="round" />
            <circle cx="16" cy="-2" r="1" fill="#38bdf8" />
          </g>
        </g>
      )}
    </g>
  );
});
