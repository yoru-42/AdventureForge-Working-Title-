import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  UserCheck, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Coins, 
  BookOpen, 
  Shield, 
  Star, 
  Plus, 
  RefreshCw, 
  Check, 
  Briefcase, 
  Zap, 
  Layers,
  Edit2
} from 'lucide-react';
import { EconomyRole, EconomyRoleTalent, LoreEntry, NPC, ProfessionCompetency } from '../../types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import { STANDARD_AUTHORITIES } from './EconomyPresets';
import { 
  detectBranchForRole, 
  getBranchInfoForRole, 
  getTalentsForJobAndBranch 
} from './professionBranchService';
import { getDutiesForProfessionAndLevel } from '../professionDuties';

interface HoldingRoleCardProps {
  role: EconomyRole;
  index: number;
  holdingType?: string;
  loreDatabase: LoreEntry[];
  npcs: NPC[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<EconomyRole>) => void;
  onRemove: () => void;
}

export const HoldingRoleCard: React.FC<HoldingRoleCardProps> = ({
  role,
  index,
  holdingType,
  loreDatabase,
  npcs,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(role.name || '');

  // Active branch info
  const branchData = detectBranchForRole(role.name, holdingType);
  const professionField = role.professionField || branchData.fieldName;
  const professionBranch = role.professionBranch || branchData.branchName;

  const safeLoreDatabase = Array.isArray(loreDatabase) ? loreDatabase : [];
  const safeNpcs = Array.isArray(npcs) ? npcs : [];

  const assignedName = (role.assignedToName || '').trim();
  const isNoName = !assignedName;
  const isPlayer = assignedName.toLowerCase() === 'spieler' || assignedName.toLowerCase() === 'nutzer';

  const isCodexCharacter = !isNoName && !isPlayer && safeLoreDatabase.some(l => 
    ((l.category as string) === 'Charaktere' || (l.category as string) === 'Gegner' || (l.category as string) === 'Akteure' || (l.category as string) === 'Fraktionen') &&
    l.title && l.title.trim().toLowerCase() === assignedName.toLowerCase()
  );

  // Available characters from Codex and NPCs with their configured job/profession
  const availableCharacters = useMemo(() => {
    const list: {
      id: string;
      name: string;
      profession: string;
      rawEntry: LoreEntry | NPC;
    }[] = [];

    // From loreDatabase
    safeLoreDatabase.forEach(entry => {
      const cat = entry.category as string;
      const isChar = cat === 'Charaktere' || cat === 'Gegner' || cat === 'Akteure' || cat === 'Fraktionen' || (entry as any).type === 'character';
      if (isChar && entry.title && entry.title.trim()) {
        const details = (entry as any).details || {};
        const job = (
          details.role || 
          details.profession || 
          details.jobTitle || 
          details.occupation ||
          (entry as any).role || 
          (entry as any).profession || 
          (entry as any).jobTitle || 
          ''
        ).trim();

        list.push({
          id: entry.id,
          name: entry.title.trim(),
          profession: job || 'Kein Beruf hinterlegt',
          rawEntry: entry
        });
      }
    });

    // From npcs (avoid duplicates)
    safeNpcs.forEach(npc => {
      if (npc.name && npc.name.trim()) {
        const trimmed = npc.name.trim();
        const already = list.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (!already) {
          const job = (npc.role || npc.profession || '').trim();
          list.push({
            id: npc.id || `npc-${trimmed}`,
            name: trimmed,
            profession: job || 'Kein Beruf hinterlegt',
            rawEntry: npc
          });
        }
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [safeLoreDatabase, safeNpcs]);

  // Safe normalized arrays for competencies, talents, responsibilities, authorities
  const safeCompetencies: ProfessionCompetency[] = useMemo(() => {
    if (Array.isArray(role.competencies)) {
      return role.competencies
        .filter(c => c && typeof c === 'object' && typeof c.name === 'string')
        .map((c, idx) => ({
          id: c.id || `comp-${idx}`,
          name: c.name,
          category: (c.category as any) || 'Grundlage',
          proficiency: c.proficiency ?? 50,
          experiencePoints: c.experiencePoints ?? 0,
          talent: c.talent ?? 3,
          description: c.description || ''
        }));
    }
    if (typeof role.competencies === 'string' && (role.competencies as string).trim()) {
      return (role.competencies as string)
        .split(/[,;\n]+/)
        .map(c => c.trim())
        .filter(Boolean)
        .map((name, idx) => ({
          id: `comp-str-${idx}`,
          name,
          category: 'Grundlage',
          proficiency: 50,
          experiencePoints: 0,
          talent: 3,
          description: ''
        }));
    }
    return [];
  }, [role.competencies]);

  const safeTalents: EconomyRoleTalent[] = useMemo(() => {
    if (Array.isArray(role.talents)) {
      return role.talents.filter(t => t && typeof t === 'object' && typeof t.name === 'string');
    }
    if (typeof role.talents === 'string' && (role.talents as string).trim()) {
      return (role.talents as string)
        .split(/[,;\n]+/)
        .map(t => t.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          score: 3,
          description: ''
        }));
    }
    return [];
  }, [role.talents]);

  const safeResponsibilities: string[] = useMemo(() => {
    if (Array.isArray(role.responsibilities)) {
      return role.responsibilities.filter(r => typeof r === 'string' && r.trim());
    }
    if (typeof role.responsibilities === 'string' && (role.responsibilities as string).trim()) {
      return (role.responsibilities as string).split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [role.responsibilities]);

  const safeAuthorities: string[] = useMemo(() => {
    if (Array.isArray(role.authorities)) {
      return role.authorities.filter(a => typeof a === 'string' && a.trim());
    }
    if (typeof role.authorities === 'string' && (role.authorities as string).trim()) {
      return (role.authorities as string).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [role.authorities]);

  // Handle character selection from dropdown
  const handleSelectAssignedCharacter = (selectedName: string) => {
    if (!selectedName || selectedName === '') {
      onUpdate({
        assignedToName: '',
        assignedCharacterId: undefined
      });
      return;
    }

    if (selectedName === 'Spieler') {
      onUpdate({
        assignedToName: 'Spieler',
        assignedCharacterId: undefined
      });
      return;
    }

    const found = availableCharacters.find(c => c.name.toLowerCase() === selectedName.toLowerCase());
    if (found) {
      const raw = found.rawEntry as any;
      const details = raw?.details || {};
      const updates: Partial<EconomyRole> = {
        assignedToName: found.name,
        assignedCharacterId: found.id
      };

      const rawComps = raw?.professionCompetencies || details?.professionCompetencies;
      if (rawComps) {
        if (Array.isArray(rawComps)) {
          updates.competencies = rawComps;
        } else if (typeof rawComps === 'string') {
          updates.competencies = rawComps.split(/[,;\n]+/).map(c => c.trim()).filter(Boolean).map((name, idx) => ({
            id: `comp-${idx}-${Date.now()}`,
            name,
            category: 'Grundlage',
            proficiency: 50,
            experiencePoints: 0,
            talent: 3,
            description: ''
          }));
        }
      }

      const rawTalents = raw?.talents || details?.talents;
      if (rawTalents) {
        if (Array.isArray(rawTalents)) {
          updates.talents = rawTalents;
        } else if (typeof rawTalents === 'string') {
          updates.talents = rawTalents.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean).map(name => ({
            name,
            score: 3,
            description: ''
          }));
        }
      }

      if (raw?.experienceText || details?.experienceText || raw?.professionExperienceText) {
        updates.experienceNotes = raw?.experienceText || details?.experienceText || raw?.professionExperienceText;
      }

      onUpdate(updates);
    } else {
      onUpdate({
        assignedToName: selectedName,
        assignedCharacterId: undefined
      });
    }
  };

  // Initialize competencies, talents and progress if not present
  useEffect(() => {
    if (!role.professionBranch || !role.professionField) {
      onUpdate({
        professionField: professionField,
        professionBranch: professionBranch
      });
    }

    if (!Array.isArray(role.competencies) || role.competencies.length === 0) {
      const branchInfo = getBranchInfoForRole(role.name, holdingType);
      onUpdate({
        competencies: branchInfo.suggestedCompetencies,
        talents: Array.isArray(role.talents) && role.talents.length > 0 ? role.talents : branchInfo.suggestedTalents,
        experienceYears: role.experienceYears ?? branchInfo.defaultExperienceYears,
        practiceHours: role.practiceHours ?? branchInfo.defaultPracticeHours,
        experiencePoints: role.experiencePoints ?? branchInfo.defaultXp,
        progressPercent: role.progressPercent ?? branchInfo.defaultProgressPercent
      });
    }
  }, [role.name]);

  // Load duties from branch
  const handleLoadBranchDuties = () => {
    const duties = getDutiesForProfessionAndLevel(role.name, 'Geselle / Fortgeschritten');
    if (duties && duties.length > 0) {
      onUpdate({ responsibilities: duties });
    }
  };

  // Load competencies from branch
  const handleLoadBranchCompetencies = () => {
    const branchInfo = getBranchInfoForRole(role.name, holdingType);
    onUpdate({ competencies: branchInfo.suggestedCompetencies });
  };

  // Load talents from branch
  const handleLoadBranchTalents = () => {
    const talents = getTalentsForJobAndBranch(role.name, professionBranch);
    onUpdate({ talents });
  };

  // Increase / decrease competency score
  const handleAdjustCompetency = (compIndex: number, delta: number) => {
    const currentComps = [...safeCompetencies];
    if (!currentComps[compIndex]) return;
    const currentProf = currentComps[compIndex].proficiency ?? 50;
    const newProf = Math.max(5, Math.min(100, currentProf + delta));
    currentComps[compIndex] = { ...currentComps[compIndex], proficiency: newProf };
    onUpdate({ competencies: currentComps });
  };

  // Practice competency
  const handlePracticeCompetency = (compIndex: number) => {
    const currentComps = [...safeCompetencies];
    if (!currentComps[compIndex]) return;
    const currentProf = currentComps[compIndex].proficiency ?? 50;
    const newProf = Math.min(100, currentProf + 5);
    currentComps[compIndex] = { ...currentComps[compIndex], proficiency: newProf };
    
    // Add XP and practice hours
    const currentXp = role.experiencePoints ?? 500;
    const currentHours = role.practiceHours ?? 100;
    const currentProg = role.progressPercent ?? 50;

    onUpdate({ 
      competencies: currentComps,
      experiencePoints: currentXp + 35,
      practiceHours: currentHours + 4,
      progressPercent: Math.min(100, currentProg + 2)
    });
  };

  // Add custom competency
  const handleAddCustomCompetency = () => {
    const currentComps = [...safeCompetencies];
    const newComp: ProfessionCompetency = {
      id: `comp-${Date.now()}`,
      name: 'Neue Fachkompetenz',
      category: 'Fortgeschritten',
      proficiency: 50,
      experiencePoints: 200,
      talent: 3,
      description: 'Beschreibung der fachlichen Fertigkeit...'
    };
    onUpdate({ competencies: [...currentComps, newComp] });
  };

  // Remove competency
  const handleRemoveCompetency = (compIndex: number) => {
    const currentComps = safeCompetencies.filter((_, i) => i !== compIndex);
    onUpdate({ competencies: currentComps });
  };

  // Set talent score
  const handleSetTalentScore = (talentIndex: number, score: number) => {
    const currentTalents = [...safeTalents];
    if (!currentTalents[talentIndex]) return;
    currentTalents[talentIndex] = { ...currentTalents[talentIndex], score };
    onUpdate({ talents: currentTalents });
  };

  // Add custom talent
  const handleAddCustomTalent = () => {
    const currentTalents = [...safeTalents];
    const newTalent: EconomyRoleTalent = {
      name: 'Neues Talent / Begabung',
      score: 3,
      description: 'Besondere Veranlagung oder Gabe...'
    };
    onUpdate({ talents: [...currentTalents, newTalent] });
  };

  // Remove talent
  const handleRemoveTalent = (talentIndex: number) => {
    const currentTalents = safeTalents.filter((_, i) => i !== talentIndex);
    onUpdate({ talents: currentTalents });
  };

  // Toggle authority
  const handleToggleAuthority = (auth: string) => {
    const currentAuths = safeAuthorities;
    const next = currentAuths.includes(auth)
      ? currentAuths.filter(a => a !== auth)
      : [...currentAuths, auth];
    onUpdate({ authorities: next });
  };

  // Conduct general practice session (+50 XP, +10 practice hours)
  const handleConductPractice = () => {
    const currentXp = role.experiencePoints ?? 500;
    const currentHours = role.practiceHours ?? 100;
    const currentProg = role.progressPercent ?? 50;

    onUpdate({
      experiencePoints: currentXp + 50,
      practiceHours: currentHours + 10,
      progressPercent: Math.min(100, currentProg + 5)
    });
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdate({ name: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <div 
      className={`bg-slate-950 rounded-2xl border transition-all duration-150 overflow-hidden ${
        isExpanded ? 'border-amber-500/40 shadow-lg' : 'border-slate-800/90 hover:border-slate-700/80'
      }`}
    >
      {/* COMPACT HEADER ROW */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-900/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
      >
        {/* Left: Avatar & Job Title info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            !isNoName 
              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' 
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            {!isNoName ? (
              <UserCheck className="w-5 h-5 text-indigo-400" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Vorgegebener Berufstitel */}
              <span className="text-sm font-bold text-white tracking-wide">
                {role.name || 'Unbenannter Beruf'}
              </span>

              <span className="text-[10px] text-slate-500 font-mono">
                #{index + 1}
              </span>

              {/* Status-Badge */}
              {isNoName ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-850 text-slate-300 border border-slate-700">
                  No-Name-Charakter
                </span>
              ) : isPlayer ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Spieler
                </span>
              ) : isCodexCharacter ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Codex-Charakter</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  Angestellt
                </span>
              )}

              {/* Connected Branch badge */}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                {professionBranch}
              </span>
            </div>

            {/* Line 2: Besetzt durch & Details */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {isNoName ? (
                <span className="text-xs text-slate-400">
                  Besetzt durch: <strong className="text-slate-300">No-Name-Angestellter</strong>{' '}
                  <span className="text-slate-500 italic">
                    (erhält erst im Chat Persönlichkeit)
                  </span>
                </span>
              ) : (
                <span className="text-xs text-slate-300">
                  Besetzt durch: <strong className="text-indigo-300">{assignedName}</strong>
                </span>
              )}

              {role.workplaceArea && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  • <MapPin className="w-3 h-3 text-slate-400" /> {role.workplaceArea}
                </span>
              )}

              {role.salary !== undefined && role.salary > 0 && (
                <span className="text-[11px] text-amber-300/90 font-mono flex items-center gap-1">
                  • <Coins className="w-3 h-3 text-amber-400" /> {role.salary} Gold
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions & Expand Toggle */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isExpanded 
                ? 'bg-slate-800 text-white border-slate-700' 
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-850'
            }`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Zuklappen</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Details & Zweig</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg text-xs cursor-pointer transition"
            title="Stelle entfernen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXPANDED DETAILS FORM: CONNECTED TO PROFESSION BRANCH */}
      {isExpanded && (
        <div className="border-t border-slate-900 bg-slate-900/30 p-4 sm:p-5 space-y-5">
          {/* 1. VORGEGEBENER BERUF & BERUFSZWEIG */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={titleInput}
                        onChange={e => setTitleInput(e.target.value)}
                        className="bg-slate-900 border border-amber-500 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveTitle}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                      >
                        Speichern
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingTitle(false)}
                        className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{role.name}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setTitleInput(role.name || '');
                          setIsEditingTitle(true);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-300 rounded"
                        title="Bezeichnung anpassen"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">
                    (Vorgegebene Betriebsstelle)
                  </span>
                </div>
              </div>

              {/* Linked Branch & Field display */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
                  Fachbereich: <strong className="text-amber-300">{professionField}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 font-medium">
                  Berufszweig: <strong className="text-white">{professionBranch}</strong>
                </span>
              </div>
            </div>

            {/* Besetzung, Arbeitsbereich & Gehalt (3 Spalten, Berufsrang & Stufe entfernt) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {/* Besetzt durch mit ausklappbarem Menü (Name & Beruf aus Codex) */}
              <div>
                <label 
                  htmlFor={`role-assigned-select-${role.id || index}`}
                  className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1"
                >
                  Besetzt durch
                </label>
                <select
                  id={`role-assigned-select-${role.id || index}`}
                  value={role.assignedToName || ''}
                  onChange={e => handleSelectAssignedCharacter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">No-Name-Angestellter (Freie Stelle)</option>
                  <option value="Spieler">Spieler / Nutzer (Inhaber)</option>
                  {availableCharacters.length > 0 && (
                    <optgroup label="Charaktere aus dem Codex">
                      {availableCharacters.map(char => (
                        <option key={char.id} value={char.name}>
                          {char.name} — {char.profession}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {assignedName && 
                   assignedName.toLowerCase() !== 'spieler' && 
                   assignedName.toLowerCase() !== 'nutzer' && 
                   !availableCharacters.some(c => c.name.toLowerCase() === assignedName.toLowerCase()) && (
                    <option value={assignedName}>
                      {assignedName} (Benutzerdefiniert)
                    </option>
                  )}
                </select>
              </div>

              {/* Arbeitsbereich */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Arbeitsbereich im Gebäude
                </label>
                <input
                  type="text"
                  value={role.workplaceArea || ''}
                  onChange={e => onUpdate({ workplaceArea: e.target.value })}
                  placeholder="z.B. Schankraum, Küche, Kontor..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {/* Gehalt / Lohn */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Lohn / Gehalt (Gold pro Woche)
                </label>
                <input
                  type="number"
                  value={role.salary || 0}
                  onChange={e => onUpdate({ salary: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 2. AUFGABEN & BERUFSPFLICHTEN (VERBUNDEN MIT DEM BERUFSZWEIG) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Aufgaben & Berufspflichten ({professionBranch})
                </h5>
              </div>

              <button
                type="button"
                onClick={handleLoadBranchDuties}
                className="px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                title="Aufgaben & Pflichten aus dem Berufszweig für diese Stufe laden"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Aus Berufszweig laden</span>
              </button>
            </div>

            <AutoExpandingTextarea
              value={safeResponsibilities.join('\n')}
              onChange={e => onUpdate({ responsibilities: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
              placeholder="Aufgaben und Pflichten für diese Stelle im Berufszweig (eine pro Zeile)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
            />
          </div>

          {/* 3. FACHKOMPETENZEN (VERBUNDEN MIT DEM BERUFSZWEIG) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Fachkompetenzen ({professionBranch})
                </h5>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({safeCompetencies.length} Kompetenzen)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadBranchCompetencies}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Kompetenzen auf Zweig-Standard zurücksetzen"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Standard laden</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomCompetency}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Kompetenz +</span>
                </button>
              </div>
            </div>

            {/* Competencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {safeCompetencies.map((comp, cIdx) => {
                const score = comp.proficiency ?? 50;
                return (
                  <div
                    key={comp.id || `comp-${cIdx}`}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-snug break-words">
                          {comp.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                          {comp.category || 'Fachbereich'}
                        </span>
                      </div>
                      {comp.description && (
                        <p className="text-[11px] text-slate-400 mt-1 break-words">
                          {comp.description}
                        </p>
                      )}
                    </div>

                    {/* Score Bar & Interactive Actions */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Kompetenzgrad:</span>
                        <span className="font-mono font-bold text-amber-300">{score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustCompetency(cIdx, -5)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center text-xs font-bold transition"
                            title="-5%"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCompetency(cIdx, 5)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center text-xs font-bold transition"
                            title="+5%"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePracticeCompetency(cIdx)}
                            className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/30 rounded text-[11px] font-bold transition cursor-pointer"
                            title="Durch praktische Ausführung üben (+35 XP)"
                          >
                            Üben (+35 XP)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompetency(cIdx)}
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                            title="Entfernen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. BERUFSTALENTE & BEGABUNGEN (VERBUNDEN MIT DEM BERUFSZWEIG) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Berufstalente & Begabungen ({professionBranch})
                </h5>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadBranchTalents}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Talente des Berufszweigs neu laden"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Zweig-Talente laden</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomTalent}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Talent +</span>
                </button>
              </div>
            </div>

            {/* Talents List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {safeTalents.map((talent, tIdx) => (
                <div
                  key={`talent-${tIdx}`}
                  className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white break-words">
                        {talent.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTalent(tIdx)}
                        className="text-slate-500 hover:text-red-400 p-0.5 shrink-0"
                        title="Talent entfernen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {talent.description && (
                      <p className="text-[11px] text-slate-400 mt-1 break-words">
                        {talent.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Veranlagung:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSetTalentScore(tIdx, star)}
                          className="p-0.5 hover:scale-110 transition cursor-pointer"
                          title={`${star} von 5 Sternen`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              star <= talent.score ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. BERUFSFORTSCHRITT, ERFAHRUNG & PRAXIS */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Berufsfortschritt, Erfahrung & Praxis
                </h5>
              </div>

              <button
                type="button"
                onClick={handleConductPractice}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-center"
                title="Praktische Routine ausführen (+50 XP, +10 Praxisstunden)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Praxisdienst durchführen (+50 XP)</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Fortschritt im Beruf:
                </span>
                <span className="font-mono font-bold text-amber-300">{role.progressPercent ?? 50}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${role.progressPercent ?? 50}%` }}
                />
              </div>
            </div>

            {/* Experience Metrics & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Praxisjahre im Beruf
                </label>
                <input
                  type="number"
                  value={role.experienceYears ?? 3}
                  onChange={e => onUpdate({ experienceYears: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono font-bold text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Geleistete Praxisstunden
                </label>
                <input
                  type="number"
                  value={role.practiceHours ?? 450}
                  onChange={e => onUpdate({ practiceHours: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono font-bold text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Erfahrungspunkte (XP)
                </label>
                <input
                  type="number"
                  value={role.experiencePoints ?? 1200}
                  onChange={e => onUpdate({ experiencePoints: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Erfahrungswerte & Praxisnotizen
              </label>
              <AutoExpandingTextarea
                value={role.experienceNotes || ''}
                onChange={e => onUpdate({ experienceNotes: e.target.value })}
                placeholder="Besondere praktische Vorkenntnisse, Meilensteine oder Arbeitsgewohnheiten..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[48px]"
              />
            </div>
          </div>

          {/* 6. BEFUGNISSE & WEISUNGSRECHTE */}
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Befugnisse und Weisungsrechte ({safeAuthorities.length} aktiv):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_AUTHORITIES.map(auth => {
                const has = safeAuthorities.includes(auth);
                return (
                  <button
                    key={auth}
                    type="button"
                    onClick={() => handleToggleAuthority(auth)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                      has 
                        ? 'bg-amber-950/30 text-amber-300 border-amber-500/40' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {auth}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
