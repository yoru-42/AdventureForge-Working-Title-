import React, { useState, useMemo } from 'react';
import { Adventure, LoreEntry } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
  onSetInputText?: (text: string) => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onUpdateAdventure,
  onSendChatMessage,
  onSetInputText
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [customDestination, setCustomDestination] = useState('');

  const loreDatabase = useMemo(() => adventure.loreDatabase || [], [adventure.loreDatabase]);

  const locationEntries = useMemo(() => {
    return loreDatabase.filter(l => l.category === 'Orte');
  }, [loreDatabase]);

  const activeTargetLocation = useMemo(() => {
    return locationEntries.find(l => l.category === 'Orte' && l.details?.isActiveTarget);
  }, [locationEntries]);

  const currentLocationName = useMemo(() => {
    if (adventure.player?.appearance?.currentLocation) {
      return adventure.player.appearance.currentLocation;
    }
    if (activeTargetLocation?.title) {
      return activeTargetLocation.title;
    }
    return 'Unbekannter Standort';
  }, [adventure.player?.appearance?.currentLocation, activeTargetLocation]);

  const regions = useMemo(() => {
    const list = new Set<string>();
    locationEntries.forEach(loc => {
      const reg = loc.details?.region || loc.details?.territory || loc.details?.area;
      if (reg && typeof reg === 'string' && reg.trim()) {
        list.add(reg.trim());
      }
    });
    return Array.from(list).sort();
  }, [locationEntries]);

  const filteredLocations = useMemo(() => {
    return locationEntries.filter(loc => {
      const title = loc.title || '';
      const desc = loc.description || '';
      const region = (loc.details?.region || loc.details?.territory || '').toLowerCase();
      const matchesSearch = searchTerm.trim() === '' || 
        title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        desc.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = selectedRegionFilter === 'all' || 
        region.includes(selectedRegionFilter.toLowerCase());

      return matchesSearch && matchesRegion;
    });
  }, [locationEntries, searchTerm, selectedRegionFilter]);

  if (!isOpen) return null;

  const handleSetAsTarget = (location: LoreEntry) => {
    const updatedLore = loreDatabase.map(l => {
      if (l.category === 'Orte') {
        return {
          ...l,
          details: {
            ...(l.details || {}),
            isActiveTarget: l.id === location.id
          }
        };
      }
      return l;
    });

    onUpdateAdventure({
      ...adventure,
      loreDatabase: updatedLore
    });
  };

  const handleTravelTo = (location: LoreEntry) => {
    handleSetAsTarget(location);
    const actionText = `*bricht auf und reist nach ${location.title}*`;
    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  const handleExploreCurrentLocation = () => {
    const actionText = `*sieht sich aufmerksam an ${currentLocationName} um und erkundet die unmittelbare Umgebung*`;
    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  const handleTravelToCustom = () => {
    if (!customDestination.trim()) return;
    const dest = customDestination.trim();
    const actionText = `*schlägt den Weg ein in Richtung ${dest}*`;
    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <i className="fa-solid fa-compass text-lg"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Navigation & Reiseziel
              </h2>
              <p className="text-xs text-slate-400">
                Umgebung erfassen, Reiseziele verwalten und den nächsten Zielort ansteuern
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Status Bar: Current Location & Active Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Current Location Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot text-teal-400"></i>
                    Aktueller Standort
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-800/50 text-teal-300 font-bold">
                    Anwesend
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white mb-1">
                  {currentLocationName}
                </div>
                {activeTargetLocation && activeTargetLocation.description && (
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-normal break-words line-clamp-3">
                    {activeTargetLocation.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleExploreCurrentLocation}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-magnifying-glass-location"></i>
                  Umgebung erkunden
                </button>
                <span className="text-[11px] text-slate-500">
                  Szene & Details am Ort untersuchen
                </span>
              </div>
            </div>

            {/* Active Destination Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-flag-checkered text-indigo-400"></i>
                    Festgelegtes Reiseziel
                  </span>
                  {activeTargetLocation ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/50 text-indigo-300 font-bold">
                      Aktiv
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                      Nicht festgelegt
                    </span>
                  )}
                </div>
                <div className="text-sm sm:text-base font-bold text-white mb-1">
                  {activeTargetLocation ? activeTargetLocation.title : 'Kein Reiseziel gewählt'}
                </div>
                {activeTargetLocation && activeTargetLocation.details?.region && (
                  <div className="text-xs text-slate-400">
                    Region: {activeTargetLocation.details.region}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {activeTargetLocation ? (
                  <button
                    type="button"
                    onClick={() => handleTravelTo(activeTargetLocation)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <i className="fa-solid fa-person-walking-luggage"></i>
                    Dorthin aufbrechen
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Wähle unten einen Ort aus der Liste
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Known Locations in the World */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-map-location-dot text-slate-500"></i>
                Bekannte Orte & Siedlungen ({filteredLocations.length})
              </h3>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    type="text"
                    placeholder="Ort suchen..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-teal-500 w-40 sm:w-48"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                {regions.length > 0 && (
                  <select
                    value={selectedRegionFilter}
                    onChange={e => setSelectedRegionFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-teal-500"
                  >
                    <option value="all">Alle Regionen</option>
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Locations List */}
            {filteredLocations.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-500 text-xs space-y-1">
                <div>Keine passenden Orte im Weltenlexikon gefunden.</div>
                <div className="text-[11px] text-slate-600">
                  Nutze das untere Freitextfeld, um eine Reiserichtung oder einen neuen Zielort frei einzugeben.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredLocations.map(loc => {
                  const isCurrent = currentLocationName.toLowerCase().includes(loc.title.toLowerCase());
                  const isTarget = activeTargetLocation?.id === loc.id;
                  const locType = loc.details?.type || loc.details?.category || 'Ort';
                  const locRegion = loc.details?.region || loc.details?.territory || '';

                  return (
                    <div
                      key={loc.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isTarget
                          ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg'
                          : isCurrent
                          ? 'bg-teal-950/20 border-teal-500/40'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                            <i className="fa-solid fa-location-dot text-teal-400 text-xs shrink-0"></i>
                            <span className="whitespace-normal break-words">{loc.title}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isCurrent && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-800 text-teal-300 font-bold">
                                Hier
                              </span>
                            )}
                            {isTarget && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
                                Reiseziel
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px] text-slate-400">
                          {locType && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              {locType}
                            </span>
                          )}
                          {locRegion && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              Region: {locRegion}
                            </span>
                          )}
                        </div>

                        {loc.description && (
                          <p className="text-xs text-slate-400 leading-relaxed whitespace-normal break-words">
                            {loc.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end gap-2 shrink-0">
                        {!isTarget && (
                          <button
                            type="button"
                            onClick={() => handleSetAsTarget(loc)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Diesen Ort als aktives Reiseziel markieren"
                          >
                            <i className="fa-solid fa-map-pin text-indigo-400"></i>
                            Als Reiseziel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTravelTo(loc)}
                          className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                          title="Sofort die Reise zu diesem Ort beginnen"
                        >
                          <i className="fa-solid fa-person-walking"></i>
                          Reisen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Custom Destination / Exploration Route */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-route text-teal-400"></i>
              Freie Reiserichtung oder neues Reiseziel angeben
            </h3>
            <p className="text-xs text-slate-400">
              Wenn das gewünschte Ziel noch nicht im Weltenlexikon verzeichnet ist, gib die Himmelsrichtung, Wegmarke oder den Namen des Ortes ein.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <AutoExpandingTextarea
                value={customDestination}
                onChange={e => setCustomDestination(e.target.value)}
                placeholder="Beispiel: Entlang des Flussufers nach Norden zur alten Festung..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-teal-500 min-h-[38px]"
              />
              <button
                type="button"
                onClick={handleTravelToCustom}
                disabled={!customDestination.trim()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <i className="fa-solid fa-compass"></i>
                Weg einschlagen
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Reisehandlungen werden direkt an den Spielleiter übermittelt.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
