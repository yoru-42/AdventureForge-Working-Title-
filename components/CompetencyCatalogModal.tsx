import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProfessionCompetency } from '../types';
import {
  PROFESSION_FIELDS,
  PROFESSION_COMPETENCY_CATALOG,
  ProfessionCompetencyDefinition,
  findProfessionCatalogEntry,
  getProfessionsForField,
  getCatalogCompetenciesForProfession
} from '../lib/professionCompetencies';
import { createCompetencyFromDefinition } from '../services/professionCompetencyService';
import { Search, X, Check, BookOpen, Plus, Folder, Briefcase } from 'lucide-react';

interface CompetencyCatalogModalProps {
  professionName: string;
  existingCompetencies: ProfessionCompetency[];
  isOpen: boolean;
  onClose: () => void;
  onAddCompetencies: (newComps: ProfessionCompetency[]) => void;
}

export const CompetencyCatalogModal: React.FC<CompetencyCatalogModalProps> = ({
  professionName,
  existingCompetencies,
  isOpen,
  onClose,
  onAddCompetencies
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [activeProfessionName, setActiveProfessionName] = useState<string>(professionName || 'Schmied');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Keep activeProfessionName updated when modal opens with a given profession
  useEffect(() => {
    if (professionName) {
      setActiveProfessionName(professionName);
      const match = findProfessionCatalogEntry(professionName);
      if (match) {
        setSelectedFieldId(match.fieldId);
      }
    }
  }, [professionName, isOpen]);

  // Existing competency names for checking already added
  const existingNamesSet = useMemo(() => {
    return new Set(
      existingCompetencies.map(c => c.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, ''))
    );
  }, [existingCompetencies]);

  // Professions available in selected field
  const professionsInField = useMemo(() => {
    return getProfessionsForField(selectedFieldId);
  }, [selectedFieldId]);

  // Active catalog entry or fallback
  const activeCatalogEntry = useMemo(() => {
    return findProfessionCatalogEntry(activeProfessionName);
  }, [activeProfessionName]);

  // Competencies for active profession
  const currentProfessionCompetencies = useMemo(() => {
    return getCatalogCompetenciesForProfession(activeProfessionName);
  }, [activeProfessionName]);

  // Filtered list
  const filteredCompetencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentProfessionCompetencies.filter(item => {
      if (selectedCategory !== 'Alle' && item.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const nameMatch = item.name.toLowerCase().includes(query);
      const descMatch = (item.description || '').toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  }, [currentProfessionCompetencies, selectedCategory, searchQuery]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllAvailable = () => {
    const next = new Set(selectedIds);
    filteredCompetencies.forEach(item => {
      const normName = item.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
      if (!existingNamesSet.has(normName)) {
        next.add(item.id);
      }
    });
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleAddSelected = () => {
    const toAdd: ProfessionCompetency[] = [];
    const source = currentProfessionCompetencies;

    selectedIds.forEach(id => {
      const def = source.find(d => d.id === id);
      if (def) {
        toAdd.push(createCompetencyFromDefinition(def, 3, 0));
      }
    });

    if (toAdd.length > 0) {
      onAddCompetencies(toAdd);
    }
    setSelectedIds(new Set());
    onClose();
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Grundlage':
        return 'bg-sky-950/70 text-sky-300 border-sky-800/70';
      case 'Fortgeschritten':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/70';
      case 'Spezialisierung':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/70';
      case 'Meisterschaft':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="competency-catalog-modal"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Berufskatalog & Fachkompetenzen
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konkrete, berufsspezifische Fertigkeiten nach Berufsfeldern auswählen und übernehmen
              </p>
            </div>
          </div>
          <button
            type="button"
            id="competency-catalog-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control: Berufsfeld Selection */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Berufsfeld:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 text-xs">
              <button
                type="button"
                id="catalog-field-all"
                onClick={() => setSelectedFieldId('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedFieldId === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                Alle Berufsfelder ({PROFESSION_COMPETENCY_CATALOG.length} Berufe)
              </button>
              {PROFESSION_FIELDS.map(f => {
                const count = PROFESSION_COMPETENCY_CATALOG.filter(p => p.fieldId === f.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={f.id}
                    type="button"
                    id={`catalog-field-${f.id}`}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
                      selectedFieldId === f.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {f.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profession Selection in Field */}
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Beruf:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 text-xs">
              {professionsInField.map(p => {
                const isSelected =
                  activeProfessionName.toLowerCase() === p.professionName.toLowerCase() ||
                  activeProfessionName.toLowerCase() === p.professionId.toLowerCase();
                return (
                  <button
                    key={p.professionId}
                    type="button"
                    id={`catalog-profession-${p.professionId}`}
                    onClick={() => {
                      setActiveProfessionName(p.professionName);
                      setSelectedIds(new Set());
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-600 text-slate-950 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {p.professionName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="competency-catalog-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Kompetenz suchen..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-white text-xs outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['Alle', 'Grundlage', 'Fortgeschritten', 'Spezialisierung', 'Meisterschaft'].map(cat => (
              <button
                key={cat}
                type="button"
                id={`competency-catalog-filter-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selection bar helper */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Angezeigt: {filteredCompetencies.length} Kompetenzen für <strong className="text-amber-300">{activeProfessionName}</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="catalog-select-all-btn"
              onClick={handleSelectAllAvailable}
              className="hover:text-amber-300 transition cursor-pointer underline underline-offset-2"
            >
              Alle verfügbaren auswählen
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                id="catalog-clear-selection-btn"
                onClick={handleClearSelection}
                className="hover:text-rose-300 transition cursor-pointer underline underline-offset-2"
              >
                Auswahl aufheben
              </button>
            )}
          </div>
        </div>

        {/* List of Catalog Items */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2 divide-y divide-slate-800/40">
          {filteredCompetencies.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              Keine passenden Katalog-Einträge für diesen Filter gefunden.
            </div>
          ) : (
            filteredCompetencies.map(item => {
              const normName = item.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
              const isAlreadyAdded = existingNamesSet.has(normName);
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  id={`catalog-item-${item.id}`}
                  onClick={() => !isAlreadyAdded && toggleSelect(item.id)}
                  className={`pt-2.5 pb-2.5 px-3 rounded-xl transition flex items-start justify-between gap-3 ${
                    isAlreadyAdded
                      ? 'opacity-50 cursor-not-allowed bg-slate-950/20'
                      : isSelected
                      ? 'bg-amber-950/25 border border-amber-600/50 cursor-pointer'
                      : 'hover:bg-slate-800/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        id={`catalog-item-checkbox-${item.id}`}
                        checked={isSelected}
                        disabled={isAlreadyAdded}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                        {isAlreadyAdded && (
                          <span className="text-[10px] text-slate-500 font-medium italic">
                            (Bereits im Profil hinterlegt)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {!isAlreadyAdded && (
                    <button
                      type="button"
                      id={`catalog-add-single-btn-${item.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        onAddCompetencies([createCompetencyFromDefinition(item, 3, 0)]);
                      }}
                      className="p-1.5 text-xs bg-slate-800 hover:bg-amber-600/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 rounded-lg transition shrink-0 cursor-pointer"
                      title="Einzeln direkt hinzufügen"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
          <span className="text-xs text-slate-400">
            {selectedIds.size} {selectedIds.size === 1 ? 'Kompetenz' : 'Kompetenzen'} ausgewählt
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="competency-catalog-cancel-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Schließen
            </button>
            <button
              type="button"
              id="competency-catalog-submit-selected-btn"
              disabled={selectedIds.size === 0}
              onClick={handleAddSelected}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Ausgewählte hinzufügen ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
