// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { UserProfile, CharacterRank, DevelopmentProfileType } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { EyeColorEditor } from './EyeColorEditor';
import { autoCalculateAppearance } from '../utils/appearance';
import { PERSONALITY_ARCHETYPES, applyArchetypeToTraits } from './personalityArchetypesData';
import { CharacterRaceAndStatsSection } from './CharacterRaceAndStatsSection';
import { DEFAULT_RACES } from '../services/raceService';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers", "Androgyn", "Nicht-Binär", "Unbekannt"];
const BUILD_OPTIONS = ["Schlank", "Sportlich", "Muskulös", "Kräftig", "Zierlich", "Kurvig", "Drahtig", "Stämmig", "Hager"];
const CUP_SIZE_OPTIONS = ["-", "AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

const UserProfileEditor: React.FC<Props> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...profile,
    race: profile.race || profile.appearance?.race || 'Mensch',
    raceFeatures: profile.raceFeatures || profile.appearance?.raceFeatures || '',
    rank: profile.rank || 'F',
    level: profile.level ?? 1,
    xp: profile.xp ?? 0,
    potential: profile.potential ?? 100,
    developmentProfile: profile.developmentProfile || 'normal',
    appearance: {
      gender: profile.appearance?.gender || 'Weiblich',
      age: profile.appearance?.age || '20',
      build: profile.appearance?.build || 'Schlank',
      hairColor: profile.appearance?.hairColor || '',
      eyeColor: profile.appearance?.eyeColor || '',
      cupSize: profile.appearance?.cupSize || '-',
      ...(profile.appearance || {}),
      race: profile.race || profile.appearance?.race || 'Mensch',
      raceFeatures: profile.raceFeatures || profile.appearance?.raceFeatures || ''
    }
  });

  const handleAppearanceChange = (field: keyof UserProfile['appearance'], value: any) => {
    let updatedAppearance = { ...formData.appearance, [field]: value };
    updatedAppearance = autoCalculateAppearance(updatedAppearance, field);
    setFormData({
      ...formData,
      appearance: updatedAppearance
    });
  };

  const handleAppearanceMultiple = (updates: Partial<UserProfile['appearance']>) => {
    let updatedAppearance = { ...formData.appearance, ...updates };
    Object.keys(updates).forEach(k => {
      updatedAppearance = autoCalculateAppearance(updatedAppearance, k);
    });
    setFormData({
      ...formData,
      appearance: updatedAppearance
    });
  };

  const handleSave = () => {
    const raceVal = formData.race || formData.appearance?.race || 'Mensch';
    const raceFeaturesVal = formData.raceFeatures || formData.appearance?.raceFeatures || '';
    const cleanProfile: UserProfile = {
      ...formData,
      race: raceVal,
      raceFeatures: raceFeaturesVal,
      appearance: {
        ...formData.appearance,
        race: raceVal,
        raceFeatures: raceFeaturesVal
      }
    };
    onSave(cleanProfile);
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 min-h-screen sm:bg-transparent sm:py-10 sm:items-center overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900/60 sm:rounded-3xl border sm:border-slate-700/80 backdrop-blur-md p-6 sm:p-8 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-amber-500">Nutzerprofil</h2>
            <p className="text-xs text-slate-400 mt-0.5">Persönliche Stamm- und Entwicklungsdaten für deine Charaktere</p>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          {/* BEREICH 1: RASSE & WERTE */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-5">
            <CharacterRaceAndStatsSection
              race={formData.race || formData.appearance?.race || 'Mensch'}
              onRaceChange={val => setFormData(prev => ({ ...prev, race: val, appearance: { ...prev.appearance, race: val } }))}
              customRaces={DEFAULT_RACES}
              raceFeatures={formData.raceFeatures || formData.appearance?.raceFeatures || ''}
              onRaceFeaturesChange={val => setFormData(prev => ({ ...prev, raceFeatures: val, appearance: { ...prev.appearance, raceFeatures: val } }))}
              origin={(formData as any).origin || (formData.appearance as any)?.origin || ''}
              onOriginChange={val => setFormData(prev => ({ ...prev, origin: val, appearance: { ...(prev.appearance || {}), origin: val } } as any))}
              characterPowerData={formData.campaignPowerLevels || (formData as any).campaignPowerData || {}}
              onCharacterPowerDataChange={newData => setFormData(prev => ({ ...prev, campaignPowerLevels: newData, campaignPowerData: newData }))}
              level={formData.level ?? 1}
              onLevelChange={lvl => setFormData(prev => ({ ...prev, level: lvl }))}
              rank={formData.rank || 'F'}
              onRankChange={rnk => setFormData(prev => ({ ...prev, rank: rnk }))}
              potential={typeof formData.potential === 'number' ? formData.potential : 1000}
              onPotentialChange={pot => setFormData(prev => ({ ...prev, potential: pot }))}
              xp={formData.xp ?? 0}
              onXpChange={x => setFormData(prev => ({ ...prev, xp: x }))}
              developmentProfile={formData.developmentProfile}
              levelsPerRank={formData.levelsPerRank}
            />
          </div>

          {/* BEREICH 2: PROFIL & AUSSEHEN */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-user-gear text-amber-400"></i>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  2. Profil &amp; Aussehen
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Persönliche Identität &amp; Körpermerkmale</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 font-semibold"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Bevorzugte Rolle / Beruf</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500"
                  placeholder="z.B. Magier, Schwertkämpfer, Heiler"
                  value={formData.preferredRole || ''}
                  onChange={e => setFormData({ ...formData, preferredRole: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Geschlecht</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                  value={formData.appearance.gender || 'Weiblich'}
                  onChange={e => handleAppearanceChange('gender', e.target.value)}
                >
                  {GENDER_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Alter</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 min-h-[38px]"
                  value={formData.appearance.age || ''}
                  onChange={e => handleAppearanceChange('age', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Statur</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                  value={formData.appearance.build || 'Schlank'}
                  onChange={e => handleAppearanceChange('build', e.target.value)}
                >
                  {BUILD_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Haarfarbe</label>
                <AutoExpandingTextarea 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 min-h-[38px]"
                  value={formData.appearance.hairColor || ''}
                  onChange={e => handleAppearanceChange('hairColor', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <EyeColorEditor
                  eyeColor={formData.appearance.eyeColor || ''}
                  hasHeterochromia={formData.appearance.hasHeterochromia}
                  eyeColorLeft={formData.appearance.eyeColorLeft || ''}
                  eyeColorRight={formData.appearance.eyeColorRight || ''}
                  onChange={updates => handleAppearanceMultiple(updates)}
                  labelClassName="text-[10px] text-slate-400 font-bold uppercase block"
                  inputClassName="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Körbchengröße</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                  value={formData.appearance.cupSize || '-'}
                  onChange={e => handleAppearanceChange('cupSize', e.target.value)}
                >
                  {CUP_SIZE_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">Archetyp / Typus</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                value={formData.personalityArchetype || formData.appearance?.personalityArchetype || '-'}
                onChange={e => {
                  const arch = e.target.value;
                  const updatedTraits = arch && arch !== '-' 
                    ? applyArchetypeToTraits(formData.personalityTraits || {}, arch) 
                    : formData.personalityTraits;
                  setFormData(prev => ({
                    ...prev,
                    personalityArchetype: arch,
                    personalityTraits: updatedTraits,
                    appearance: { ...prev.appearance, personalityArchetype: arch }
                  }));
                }}
              >
                <option value="-">- Kein Archetyp (Neutral) -</option>
                <optgroup label="Klassische Dere-Typen">
                  {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Klassische Dere-Typen').map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Subtypen & Varianten">
                  {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Subtypen & Varianten').map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Western-Typen">
                  {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Western-Typen').map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Spezielle & Exzentrische Typen">
                  {PERSONALITY_ARCHETYPES.filter(a => a.category === 'Spezielle & Exzentrische Typen').map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">Biografie / Hintergrund</label>
              <AutoExpandingTextarea 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 min-h-[70px]"
                placeholder="Persönliche Hintergrundgeschichte..."
                value={formData.bio || ''}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition font-bold text-xs cursor-pointer"
          >
            Abbrechen
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Profil Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileEditor;
