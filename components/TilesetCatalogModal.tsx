import React, { useState } from 'react';
import { X, Map, Waves, Mountain, Trees, Castle, Compass, Palette, Check, Layers, Sparkles } from 'lucide-react';
import { CatalogItems, STENCIL_PRESETS_POINT_9 } from '../lib/landmassShapes';

interface TilesetCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  onUpdateConfig: (key: string, value: any) => void;
  onToggleDecoration?: (decor: string) => void;
}

export const TilesetCatalogModal: React.FC<TilesetCatalogModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onToggleDecoration
}) => {
  const [activeTab, setActiveTab] = useState<'landmass_blocks' | 'stencils' | 'styles' | 'coastlines' | 'mountains' | 'biomes' | 'settlements' | 'elements'>('landmass_blocks');

  if (!isOpen) return null;

  const allBuildingBlocks = CatalogItems.getAllBuildingBlocks();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-serif flex items-center gap-2">
                Weltkarten Tileset- & Schablonen-Katalog
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                  🎯 Drag & Drop / Vorlagen
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Wähle Kontinent-Bausteine, Insel-Formen und Schablonen aus oder ziehe sie direkt per Drag & Drop auf die Karte.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950/60 border-b border-slate-800/60">
          <button
            onClick={() => setActiveTab('landmass_blocks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'landmass_blocks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            1-8. Kontinent- & Insel-Bausteine
          </button>

          <button
            onClick={() => setActiveTab('stencils')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'stencils'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Map className="w-4 h-4 text-sky-400" />
            9. Schablonen & Vorlagen
          </button>

          <button
            onClick={() => setActiveTab('styles')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'styles'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            Karten-Stile
          </button>

          <button
            onClick={() => setActiveTab('coastlines')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'coastlines'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Waves className="w-4 h-4 text-cyan-400" />
            Küstenlinien & Höhen
          </button>

          <button
            onClick={() => setActiveTab('mountains')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'mountains'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mountain className="w-4 h-4 text-emerald-400" />
            Gebirge & Flüsse
          </button>

          <button
            onClick={() => setActiveTab('biomes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'biomes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Trees className="w-4 h-4 text-green-400" />
            Biome & Zonen
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'settlements'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Castle className="w-4 h-4 text-rose-400" />
            Siedlungen & Icons
          </button>

          <button
            onClick={() => setActiveTab('elements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'elements'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            Dekorationen
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* TAB 1-8: KONTINENT- & INSEL-BAUSTEINE */}
          {activeTab === 'landmass_blocks' && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                    🏝️ Drag & Drop Kontinent- & Insel-Tileset
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Ziehe beliebig viele Kontinente, Halbinseln, Inselketten, Buchten, Isthmen oder Ringe per <strong>Drag & Drop</strong> direkt auf deine Weltkarte! Sie werden als präzise organische Landmassen mit echten Küstenkonturen platziert.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allBuildingBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'landmass_tile',
                        shapeId: block.id,
                        name: block.name,
                        categoryName: block.categoryName,
                        radius: block.defaultRadius,
                        icon: block.icon,
                        desc: block.description
                      }));
                    }}
                    className="p-3 bg-slate-950/80 border border-slate-800 hover:border-amber-400/80 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:bg-slate-850 group shadow-md"
                    title="Ziehe diesen Baustein direkt auf die Weltkarte! 🎯"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl p-1 bg-slate-900 rounded-lg border border-slate-800 group-hover:scale-110 transition-transform">
                        {block.icon}
                      </span>
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
                        🎯 Drag
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-100 mt-2 group-hover:text-amber-300 font-serif">
                      {block.name}
                    </h5>
                    <span className="text-[9px] text-amber-400/90 font-mono block mt-0.5">
                      {block.categoryName}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                      {block.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: KONTINENT-SCHABLONEN & POINT 9 PRESETS */}
          {activeTab === 'stencils' && (
            <div className="space-y-6">
              
              {/* Point 9 Vorlagen / Kombinationen */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                  <h3 className="text-xs font-bold text-amber-300 flex items-center gap-2 uppercase tracking-wider font-mono">
                    ⭐ 9. Kombination & Beispiele (Komplette Karten-Vorlagen)
                  </h3>
                  <span className="text-[11px] text-amber-400/80 font-mono">Als Schablone setzen & laden</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {STENCIL_PRESETS_POINT_9.map((preset) => {
                    const isSelected = (config.continentStencil || '') === preset.id;
                    return (
                      <div
                        key={preset.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', JSON.stringify({
                            type: 'stencil',
                            id: preset.id,
                            name: preset.name
                          }));
                        }}
                        onClick={() => onUpdateConfig('continentStencil', preset.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-100 shadow-lg scale-[1.02]'
                            : 'bg-slate-950/90 border-slate-800 hover:border-amber-500/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{preset.icon}</span>
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            {preset.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 mt-2 font-serif">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                          {preset.subtitle}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          {preset.description}
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {isSelected ? '✓ Aktiviert' : 'Klick = Laden'}
                          </span>
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                            🎯 Drag auf Karte
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standard Grund-Schablonen */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                    🗺️ Grund-Schablonen (Geometrie)
                  </h3>
                  <span className="text-xs text-slate-400">Schnelle Basiskonfiguration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'none', name: 'Keine (Freier Ozean)', desc: 'Leere Karte. Platziere alle Inseln & Kacheln 100% selbst.' },
                    { id: 'complete', name: 'Komplettkontinent', desc: 'Eine große, zusammenhängende Hauptlandmasse.' },
                    { id: 'rugged', name: 'Zerklüftet', desc: 'Stark zerklüftete Kontinentalränder und Buchten.' },
                    { id: 'divided', name: 'Geteilt', desc: 'Zwei Hauptkontinente (z.B. Ost & West).' },
                    { id: 'peninsula', name: 'Halbinsel', desc: 'Große Landzungen und weit vorspringende Kaps.' },
                    { id: 'island_group', name: 'Inselgruppe', desc: 'Kompakte Ansammlung nah beieinander liegender Eilande.' },
                    { id: 'archipelago', name: 'Archipel', desc: 'Weit verstreutes Inselmeer im Ozean.' },
                    { id: 'ring', name: 'Ringkontinent', desc: 'Ringförmiger Landgürtel um ein inneres Meer.' },
                    { id: 'central_sea', name: 'Zentrale See', desc: 'Zentrales Binnenmeer umgeben von Festland.' }
                  ].map(stencil => {
                    const isSelected = (config.continentStencil || 'none') === stencil.id;
                    return (
                      <div
                        key={stencil.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'stencil', id: stencil.id, name: stencil.name }));
                        }}
                        onClick={() => onUpdateConfig('continentStencil', stencil.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        title="Ziehe diese Schablone direkt auf die Weltkarte! 🎯"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-serif">{stencil.name}</span>
                          {isSelected ? <Check className="w-4 h-4 text-amber-400" /> : <span className="text-[9px] text-amber-400 font-mono">🎯 Drag</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{stencil.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB: KARTEN-STILE */}
          {activeTab === 'styles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                  🎨 Karten-Stile (Farb- & Texturwelt)
                </h3>
                <span className="text-xs text-slate-400">Bestimmt Ozeanfarbe, Pergament-Textur und Küstenlinien</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'watercolor',
                    name: 'Aquarell',
                    desc: 'Sanfte meeresblaue Wasserauswaschungen mit frischem Grasgrün.',
                    bg: 'from-sky-950 to-blue-900 border-sky-500/30',
                    badge: 'bg-sky-500/20 text-sky-300'
                  },
                  {
                    id: 'handdrawn',
                    name: 'Handgemalt',
                    desc: 'Cremefarbenes Skizzenpapier mit feinen Bleistift-Schraffuren.',
                    bg: 'from-amber-950/40 to-stone-900 border-amber-600/30',
                    badge: 'bg-amber-500/20 text-amber-300'
                  },
                  {
                    id: 'realistic',
                    name: 'Realistisch',
                    desc: 'Tiefblaues Meereswasser mit echten Sättigungs- & Relief-Verläufen.',
                    bg: 'from-blue-950 to-indigo-950 border-blue-500/40',
                    badge: 'bg-blue-500/20 text-blue-300'
                  },
                  {
                    id: 'parchment',
                    name: 'Parchment (Alt)',
                    desc: 'Antikes Sepia-Pergament mit historischen braunen Tintentönen.',
                    bg: 'from-amber-950 to-yellow-950 border-amber-700/40',
                    badge: 'bg-amber-600/20 text-amber-200'
                  },
                  {
                    id: 'fantasy_saturated',
                    name: 'Satter Fantasy-Stil',
                    desc: 'Magisch strahlende, gesättigte Ozean- & Biom-Kontraste.',
                    bg: 'from-purple-950 to-slate-900 border-purple-500/40',
                    badge: 'bg-purple-500/20 text-purple-300'
                  },
                  {
                    id: 'minimalist',
                    name: 'Minimalist-Vektor',
                    desc: 'Klare, reduzierte Vektorlinien ohne verspielte Effekte.',
                    bg: 'from-slate-950 to-slate-900 border-slate-700',
                    badge: 'bg-slate-700/40 text-slate-300'
                  }
                ].map((style) => {
                  const isSelected = (config.mapStyle || 'watercolor') === style.id;
                  return (
                    <div
                      key={style.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'style', id: style.id, name: style.name }));
                      }}
                      onClick={() => onUpdateConfig('mapStyle', style.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing bg-gradient-to-br ${style.bg} ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg scale-[1.02]'
                          : 'hover:border-slate-600 hover:scale-[1.01]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 p-1 bg-amber-500 text-slate-950 rounded-full">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                          {style.name}
                        </span>
                        <span className="text-[9px] font-bold text-amber-400/80 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">🎯 Drag</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 mt-2 font-serif">{style.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{style.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: KÜSTENLINIEN */}
          {activeTab === 'coastlines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                  🌊 Küstenlinien-Stile
                </h3>
                <span className="text-xs text-slate-400">Verlauf und Detailgrad der Insel- & Küstenränder</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'smooth', name: 'Sanft & Rund', desc: 'Glatte, geschwungene Küsten ohne scharfe Klippen.' },
                  { id: 'rugged', name: 'Zerklüftet', desc: 'Klassische, zackige Abruchkanten & raue Felsen.' },
                  { id: 'fjord', name: 'Fjordküste', desc: 'Extrem tiefe Meeresarme und Fjordeinschneidungen.' },
                  { id: 'beach', name: 'Sandstrand', desc: 'Breite, sanft auslaufende Flachwasserzonen.' },
                  { id: 'cliff', name: 'Klippenküste', desc: 'Steil abfallende Felsküsten mit Brandung.' },
                  { id: 'lagoon', name: 'Lagunen & Riffe', desc: 'Vorgelagerte Riffketten und ruhige Atoll-Lagunen.' }
                ].map(coast => {
                  const isSelected = (config.coastlineStyle || 'rugged') === coast.id;
                  return (
                    <div
                      key={coast.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'coastline', id: coast.id, name: coast.name }));
                      }}
                      onClick={() => onUpdateConfig('coastlineStyle', coast.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-serif">{coast.name}</span>
                        {isSelected ? <Check className="w-4 h-4 text-amber-400" /> : <span className="text-[9px] text-amber-400 font-mono">🎯 Drag</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{coast.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: GEBIRGE & FLÜSSE */}
          {activeTab === 'mountains' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                  ⛰️ Gebirgs-Stile & Flüsse
                </h3>
                <span className="text-xs text-slate-400">Darstellung von Gipfeln, Plateaus und Flussläufen</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'young', name: 'Junge Faltengebirge', desc: 'Spitze, schneebedeckte Hochgebirgsgipfel.' },
                  { id: 'rounded', name: 'Alte Abgerundete Berge', desc: 'Sanfte Mittelgebirgskuppen und bewaldete Hügel.' },
                  { id: 'plateau', name: 'Hochplateau / Tafelberge', desc: 'Flache, steil abfallende Tafelberge & Canyons.' },
                  { id: 'volcanic', name: 'Vulkanisch', desc: 'Aktive Vulkankegel mit Lavakratern.' },
                  { id: 'jagged', name: 'Gezackte Gipfel', desc: 'Extreme, nadelartige Felsformationen.' },
                  { id: 'chain', name: 'Gebirgskette (Verlauf)', desc: 'Zusammenhängende Gebirgszüge entlang von Bruchkanten.' }
                ].map(mtn => {
                  const isSelected = (config.mountainStyle || 'young') === mtn.id;
                  return (
                    <div
                      key={mtn.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'terrain', subtype: mtn.name, name: mtn.name, color: '#64748b' }));
                      }}
                      onClick={() => onUpdateConfig('mountainStyle', mtn.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-serif">{mtn.name}</span>
                        {isSelected ? <Check className="w-4 h-4 text-amber-400" /> : <span className="text-[9px] text-amber-400 font-mono">🎯 Drag</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{mtn.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: BIOME */}
          {activeTab === 'biomes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                  🎨 Biome & Klima-Zonen
                </h3>
                <span className="text-xs text-slate-400">Genaue Kachel-Farbgebung und Biome aus dem Katalog</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'rainforest', name: 'Tropischer Regenwald', color: '#2e6910' },
                  { id: 'temperate', name: 'Gemäßigter Wald', color: '#4d8014' },
                  { id: 'taiga', name: 'Taiga (Nadelwald)', color: '#556847' },
                  { id: 'grassland', name: 'Steppe / Grasland', color: '#9e9f52' },
                  { id: 'desert', name: 'Wüste', color: '#b28a52' },
                  { id: 'savanna', name: 'Savanne', color: '#9e7a40' },
                  { id: 'tundra', name: 'Tundra', color: '#96917a' },
                  { id: 'snow', name: 'Schnee / Eis', color: '#e8ecef' }
                ].map(bio => {
                  const isSelected = (config.biomeStyle || 'grassland') === bio.id;
                  return (
                    <div
                      key={bio.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'terrain', subtype: bio.name, name: bio.name, color: bio.color }));
                      }}
                      onClick={() => onUpdateConfig('biomeStyle', bio.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg border border-slate-700 shrink-0" style={{ backgroundColor: bio.color }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold font-serif block truncate">{bio.name}</span>
                        <span className="text-[9px] text-amber-400 font-mono">🎯 Drag zum Färben</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: SIEDLUNGEN & ICONS */}
          {activeTab === 'settlements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                  🏰 Siedlungs-Icons & Marker
                </h3>
                <span className="text-xs text-slate-400">Symbole per Drag & Drop auf die Weltkarte platzieren</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { icon: '👑', name: 'Hauptstadt', category: 'civilization', desc: 'Königssitz & Metropole' },
                  { icon: '🏰', name: 'Großstadt', category: 'place', desc: 'Mauerbefestigte Stadt' },
                  { icon: '🏘️', name: 'Stadt / Markt', category: 'place', desc: 'Handelszentrum' },
                  { icon: '🏠', name: 'Dorf', category: 'place', desc: 'Ländliche Siedlung' },
                  { icon: '⚓', name: 'Hafenstadt', category: 'place', desc: 'Seehafen & Dock' },
                  { icon: '🛡️', name: 'Festung', category: 'region', desc: 'Militärbastion' },
                  { icon: '🏰', name: 'Burg / Schloss', category: 'place', desc: 'Adelssitz' },
                  { icon: '🏛️', name: 'Ruinen / Tempel', category: 'region', desc: 'Antike Stätte' },
                  { icon: '🗼', name: 'Wachturm', category: 'place', desc: 'Beobachtungsturm' },
                  { icon: '⛏️', name: 'Mine / Stollen', category: 'place', desc: 'Erz- und Goldmine' },
                  { icon: '⛩️', name: 'Heiligtum', category: 'region', desc: 'Sakralbau' },
                  { icon: '🐉', name: 'Monsterbau', category: 'region', desc: 'Gefahrenzone' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'settlement',
                        name: item.name,
                        icon: item.icon,
                        category: item.category,
                        desc: item.desc
                      }));
                    }}
                    className="p-3 bg-slate-950/60 border border-slate-800 hover:border-amber-400/80 rounded-xl flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-slate-850 transition-all select-none group shadow-md"
                  >
                    <span className="text-2xl p-1 bg-slate-900 rounded-lg border border-slate-800 group-hover:scale-110 transition-transform shrink-0">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 block truncate">{item.name}</span>
                      <span className="text-[9px] text-amber-400 font-mono">🎯 Drag</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DEKORATIONEN */}
          {activeTab === 'elements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-mono">
                  🧭 Karten-Dekorationen
                </h3>
                <span className="text-xs text-slate-400">Verzierungen, Kompasse & Banner</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'compass', name: 'Windrose', icon: '🧭', desc: 'Klassischer Nautischer Kompass' },
                  { id: 'banner', name: 'Karten-Banner', icon: '📜', desc: 'Pergament-Inschrift oben' },
                  { id: 'scale', name: 'Maßstabs-Leiste', icon: '📏', desc: 'Kartenmaßstab in Meilen/KM' },
                  { id: 'border', name: 'Verzierter Rahmen', icon: 'framed', desc: 'Klassischer antik gezeichneter Rand' }
                ].map((item) => (
                  <div
                    key={item.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'decoration',
                        id: item.id,
                        name: item.name
                      }));
                    }}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-amber-400/80 rounded-xl flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-slate-850 transition-all group shadow-md"
                  >
                    <span className="text-2xl p-1 bg-slate-900 rounded-lg border border-slate-800 shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 block truncate">{item.name}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            🎯 Ziehe jedes Element direkt auf das Weltkarten-Spielfeld.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg font-serif"
          >
            Fertig / Zurück zur Karte
          </button>
        </div>

      </div>
    </div>
  );
};
