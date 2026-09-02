import React, { useState } from 'react';
import { Character, BodyCondition, BodyConditionType } from '../types';
import { BODY_CONDITION_PRESETS } from './bodyConditionPresets';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { TransformationIntensityCard } from './TransformationIntensityCard';
import { 
  resolveBodyAppearance, 
  toggleConditionOnCharacter, 
  saveCustomConditionOnCharacter, 
  removeConditionFromCharacter,
  incrementTransformationIntensity,
  decayTransformationIntensity,
  updateTransformationIntensity
} from './bodyConditionResolver';

interface BodyConditionsManagerProps {
  player: Character;
  onUpdatePlayer: (updated: Character) => void;
  readOnly?: boolean;
}

export const BodyConditionsManager: React.FC<BodyConditionsManagerProps> = ({
  player,
  onUpdatePlayer,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gender_change' | 'race_change' | 'curse' | 'blessing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State for Creating/Editing
  const [showModal, setShowModal] = useState(false);
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);

  // Form state
  const [condName, setCondName] = useState('');
  const [condType, setCondType] = useState<BodyConditionType>('curse');
  const [condCategory, setCondCategory] = useState('Fluch');
  const [condSource, setCondSource] = useState('');
  const [condDuration, setCondDuration] = useState('Permanent');
  const [condTrigger, setCondTrigger] = useState('Dauerhaft');
  const [condDescription, setCondDescription] = useState('');
  const [condSeverity, setCondSeverity] = useState<'leicht' | 'mittel' | 'stark' | 'vollständig'>('mittel');
  const [linkedTransformationId, setLinkedTransformationId] = useState('');
  const [modalIntensity, setModalIntensity] = useState(0);
  
  // Physical modifiers
  const [overrideGender, setOverrideGender] = useState('');
  const [overrideRace, setOverrideRace] = useState('');
  const [heightMod, setHeightMod] = useState(0);
  const [weightMod, setWeightMod] = useState(0);
  const [cupOverride, setCupOverride] = useState('');
  const [muscleMod, setMuscleMod] = useState(0);
  const [fatMod, setFatMod] = useState(0);
  const [skinTone, setSkinTone] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [wings, setWings] = useState<boolean | undefined>(undefined);
  const [horns, setHorns] = useState<boolean | undefined>(undefined);
  const [healingMod, setHealingMod] = useState(0);

  const resolved = resolveBodyAppearance(player);
  const activeConditions = player.appearance?.activeConditions || [];
  const customConditions = player.appearance?.customConditions || [];

  const availableTransformations = (player.abilities || []).filter(a => 
    a.category === 'Transformationen' ||
    a.transformName ||
    a.transformGender ||
    a.transformRace ||
    a.transformBuild
  );

  const handleImportTransformationModifiers = (abilityId: string) => {
    setLinkedTransformationId(abilityId);
    const ability = (player.abilities || []).find(a => a.id === abilityId);
    if (!ability) return;

    if (ability.transformGender) setOverrideGender(ability.transformGender);
    if (ability.transformRace) setOverrideRace(ability.transformRace);
    if (ability.transformHairColor) setHairColor(ability.transformHairColor);
    if (ability.transformEyeColor) setEyeColor(ability.transformEyeColor);
    if (ability.transformCupSize) setCupOverride(ability.transformCupSize);
    if (ability.transformWings !== undefined) setWings(ability.transformWings);
    if (ability.transformHorns !== undefined) setHorns(ability.transformHorns);

    if (ability.transformRaceFeatures || ability.transformLooks) {
      setSkinTone(ability.transformRaceFeatures || ability.transformLooks || '');
    }

    // Infer height and weight modifiers
    let hMod = 0;
    if (ability.transformHeight) {
      const raw = ability.transformHeight.trim();
      if (raw.startsWith('+') || raw.startsWith('-')) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) hMod = parsed;
      } else {
        const targetH = parseInt(raw, 10);
        const baseH = parseInt(player.appearance?.height || '170', 10);
        if (!isNaN(targetH) && !isNaN(baseH)) {
          hMod = targetH - baseH;
        }
      }
      setHeightMod(hMod);
    }

    // Smart weight & muscle/fat defaults based on build
    let wMod = hMod > 0 ? Math.round(hMod * 0.6) : hMod < 0 ? Math.round(hMod * 0.4) : 0;
    let mMod = 0;
    let fMod = 0;

    if (ability.transformBuild) {
      const buildLower = ability.transformBuild.toLowerCase();
      if (buildLower.includes('muskulös') || buildLower.includes('kraftvoll') || buildLower.includes('breit')) {
        mMod = 15;
        fMod = -5;
        wMod += 10;
      } else if (buildLower.includes('athletisch') || buildLower.includes('durchtrainiert')) {
        mMod = 10;
        fMod = -3;
        wMod += 5;
      } else if (buildLower.includes('schlank') || buildLower.includes('mager') || buildLower.includes('zierlich')) {
        mMod = -5;
        fMod = -5;
        wMod -= 5;
      } else if (buildLower.includes('üppig') || buildLower.includes('kurvig') || buildLower.includes('vollschlank')) {
        mMod = 2;
        fMod = 12;
        wMod += 8;
      }
    }
    setWeightMod(wMod);
    setMuscleMod(mMod);
    setFatMod(fMod);

    // Default healing factor based on transformation category or name keywords
    let healMod = 0;
    const descLower = (ability.description || '').toLowerCase();
    const nameLower = (ability.name || '').toLowerCase();
    if (descLower.includes('regeneration') || descLower.includes('heilung') || descLower.includes('unsterblich') || nameLower.includes('vampir') || nameLower.includes('troll')) {
      healMod = 2;
    }
    setHealingMod(healMod);

    const transName = ability.transformName || ability.name || 'Transformation';
    if (!condName.trim()) setCondName(transName);
    setCondSource(`Transformation: ${transName}`);
    if (!condDescription.trim() && ability.description) setCondDescription(ability.description);
  };

  // Combine built-in presets with user-defined custom conditions
  const allAvailablePresets = [
    ...customConditions,
    ...BODY_CONDITION_PRESETS.filter(p => !customConditions.some(c => c.id === p.id))
  ];

  const filteredPresets = allAvailablePresets.filter(cond => {
    if (activeTab !== 'all' && cond.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cond.name.toLowerCase().includes(q) ||
        (cond.description || '').toLowerCase().includes(q) ||
        (cond.category || '').toLowerCase().includes(q) ||
        (cond.triggerCondition || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggle = (condition: BodyCondition) => {
    if (readOnly) return;
    const updated = toggleConditionOnCharacter(player, condition);
    onUpdatePlayer(updated);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onUpdatePlayer({
      ...player,
      appearance: {
        ...(player.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' }),
        activeConditions: []
      }
    });
  };

  const handleOpenCreateModal = () => {
    setEditingConditionId(null);
    setCondName('');
    setCondType('curse');
    setCondCategory('Fluch');
    setCondSource('');
    setCondDuration('Permanent');
    setCondTrigger('Dauerhaft');
    setCondDescription('');
    setCondSeverity('mittel');
    setLinkedTransformationId('');
    setModalIntensity(resolved.transformationIntensityVal);
    setOverrideGender('');
    setOverrideRace('');
    setHeightMod(0);
    setWeightMod(0);
    setCupOverride('');
    setMuscleMod(0);
    setFatMod(0);
    setSkinTone('');
    setEyeColor('');
    setHairColor('');
    setWings(undefined);
    setHorns(undefined);
    setHealingMod(0);
    setShowModal(true);
  };

  const handleOpenEditModal = (cond: BodyCondition) => {
    setEditingConditionId(cond.id);
    setCondName(cond.name || '');
    setCondType(cond.type || 'curse');
    setCondCategory(cond.category || 'Spezial');
    setCondSource(cond.source || '');
    setCondDuration(cond.duration || 'Permanent');
    setCondTrigger(cond.triggerCondition || 'Dauerhaft');
    setCondDescription(cond.description || '');
    setCondSeverity(cond.severity || 'mittel');
    setLinkedTransformationId(cond.linkedTransformationId || '');
    setModalIntensity(resolved.transformationIntensityVal);
    setOverrideGender(cond.overrideGender || '');
    setOverrideRace(cond.overrideRace || '');
    setHeightMod(cond.heightModifierCm || 0);
    setWeightMod(cond.weightModifierKg || 0);
    setCupOverride(cond.cupSizeOverride || '');
    setMuscleMod(cond.muscleMassModifier || 0);
    setFatMod(cond.bodyFatModifier || 0);
    setSkinTone(cond.skinToneOverride || '');
    setEyeColor(cond.eyeColorOverride || '');
    setHairColor(cond.hairColorOverride || '');
    setWings(cond.wingsOverride);
    setHorns(cond.hornsOverride);
    setHealingMod(cond.healingFactorModifier || 0);
    setShowModal(true);
  };

  const handleSaveModal = () => {
    if (!condName.trim()) return;

    const isCurrentlyActive = editingConditionId 
      ? activeConditions.some(c => c.id === editingConditionId)
      : true;

    const conditionToSave: BodyCondition = {
      id: editingConditionId || ('custom-cond-' + Date.now().toString(36)),
      name: condName.trim(),
      type: condType,
      category: condCategory || 'Spezial',
      icon: '',
      isActive: isCurrentlyActive,
      severity: condSeverity,
      source: condSource.trim() || 'Rollenspiel / Benutzerdefiniert',
      duration: condDuration.trim() || 'Permanent',
      triggerCondition: condTrigger.trim() || 'Dauerhaft',
      linkedTransformationId: linkedTransformationId || undefined,
      description: condDescription.trim() || 'Individuelle körperliche Metamorphose.',
      overrideGender: overrideGender || undefined,
      overrideRace: overrideRace || undefined,
      heightModifierCm: heightMod || undefined,
      weightModifierKg: weightMod || undefined,
      cupSizeOverride: cupOverride || undefined,
      muscleMassModifier: muscleMod || undefined,
      bodyFatModifier: fatMod || undefined,
      skinToneOverride: skinTone || undefined,
      eyeColorOverride: eyeColor || undefined,
      hairColorOverride: hairColor || undefined,
      wingsOverride: wings,
      hornsOverride: horns,
      healingFactorModifier: healingMod || undefined,
      statusTag: condName.trim()
    };

    let updated = saveCustomConditionOnCharacter(player, conditionToSave);
    if (modalIntensity !== resolved.transformationIntensityVal) {
      updated = updateTransformationIntensity(updated, modalIntensity);
    }
    onUpdatePlayer(updated);
    setShowModal(false);
  };

  const handleRemoveCustomCondition = (id: string) => {
    if (readOnly) return;
    const updated = removeConditionFromCharacter(player, id);
    onUpdatePlayer(updated);
    setShowModal(false);
  };

  const handleIncreaseIntensity = (amount: number) => {
    if (readOnly) return;
    const updated = incrementTransformationIntensity(player, amount);
    onUpdatePlayer(updated);
  };

  const handleDecayIntensity = (amount: number = 20) => {
    if (readOnly) return;
    const updated = decayTransformationIntensity(player, amount);
    onUpdatePlayer(updated);
  };

  const handleSetIntensity = (val: number) => {
    if (readOnly) return;
    const updated = updateTransformationIntensity(player, val);
    onUpdatePlayer(updated);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-sparkles text-amber-400 text-sm"></i>
            <h3 className="text-sm font-bold text-amber-300 tracking-wide">
              Transformationen & Körperzustände
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Physische Metamorphosen, Effekte und Auslöser verwalten.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!readOnly && (
            <>
              {activeConditions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Alle aktiven Effekte & Metamorphosen zurücksetzen"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                  <span>Alle aufheben</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Zustand hinzufügen</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ACTIVE CONDITIONS DISPLAY BANNER */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-inner">
        <div className="flex justify-between items-center">
          <span className="text-[10.5px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <i className="fa-solid fa-burst text-amber-500"></i>
            <span>Aktive Bedingungen ({activeConditions.length})</span>
          </span>

          <span className="text-[9.5px] text-slate-400 font-medium">
            Live im HUD & KI-Prompt synchronisiert
          </span>
        </div>

        {activeConditions.length === 0 ? (
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-center">
            <p className="text-[11px] text-slate-400 italic">
              Derzeit wirken keine aktiven Flüche, Segen oder Metamorphosen auf deinen Körper.
            </p>
            <p className="text-[9.5px] text-slate-500 mt-0.5">
              Wähle unten eine Vorlage aus oder erstelle einen eigenen Zustand!
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeConditions.map(cond => {
              const isCurse = cond.type === 'curse';
              const isBlessing = cond.type === 'blessing';
              const isGender = cond.type === 'gender_change';
              const isRace = cond.type === 'race_change';

              return (
                <div
                  key={cond.id}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                    isCurse
                      ? 'bg-red-950/35 border-red-500/40 text-red-300 hover:border-red-400'
                      : isBlessing
                      ? 'bg-amber-950/35 border-amber-500/40 text-amber-300 hover:border-amber-400'
                      : isGender
                      ? 'bg-pink-950/35 border-pink-500/40 text-pink-300 hover:border-pink-400'
                      : isRace
                      ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                      : 'bg-indigo-950/35 border-indigo-500/40 text-indigo-300 hover:border-indigo-400'
                  }`}
                >
                  <i className={`fa-solid ${
                    isCurse ? 'fa-skull text-red-400' :
                    isBlessing ? 'fa-hands-praying text-amber-400' :
                    isGender ? 'fa-venus-mars text-pink-400' :
                    isRace ? 'fa-dna text-emerald-400' : 'fa-sparkles text-indigo-400'
                  }`}></i>
                  <span className="text-[11px]">{cond.name}</span>
                  
                  {cond.triggerCondition && cond.triggerCondition !== 'Dauerhaft' && (
                    <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <i className="fa-solid fa-clock text-[8px]"></i>
                      <span>{cond.triggerCondition}</span>
                    </span>
                  )}

                  {!readOnly && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cond)}
                        className="text-slate-400 hover:text-amber-400 p-0.5 rounded transition-all"
                        title="Bedingung & Auslöser bearbeiten"
                      >
                        <i className="fa-solid fa-pen text-[9px]"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(cond)}
                        className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-all"
                        title="Entfernen"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DYNAMIC TRANSFORMATION PROGRESSION CONTROL CARD */}
      <TransformationIntensityCard
        intensityVal={resolved.transformationIntensityVal}
        stageName={resolved.transformationStageName}
        onUpdateIntensity={handleSetIntensity}
        readOnly={readOnly}
      />

      {/* CATEGORY TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Alle', iconClass: 'fa-layer-group' },
            { id: 'gender_change', label: 'Geschlecht', iconClass: 'fa-venus-mars' },
            { id: 'race_change', label: 'Rassen', iconClass: 'fa-dna' },
            { id: 'curse', label: 'Flüche', iconClass: 'fa-skull' },
            { id: 'blessing', label: 'Segen', iconClass: 'fa-hands-praying' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className={`fa-solid ${tab.iconClass} text-[10px]`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-500 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Metamorphose suchen..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* PRESETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
        {filteredPresets.map(preset => {
          const isActive = activeConditions.some(c => c.id === preset.id || c.name.toLowerCase() === preset.name.toLowerCase());
          const isCurse = preset.type === 'curse';
          const isBlessing = preset.type === 'blessing';
          const isGender = preset.type === 'gender_change';
          const isRace = preset.type === 'race_change';

          return (
            <div
              key={preset.id}
              onClick={() => handleToggle(preset)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm relative group ${
                isActive
                  ? isCurse
                    ? 'bg-red-950/25 border-red-500 text-red-100 ring-1 ring-red-500/40'
                    : isBlessing
                    ? 'bg-amber-950/25 border-amber-500 text-amber-100 ring-1 ring-amber-500/40'
                    : isGender
                    ? 'bg-pink-950/25 border-pink-500 text-pink-100 ring-1 ring-pink-500/40'
                    : 'bg-emerald-950/25 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex justify-between items-center gap-1 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`fa-solid ${
                      isCurse ? 'fa-skull text-red-400' :
                      isBlessing ? 'fa-hands-praying text-amber-400' :
                      isGender ? 'fa-venus-mars text-pink-400' :
                      isRace ? 'fa-dna text-emerald-400' : 'fa-wand-magic-sparkles text-indigo-400'
                    } text-xs shrink-0`}></i>
                    <span className="text-xs font-black truncate">{preset.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Active toggle checkmark */}
                    <i className={`fa-solid ${isActive ? 'fa-circle-check text-amber-400 text-sm' : 'fa-circle text-slate-700 text-xs hover:text-slate-500'}`}></i>

                    {/* Edit button */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(preset);
                        }}
                        className="p-1 rounded bg-slate-800/80 hover:bg-amber-500 text-slate-400 hover:text-slate-950 transition-all text-[10px] ml-1"
                        title="Bedingung & Zeit-Auslöser bearbeiten"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {/* Trigger Condition / Time Interval Badge if present */}
              {preset.triggerCondition && preset.triggerCondition !== 'Dauerhaft' && (
                <div className="flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md text-[9.5px] font-medium">
                  <i className="fa-solid fa-clock text-[9px] text-indigo-400"></i>
                  <span className="truncate">Auslöser: {preset.triggerCondition}</span>
                </div>
              )}

              {/* Linked Transformation Badge if present */}
              {preset.linkedTransformationId && (
                (() => {
                  const linkedAbility = (player.abilities || []).find(a => a.id === preset.linkedTransformationId);
                  if (linkedAbility) {
                    return (
                      <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md text-[9.5px] font-medium">
                        <i className="fa-solid fa-bolt-lightning text-[9px] text-amber-400"></i>
                        <span className="truncate">Form: {linkedAbility.name}</span>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Modifiers Summary */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1 text-[9px] font-mono">
                {preset.overrideGender && (
                  <span className="bg-pink-950/40 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-venus-mars text-[8px]"></i> {preset.overrideGender}
                  </span>
                )}
                {preset.overrideRace && (
                  <span className="bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-dna text-[8px]"></i> {preset.overrideRace}
                  </span>
                )}
                {preset.heightModifierCm !== undefined && (
                  <span className="bg-indigo-950/40 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-ruler-vertical text-[8px]"></i> {preset.heightModifierCm > 0 ? `+${preset.heightModifierCm}` : preset.heightModifierCm} cm
                  </span>
                )}
                {preset.weightModifierKg !== undefined && (
                  <span className="bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-weight-scale text-[8px]"></i> {preset.weightModifierKg > 0 ? `+${preset.weightModifierKg}` : preset.weightModifierKg} kg
                  </span>
                )}
                {preset.cupSizeOverride && (
                  <span className="bg-pink-950/40 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-circle text-[6px]"></i> Cup {preset.cupSizeOverride}
                  </span>
                )}
                {preset.wingsOverride && (
                  <span className="bg-sky-950/40 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-feather text-[8px]"></i> Flügel
                  </span>
                )}
                {preset.hornsOverride && (
                  <span className="bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                    <i className="fa-solid fa-dharmachakra text-[8px]"></i> Hörner
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 px-6 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl text-base">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                    {editingConditionId ? 'Körper-Bedingung bearbeiten' : 'Eigene Körper-Bedingung erstellen'}
                  </h3>
                  <p className="text-[10px] text-amber-400/80">Flüche, Segen, Zeitabstände & Metamorphosen konfigurieren</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                    Name der Bedingung / Verwandlung *
                  </label>
                  <input
                    type="text"
                    value={condName}
                    onChange={e => setCondName(e.target.value)}
                    placeholder="z.B. Hexenfluch der Kröte, Segen der Sternengöttin..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Kategorie-Typ
                  </label>
                  <select
                    value={condType}
                    onChange={e => {
                      const t = e.target.value as BodyConditionType;
                      setCondType(t);
                      if (t === 'curse') setCondCategory('Fluch');
                      else if (t === 'blessing') setCondCategory('Segen');
                      else if (t === 'gender_change') setCondCategory('Geschlechtswechsel');
                      else if (t === 'race_change') setCondCategory('Rassenwechsel');
                      else setCondCategory('Mutation');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="curse">Fluch</option>
                    <option value="blessing">Segen</option>
                    <option value="gender_change">Geschlechtswechsel</option>
                    <option value="race_change">Rassenwechsel</option>
                    <option value="magical_mutation">Magische Mutation</option>
                  </select>
                </div>
              </div>

              {/* VERKNÜPFTE TRANSFORMATION & INTENSITÄTS-KONTROLLE */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-3 shadow-inner">
                <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt-lightning text-amber-400"></i>
                  <span>Verknüpfte Transformation & Intensitäts-Verlauf</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Linked transformation dropdown */}
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Transformation (Auslöser-Form)
                    </label>
                    <select
                      value={linkedTransformationId}
                      onChange={e => handleImportTransformationModifiers(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="">-- Keine Verknüpfung --</option>
                      {availableTransformations.map(ability => (
                        <option key={ability.id} value={ability.id}>
                          {ability.name} {ability.transformName ? `(${ability.transformName})` : ''}
                        </option>
                      ))}
                    </select>
                    {linkedTransformationId && (
                      <div className="mt-1.5 flex items-center justify-between bg-slate-900/50 p-1.5 rounded-lg border border-slate-800/80">
                        <span className="text-[8.5px] text-emerald-400 font-semibold flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Modifikatoren geladen!</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleImportTransformationModifiers(linkedTransformationId)}
                          className="text-[8.5px] text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                          title="Überschreibt manuelle Änderungen mit den Werten der Transformation"
                        >
                          <i className="fa-solid fa-arrows-rotate mr-1"></i>
                          Modifikatoren übernehmen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Intensity slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">
                        Verwandlungs-Intensität
                      </label>
                      <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {String(Math.round(modalIntensity * 100) / 100).replace('.', ',')}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={modalIntensity}
                        onChange={e => setModalIntensity(parseFloat(e.target.value) || 0)}
                        className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Stage Badge inside the input block */}
                    <div className="mt-1 flex justify-between items-center text-[9px]">
                      <span className="text-slate-500">Stufe:</span>
                      <span className="font-extrabold text-amber-300">
                        {modalIntensity <= 25 
                          ? 'Subtil (0-25%)' 
                          : modalIntensity <= 50 
                          ? 'Gesteigert (26-50%)' 
                          : modalIntensity <= 75 
                          ? 'Manifestiert (51-75%)' 
                          : 'Vollendete Form (76-100%)'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick intensity buttons inside the modal editor */}
                <div className="flex flex-wrap gap-1 justify-between items-center pt-2 border-t border-slate-900">
                  <span className="text-[9px] text-slate-500">Intensität Schnellwahl:</span>
                  <div className="flex gap-1">
                    {[0, 25, 50, 75, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setModalIntensity(val)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border cursor-pointer ${
                          modalIntensity === val
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TRIGGER CONDITION & TIME INTERVAL FIELD */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/30 space-y-2">
                <label className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-clock text-indigo-400"></i>
                  <span>Zeitliche Abstände & Auslöser-Bedingungen</span>
                </label>
                <p className="text-[9.5px] text-slate-400 leading-snug">
                  Wann oder unter welchen Bedingungen tritt die Verwandlung/der Zustand in Kraft?
                </p>

                <input
                  type="text"
                  value={condTrigger}
                  onChange={e => setCondTrigger(e.target.value)}
                  placeholder="z.B. Jeden Vollmond, Alle 12 Stunden, Bei HP < 30%, Bei Stress..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-medium"
                />

                {/* Quick Presets for Trigger Condition */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    'Dauerhaft',
                    'Jeden Vollmond',
                    'Alle 12 Stunden',
                    'Bei Sonnenuntergang',
                    'Bei Absinken der HP < 30%',
                    'Bei Stress & Emotionen',
                    'Nach jeder Rast',
                    'Nutzung von Magie'
                  ].map(presetTrigger => (
                    <button
                      key={presetTrigger}
                      type="button"
                      onClick={() => setCondTrigger(presetTrigger)}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-medium border transition-all ${
                        condTrigger === presetTrigger
                          ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {presetTrigger}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Quelle / Urheber
                  </label>
                  <input
                    type="text"
                    value={condSource}
                    onChange={e => setCondSource(e.target.value)}
                    placeholder="z.B. Schattenhexe, Göttin Luna, Ritual..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Dauer
                  </label>
                  <input
                    type="text"
                    value={condDuration}
                    onChange={e => setCondDuration(e.target.value)}
                    placeholder="z.B. Permanent, Bis Sonnenaufgang..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Schweregrad
                  </label>
                  <select
                    value={condSeverity}
                    onChange={e => setCondSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="leicht">Leicht</option>
                    <option value="mittel">Mittel</option>
                    <option value="stark">Stark</option>
                    <option value="vollständig">Vollständig</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Beschreibung & Auswirkung auf den Körper
                </label>
                <AutoExpandingTextarea
                  value={condDescription}
                  onChange={e => setCondDescription(e.target.value)}
                  placeholder="Beschreibe, was mit dem Körper passiert, wie sich das Aussehen verändert und wie NPCs darauf reagieren..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500"
                />
              </div>

              {/* Physical Modifiers Box */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-child-reaching"></i> Physische Modifikatoren (Optional)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Geschlecht</label>
                    <select
                      value={overrideGender}
                      onChange={e => setOverrideGender(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    >
                      <option value="">(Unverändert)</option>
                      <option value="Weiblich">Weiblich</option>
                      <option value="Männlich">Männlich</option>
                      <option value="Androgyn">Androgyn</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Neue Rasse</label>
                    <input
                      type="text"
                      value={overrideRace}
                      onChange={e => setOverrideRace(e.target.value)}
                      placeholder="z.B. Vampir, Elf..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Größe +/- cm</label>
                    <input
                      type="number"
                      value={heightMod}
                      onChange={e => setHeightMod(parseInt(e.target.value) || 0)}
                      placeholder="z.B. -30 oder +15"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Gewicht +/- kg</label>
                    <input
                      type="number"
                      value={weightMod}
                      onChange={e => setWeightMod(parseInt(e.target.value) || 0)}
                      placeholder="z.B. +10 oder -15"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Körbchen</label>
                    <select
                      value={cupOverride}
                      onChange={e => setCupOverride(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    >
                      <option value="">(Unverändert)</option>
                      {['-', 'AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Muskeln +/- %</label>
                    <input
                      type="number"
                      value={muscleMod}
                      onChange={e => setMuscleMod(parseInt(e.target.value) || 0)}
                      placeholder="+10%"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Flügel</label>
                    <select
                      value={wings === undefined ? '' : wings ? 'true' : 'false'}
                      onChange={e => setWings(e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    >
                      <option value="">(Unverändert)</option>
                      <option value="true">Flügel Aktiv</option>
                      <option value="false">Keine Flügel</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9.5px] text-slate-400 block mb-0.5">Hörner</label>
                    <select
                      value={horns === undefined ? '' : horns ? 'true' : 'false'}
                      onChange={e => setHorns(e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                    >
                      <option value="">(Unverändert)</option>
                      <option value="true">Hörner Aktiv</option>
                      <option value="false">Keine Hörner</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-6 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center shrink-0">
              {editingConditionId ? (
                <button
                  type="button"
                  onClick={() => handleRemoveCustomCondition(editingConditionId)}
                  className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  Löschen
                </button>
              ) : <div></div>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={!condName.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Speichern & Übernehmen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
