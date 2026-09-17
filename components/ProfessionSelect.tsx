import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, Check, Lock, Unlock, Shield, Award, Info, Briefcase, GraduationCap, ArrowRight, Layers, Star, Compass } from 'lucide-react';
import { JOB_CATEGORIES, getFieldIdForJob, getProfessionTypeForField, getProfessionTypeForJob, ProfessionType } from './jobPresets';
import { getProfessionTreeForField, ProfessionTreeNode, ProfessionTreeField, ProfessionPrerequisite } from '../lib/professionTreeData';
import { getPositionsForProfession, ProfessionPosition, PROFESSION_POSITIONS } from '../lib/professionPositionsData';
import { getSuggestedAuthoritiesForProfession } from '../lib/professionAuthoritiesData';

interface ProfessionSelectProps {
  value: string;
  onChange: (value: string, detectedFieldId?: string) => void;
  selectedField?: string;
  onFieldChange?: (fieldId: string) => void;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  showNobleChildrenButton?: boolean;
}

export const ProfessionSelect: React.FC<ProfessionSelectProps> = ({
  value = '',
  onChange,
  selectedField = '',
  onFieldChange,
  placeholder = 'Beruf aus dem hierarchischen System auswählen...',
  className = '',
  selectClassName = '',
  inputClassName = ''
}) => {
  const [openField, setOpenField] = useState(selectedField || (value ? getFieldIdForJob(value) : 'lebensmittel_versorgung'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'positions'>('tree');
  const [selectedBranchKey, setSelectedBranchKey] = useState<string>('all');
  const [professionTypeFilter, setProfessionTypeFilter] = useState<'all' | 'civil' | 'combat'>('all');

  const activeField = selectedField || openField || 'lebensmittel_versorgung';


  const filteredJobCategories = useMemo(() => {
    if (professionTypeFilter === 'all') return JOB_CATEGORIES;
    return JOB_CATEGORIES.filter(cat => getProfessionTypeForField(cat.fieldId) === professionTypeFilter);
  }, [professionTypeFilter]);
  const activeCategory = useMemo(
    () => JOB_CATEGORIES.find(category => category.fieldId === activeField) || JOB_CATEGORIES[0],
    [activeField]
  );

  // Load hierarchical tree for the active field
  const treeField: ProfessionTreeField = useMemo(() => {
    return getProfessionTreeForField(activeField, activeCategory?.category);
  }, [activeField, activeCategory]);

  // Group nodes by branch/category
  const branchGroups = useMemo(() => {
    const groups: Record<string, ProfessionTreeNode[]> = {};
    for (const node of treeField.nodes) {
      const cat = node.category || 'Hauptzweig';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(node);
    }
    return groups;
  }, [treeField]);

  // Positions associated with current profession
  const availablePositions = useMemo(() => {
    if (!value) return PROFESSION_POSITIONS.slice(0, 10);
    return getPositionsForProfession(value);
  }, [value]);

  // Active inspected node
  const activeInspectedNode = useMemo(() => {
    if (selectedNodeId) {
      const found = treeField.nodes.find(n => n.id === selectedNodeId);
      if (found) return found;
    }
    if (value) {
      const found = treeField.nodes.find(n => n.name.toLowerCase() === value.toLowerCase());
      if (found) return found;
    }
    return treeField.nodes[0] || null;
  }, [selectedNodeId, value, treeField]);

  // Global search results across all fields if search active
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    const results: { fieldId: string; fieldName: string; node: ProfessionTreeNode }[] = [];

    for (const cat of JOB_CATEGORIES) {
      const tree = getProfessionTreeForField(cat.fieldId, cat.category);
      for (const node of tree.nodes) {
        if (
          node.name.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query) ||
          node.suggestedCompetencies?.some(c => c.toLowerCase().includes(query))
        ) {
          results.push({ fieldId: cat.fieldId, fieldName: cat.category, node });
        }
      }
    }
    return results;
  }, [searchQuery]);

  const handleSelectField = (fieldId: string) => {
    setOpenField(fieldId);
    onFieldChange?.(fieldId);
    setSelectedBranchKey('all');
    setSelectedNodeId(null);
  };

  const handleSelectProfession = (jobName: string, targetFieldId?: string) => {
    const finalFieldId = targetFieldId || activeCategory?.fieldId || getFieldIdForJob(jobName);
    onChange(jobName, finalFieldId);
    if (finalFieldId && finalFieldId !== activeField) {
      setOpenField(finalFieldId);
      onFieldChange?.(finalFieldId);
    }
  };

  const getNodeTypeBadge = (node: ProfessionTreeNode) => {
    switch (node.nodeType) {
      case 'training':
        return { label: 'Ausbildung / Vorstufe', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' };
      case 'profession':
        return { label: 'Grundberuf', bg: 'bg-blue-950/80 text-blue-300 border-blue-800/60' };
      case 'specialization':
        return { label: 'Spezialisierung', bg: 'bg-amber-950/80 text-amber-300 border-amber-800/60' };
      case 'advanced_profession':
        return { label: 'Weiterführend', bg: 'bg-purple-950/80 text-purple-300 border-purple-800/60' };
      case 'promotion':
        return { label: 'Beförderungsstufe', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60' };
      case 'leadership':
        return { label: 'Leitungsfunktion', bg: 'bg-rose-950/80 text-rose-300 border-rose-800/60' };
      default:
        if (node.rankOrder === 0) return { label: 'Ausbildung', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' };
        if (node.rankOrder === 1) return { label: 'Grundberuf', bg: 'bg-blue-950/80 text-blue-300 border-blue-800/60' };
        if (node.rankOrder === 2) return { label: 'Spezialisierung', bg: 'bg-amber-950/80 text-amber-300 border-amber-800/60' };
        return { label: 'Meister / Leitung', bg: 'bg-rose-950/80 text-rose-300 border-rose-800/60' };
    }
  };

  const isSelectedJob = (jobName: string) => {
    return value.toLowerCase().trim() === jobName.toLowerCase().trim();
  };

  return (
    <div className={`flex flex-col w-full text-slate-200 ${className}`}>
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Berufsentwicklung & Hierarchischer Katalog (V7)
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Beruf, Spezialisierung, Skill..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Global Search Results Overlay */}
      {searchResults ? (
        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
            <span>Suchergebnisse ({searchResults.length})</span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-amber-400 hover:underline"
            >
              Zurück zur Feldansicht
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Kein Beruf oder Spezialisierung für "{searchQuery}" gefunden.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchResults.map(({ fieldId, fieldName, node }) => {
                const selected = isSelectedJob(node.name);
                const badge = getNodeTypeBadge(node);
                return (
                  <button
                    key={`${fieldId}_${node.id}`}
                    type="button"
                    onClick={() => {
                      handleSelectProfession(node.name, fieldId);
                      setSelectedNodeId(node.id);
                      setSearchQuery('');
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition ${
                      selected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{node.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{node.description}</div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                      <span>{fieldName}</span>
                      <span>{selected ? '✓ Ausgewählt' : 'Auswählen →'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 16 Berufsfelder Auswahltabs */}
          <div className="mt-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProfessionTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                    professionTypeFilter === 'all'
                      ? 'bg-slate-700 text-white border-slate-600 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Alle Berufsfelder (16)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfessionTypeFilter('civil');
                    if (getProfessionTypeForField(activeField) !== 'civil') {
                      const firstCivil = JOB_CATEGORIES.find(c => getProfessionTypeForField(c.fieldId) === 'civil');
                      if (firstCivil) handleSelectField(firstCivil.fieldId);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                    professionTypeFilter === 'civil'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Zivile Berufe (12)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfessionTypeFilter('combat');
                    if (getProfessionTypeForField(activeField) !== 'combat') {
                      const firstCombat = JOB_CATEGORIES.find(c => getProfessionTypeForField(c.fieldId) === 'combat');
                      if (firstCombat) handleSelectField(firstCombat.fieldId);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                    professionTypeFilter === 'combat'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700/70 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Kampfberufe (4)
                </button>
              </div>
              {activeCategory && (
                <span className="text-[10px] text-slate-400">
                  {treeField.nodes.length} Stufen & Spezialisierungen
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              {filteredJobCategories.map(category => {
                const isSelected = category.fieldId === activeField;
                return (
                  <button
                    key={category.fieldId}
                    type="button"
                    onClick={() => handleSelectField(category.fieldId)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {category.category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Navigation & View Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('tree')}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'tree'
                    ? 'bg-slate-800 text-white border-slate-700'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Hierarchischer Berufstree
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('positions')}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'positions'
                    ? 'bg-slate-800 text-white border-slate-700'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Beförderungs- & Leitungsfunktionen
              </button>
            </div>

            {/* Branch Filter within Active Field */}
            {activeTab === 'tree' && Object.keys(branchGroups).length > 1 && (
              <div className="flex items-center gap-1 text-[11px] overflow-x-auto">
                <span className="text-slate-500 text-[10px] mr-1">Zweig:</span>
                <button
                  type="button"
                  onClick={() => setSelectedBranchKey('all')}
                  className={`px-2 py-0.5 rounded border text-[10px] transition ${
                    selectedBranchKey === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Alle Zweige
                </button>
                {Object.keys(branchGroups).map(branchName => (
                  <button
                    key={branchName}
                    type="button"
                    onClick={() => setSelectedBranchKey(branchName)}
                    className={`px-2 py-0.5 rounded border text-[10px] whitespace-nowrap transition ${
                      selectedBranchKey === branchName
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {branchName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          {activeTab === 'tree' ? (
            <div className="mt-3 space-y-4">
              {/* Active Selection Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] text-slate-400">Aktuell gewählter Beruf:</span>
                  <span className="text-xs font-bold text-amber-300">
                    {value || 'Keiner ausgewählt (bitte im Tree wählen)'}
                  </span>
                </div>
                {value && (
                  <span className="text-[10px] text-slate-500">
                    Fachbereich: {activeCategory.category}
                  </span>
                )}
              </div>

              {/* Tree Branches Representation */}
              <div className="space-y-6">
                {Object.entries(branchGroups)
                  .filter(([branchName]) => selectedBranchKey === 'all' || selectedBranchKey === branchName)
                  .map(([branchName, nodes]) => {
                    // Sort nodes hierarchically by rankOrder
                    const sortedNodes = [...nodes].sort((a, b) => (a.rankOrder ?? 0) - (b.rankOrder ?? 0));
                    
                    // Group into tiers: 0=Ausbildung, 1=Grundberuf, 2=Spezialisierung, 3=Meister
                    const tier0 = sortedNodes.filter(n => (n.rankOrder ?? 0) === 0 || n.nodeType === 'training');
                    const tier1 = sortedNodes.filter(n => (n.rankOrder ?? 0) === 1 || n.nodeType === 'profession');
                    const tier2 = sortedNodes.filter(n => (n.rankOrder ?? 0) === 2 || n.nodeType === 'specialization' || n.nodeType === 'advanced_profession');
                    const tier3 = sortedNodes.filter(n => (n.rankOrder ?? 0) >= 3 || n.nodeType === 'leadership');

                    return (
                      <div
                        key={branchName}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 relative overflow-hidden"
                      >
                        {/* Branch Title Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-bold tracking-wide text-slate-200">
                              Berufszweig: {branchName}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {sortedNodes.length} Entwicklungsknoten
                          </span>
                        </div>

                        {/* Hierarchical Flow: Ausbildung -> Grundberuf -> Spezialisierung -> Meister */}
                        <div className="space-y-4">
                          {/* Stufe 0: Ausbildung / Lehrling */}
                          {tier0.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5" />
                                1. Ausbildung & Vorstufe
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {tier0.map(node => (
                                  <TreeNodeCard
                                    key={node.id}
                                    node={node}
                                    isSelected={isSelectedJob(node.name)}
                                    isInspected={activeInspectedNode?.id === node.id}
                                    onSelect={() => handleSelectProfession(node.name)}
                                    onInspect={() => setSelectedNodeId(node.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Connection Arrow */}
                          {tier0.length > 0 && tier1.length > 0 && (
                            <div className="flex items-center justify-center py-1">
                              <div className="h-4 w-px bg-slate-700" />
                            </div>
                          )}

                          {/* Stufe 1: Grundberuf */}
                          {tier1.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                2. Grundberuf (Fundament)
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {tier1.map(node => (
                                  <TreeNodeCard
                                    key={node.id}
                                    node={node}
                                    isSelected={isSelectedJob(node.name)}
                                    isInspected={activeInspectedNode?.id === node.id}
                                    onSelect={() => handleSelectProfession(node.name)}
                                    onInspect={() => setSelectedNodeId(node.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Connection Arrow */}
                          {tier1.length > 0 && tier2.length > 0 && (
                            <div className="flex items-center justify-center py-1">
                              <div className="h-4 w-px bg-slate-700" />
                            </div>
                          )}

                          {/* Stufe 2: Spezialisierungen & Weiterführende Berufe */}
                          {tier2.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" />
                                3. Spezialisierungen & Fachrichtungen
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {tier2.map(node => (
                                  <TreeNodeCard
                                    key={node.id}
                                    node={node}
                                    isSelected={isSelectedJob(node.name)}
                                    isInspected={activeInspectedNode?.id === node.id}
                                    onSelect={() => handleSelectProfession(node.name)}
                                    onInspect={() => setSelectedNodeId(node.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Connection Arrow */}
                          {tier2.length > 0 && tier3.length > 0 && (
                            <div className="flex items-center justify-center py-1">
                              <div className="h-4 w-px bg-slate-700" />
                            </div>
                          )}

                          {/* Stufe 3: Meister- & Leitungsstufe */}
                          {tier3.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" />
                                4. Fachspitze & Meisterrang
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {tier3.map(node => (
                                  <TreeNodeCard
                                    key={node.id}
                                    node={node}
                                    isSelected={isSelectedJob(node.name)}
                                    isInspected={activeInspectedNode?.id === node.id}
                                    onSelect={() => handleSelectProfession(node.name)}
                                    onInspect={() => setSelectedNodeId(node.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Inspected Node Detail Card */}
              {activeInspectedNode && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">
                        Knotendetails: {activeInspectedNode.name}
                      </h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getNodeTypeBadge(activeInspectedNode).bg}`}>
                        {getNodeTypeBadge(activeInspectedNode).label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectProfession(activeInspectedNode.name)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
                    >
                      Diesen Beruf wählen
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeInspectedNode.description}
                  </p>

                  {/* Prerequisites (Voraussetzungen) */}
                  {activeInspectedNode.prerequisites && activeInspectedNode.prerequisites.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Voraussetzungen für diesen Knoten
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {activeInspectedNode.prerequisites.map((req, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2"
                          >
                            <span className="text-amber-400 font-bold">•</span>
                            <div>
                              <div className="font-medium text-slate-200">{req.label || (req as any).targetName || req.targetId}</div>
                              {req.minValue && (
                                <div className="text-[10px] text-slate-400">
                                  Erfordert Mindestwert: {req.minValue} %
                                </div>
                              )}
                              {req.targetFieldName && (
                                <div className="text-[9px] text-amber-400/80">
                                  Cross-Profession: {req.targetFieldName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Competencies */}
                  {activeInspectedNode.suggestedCompetencies && activeInspectedNode.suggestedCompetencies.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Zugehörige Kern- und Fachkompetenzen
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeInspectedNode.suggestedCompetencies.map((comp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Possible Ranks / Titles */}
                  {activeInspectedNode.possibleRanks && activeInspectedNode.possibleRanks.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Mögliche Bezeichnungen / Amtsformen
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {activeInspectedNode.possibleRanks.join(' · ')}
                      </div>
                    </div>
                  )}

                  {/* Operational Authorities (Befugnisse & Weisungsrechte) */}
                  {(() => {
                    const auths =
                      activeInspectedNode.suggestedAuthorities ||
                      activeInspectedNode.authorities ||
                      getSuggestedAuthoritiesForProfession(
                        activeInspectedNode.name,
                        activeInspectedNode.rankOrder ?? activeInspectedNode.tier
                      );

                    if (!auths || auths.length === 0) return null;

                    return (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-400" />
                          Befugnisse & Weisungsrechte im Betrieb
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {auths.map((auth, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-200 font-medium"
                            >
                              {auth}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* Positions & Leadership Functions Tab */
            <div className="mt-3 space-y-3">
              <div className="p-3 rounded-xl border border-indigo-900/50 bg-indigo-950/20 text-xs text-indigo-200 leading-relaxed">
                <strong>Trennung nach System V7:</strong> Positionen (z. B. Küchenchef, Souschef, Oberarzt, Werkstattleiter, Vorarbeiter, Kapitän) sind Leitungs- und Stellvertreterfunktionen. Sie werden durch Erfahrung, Vertrauen oder Beförderung erlangt, ohne den Grundberuf zu überschreiben.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {availablePositions.map(pos => (
                  <div
                    key={pos.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">{pos.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-950 text-indigo-300 border-indigo-800">
                        {pos.type === 'deputy' ? 'Stellvertretung' : pos.type === 'supervisor' ? 'Aufsicht' : pos.type === 'leadership' ? 'Leitung' : 'Höhere Leitung'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {pos.description}
                    </p>

                    {pos.prerequisites && pos.prerequisites.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-500">Beförderungsvoraussetzung: </span>
                        {pos.prerequisites.map(p => p.description || p.targetName || p.label).join('; ')}
                      </div>
                    )}

                    {pos.authorityScope && (
                      <div className="text-[10px] text-indigo-300">
                        <span className="text-slate-500">Befugnisse: </span>
                        {pos.authorityScope.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface TreeNodeCardProps {
  node: ProfessionTreeNode;
  isSelected: boolean;
  isInspected: boolean;
  onSelect: () => void;
  onInspect: () => void;
}

const TreeNodeCard: React.FC<TreeNodeCardProps> = ({
  node,
  isSelected,
  isInspected,
  onSelect,
  onInspect
}) => {
  const hasPrerequisites = Boolean(node.prerequisites && node.prerequisites.length > 0);
  const crossFieldReq = node.prerequisites?.find(p => p.targetFieldName);
  const nodeAuthorities =
    node.suggestedAuthorities ||
    node.authorities ||
    getSuggestedAuthoritiesForProfession(node.name, node.rankOrder ?? node.tier);

  return (
    <div
      className={`group rounded-xl border p-2.5 transition flex flex-col justify-between ${
        isSelected
          ? 'border-amber-500 bg-amber-500/15 shadow-md text-amber-200'
          : isInspected
          ? 'border-slate-600 bg-slate-900 text-slate-200'
          : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700 text-slate-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-xs font-bold leading-tight line-clamp-1">{node.name}</span>
          {isSelected && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500 text-slate-950 font-bold shrink-0">
              ✓ AKTUELL
            </span>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {node.description}
        </p>

        {/* Requirements badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {hasPrerequisites && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              Voraussetzungen
            </span>
          )}
          {crossFieldReq && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300">
              Cross: {crossFieldReq.targetFieldName}
            </span>
          )}
          {nodeAuthorities && nodeAuthorities.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300/90 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-amber-400" />
              {nodeAuthorities.length} Befugnisse
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/70">
        <button
          type="button"
          onClick={onSelect}
          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition text-center ${
            isSelected
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {isSelected ? 'Ausgewählt' : 'Auswählen'}
        </button>
        <button
          type="button"
          onClick={onInspect}
          title="Details ansehen"
          className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ProfessionSelect;
