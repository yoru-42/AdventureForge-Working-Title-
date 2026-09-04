import React, { useState } from 'react';
import { 
  WorldSetting, 
  LoreEntry, 
  EconomyHolding, 
  CombatState,
  TacticalFormation,
  TacticalDirection
} from '../../types';
import * as LucideIcons from 'lucide-react';
import { 
  changeTacticalGroupFormation, 
  splitTacticalGroup, 
  spawnTacticalGroup 
} from '../../utils/tacticalEngine';

interface TacticalManagementTabProps {
  world: WorldSetting;
  loreDatabase: LoreEntry[];
  holdings: EconomyHolding[];
  combatState?: CombatState;
  onUpdateCombatState: (updates: Partial<CombatState>) => void;
}

const FORMATIONS: { id: TacticalFormation; label: string; description: string }[] = [
  { id: 'line', label: 'Linie', description: 'Breite Front mit hoher Feuerkraft' },
  { id: 'column', label: 'Kolonne', description: 'Schmale Marschformation für schnelles Vorrücken' },
  { id: 'wedge', label: 'Keil', description: 'Speerspitzen-Formation zum Durchbrechen feindlicher Linien' },
  { id: 'square', label: 'Quadrat', description: 'Kompakter Block mit Rundumschutz' },
  { id: 'circle', label: 'Kreis', description: 'Defensive Igelstellung gegen Einkesselung' },
  { id: 'loose', label: 'Locker', description: 'Aufgelockerte Ordnung gegen Flächenschaden' },
  { id: 'swarm', label: 'Schwarm', description: 'Organische, dichte Massenanhäufung' },
  { id: 'spread', label: 'Verteilt', description: 'Weitmaschiges Netz mit Zwischenabständen' },
  { id: 'defensive_line', label: 'Verteidigungslinie', description: 'Gestaffelte Schildmauer in zwei Gliedern' },
  { id: 'archer_line', label: 'Schützenlinie', description: 'Aufgelockerte Feuerlinie für Fernkämpfer' },
  { id: 'wall', label: 'Mauer', description: 'Geschlossene Schutzwand ohne Lücken' },
  { id: 'scattered', label: 'Gestreut', description: 'Weiträumig zerstreute Einzelpositionen' }
];

const DIRECTIONS: { id: TacticalDirection; label: string }[] = [
  { id: 'north', label: 'Norden' },
  { id: 'south', label: 'Süden' },
  { id: 'east', label: 'Osten' },
  { id: 'west', label: 'Westen' },
  { id: 'northeast', label: 'Nordosten' },
  { id: 'northwest', label: 'Nordwesten' },
  { id: 'southeast', label: 'Südosten' },
  { id: 'southwest', label: 'Südwesten' }
];

export const TacticalManagementTab: React.FC<TacticalManagementTabProps> = ({
  world,
  loreDatabase,
  holdings,
  combatState,
  onUpdateCombatState
}) => {
  const factions = loreDatabase.filter(l => l.category === 'Fraktionen');
  const [selectedFactionId, setSelectedFactionId] = useState<string>(factions[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Modal / Form state for creating a new tactical group
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupCount, setNewGroupCount] = useState<number>(20);
  const [newGroupFormation, setNewGroupFormation] = useState<TacticalFormation>('loose');
  const [newGroupDirection, setNewGroupDirection] = useState<TacticalDirection>('south');

  // Split state
  const [splitCount, setSplitCount] = useState<number>(10);

  const entities = combatState?.tacticalEntities || {};
  const groups = combatState?.tacticalGroups || {};

  const allGroups = Object.values(groups);
  const factionGroups = allGroups.filter(g => !selectedFactionId || g.factionId === selectedFactionId || !g.factionId);
  const activeGroup = (selectedGroupId && groups[selectedGroupId]) ? groups[selectedGroupId] : factionGroups[0] || null;

  const gridWidth = combatState?.gridWidth || 30;
  const gridHeight = combatState?.gridHeight || 20;

  const handleFormationChange = (groupId: string, newFormation: TacticalFormation) => {
    if (!combatState) return;
    try {
      const res = changeTacticalGroupFormation({
        combatState,
        groupId,
        newFormation
      });
      onUpdateCombatState(res.updatedCombatState);
    } catch (err) {
      console.error('Fehler beim Ändern der Formation:', err);
    }
  };

  const handleDirectionChange = (groupId: string, newDirection: TacticalDirection) => {
    if (!combatState) return;
    const g = groups[groupId];
    if (!g) return;
    try {
      const res = changeTacticalGroupFormation({
        combatState,
        groupId,
        newFormation: g.formation || 'loose',
        newDirection
      });
      onUpdateCombatState(res.updatedCombatState);
    } catch (err) {
      console.error('Fehler beim Ändern der Ausrichtung:', err);
    }
  };

  const handleSplitGroup = (groupId: string) => {
    if (!combatState) return;
    const g = groups[groupId];
    if (!g || g.unitIds.length <= splitCount) return;
    try {
      const res = splitTacticalGroup({
        combatState,
        sourceGroupId: groupId,
        countToSplit: splitCount,
        newGroupName: `${g.name} Flanke`,
        newFormation: 'wedge',
        newCenter: {
          x: Math.min(gridWidth - 3, Math.max(2, (g.center?.x || 15) - 6)),
          y: g.center?.y || 10
        }
      });
      onUpdateCombatState(res.updatedCombatState);
      setSelectedGroupId(res.newGroup.id);
    } catch (err) {
      console.error('Fehler beim Aufteilen des Verbands:', err);
    }
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!combatState) return;
    const name = newGroupName.trim() || `Verband ${allGroups.length + 1}`;
    try {
      const res = spawnTacticalGroup({
        combatState,
        groupName: name,
        factionId: selectedFactionId || undefined,
        count: Math.max(1, Math.min(100, newGroupCount)),
        formation: newGroupFormation,
        direction: newGroupDirection,
        unitDisplayName: name.replace(/\s+\d+$/, '')
      });
      onUpdateCombatState(res.updatedCombatState);
      setSelectedGroupId(res.group.id);
      setShowCreateGroup(false);
      setNewGroupName('');
    } catch (err) {
      console.error('Fehler beim Aufstellen des Verbands:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <LucideIcons.Shield className="w-4 h-4 text-emerald-500" /> Taktische Verbände und Formationen
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verwaltung von Großverbänden, taktischen Ausrichtungen und Gitterformationen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <LucideIcons.Plus className="w-3.5 h-3.5" /> Verband aufstellen
          </button>
        </div>
      </div>

      {/* Main Content: Group Overview & Formation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Group List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <LucideIcons.Users className="w-3.5 h-3.5" /> Aktive Verbände ({factionGroups.length})
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">{gridWidth}x{gridHeight} Gitter</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {factionGroups.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  Keine taktischen Verbände vorhanden. Erstelle einen Verband oder starte einen Kampf mit Gruppenstärke.
                </div>
              ) : (
                factionGroups.map(g => {
                  const isSelected = activeGroup?.id === g.id;
                  const formationLabel = FORMATIONS.find(f => f.id === g.formation)?.label || g.formation || 'Locker';
                  const dirLabel = DIRECTIONS.find(d => d.id === g.direction)?.label || g.direction || 'Süden';

                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-100 truncate">{g.name}</div>
                        <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {g.spawnedCount || g.unitIds.length} Einheiten
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <LucideIcons.Grid className="w-3 h-3 text-slate-500" /> {formationLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <LucideIcons.Compass className="w-3 h-3 text-slate-500" /> {dirLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Spawn 50 Units */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h5 className="text-[11px] font-bold text-slate-300">Schnell-Bereitstellung</h5>
            <p className="text-[11px] text-slate-400">
              Generiert eine Test-Horde mit 50 Einheiten auf dem aktuellen Kampfraster.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!combatState) return;
                const res = spawnTacticalGroup({
                  combatState,
                  groupName: 'Goblin-Horde',
                  count: 50,
                  formation: 'loose',
                  direction: 'south',
                  unitDisplayName: 'Goblin'
                });
                onUpdateCombatState(res.updatedCombatState);
                setSelectedGroupId(res.group.id);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LucideIcons.Plus className="w-3.5 h-3.5 text-amber-400" /> 50 Goblins aufstellen (Locker)
            </button>
          </div>
        </div>

        {/* Right: Active Group Formation Editor */}
        <div className="lg:col-span-2 space-y-4">
          {activeGroup ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <LucideIcons.Flag className="w-4 h-4 text-amber-500" /> {activeGroup.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Stärke: {activeGroup.spawnedCount || activeGroup.unitIds.length} von {activeGroup.requestedCount || activeGroup.unitIds.length} Einheiten platziert
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold">Ausrichtung:</span>
                  <select
                    value={activeGroup.direction || 'south'}
                    onChange={e => handleDirectionChange(activeGroup.id, e.target.value as TacticalDirection)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {DIRECTIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Formation Selector Grid */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Formation wählen (12 taktische Anordnungen)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {FORMATIONS.map(f => {
                    const isActive = activeGroup.formation === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleFormationChange(activeGroup.id, f.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-500/80 text-amber-200 shadow-sm ring-1 ring-amber-500/40'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                        }`}
                        title={f.description}
                      >
                        <div className="text-xs font-bold leading-none">{f.label}</div>
                        <div className="text-[9px] text-slate-400 mt-1 leading-tight line-clamp-1">{f.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group Splitting Section */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Verband aufteilen</div>
                    <div className="text-[10px] text-slate-400">Spaltet Einheiten ab, um eine Flanke oder Reserve zu bilden.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, (activeGroup.unitIds.length || 2) - 1)}
                      value={splitCount}
                      onChange={e => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-slate-100 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSplitGroup(activeGroup.id)}
                      disabled={activeGroup.unitIds.length <= splitCount}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Abspalten
                    </button>
                  </div>
                </div>
              </div>

              {/* Tactical Overview / Grid Mini Radar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold">Einheiten-Verteilung auf dem Gitter</span>
                  <span className="font-mono text-[10px]">{gridWidth} Spalten × {gridHeight} Zeilen</span>
                </div>
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`
                  }}
                  className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-1 gap-[1px] relative overflow-hidden"
                >
                  {/* Visual dots for tactical entities */}
                  {Object.values(entities).map(e => {
                    const isPartOfActive = e.groupId === activeGroup.id;
                    const left = `${(e.position.x / gridWidth) * 100}%`;
                    const top = `${(e.position.y / gridHeight) * 100}%`;
                    return (
                      <div
                        key={e.id}
                        style={{
                          position: 'absolute',
                          left,
                          top,
                          width: `${100 / gridWidth}%`,
                          height: `${100 / gridHeight}%`
                        }}
                        className="flex items-center justify-center pointer-events-none"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isPartOfActive 
                              ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' 
                              : 'bg-red-500 opacity-60'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Wähle einen Verband aus der Liste aus oder erstelle einen neuen.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Tactical Group */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <LucideIcons.Plus className="w-4 h-4 text-emerald-500" /> Neuen taktischen Verband aufstellen
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Name des Verbands</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="z. B. Vorhut der Stadtwache"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Einheitenanzahl</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newGroupCount}
                    onChange={e => setNewGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Ausrichtung</label>
                  <select
                    value={newGroupDirection}
                    onChange={e => setNewGroupDirection(e.target.value as TacticalDirection)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  >
                    {DIRECTIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Startformation</label>
                <select
                  value={newGroupFormation}
                  onChange={e => setNewGroupFormation(e.target.value as TacticalFormation)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                >
                  {FORMATIONS.map(f => (
                    <option key={f.id} value={f.id}>{f.label} - {f.description}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Aufstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
