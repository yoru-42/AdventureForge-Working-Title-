import React from 'react';
import {
  LocalBuildingCategory,
  LocalBuildingSymbol,
  BUILDING_CATALOG
} from './townBuildingCatalog';

interface TownBuildingGraphicProps {
  building: LocalBuildingSymbol;
  isSelected?: boolean;
}

export const TownBuildingGraphic: React.FC<TownBuildingGraphicProps> = ({
  building,
  isSelected = false
}) => {
  const def = BUILDING_CATALOG[building.category] || BUILDING_CATALOG.wohnen_einfach;
  const level = Math.max(1, Math.min(5, building.level || 1));
  const status = building.status || 'aktiv';

  // Base size scaled by level factor (1.0 to 1.35) and building.scale
  const levelScale = 1 + (level - 1) * 0.08;
  const size = def.size * (building.scale || 1) * levelScale;
  const half = size / 2;

  const baseColor = def.color;
  const strokeColor = def.stroke;
  const accentColor = def.accentColor;

  return (
    <g className="transition-transform duration-150">
      {/* SELECTION HIGHLIGHT GLOW / RING */}
      {isSelected && (
        <circle
          r={half + 6}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.6"
          strokeDasharray="4 2"
          opacity="0.9"
        />
      )}

      {/* RENDER GRAPHIC BASED ON STATUS */}
      {status === 'zerstoert' ? (
        <RuinGraphic size={size} />
      ) : status === 'im_bau' ? (
        <ConstructionGraphic
          size={size}
          category={building.category}
          progress={building.constructionProgress ?? 45}
        />
      ) : (
        <g>
          {/* Base stylized category vector graphic */}
          {renderCategoryBase(building.category, size, baseColor, strokeColor, accentColor, level)}

          {/* Damaged overlay if status === 'beschaedigt' */}
          {status === 'beschaedigt' && <DamagedOverlay size={size} />}

          {/* Stufen-Pips / Level Badge on building */}
          {level > 1 && (
            <g transform={`translate(${half * 0.6}, ${-half * 0.6})`}>
              <rect
                x="-5"
                y="-3.5"
                width="10"
                height="7"
                rx="1.5"
                fill="#0f172a"
                stroke="#f59e0b"
                strokeWidth="0.7"
              />
              <text
                x="0"
                y="1.8"
                textAnchor="middle"
                fontSize="4.5"
                fontWeight="900"
                fill="#fbbf24"
                fontFamily="sans-serif"
              >
                {level}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/**
 * Renders the intact vector graphic for each building category
 */
function renderCategoryBase(
  category: LocalBuildingCategory,
  size: number,
  color: string,
  stroke: string,
  accent: string,
  level: number
) {
  const half = size / 2;

  switch (category) {
    // === WOHNEN ===
    case 'wohnen_einfach':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.7}
            width={size}
            height={size * 1.1}
            fill={color}
            stroke={stroke}
            strokeWidth="1.2"
            rx="1"
          />
          <line x1="0" y1={-half * 0.7} x2="0" y2={half * 0.9} stroke={stroke} strokeWidth="1.5" />
          <circle cx={half * 0.4} cy={-half * 0.3} r="1.5" fill={accent} />
        </g>
      );

    case 'wohnen_fachwerk':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.8}
            width={size}
            height={size * 1.2}
            fill={color}
            stroke={stroke}
            strokeWidth="1.3"
            rx="1"
          />
          {/* Fachwerk cross beams */}
          <line x1={-half} y1={-half * 0.8} x2={half} y2={half * 0.4} stroke={stroke} strokeWidth="1" opacity="0.6" />
          <line x1={half} y1={-half * 0.8} x2={-half} y2={half * 0.4} stroke={stroke} strokeWidth="1" opacity="0.6" />
          <line x1="0" y1={-half * 0.8} x2="0" y2={half * 0.4} stroke={stroke} strokeWidth="1.4" />
          <circle cx={half * 0.5} cy={-half * 0.4} r="1.8" fill={accent} />
        </g>
      );

    case 'herrenhaus':
      return (
        <g>
          {/* L-shaped manor structure */}
          <path
            d={`M ${-half} ${-half} L ${half} ${-half} L ${half} ${half} L ${0} ${half} L ${0} ${0} L ${-half} ${0} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <line x1={-half} y1={-half * 0.5} x2={half} y2={-half * 0.5} stroke={stroke} strokeWidth="1" />
          <circle cx={half * 0.5} cy={half * 0.5} r="2" fill={accent} stroke={stroke} strokeWidth="0.8" />
        </g>
      );

    case 'gasthaus':
      return (
        <g>
          <rect
            x={-half * 1.1}
            y={-half * 0.8}
            width={size * 1.1}
            height={size * 1.1}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1.5"
          />
          <rect x={-half * 0.5} y={-half * 0.3} width={half} height={half} fill="#fdba74" stroke={stroke} strokeWidth="0.8" />
          <line x1="0" y1={-half * 0.8} x2="0" y2={half * 0.8} stroke={stroke} strokeWidth="1.4" />
        </g>
      );

    // === HANDWERK ===
    case 'schmiede':
      return (
        <g>
          <rect
            x={-half}
            y={-half}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          {/* Chimney & Glowing Fire */}
          <rect x={half * 0.2} y={-half * 0.9} width="5" height="7" fill="#ea580c" stroke={stroke} strokeWidth="0.8" />
          <circle cx={half * 0.5} cy={-half * 0.5} r="1.5" fill="#fef08a" />
          <path d={`M ${-half * 0.5} 0 L ${half * 0.5} 0`} stroke="#f59e0b" strokeWidth="1.4" />
        </g>
      );

    case 'schreinerei':
      return (
        <g>
          <rect
            x={-half * 1.1}
            y={-half * 0.7}
            width={size * 1.1}
            height={size * 0.9}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1"
          />
          <line x1={-half * 0.8} y1={-half * 0.2} x2={half * 0.8} y2={-half * 0.2} stroke="#fef08a" strokeWidth="1.5" />
          <rect x={-half * 0.6} y={half * 0.2} width={size * 0.6} height="3" fill="#ca8a04" />
        </g>
      );

    case 'weberei':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.8}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.3"
            rx="1"
          />
          <line x1={-half} y1={-half * 0.3} x2={half} y2={-half * 0.3} stroke="#f472b6" strokeWidth="1.5" strokeDasharray="2 1" />
          <line x1={-half} y1={half * 0.3} x2={half} y2={half * 0.3} stroke="#f472b6" strokeWidth="1.5" strokeDasharray="2 1" />
        </g>
      );

    case 'toepferei':
      return (
        <g>
          <circle cx="0" cy="0" r={half * 0.9} fill={color} stroke={stroke} strokeWidth="1.4" />
          <circle cx="0" cy="0" r={half * 0.4} fill="#fbbf24" stroke={stroke} strokeWidth="0.8" />
        </g>
      );

    case 'alchemie':
      return (
        <g>
          <rect
            x={-half}
            y={-half}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="2"
          />
          <circle cx="0" cy="0" r={half * 0.45} fill="#c084fc" stroke={stroke} strokeWidth="1" />
          <path d={`M 0 ${-half * 0.6} L 0 ${half * 0.6}`} stroke="#f3e8ff" strokeWidth="1.2" />
        </g>
      );

    // === HANDEL ===
    case 'markt':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 1.2}
            width={size * 1.2}
            height={size * 1.2}
            fill="#059669"
            stroke={stroke}
            strokeWidth="1.3"
            rx="2"
            opacity="0.9"
          />
          {/* Canopy stripes */}
          <line x1={-half * 1.2} y1={-half * 0.4} x2={half * 1.2} y2={-half * 0.4} stroke="#ffffff" strokeWidth="1.4" strokeDasharray="3 2" />
          <line x1={-half * 1.2} y1={half * 0.4} x2={half * 1.2} y2={half * 0.4} stroke="#ffffff" strokeWidth="1.4" strokeDasharray="3 2" />
          <circle cx="0" cy="0" r={size * 0.22} fill="#f59e0b" />
        </g>
      );

    case 'kontor':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 0.8}
            width={size * 1.2}
            height={size * 1.1}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1.5"
          />
          <rect x={-half * 0.7} y={-half * 0.4} width={size * 0.7} height={size * 0.5} fill="#0c4a6e" stroke="#38bdf8" strokeWidth="0.8" />
        </g>
      );

    case 'bankhaus':
      return (
        <g>
          <rect
            x={-half}
            y={-half}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          <circle cx="0" cy="0" r={half * 0.5} fill="#fde047" stroke={stroke} strokeWidth="1" />
          <line x1="0" y1={-half * 0.4} x2="0" y2={half * 0.4} stroke="#854d0e" strokeWidth="1.4" />
        </g>
      );

    case 'taverne':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.8}
            width={size}
            height={size * 1.1}
            fill={color}
            stroke={stroke}
            strokeWidth="1.3"
            rx="1"
          />
          <line x1="0" y1={-half * 0.8} x2="0" y2={half * 0.8} stroke={stroke} strokeWidth="1.5" />
          <circle cx={half * 0.4} cy={-half * 0.3} r="2" fill="#fb923c" />
        </g>
      );

    // === LANDWIRTSCHAFT ===
    case 'muehle':
      return (
        <g>
          <circle cx="0" cy="0" r={half * 0.8} fill={color} stroke={stroke} strokeWidth="1.5" />
          {/* Windmill blades */}
          <line x1={-half * 1.3} y1={-half * 1.3} x2={half * 1.3} y2={half * 1.3} stroke="#facc15" strokeWidth="1.6" />
          <line x1={-half * 1.3} y1={half * 1.3} x2={half * 1.3} y2={-half * 1.3} stroke="#facc15" strokeWidth="1.6" />
          <circle cx="0" cy="0" r="2.5" fill="#451a03" />
        </g>
      );

    case 'speicher':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 0.6}
            width={size * 1.2}
            height={size * 0.8}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1"
          />
          <line x1={-half * 1.2} y1="0" x2={half * 1.2} y2="0" stroke="#fef08a" strokeWidth="1.2" strokeDasharray="3 2" />
        </g>
      );

    case 'fischer':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.7}
            width={size}
            height={size * 0.9}
            fill={color}
            stroke={stroke}
            strokeWidth="1.3"
            rx="1"
          />
          <path d={`M ${-half * 0.6} 0 Q 0 ${half * 0.5}, ${half * 0.6} 0`} stroke="#38bdf8" strokeWidth="1.3" fill="none" />
        </g>
      );

    case 'brauerei':
      return (
        <g>
          <rect
            x={-half * 1.1}
            y={-half * 0.8}
            width={size * 1.1}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1"
          />
          <circle cx={-half * 0.3} cy={0} r={half * 0.35} fill="#f59e0b" stroke={stroke} strokeWidth="0.8" />
          <circle cx={half * 0.3} cy={0} r={half * 0.35} fill="#f59e0b" stroke={stroke} strokeWidth="0.8" />
        </g>
      );

    case 'steinmetz':
      return (
        <g>
          <rect
            x={-half}
            y={-half}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1"
          />
          <rect x={-half * 0.5} y={-half * 0.5} width={half} height={half} fill="#cbd5e1" stroke={stroke} strokeWidth="0.8" />
        </g>
      );

    // === MILITÄR ===
    case 'turm':
      return (
        <g>
          <rect
            x={-half}
            y={-half}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="2"
          />
          <circle cx="0" cy="0" r={half * 0.45} fill="#450a0a" stroke="#f87171" strokeWidth="1" />
        </g>
      );

    case 'kaserne':
      return (
        <g>
          <rect
            x={-half * 1.3}
            y={-half * 0.8}
            width={size * 1.3}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          <line x1={-half * 1.3} y1="0" x2={half * 1.3} y2="0" stroke="#fca5a5" strokeWidth="1.2" />
        </g>
      );

    case 'zeughaus':
      return (
        <g>
          <rect
            x={-half * 1.1}
            y={-half * 0.8}
            width={size * 1.1}
            height={size * 0.9}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          <line x1={-half * 0.6} y1={-half * 0.4} x2={half * 0.6} y2={half * 0.4} stroke="#fca5a5" strokeWidth="1.5" />
          <line x1={half * 0.6} y1={-half * 0.4} x2={-half * 0.6} y2={half * 0.4} stroke="#fca5a5" strokeWidth="1.5" />
        </g>
      );

    case 'torhaus':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 0.7}
            width={size * 1.2}
            height={size * 0.8}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1.5"
          />
          {/* Gate arch opening */}
          <rect x={-half * 0.35} y={-half * 0.3} width={half * 0.7} height={half * 0.7} fill="#0f172a" />
          <circle cx={-half * 0.8} cy="0" r="2" fill="#ef4444" />
          <circle cx={half * 0.8} cy="0" r="2" fill="#ef4444" />
        </g>
      );

    case 'mauer':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 0.4}
            width={size * 1.2}
            height={size * 0.5}
            fill={color}
            stroke={stroke}
            strokeWidth="1.3"
            rx="0.5"
          />
          <line x1={-half * 0.6} y1={-half * 0.4} x2={-half * 0.6} y2={half * 0.1} stroke="#94a3b8" strokeWidth="1" />
          <line x1={0} y1={-half * 0.4} x2={0} y2={half * 0.1} stroke="#94a3b8" strokeWidth="1" />
          <line x1={half * 0.6} y1={-half * 0.4} x2={half * 0.6} y2={half * 0.1} stroke="#94a3b8" strokeWidth="1" />
        </g>
      );

    // === HAFEN ===
    case 'hafen':
      return (
        <g>
          <rect
            x={-half * 1.4}
            y={-half * 0.5}
            width={size * 1.4}
            height={size * 0.6}
            fill="#0369a1"
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          <line x1={-half * 1.4} y1="0" x2={half * 1.4} y2="0" stroke="#bae6fd" strokeWidth="1.2" />
        </g>
      );

    case 'werft':
      return (
        <g>
          <rect
            x={-half * 1.3}
            y={-half * 0.8}
            width={size * 1.3}
            height={size * 0.9}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1"
          />
          {/* Hull outline */}
          <path d={`M ${-half * 0.8} ${half * 0.2} Q 0 ${half * 0.5}, ${half * 0.8} ${half * 0.2}`} stroke="#7dd3fc" strokeWidth="1.5" fill="none" />
        </g>
      );

    case 'zollhaus':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.8}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="1"
          />
          <circle cx="0" cy="0" r={half * 0.35} fill="#22d3ee" stroke={stroke} strokeWidth="0.8" />
        </g>
      );

    case 'leuchtturm':
      return (
        <g>
          <circle cx="0" cy="0" r={half * 0.75} fill={color} stroke={stroke} strokeWidth="1.5" />
          <circle cx="0" cy="0" r={half * 0.4} fill="#facc15" stroke={stroke} strokeWidth="0.8" />
          {/* Light ray accents */}
          <line x1="0" y1={-half * 1.2} x2="0" y2={-half * 0.8} stroke="#fde047" strokeWidth="1.5" />
        </g>
      );

    // === KULTUR & VERWALTUNG ===
    case 'rathaus':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 0.8}
            width={size * 1.2}
            height={size * 0.9}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          <circle cx="0" cy="0" r={size * 0.26} fill="#f59e0b" stroke={stroke} strokeWidth="1" />
          <path d={`M 0 ${-size * 0.55} L 0 ${size * 0.26}`} stroke={stroke} strokeWidth="1.5" />
        </g>
      );

    case 'tempel':
      return (
        <g>
          <circle cx="0" cy="0" r={half * 0.9} fill={color} stroke={stroke} strokeWidth="1.5" />
          <path
            d={`M 0 ${-half * 0.65} L 0 ${half * 0.65} M ${-half * 0.65} 0 L ${half * 0.65} 0`}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </g>
      );

    case 'kathedrale':
      return (
        <g>
          <rect
            x={-half * 1.3}
            y={-half * 0.9}
            width={size * 1.3}
            height={size * 1.1}
            fill={color}
            stroke={stroke}
            strokeWidth="1.6"
            rx="1.5"
          />
          <circle cx={-half * 0.7} cy={-half * 0.3} r="3" fill="#a5b4fc" stroke={stroke} strokeWidth="0.8" />
          <circle cx={half * 0.7} cy={-half * 0.3} r="3" fill="#a5b4fc" stroke={stroke} strokeWidth="0.8" />
          <path d={`M 0 ${-half * 0.8} L 0 ${half * 0.6}`} stroke="#ffffff" strokeWidth="1.6" />
          <path d={`M ${-half * 0.5} ${-half * 0.2} L ${half * 0.5} ${-half * 0.2}`} stroke="#ffffff" strokeWidth="1.6" />
        </g>
      );

    case 'badehaus':
      return (
        <g>
          <rect
            x={-half}
            y={-half * 0.8}
            width={size}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.4"
            rx="2"
          />
          <circle cx="0" cy="0" r={half * 0.45} fill="#67e8f9" stroke={stroke} strokeWidth="0.8" />
          <path d={`M ${-half * 0.4} 0 Q 0 ${half * 0.3}, ${half * 0.4} 0`} stroke="#164e63" strokeWidth="1" fill="none" />
        </g>
      );

    case 'bibliothek':
      return (
        <g>
          <rect
            x={-half * 1.1}
            y={-half * 0.8}
            width={size * 1.1}
            height={size}
            fill={color}
            stroke={stroke}
            strokeWidth="1.5"
            rx="1"
          />
          <rect x={-half * 0.7} y={-half * 0.4} width={size * 0.7} height={size * 0.5} fill="#312e81" stroke="#a5b4fc" strokeWidth="0.8" />
        </g>
      );

    case 'park':
      return (
        <g>
          <rect
            x={-half * 1.2}
            y={-half * 1.2}
            width={size * 1.2}
            height={size * 1.2}
            fill="#15803d"
            stroke="#064e3b"
            strokeWidth="1.2"
            rx="3"
            opacity="0.8"
          />
          <circle cx="0" cy="0" r={half * 0.35} fill="#38bdf8" stroke="#064e3b" strokeWidth="0.8" />
        </g>
      );

    default:
      return (
        <rect
          x={-half}
          y={-half}
          width={size}
          height={size}
          fill={color}
          stroke={stroke}
          strokeWidth="1.5"
          rx="1"
        />
      );
  }
}

/**
 * Graphic for building "Im Bau" (Construction scaffolding frame)
 */
function ConstructionGraphic({
  size,
  category,
  progress
}: {
  size: number;
  category: LocalBuildingCategory;
  progress: number;
}) {
  const half = size / 2;
  return (
    <g>
      {/* Blueprint ground silhouette */}
      <rect
        x={-half}
        y={-half}
        width={size}
        height={size}
        fill="#1e293b"
        stroke="#f59e0b"
        strokeWidth="1.4"
        strokeDasharray="3 2"
        rx="1"
        opacity="0.85"
      />

      {/* Timber Scaffolding Cross-beams */}
      <line x1={-half} y1={-half} x2={half} y2={half} stroke="#d97706" strokeWidth="1.2" />
      <line x1={half} y1={-half} x2={-half} y2={half} stroke="#d97706" strokeWidth="1.2" />
      <line x1={-half} y1="0" x2={half} y2="0" stroke="#d97706" strokeWidth="1" />
      <line x1="0" y1={-half} x2="0" y2={half} stroke="#d97706" strokeWidth="1" />

      {/* Crane / Hook silhouette */}
      <circle cx="0" cy="0" r={half * 0.3} fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
      <path d={`M 0 ${-half * 0.7} L ${half * 0.5} ${-half * 0.9}`} stroke="#f59e0b" strokeWidth="1.5" />
    </g>
  );
}

/**
 * Graphic for destroyed building / ruin
 */
function RuinGraphic({ size }: { size: number }) {
  const half = size / 2;
  return (
    <g>
      {/* Charred ash base */}
      <path
        d={`M ${-half * 0.9} ${-half * 0.7} L ${half * 0.3} ${-half * 0.9} L ${half * 0.8} ${-half * 0.2} L ${half * 0.7} ${half * 0.8} L ${-half * 0.4} ${half * 0.9} L ${-half * 0.9} ${half * 0.3} Z`}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth="1.4"
      />
      {/* Broken wall fragments */}
      <rect x={-half * 0.7} y={-half * 0.6} width={half * 0.6} height={half * 0.7} fill="#334155" stroke="#0f172a" strokeWidth="1" />
      <rect x={half * 0.1} y={half * 0.1} width={half * 0.5} height={half * 0.5} fill="#334155" stroke="#0f172a" strokeWidth="1" />

      {/* Rubble rubble dots / stones */}
      <circle cx={-half * 0.2} cy={half * 0.4} r="1.5" fill="#64748b" />
      <circle cx={half * 0.4} cy={-half * 0.4} r="1.2" fill="#64748b" />
      <circle cx={-half * 0.5} cy={half * 0.6} r="1" fill="#94a3b8" />

      {/* Skull / Danger subtle icon */}
      <line x1={-half * 0.4} y1={-half * 0.2} x2={half * 0.4} y2={half * 0.2} stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
      <line x1={half * 0.4} y1={-half * 0.2} x2={-half * 0.4} y2={half * 0.2} stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/**
 * Damaged cracks overlay
 */
function DamagedOverlay({ size }: { size: number }) {
  const half = size / 2;
  return (
    <g>
      <path
        d={`M ${-half * 0.6} ${-half * 0.6} L ${-half * 0.1} 0 L ${half * 0.2} ${-half * 0.2} L ${half * 0.6} ${half * 0.5}`}
        stroke="#f97316"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={half * 0.5} cy={-half * 0.5} r="2.5" fill="#ea580c" stroke="#431407" strokeWidth="0.8" />
      <text x={half * 0.5} y={-half * 0.5 + 1.5} textAnchor="middle" fontSize="3.5" fill="#ffffff" fontWeight="bold">!</text>
    </g>
  );
}
