import React, { useState, useMemo } from 'react';
import {
  ProfessionTreeNode,
  ProfessionNodeTier,
  getProfessionTreeForField,
  evaluateNodePrerequisites,
  NodeEvaluationResult
} from '../lib/professionTreeData';
import { ProfessionCompetency } from '../types';
import {
  CheckCircle2,
  Lock,
  Compass,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Info,
  ShieldAlert,
  Flame,
  UserCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface ProfessionSkillTreeProps {
  fieldId: string;
  fieldName?: string;
  currentProfession: string;
  currentSpecialization?: string;
  currentRank?: string;
  experienceYears?: number;
  competencies?: ProfessionCompetency[];
  onSelectProfession: (professionName: string, specialization?: string, fieldId?: string) => void;
  readOnly?: boolean;
}

const TIER_LABELS: Record<ProfessionNodeTier, string> = {
  einstieg: 'Berufseinstieg / Lehrling',
  beruf: 'Kernberufe',
  spezialisierung: 'Spezialisierungen & Fachpfade',
  meister: 'Meisterstufe & Führung'
};

const TIER_BADGE_STYLES: Record<ProfessionNodeTier, string> = {
  einstieg: 'bg-slate-800 text-slate-300 border-slate-700',
  beruf: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
  spezialisierung: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50',
  meister: 'bg-amber-500/20 text-amber-200 border-amber-500/40 font-semibold'
};

export const ProfessionSkillTree: React.FC<ProfessionSkillTreeProps> = ({
  fieldId,
  fieldName,
  currentProfession,
  currentSpecialization = '',
  currentRank = '',
  experienceYears = 0,
  competencies = [],
  onSelectProfession,
  readOnly = false
}) => {
  const tree = useMemo(() => {
    return getProfessionTreeForField(fieldId, fieldName);
  }, [fieldId, fieldName]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Group nodes by tier
  const nodesByTier = useMemo(() => {
    const tiers: Record<ProfessionNodeTier, ProfessionTreeNode[]> = {
      einstieg: [],
      beruf: [],
      spezialisierung: [],
      meister: []
    };
    for (const node of tree.nodes) {
      if (tiers[node.tier]) {
        tiers[node.tier].push(node);
      }
    }
    return tiers;
  }, [tree]);

  // Map of node evaluations
  const evaluations = useMemo(() => {
    const map = new Map<string, NodeEvaluationResult>();
    for (const node of tree.nodes) {
      const evalResult = evaluateNodePrerequisites(node, {
        profession: currentProfession,
        professionSpecialization: currentSpecialization,
        professionRank: currentRank,
        experienceYears,
        competencies
      });
      map.set(node.id, evalResult);
    }
    return map;
  }, [tree, currentProfession, currentSpecialization, currentRank, experienceYears, competencies]);

  // Selected node object
  const activeDetailNode = useMemo(() => {
    if (selectedNodeId) {
      return tree.nodes.find(n => n.id === selectedNodeId) || null;
    }
    // Default to the currently active profession node or the first core profession
    const currentActive = tree.nodes.find(n => {
      const ev = evaluations.get(n.id);
      return ev?.isActive;
    });
    return currentActive || tree.nodes[0] || null;
  }, [selectedNodeId, tree, evaluations]);

  const activeDetailEval = useMemo(() => {
    if (!activeDetailNode) return null;
    return evaluations.get(activeDetailNode.id) || null;
  }, [activeDetailNode, evaluations]);

  const handleNodeClick = (node: ProfessionTreeNode) => {
    setSelectedNodeId(node.id);
  };

  const handleApplyNode = (node: ProfessionTreeNode) => {
    if (readOnly) return;
    if (node.tier === 'spezialisierung') {
      // If choosing a specialization, set parent profession if known
      const parentNode = tree.nodes.find(n => node.parentIds.includes(n.id) && n.tier === 'beruf');
      const baseProf = parentNode ? parentNode.name : currentProfession || node.name;
      onSelectProfession(baseProf, node.name, fieldId);
    } else {
      onSelectProfession(node.name, '', fieldId);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-semibold text-white">
              Berufsskilltree: {tree.fieldName}
            </h4>
            <p className="text-xs text-slate-400">
              Interaktive Berufs- und Spezialisierungspfade mit echten Voraussetzungen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Aktiver Stand:</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-700/50 text-amber-300 font-medium">
            {currentProfession || 'Kein Beruf'} {currentSpecialization ? `(${currentSpecialization})` : ''}
          </span>
        </div>
      </div>

      {/* Visual Tree Layout */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="min-w-[620px] flex flex-col gap-6">
          {(['einstieg', 'beruf', 'spezialisierung', 'meister'] as ProfessionNodeTier[]).map(tier => {
            const nodes = nodesByTier[tier];
            if (nodes.length === 0) return null;

            return (
              <div key={tier} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                  <span>{TIER_LABELS[tier]}</span>
                  <div className="flex-1 h-[1px] bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {nodes.map(node => {
                    const evalResult = evaluations.get(node.id) || {
                      isAvailable: true,
                      isActive: false,
                      missingPrerequisites: [],
                      fulfilledPrerequisites: []
                    };
                    const isSelected = activeDetailNode?.id === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        className={`relative group rounded-xl p-3.5 transition-all cursor-pointer border text-left flex flex-col justify-between min-h-[135px] ${
                          evalResult.isActive
                            ? 'bg-amber-950/30 border-amber-500/80 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/40'
                            : isSelected
                            ? 'bg-slate-900/90 border-slate-500 ring-1 ring-slate-400'
                            : evalResult.isAvailable
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            : 'bg-slate-950/40 border-slate-900/80 opacity-70 hover:opacity-90'
                        }`}
                      >
                        {/* Top Meta Line */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              TIER_BADGE_STYLES[node.tier]
                            }`}
                          >
                            {node.tier === 'einstieg'
                              ? 'Einstieg'
                              : node.tier === 'beruf'
                              ? 'Kernberuf'
                              : node.tier === 'spezialisierung'
                              ? 'Spezialisierung'
                              : 'Meistergrad'}
                          </span>

                          {evalResult.isActive ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-amber-400" />
                              Aktiv
                            </span>
                          ) : evalResult.isAvailable ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Verfügbar
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-rose-300 bg-rose-950/50 border border-rose-900/50 px-2 py-0.5 rounded-full">
                              <Lock className="w-2.5 h-2.5 text-rose-400" />
                              {evalResult.missingPrerequisites.length} gesperrt
                            </span>
                          )}
                        </div>

                        {/* Node Title & Description */}
                        <div>
                          <h5 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition">
                            {node.name}
                          </h5>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {node.description}
                          </p>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            {node.prerequisites.length > 0
                              ? `${node.prerequisites.length} Bedingungen`
                              : 'Keine Hürde'}
                          </span>
                          <span className="text-[10px] text-amber-400/90 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                            Details <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Inspector / Detail Card */}
      {activeDetailNode && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    TIER_BADGE_STYLES[activeDetailNode.tier]
                  }`}
                >
                  {TIER_LABELS[activeDetailNode.tier]}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {activeDetailNode.name}
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activeDetailNode.description}
              </p>
            </div>

            {/* Selection Button */}
            {!readOnly && (
              <div className="flex items-center gap-2 shrink-0">
                {activeDetailEval?.isActive ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Aktueller Beruf
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyNode(activeDetailNode)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition shadow-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>
                      {activeDetailNode.tier === 'spezialisierung'
                        ? 'Spezialisierung wählen'
                        : 'Als Beruf wählen'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details Grid: Voraussetzungen & Aufstiegswege */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voraussetzungen */}
            <div className="flex flex-col gap-2 bg-slate-950/60 border border-slate-800/70 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Voraussetzungen
                </span>
                {activeDetailEval?.isAvailable ? (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Erfüllt
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Nicht alle erfüllt
                  </span>
                )}
              </div>

              {activeDetailNode.prerequisites.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Offener Einstieg ohne formale Vorbedingungen.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5 text-xs">
                  {activeDetailEval?.fulfilledPrerequisites.map((item, idx) => (
                    <li key={`f_${idx}`} className="flex items-start gap-1.5 text-emerald-300/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {activeDetailEval?.missingPrerequisites.map((item, idx) => (
                    <li key={`m_${idx}`} className="flex items-start gap-1.5 text-rose-300">
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Mögliche Aufstiegswege */}
            <div className="flex flex-col gap-2 bg-slate-950/60 border border-slate-800/70 rounded-xl p-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Mögliche Aufstiegswege
              </span>
              <div className="flex flex-col gap-2">
                {activeDetailNode.careerRoutes.map(route => (
                  <div
                    key={route.id}
                    className="border border-slate-800 bg-slate-900/50 rounded-lg p-2 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-300">
                        {route.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {route.type === 'experience'
                          ? 'Berufserfahrung'
                          : route.type === 'exam'
                          ? 'Prüfung / Meister'
                          : route.type === 'social_recognition'
                          ? 'Anerkennung / Wahl'
                          : 'Notfall / Ernennung'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {route.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Empfohlene Fachkompetenzen */}
          {activeDetailNode.suggestedCompetencies.length > 0 && (
            <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Zugehörige Kompetenzen:
              </span>
              {activeDetailNode.suggestedCompetencies.map((compName, idx) => (
                <span
                  key={idx}
                  className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-lg"
                >
                  {compName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
