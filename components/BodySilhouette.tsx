import React, { useState, useEffect, useRef } from 'react';
import { Character, Appearance } from '../types';
import { BodyConditionsManager } from './BodyConditionsManager';
import { TransformationIntensityCard } from './TransformationIntensityCard';
import { 
  resolveBodyAppearance,
  incrementTransformationIntensity,
  decayTransformationIntensity,
  updateTransformationIntensity
} from './bodyConditionResolver';

interface BodySilhouetteProps {
  player: Character;
  onUpdatePlayer?: (updated: Character) => void;
  onClose?: () => void;
  readOnly?: boolean;
  className?: string;
  loreDatabase?: any[];
  onUpdateLore?: (updatedLore: any[]) => void;
  npcs?: any[];
  onUpdateNpcs?: (updatedNpcs: any[]) => void;
}

export interface SilhouetteState {
  form: 'human' | 'child' | 'hybrid' | 'beast';
  isPregnant?: boolean;
  pregnancyMonth: number; // 0 - 9
  fatherName?: string;
  vampireBlood: number; // 0 - 100
  isVampire: boolean;
  hasWings: boolean;
  hasHorns: boolean;
  injuries: Record<string, string[]>; // e.g. { head: ['Schnittwunde'], chest: [] }
  weight?: number; // weight in kg
  bodyFat?: number; // body fat %
  muscleMass?: number; // muscle mass %
  healingFactor?: number; // 1 (Normal/Mensch) bis 5 (Übernatürlich/Unsterblich)
  customBuild?: string;
  customCupSize?: string;
  isVirgin?: boolean;
  hasChildren?: boolean;
  childrenCount?: number;
  pregnancyDaysRemaining?: number;
  pregnancyTestDone?: boolean;
  pregnancyChangesVisible?: boolean;
}

const areStatesEqual = (s1: any, s2: any): boolean => {
  if (!s1 && !s2) return true;
  if (!s1 || !s2) return false;
  
  try {
    const p1 = typeof s1 === 'string' ? JSON.parse(s1) : s1;
    const p2 = typeof s2 === 'string' ? JSON.parse(s2) : s2;
    
    if (p1.form !== p2.form) return false;
    if (p1.isPregnant !== p2.isPregnant) return false;
    if (p1.pregnancyMonth !== p2.pregnancyMonth) return false;
    if (p1.fatherName !== p2.fatherName) return false;
    if (p1.vampireBlood !== p2.vampireBlood) return false;
    if (p1.isVampire !== p2.isVampire) return false;
    if (p1.hasWings !== p2.hasWings) return false;
    if (p1.hasHorns !== p2.hasHorns) return false;
    if (p1.weight !== p2.weight) return false;
    if (p1.bodyFat !== p2.bodyFat) return false;
    if (p1.muscleMass !== p2.muscleMass) return false;
    if (p1.healingFactor !== p2.healingFactor) return false;
    if (p1.isVirgin !== p2.isVirgin) return false;
    if (p1.hasChildren !== p2.hasChildren) return false;
    if (p1.childrenCount !== p2.childrenCount) return false;
    
    // Compare injuries
    const keys = ['head', 'chest', 'l_arm', 'r_arm', 'l_leg', 'r_leg'];
    for (const k of keys) {
      const arr1 = p1.injuries?.[k] || [];
      const arr2 = p2.injuries?.[k] || [];
      if (arr1.length !== arr2.length) return false;
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
};



export const BodySilhouette: React.FC<BodySilhouetteProps> = ({
  player,
  onUpdatePlayer,
  readOnly = false,
  className = '',
  loreDatabase,
  onUpdateLore,
  npcs,
  onUpdateNpcs
}) => {
  const playerName = player.name || '';

  // Extract all available Codex characters and NPCs for Body Swap
  const availableCodexCharacters = React.useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // 0. From main player / user
    let mainPlayerObj: any = null;
    try {
      const saved = localStorage.getItem('adventures');
      if (saved) {
        const advs = JSON.parse(saved);
        if (advs[0]?.player?.name) {
          mainPlayerObj = advs[0].player;
        }
      }
    } catch (e) {
      // ignore
    }

    const playerCandidates = [mainPlayerObj, player].filter(Boolean);
    playerCandidates.forEach((pCandidate: any) => {
      if (pCandidate && pCandidate.name) {
        const pId = (pCandidate as any).id || 'main_player_user';
        if (!seenIds.has(pId)) {
          seenIds.add(pId);
          list.push({
            id: pId,
            name: pCandidate.name,
            source: 'player' as const,
            role: pCandidate.role || 'Nutzer / Hauptcharakter',
            image: pCandidate.appearance?.avatarUrl || pCandidate.image,
            bio: pCandidate.bio || '',
            personality: pCandidate.personality || '',
            gender: pCandidate.appearance?.gender || (pCandidate as any).gender || 'Weiblich',
            race: pCandidate.appearance?.race || (pCandidate as any).race || 'Mensch',
            raceFeatures: pCandidate.appearance?.raceFeatures || '',
            age: pCandidate.appearance?.age || (pCandidate as any).age || '20',
            build: pCandidate.appearance?.build || (pCandidate as any).build || 'Schlank',
            height: pCandidate.appearance?.height || (pCandidate as any).height || '170',
            measurements: pCandidate.appearance?.measurements || '',
            cupSize: pCandidate.appearance?.cupSize || (pCandidate as any).cupSize || '-',
            hairColor: pCandidate.appearance?.hairColor || (pCandidate as any).hairColor || '',
            eyeColor: pCandidate.appearance?.eyeColor || (pCandidate as any).eyeColor || '',
            outfit: pCandidate.appearance?.outfit || (pCandidate as any).outfit || '',
            looks: pCandidate.appearance?.looks || (pCandidate as any).looks || '',
            wings: !!pCandidate.appearance?.silhouetteState?.hasWings,
            horns: !!pCandidate.appearance?.silhouetteState?.hasHorns,
            skills: pCandidate.skills || '',
            powerName: pCandidate.powerName || '',
            powerDescription: pCandidate.powerDescription || '',
            powerSource: pCandidate.powerSource || '',
            powerCost: pCandidate.powerCost || '',
            abilities: pCandidate.abilities || [],
            techniques: pCandidate.techniques || '',
            campaignPowerLevels: pCandidate.campaignPowerLevels || {},
            attributes: pCandidate.attributes || [],
            relationships: pCandidate.relationships || [],
            conducts: pCandidate.conducts || [],
            relationship: pCandidate.relationship || '',
            conduct: pCandidate.conduct || '',
            rawDetails: pCandidate
          });
        }
      }
    });

    // 1. From loreDatabase prop
    (loreDatabase || []).forEach((entry: any) => {
      if (entry.category === 'Charaktere' || entry.category === 'Gegner' || (entry.details && (entry.details.role || entry.details.gender || entry.details.abilities || entry.details.skills))) {
        const d = entry.details || {};
        const id = entry.id || `codex-${entry.title}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          list.push({
            id,
            name: entry.title || d.name || 'Codex-Charakter',
            source: 'codex' as const,
            role: d.role || (entry.category === 'Gegner' ? 'Gegner / Boss' : 'Codex-Charakter'),
            image: entry.image || d.image,
            bio: d.bio || entry.description || '',
            personality: d.personality || '',
            gender: d.gender || 'Weiblich',
            race: d.race || 'Mensch',
            raceFeatures: d.raceFeatures || '',
            age: d.age || '20',
            build: d.build || 'Schlank',
            height: d.height || '168',
            measurements: d.measurements || '',
            cupSize: d.cupSize || '-',
            hairColor: d.hairColor || '',
            eyeColor: d.eyeColor || '',
            outfit: d.outfit || '',
            looks: d.looks || '',
            wings: !!d.wings,
            horns: !!d.horns,
            skills: d.skills || '',
            powerName: d.powerName || '',
            powerDescription: d.powerDescription || '',
            powerSource: d.powerSource || '',
            powerCost: d.powerCost || '',
            abilities: d.abilities || [],
            techniques: d.techniques || '',
            campaignPowerLevels: d.campaignPowerLevels || {},
            attributes: d.attributes || [],
            relationships: d.relationships || [],
            conducts: d.conducts || [],
            relationship: d.relationship || '',
            conduct: d.conduct || '',
            rawDetails: d
          });
        }
      }
    });

    // 2. From npcs prop
    (npcs || []).forEach((npc: any) => {
      const id = npc.id || `npc-${npc.name}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        list.push({
          id,
          name: npc.name,
          source: 'npc' as const,
          role: npc.role || (npc.isHostile ? 'Feindlicher NPC' : 'NPC'),
          image: npc.image,
          bio: npc.bio || '',
          personality: npc.personality || '',
          gender: npc.appearance?.gender || 'Weiblich',
          race: npc.appearance?.race || 'Mensch',
          raceFeatures: npc.appearance?.raceFeatures || '',
          age: npc.appearance?.age || '20',
          build: npc.appearance?.build || 'Schlank',
          height: npc.appearance?.height || '170',
          measurements: npc.appearance?.measurements || '',
          cupSize: npc.appearance?.cupSize || '-',
          hairColor: npc.appearance?.hairColor || '',
          eyeColor: npc.appearance?.eyeColor || '',
          outfit: npc.appearance?.outfit || '',
          looks: npc.appearance?.looks || '',
          wings: !!npc.appearance?.silhouetteState?.hasWings,
          horns: !!npc.appearance?.silhouetteState?.hasHorns,
          skills: npc.skills || '',
          powerName: npc.powerName || '',
          powerDescription: npc.powerDescription || '',
          powerSource: npc.powerSource || '',
          powerCost: npc.powerCost || '',
          abilities: npc.abilities || [],
          techniques: npc.techniques || '',
          campaignPowerLevels: npc.campaignPowerLevels || {},
          attributes: npc.attributes || [],
          relationships: npc.relationships || [],
          conducts: npc.conducts || [],
          relationship: npc.relationship || '',
          conduct: npc.conduct || '',
          rawDetails: npc
        });
      }
    });

    // Fallback: Check localStorage if no entries in props
    if (list.length === 0) {
      try {
        const saved = localStorage.getItem('adventures');
        if (saved) {
          const advs = JSON.parse(saved);
          const currentAdv = advs[0];
          if (currentAdv?.loreDatabase) {
            currentAdv.loreDatabase.forEach((entry: any) => {
              if (entry.category === 'Charaktere' || entry.category === 'Gegner') {
                const d = entry.details || {};
                const id = entry.id || `codex-${entry.title}`;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  list.push({
                    id,
                    name: entry.title || d.name || 'Codex-Charakter',
                    source: 'codex' as const,
                    role: d.role || (entry.category === 'Gegner' ? 'Gegner' : 'Charakter'),
                    image: entry.image || d.image,
                    bio: d.bio || entry.description || '',
                    personality: d.personality || '',
                    gender: d.gender || 'Weiblich',
                    race: d.race || 'Mensch',
                    raceFeatures: d.raceFeatures || '',
                    age: d.age || '20',
                    build: d.build || 'Schlank',
                    height: d.height || '168',
                    measurements: d.measurements || '',
                    cupSize: d.cupSize || '-',
                    hairColor: d.hairColor || '',
                    eyeColor: d.eyeColor || '',
                    outfit: d.outfit || '',
                    looks: d.looks || '',
                    wings: !!d.wings,
                    horns: !!d.horns,
                    skills: d.skills || '',
                    powerName: d.powerName || '',
                    powerDescription: d.powerDescription || '',
                    powerSource: d.powerSource || '',
                    powerCost: d.powerCost || '',
                    abilities: d.abilities || [],
                    techniques: d.techniques || '',
                    campaignPowerLevels: d.campaignPowerLevels || {},
                    attributes: d.attributes || [],
                    relationships: d.relationships || [],
                    conducts: d.conducts || [],
                    relationship: d.relationship || '',
                    conduct: d.conduct || '',
                    rawDetails: d
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }

    return list;
  }, [loreDatabase, npcs]);

  // Extract all raw transformations defined on this player
  const rawTransformationList = React.useMemo(() => {
    return (player.abilities || []).filter(a => a.category === 'Transformationen');
  }, [player.abilities]);

  // Build list of all available partner characters (including main player if player is a codex char)
  const allPartnerCharacters = React.useMemo(() => {
    const list = [...availableCodexCharacters];
    try {
      const saved = localStorage.getItem('adventures');
      if (saved) {
        const advs = JSON.parse(saved);
        const currentAdv = advs[0];
        if (currentAdv?.player && currentAdv.player.name) {
          const mainP = currentAdv.player;
          const pId = (mainP as any).id || 'main_player';
          if (!list.some(c => c.id === pId || (c.name && c.name.toLowerCase() === mainP.name.toLowerCase()))) {
            list.push({
              id: pId,
              name: mainP.name,
              source: 'player' as any,
              role: mainP.role || 'Hauptcharakter',
              bio: mainP.bio || '',
              personality: mainP.personality || '',
              gender: mainP.appearance?.gender || (mainP as any).gender || 'Weiblich',
              race: mainP.appearance?.race || (mainP as any).race || 'Mensch',
              raceFeatures: mainP.appearance?.raceFeatures || '',
              age: mainP.appearance?.age || (mainP as any).age || '20',
              build: mainP.appearance?.build || (mainP as any).build || 'Schlank',
              height: mainP.appearance?.height || (mainP as any).height || '170',
              measurements: mainP.appearance?.measurements || '',
              cupSize: mainP.appearance?.cupSize || (mainP as any).cupSize || '-',
              hairColor: mainP.appearance?.hairColor || (mainP as any).hairColor || '',
              eyeColor: mainP.appearance?.eyeColor || (mainP as any).eyeColor || '',
              outfit: mainP.appearance?.outfit || (mainP as any).outfit || '',
              looks: mainP.appearance?.looks || (mainP as any).looks || '',
              abilities: mainP.abilities || [],
              appearance: mainP.appearance,
              rawDetails: mainP
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return list;
  }, [availableCodexCharacters]);

  // Compute transformationList including reciprocal body swap forms for both characters
  const transformationList = React.useMemo(() => {
    const list = [...rawTransformationList];
    const currentCharName = (player.name || '').toLowerCase().trim();
    const currentCharId = (player as any).id;

    if (currentCharName || currentCharId) {
      allPartnerCharacters.forEach(otherChar => {
        if (otherChar.id === currentCharId || (otherChar.name && otherChar.name.toLowerCase().trim() === currentCharName)) {
          return; // Skip self
        }

        // Check if otherChar has a body swap transformation targeting currentChar
        const otherAbilities = otherChar.abilities || otherChar.rawDetails?.abilities || [];
        const otherSwapTrans = otherAbilities.find((a: any) => 
          a.category === 'Transformationen' &&
          (a.transformIdentityPerception === 'koerpertausch' || a.transformSwappedCharacterName) &&
          (
            (a.transformSwappedCharacterId && a.transformSwappedCharacterId === currentCharId) ||
            (a.transformSwappedCharacterName && a.transformSwappedCharacterName.toLowerCase().trim() === currentCharName)
          )
        );

        if (otherSwapTrans) {
          // Check if list already has a transformation for this swap
          const existing = list.find(t => 
            (t.transformSwappedCharacterId && t.transformSwappedCharacterId === otherChar.id) ||
            (t.transformSwappedCharacterName && t.transformSwappedCharacterName.toLowerCase().trim() === otherChar.name.toLowerCase().trim()) ||
            t.name === `Körpertausch: ${otherChar.name}`
          );

          if (!existing) {
            const reciprocalId = `reciprocal_swap_${otherChar.id || otherChar.name.replace(/\s+/g, '_')}`;
            const reciprocal: any = {
              id: reciprocalId,
              name: `Körpertausch: ${otherChar.name}`,
              category: 'Transformationen',
              transformName: `Körpertausch: ${otherChar.name}`,
              transformIdentityPerception: 'koerpertausch',
              transformSwappedCharacterId: otherChar.id,
              transformSwappedCharacterName: otherChar.name,
              transformGender: otherChar.gender || 'Weiblich',
              transformRace: otherChar.race || 'Mensch',
              transformRaceFeatures: otherChar.raceFeatures || '',
              transformAge: otherChar.age || '20',
              transformBuild: otherChar.build || 'Schlank',
              transformHeight: otherChar.height || '170',
              transformMeasurements: otherChar.measurements || '',
              transformCupSize: otherChar.cupSize || '-',
              transformHairColor: otherChar.hairColor || '',
              transformEyeColor: otherChar.eyeColor || '',
              transformOutfit: otherChar.outfit || '',
              transformLooks: otherChar.looks || '',
              transformRole: otherChar.role || ''
            };
            list.push(reciprocal);
          }
        }
      });
    }

    return list;
  }, [rawTransformationList, player.name, (player as any).id, allPartnerCharacters]);

  // Check if there is an active swap from another partner targeting current player
  const activePartnerSwap = React.useMemo(() => {
    const currentCharName = (player.name || '').toLowerCase().trim();
    const currentCharId = (player as any).id;
    if (!currentCharName && !currentCharId) return null;

    for (const other of allPartnerCharacters) {
      if (other.id === currentCharId || (other.name && other.name.toLowerCase().trim() === currentCharName)) continue;

      const otherAbilities = other.abilities || other.rawDetails?.abilities || [];
      const otherActiveTransId = other.appearance?.activeTransformationId || other.rawDetails?.activeTransformationId;

      const activeTrans = otherAbilities.find((a: any) => 
        a.category === 'Transformationen' &&
        (a.id === otherActiveTransId || a.transformIdentityPerception === 'koerpertausch' || a.transformSwappedCharacterName) &&
        a.id === otherActiveTransId &&
        (
          (a.transformSwappedCharacterId && a.transformSwappedCharacterId === currentCharId) ||
          (a.transformSwappedCharacterName && a.transformSwappedCharacterName.toLowerCase().trim() === currentCharName)
        )
      );

      if (activeTrans) {
        return { partner: other, activeTrans };
      }
    }
    return null;
  }, [player.name, (player as any).id, allPartnerCharacters]);

  const rawActiveTransformationId = player.appearance?.activeTransformationId || 'standard';
  const activeTransformationId = (rawActiveTransformationId === 'standard' && activePartnerSwap)
    ? (transformationList.find(t => t.transformSwappedCharacterName?.toLowerCase().trim() === activePartnerSwap.partner.name.toLowerCase().trim())?.id || 'standard')
    : rawActiveTransformationId;

  const activeTransformation = transformationList.find(t => t.id === activeTransformationId);

  const syncReciprocalSwapToTargetChar = (targetChar: any, isSwapActive: boolean) => {
    if (!targetChar) return;

    const charAName = player.name || 'Hauptcharakter';
    const charAId = (player as any).id || 'player_id';
    const reciprocalTransId = `trans_swap_reciprocal_${charAId || charAName.replace(/\s+/g, '_')}`;

    const reciprocalTrans: any = {
      id: reciprocalTransId,
      name: `Körpertausch: ${charAName}`,
      category: 'Transformationen',
      transformName: `Körpertausch: ${charAName}`,
      transformIdentityPerception: 'koerpertausch',
      transformSwappedCharacterId: charAId,
      transformSwappedCharacterName: charAName,
      transformGender: player.appearance?.gender || (player as any).gender || 'Weiblich',
      transformRace: player.appearance?.race || (player as any).race || 'Mensch',
      transformRaceFeatures: player.appearance?.raceFeatures || '',
      transformAge: player.appearance?.age || (player as any).age || '20',
      transformBuild: player.appearance?.build || (player as any).build || 'Schlank',
      transformHeight: player.appearance?.height || (player as any).height || '170',
      transformMeasurements: player.appearance?.measurements || '',
      transformCupSize: player.appearance?.cupSize || (player as any).cupSize || '-',
      transformHairColor: player.appearance?.hairColor || (player as any).hairColor || '',
      transformEyeColor: player.appearance?.eyeColor || (player as any).eyeColor || '',
      transformOutfit: player.appearance?.outfit || (player as any).outfit || '',
      transformLooks: player.appearance?.looks || (player as any).looks || '',
      transformRole: player.role || ''
    };

    if (loreDatabase && onUpdateLore) {
      const updatedLore = loreDatabase.map(entry => {
        if (entry.id === targetChar.id || (entry.title && entry.title.trim().toLowerCase() === targetChar.name.trim().toLowerCase())) {
          const d = entry.details || {};
          const existingAbilities = d.abilities || [];
          let newAbilities = [...existingAbilities];
          const idx = newAbilities.findIndex((a: any) => 
            a.id === reciprocalTransId || 
            a.name === `Körpertausch: ${charAName}` ||
            (a.category === 'Transformationen' && a.transformSwappedCharacterName?.trim().toLowerCase() === charAName.trim().toLowerCase())
          );
          if (idx >= 0) {
            newAbilities[idx] = { ...newAbilities[idx], ...reciprocalTrans };
          } else {
            newAbilities.push(reciprocalTrans);
          }
          return {
            ...entry,
            details: {
              ...d,
              abilities: newAbilities,
              activeTransformationId: isSwapActive ? reciprocalTransId : 'standard',
              appearance: {
                ...(d.appearance || {}),
                activeTransformationId: isSwapActive ? reciprocalTransId : 'standard'
              }
            }
          };
        }
        return entry;
      });
      onUpdateLore(updatedLore);
    }

    if (targetChar.source === 'player' && onUpdatePlayerRef.current) {
      const existingAbilities = player.abilities || [];
      let newAbilities = [...existingAbilities];
      const idx = newAbilities.findIndex((a: any) => 
        a.id === reciprocalTransId || 
        a.name === `Körpertausch: ${charAName}`
      );
      if (idx >= 0) {
        newAbilities[idx] = { ...newAbilities[idx], ...reciprocalTrans };
      } else {
        newAbilities.push(reciprocalTrans);
      }
      onUpdatePlayerRef.current({
        ...player,
        abilities: newAbilities
      });
    }

    if (npcs && onUpdateNpcs) {
      const updatedNpcs = npcs.map(npc => {
        if (npc.id === targetChar.id || (npc.name && npc.name.trim().toLowerCase() === targetChar.name.trim().toLowerCase())) {
          const existingAbilities = npc.abilities || [];
          let newAbilities = [...existingAbilities];
          const idx = newAbilities.findIndex((a: any) => 
            a.id === reciprocalTransId || 
            a.name === `Körpertausch: ${charAName}`
          );
          if (idx >= 0) {
            newAbilities[idx] = { ...newAbilities[idx], ...reciprocalTrans };
          } else {
            newAbilities.push(reciprocalTrans);
          }
          return {
            ...npc,
            abilities: newAbilities,
            appearance: {
              ...(npc.appearance || {}),
              activeTransformationId: isSwapActive ? reciprocalTransId : 'standard'
            }
          };
        }
        return npc;
      });
      onUpdateNpcs(updatedNpcs);
    }
  };

  // Parse initial state from player.appearance or fall back
  const app: Appearance = player.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };

  // Create resolvedApp with transformation overrides applied
  const resolvedApp: Appearance = {
    ...app,
    gender: activeTransformation?.transformGender || app.gender,
    hairColor: activeTransformation?.transformHairColor || app.hairColor,
    eyeColor: activeTransformation?.transformEyeColor || app.eyeColor,
    build: activeTransformation?.transformBuild || app.build,
    age: activeTransformation?.transformAge || app.age,
    race: activeTransformation?.transformRace || app.race,
    raceFeatures: activeTransformation?.transformRaceFeatures || app.raceFeatures,
    height: activeTransformation?.transformHeight || app.height,
    measurements: activeTransformation?.transformMeasurements || app.measurements,
    origin: activeTransformation?.transformOrigin || app.origin,
    family: activeTransformation?.transformFamily || app.family,
    faction: activeTransformation?.transformFaction || app.faction,
    outfit: activeTransformation?.transformOutfit || app.outfit,
    looks: activeTransformation?.transformLooks || app.looks,
    cupSize: activeTransformation?.transformCupSize || app.cupSize,
    weight: activeTransformation?.transformWeight || app.weight,
    bodyFat: activeTransformation?.transformBodyFat || app.bodyFat,
    muscleMass: activeTransformation?.transformMuscleMass || app.muscleMass,
  };

  const initialGender = resolvedApp.gender || app.gender || 'Weiblich';
  const initialRace = (resolvedApp.race || '').toLowerCase();
  const initialFeatures = (resolvedApp.raceFeatures || '').toLowerCase();

  // Deduce default states from description
  const isInitiallyVampire = initialRace.includes('vampir') || initialFeatures.includes('vampir');
  const initiallyWings = initialFeatures.includes('flügel') || initialFeatures.includes('wings') || initialFeatures.includes('feder');
  const initiallyHorns = initialFeatures.includes('horn') || initialFeatures.includes('hörner') || initialFeatures.includes('horns');

  const [state, setState] = useState<SilhouetteState>(() => {
    // Try to load saved state from custom fields on appearance or infer them
    const saved = (app as any).silhouetteState;
    const isFemale = (resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
    const initIsPregnant = saved?.isPregnant !== undefined ? !!saved.isPregnant : ((saved?.pregnancyMonth || 0) > 0);
    const initPregMonth = saved?.pregnancyMonth || (app.pregnancyMonth ? parseInt(app.pregnancyMonth) || 0 : 0);
    const initFather = saved?.fatherName || (app as any).fatherName || '';
    
    const initHasChildren = saved?.hasChildren !== undefined
      ? !!saved.hasChildren
      : ((saved?.childrenCount || 0) > 0 || (app as any).hasChildren || ((app as any).childrenCount || 0) > 0);
    const initChildrenCount = saved?.childrenCount !== undefined
      ? saved.childrenCount
      : ((app as any).childrenCount || (initHasChildren ? 1 : 0));
    const hasChildrenOrPregnantInit = initHasChildren || initChildrenCount > 0 || initIsPregnant || initPregMonth > 0;
    const initIsVirgin = hasChildrenOrPregnantInit
      ? false
      : (saved?.isVirgin !== undefined ? !!saved.isVirgin : ((app as any).isVirgin !== undefined ? !!(app as any).isVirgin : true));

    const defaultState: SilhouetteState = {
      form: (isInitiallyVampire && (resolvedApp.age === 'Kind' || parseInt(resolvedApp.age || '25') < 12)) ? 'child' : 'human',
      isPregnant: initIsPregnant,
      pregnancyMonth: initPregMonth,
      fatherName: initFather,
      vampireBlood: isInitiallyVampire ? 100 : 100,
      isVampire: isInitiallyVampire,
      hasWings: initiallyWings,
      hasHorns: initiallyHorns,
      injuries: {
        head: [],
        chest: [],
        l_arm: [],
        r_arm: [],
        l_leg: [],
        r_leg: []
      },
      weight: undefined,
      bodyFat: undefined,
      muscleMass: undefined,
      healingFactor: (resolvedApp as any).healingFactor ? parseInt((resolvedApp as any).healingFactor) : 1,
      customBuild: undefined,
      customCupSize: undefined,
      isVirgin: initIsVirgin,
      hasChildren: initHasChildren,
      childrenCount: initChildrenCount,
      pregnancyDaysRemaining: saved?.pregnancyDaysRemaining ?? (initPregMonth > 0 ? Math.max(0, 270 - (initPregMonth - 1) * 30) : 270),
      pregnancyTestDone: saved?.pregnancyTestDone ?? false,
      pregnancyChangesVisible: saved?.pregnancyChangesVisible ?? false
    };

    if (saved) {
      try {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        return {
          ...defaultState,
          ...parsed
        };
      } catch (e) {
        // Fallback
      }
    }

    return defaultState;
  });

  const resolvedBody = resolveBodyAppearance(player);
  const activeConditionsList = resolvedBody.activeConditionList || [];
  const hasActiveCurses = activeConditionsList.some(c => c.type === 'curse');
  const hasActiveBlessings = activeConditionsList.some(c => c.type === 'blessing');

  const finalWings = resolvedBody.effectiveWings || (activeTransformation 
    ? (activeTransformation.transformWings !== undefined ? activeTransformation.transformWings : state?.hasWings || false)
    : state?.hasWings || false);
  const finalHorns = resolvedBody.effectiveHorns || (activeTransformation 
    ? (activeTransformation.transformHorns !== undefined ? activeTransformation.transformHorns : state?.hasHorns || false)
    : state?.hasHorns || false);

  const [activeSilhouetteTab, setActiveSilhouetteTab] = useState<'conditions' | 'physical' | 'injuries'>('conditions');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [newInjuryName, setNewInjuryName] = useState('');
  const [showPermanentSwapModal, setShowPermanentSwapModal] = useState<boolean>(false);
  const [showConfirmFullSwapModal, setShowConfirmFullSwapModal] = useState<boolean>(false);
  const [targetCharForFullSwap, setTargetCharForFullSwap] = useState<any>(null);
  const [swappedCharSearch, setSwappedCharSearch] = useState<string>('');
  const [swapSuccessToast, setSwapSuccessToast] = useState<string | null>(null);



  const currentSwappedChar = React.useMemo(() => {
    if (!activeTransformation) return null;
    const targetId = activeTransformation.transformSwappedCharacterId;
    const targetName = activeTransformation.transformSwappedCharacterName;
    if (targetId) {
      const found = availableCodexCharacters.find(c => c.id === targetId);
      if (found) return found;
    }
    if (targetName) {
      const found = availableCodexCharacters.find(c => c.name.toLowerCase() === targetName.toLowerCase());
      if (found) return found;
    }
    if (activeTransformation.transformIdentityPerception === 'koerpertausch') {
      return availableCodexCharacters.find(c => c.name.toLowerCase() === activeTransformation.name.toLowerCase()) || null;
    }
    return null;
  }, [availableCodexCharacters, activeTransformation]);

  const activeSwappedName = currentSwappedChar?.name || 
    activeTransformation?.transformSwappedCharacterName || 
    (activeTransformation?.transformIdentityPerception === 'koerpertausch' ? (activeTransformation?.transformSwappedCharacterName || activeTransformation?.name) : null) ||
    (player.appearance as any)?.silhouetteState?.swappedCharacterName ||
    (player as any)?.swappedCharacterName;

  const [isCustomFatherInput, setIsCustomFatherInput] = useState<boolean>(false);

  const fatherCandidates = React.useMemo(() => {
    const names: string[] = [];
    availableCodexCharacters.forEach(c => {
      const n = (c.name || '').trim();
      if (n && n !== playerName && !names.includes(n)) {
        names.push(n);
      }
    });
    return names;
  }, [availableCodexCharacters, playerName]);

  const lastSyncedAppearanceRef = useRef<string | null>(null);

  const playerRef = useRef(player);
  const onUpdatePlayerRef = useRef(onUpdatePlayer);
  useEffect(() => {
    playerRef.current = player;
    onUpdatePlayerRef.current = onUpdatePlayer;
  }, [player, onUpdatePlayer]);

  // Synchronize dynamic/reciprocal body swap transformations into actual abilities
  useEffect(() => {
    if (!onUpdatePlayer || readOnly) return;

    const currentAbilities = player.abilities || [];
    let changed = false;
    const updatedAbilities = [...currentAbilities];

    transformationList.forEach(t => {
      const isDynamicReciprocal = t.id && String(t.id).startsWith('reciprocal_swap_');
      if (isDynamicReciprocal) {
        const targetCharAId = t.transformSwappedCharacterId || t.name.replace('Körpertausch: ', '').replace(/\s+/g, '_');
        const permanentId = `trans_swap_reciprocal_${targetCharAId}`;

        const alreadyExists = currentAbilities.some(a => 
          a.id === t.id || 
          a.id === permanentId ||
          a.name === t.name || 
          (a.category === 'Transformationen' && a.transformSwappedCharacterId === t.transformSwappedCharacterId)
        );

        if (!alreadyExists) {
          updatedAbilities.push({
            ...t,
            id: permanentId
          });
          changed = true;
        }
      }
    });

    if (changed) {
      onUpdatePlayer({
        ...player,
        abilities: updatedAbilities
      });
    }
  }, [transformationList, player, onUpdatePlayer, readOnly]);

  const handleMakePermanentMainBody = () => {
    if (!activeTransformation || !onUpdatePlayerRef.current) return;

    const newName = activeTransformation.transformName || activeTransformation.name || player.name || '';
    const newRufName = activeTransformation.transformRufName || player.rufName || '';
    const newNickname = activeTransformation.transformNickname || player.nickname || '';
    const newRole = activeTransformation.transformRole || player.role || '';
    const newGender = activeTransformation.transformGender || resolvedApp.gender || 'Weiblich';
    const newHairColor = activeTransformation.transformHairColor || resolvedApp.hairColor || '';
    const newEyeColor = activeTransformation.transformEyeColor || resolvedApp.eyeColor || '';
    const newBuild = activeTransformation.transformBuild || resolvedApp.build || '';
    const newAge = activeTransformation.transformAge || resolvedApp.age || '';
    const newRace = activeTransformation.transformRace || resolvedApp.race || '';
    const newRaceFeatures = activeTransformation.transformRaceFeatures || resolvedApp.raceFeatures || '';
    const newHeight = activeTransformation.transformHeight || resolvedApp.height || '';
    const newMeasurements = activeTransformation.transformMeasurements || resolvedApp.measurements || '';
    const newCupSize = activeTransformation.transformCupSize || resolvedApp.cupSize || '';
    const newOutfit = activeTransformation.transformOutfit || resolvedApp.outfit || '';
    const newLooks = activeTransformation.transformLooks || resolvedApp.looks || '';

    const newWings = activeTransformation.transformWings !== undefined 
      ? activeTransformation.transformWings 
      : (state?.hasWings || false);
    const newHorns = activeTransformation.transformHorns !== undefined 
      ? activeTransformation.transformHorns 
      : (state?.hasHorns || false);

    // 1. Sichere/Erhalte die ursprüngliche Gestalt (Geburtsidentität & bisheriges Leben)
    const previousOriginalData: Partial<Character> = player.originalIdentity || {
      name: player.name,
      rufName: player.rufName,
      nickname: player.nickname,
      role: player.role,
      appearance: { ...player.appearance },
      personality: player.personality,
      bio: player.bio,
      currentSituation: player.currentSituation,
      goal: player.goal,
      relationships: player.relationships ? [...player.relationships] : []
    };

    // 2. Füge den vorherigen Körper als verwandelbare Form hinzu, falls noch nicht vorhanden
    const prevOriginalName = player.name || 'Ursprüngliche Gestalt';
    const existingAbilities = player.abilities || [];
    const hasOriginalTransformation = existingAbilities.some(
      a => a.category === 'Transformationen' && (a.name?.includes('Ursprüngliche Gestalt') || a.transformName === prevOriginalName)
    );

    let updatedAbilities = [...existingAbilities];
    if (!hasOriginalTransformation && player.name) {
      const originalFormId = 'original_form_' + Date.now();
      updatedAbilities.push({
        id: originalFormId,
        source: 'Geburt',
        cost: '-',
        techniques: '',
        name: `Ursprüngliche Gestalt (${prevOriginalName})`,
        category: 'Transformationen',
        description: `Dein ursprünglicher Körper und deine Geburtsidentität als ${prevOriginalName}.`,
        transformName: player.name,
        transformRufName: player.rufName,
        transformNickname: player.nickname,
        transformRole: player.role,
        transformGender: player.appearance?.gender,
        transformHairColor: player.appearance?.hairColor,
        transformEyeColor: player.appearance?.eyeColor,
        transformBuild: player.appearance?.build,
        transformAge: player.appearance?.age,
        transformRace: player.appearance?.race,
        transformRaceFeatures: player.appearance?.raceFeatures,
        transformHeight: player.appearance?.height,
        transformMeasurements: player.appearance?.measurements,
        transformCupSize: player.appearance?.cupSize,
        transformOutfit: player.appearance?.outfit,
        transformLooks: player.appearance?.looks,
        transformWings: player.appearance?.silhouetteState?.hasWings,
        transformHorns: player.appearance?.silhouetteState?.hasHorns,
        transformPersonality: player.personality,
        transformBio: player.bio,
        transformCurrentSituation: player.currentSituation,
        transformGoal: player.goal,
        transformRelationships: player.relationships ? [...player.relationships] : [],
        transformIdentityPerception: 'koerpertausch'
      });
    }

    const updatedAppearance: Appearance = {
      ...app,
      gender: newGender,
      hairColor: newHairColor,
      eyeColor: newEyeColor,
      build: newBuild,
      age: newAge,
      race: newRace,
      raceFeatures: newRaceFeatures,
      height: newHeight,
      measurements: newMeasurements,
      cupSize: newCupSize,
      outfit: newOutfit,
      looks: newLooks,
      activeTransformationId: 'standard',
      silhouetteState: {
        ...state,
        hasWings: newWings,
        hasHorns: newHorns,
        customBuild: newBuild,
        customCupSize: newCupSize
      }
    };

    const updatedPlayer: Character = {
      ...player,
      name: newName,
      rufName: newRufName,
      nickname: newNickname,
      role: newRole,
      personality: activeTransformation.transformPersonality !== undefined ? activeTransformation.transformPersonality : player.personality,
      bio: activeTransformation.transformBio !== undefined ? activeTransformation.transformBio : player.bio,
      currentSituation: activeTransformation.transformCurrentSituation !== undefined ? activeTransformation.transformCurrentSituation : player.currentSituation,
      goal: activeTransformation.transformGoal !== undefined ? activeTransformation.transformGoal : player.goal,
      relationships: activeTransformation.transformRelationships !== undefined ? activeTransformation.transformRelationships : player.relationships,
      appearance: updatedAppearance,
      originalIdentity: previousOriginalData,
      abilities: updatedAbilities
    };

    onUpdatePlayerRef.current(updatedPlayer);
    setShowPermanentSwapModal(false);
    setSwapSuccessToast(`Körper dauerhaft gewechselt! "${newName || activeTransformation.name}" ist jetzt deine neue Hauptgestalt. Seine/Ihre Ursprüngliche Gestalt bleibt dauerhaft gesichert.`);
    setTimeout(() => setSwapSuccessToast(null), 4500);
  };

  const updateTransformationIdentity = (mode: 'bekannt' | 'getrennt' | 'koerpertausch') => {
    if (!activeTransformation || !onUpdatePlayerRef.current) return;
    const updatedAbilities = (player.abilities || []).map(a =>
      a.id === activeTransformation.id
        ? { ...a, transformIdentityPerception: mode }
        : a
    );
    onUpdatePlayerRef.current({
      ...player,
      abilities: updatedAbilities
    });
  };

  const handleSelectSwappedCharacter = (targetChar: any) => {
    if (!activeTransformation || !onUpdatePlayerRef.current) return;

    // Backup original player data into transformation if not already backed up
    const backupOriginal = activeTransformation.transformSwappedOriginalData || {
      name: player.name,
      rufName: player.rufName,
      nickname: player.nickname,
      role: player.role,
      bio: player.bio,
      personality: player.personality,
      appearance: { ...player.appearance },
      powerName: player.powerName,
      powerDescription: player.powerDescription,
      powerSource: player.powerSource,
      powerCost: player.powerCost,
      skills: player.skills,
      techniques: player.techniques,
      campaignPowerLevels: player.campaignPowerLevels,
      relationships: player.relationships,
      conducts: player.conducts,
      relationship: player.relationship,
      conduct: player.conduct
    };

    const updatedAbilities = (player.abilities || []).map(a => {
      if (a.id === activeTransformation.id) {
        return {
          ...a,
          transformIdentityPerception: 'koerpertausch' as const,
          transformSwappedCharacterId: targetChar.id,
          transformSwappedCharacterName: targetChar.name,
          transformSwappedCharacterSource: targetChar.source,
          transformSwappedOriginalData: backupOriginal,
          transformName: `Körpertausch: ${targetChar.name}`,
          transformGender: targetChar.gender || 'Weiblich',
          transformRace: targetChar.race || 'Mensch',
          transformRaceFeatures: targetChar.raceFeatures || '',
          transformAge: targetChar.age || '20',
          transformBuild: targetChar.build || 'Schlank',
          transformHeight: targetChar.height || '170',
          transformMeasurements: targetChar.measurements || '',
          transformCupSize: targetChar.cupSize || '-',
          transformHairColor: targetChar.hairColor || '',
          transformEyeColor: targetChar.eyeColor || '',
          transformOutfit: targetChar.outfit || '',
          transformLooks: targetChar.looks || '',
          transformWings: !!targetChar.wings,
          transformHorns: !!targetChar.horns,
          transformRole: targetChar.role || ''
        };
      }
      return a;
    });

    const targetGender = targetChar.gender || 'Weiblich';
    const isTargetFemale = targetGender.toLowerCase() === 'weiblich';
    const targetHeight = targetChar.height ? String(targetChar.height) : (isTargetFemale ? '165' : '178');
    const targetCup = targetChar.cupSize || (isTargetFemale ? 'C' : '-');

    const updatedAppearance: Appearance = {
      ...app,
      gender: targetGender,
      hairColor: targetChar.hairColor || app.hairColor,
      eyeColor: targetChar.eyeColor || app.eyeColor,
      build: targetChar.build || app.build,
      age: targetChar.age || app.age,
      race: targetChar.race || app.race,
      raceFeatures: targetChar.raceFeatures || app.raceFeatures,
      height: targetHeight,
      measurements: targetChar.measurements || app.measurements,
      cupSize: targetCup,
      outfit: targetChar.outfit || app.outfit,
      looks: targetChar.looks || app.looks,
      silhouetteState: {
        ...state,
        hasWings: !!targetChar.wings,
        hasHorns: !!targetChar.horns,
        customBuild: targetChar.build,
        customCupSize: targetCup
      }
    };

    let newAbilities = [...updatedAbilities];
    if (targetChar.abilities && Array.isArray(targetChar.abilities) && targetChar.abilities.length > 0) {
      targetChar.abilities.forEach((targetAb: any) => {
        if (!newAbilities.some(a => a.name === targetAb.name)) {
          newAbilities.push({
            ...targetAb,
            id: `swapped-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            source: `Körpertausch (${targetChar.name})`
          });
        }
      });
    }

    onUpdatePlayerRef.current({
      ...player,
      role: targetChar.role || player.role,
      bio: targetChar.bio || player.bio,
      personality: targetChar.personality || player.personality,
      appearance: updatedAppearance,
      relationships: (targetChar.relationships && targetChar.relationships.length > 0) ? targetChar.relationships : player.relationships,
      conducts: (targetChar.conducts && targetChar.conducts.length > 0) ? targetChar.conducts : player.conducts,
      relationship: targetChar.relationship || player.relationship,
      conduct: targetChar.conduct || player.conduct,
      powerName: targetChar.powerName || player.powerName,
      powerDescription: targetChar.powerDescription || player.powerDescription,
      powerSource: targetChar.powerSource || player.powerSource,
      powerCost: targetChar.powerCost || player.powerCost,
      skills: targetChar.skills || player.skills,
      techniques: targetChar.techniques || player.techniques,
      campaignPowerLevels: (targetChar.campaignPowerLevels && Object.keys(targetChar.campaignPowerLevels).length > 0) ? targetChar.campaignPowerLevels : player.campaignPowerLevels,
      abilities: newAbilities
    });

    syncReciprocalSwapToTargetChar(targetChar, true);

    setSwapSuccessToast(`Körpertausch mit "${targetChar.name}" synchronisiert! Profil, Aussehen, Beziehungen & Kampffähigkeiten wurden in deine Reiter übertragen.`);
    setTimeout(() => setSwapSuccessToast(null), 4500);
  };

  const handleExecuteFullBodySwap = (targetChar: any) => {
    if (!onUpdatePlayerRef.current) return;

    const backupOriginal = (activeTransformation?.transformSwappedOriginalData) || {
      name: player.name,
      rufName: player.rufName,
      nickname: player.nickname,
      role: player.role,
      bio: player.bio,
      personality: player.personality,
      appearance: { ...player.appearance },
      powerName: player.powerName,
      powerDescription: player.powerDescription,
      powerSource: player.powerSource,
      powerCost: player.powerCost,
      skills: player.skills,
      techniques: player.techniques,
      campaignPowerLevels: player.campaignPowerLevels,
      relationships: player.relationships,
      conducts: player.conducts,
      relationship: player.relationship,
      conduct: player.conduct
    };

    const targetGender = targetChar.gender || 'Weiblich';
    const isTargetFemale = targetGender.toLowerCase() === 'weiblich';
    const targetHeight = targetChar.height ? String(targetChar.height) : (isTargetFemale ? '165' : '178');
    const targetCup = targetChar.cupSize || (isTargetFemale ? 'C' : '-');

    const updatedAppearance: Appearance = {
      ...app,
      gender: targetGender,
      hairColor: targetChar.hairColor || app.hairColor,
      eyeColor: targetChar.eyeColor || app.eyeColor,
      build: targetChar.build || app.build,
      age: targetChar.age || app.age,
      race: targetChar.race || app.race,
      raceFeatures: targetChar.raceFeatures || app.raceFeatures,
      height: targetHeight,
      measurements: targetChar.measurements || app.measurements,
      cupSize: targetCup,
      outfit: targetChar.outfit || app.outfit,
      looks: targetChar.looks || app.looks,
      activeTransformationId: activeTransformationId,
      silhouetteState: {
        ...state,
        hasWings: !!targetChar.wings,
        hasHorns: !!targetChar.horns,
        customBuild: targetChar.build,
        customCupSize: targetCup
      }
    };

    // Combine or update abilities with target's abilities
    let newAbilities = [...(player.abilities || [])];

    // 2. Füge den vorherigen Körper als verwandelbare Form hinzu, falls noch nicht vorhanden
    const prevOriginalName = player.name || 'Ursprüngliche Gestalt';
    const hasOriginalTransformation = newAbilities.some(
      a => a.category === 'Transformationen' && (a.name?.includes('Ursprüngliche Gestalt') || a.transformName === prevOriginalName)
    );
    if (!hasOriginalTransformation && player.name) {
      const originalFormId = 'original_form_' + Date.now();
      newAbilities.push({
        id: originalFormId,
        source: 'Geburt',
        cost: '-',
        techniques: '',
        name: `Ursprüngliche Gestalt (${prevOriginalName})`,
        category: 'Transformationen',
        description: `Dein ursprünglicher Körper und deine Geburtsidentität als ${prevOriginalName}.`,
        transformName: player.name,
        transformRufName: player.rufName,
        transformNickname: player.nickname,
        transformRole: player.role,
        transformGender: player.appearance?.gender,
        transformHairColor: player.appearance?.hairColor,
        transformEyeColor: player.appearance?.eyeColor,
        transformBuild: player.appearance?.build,
        transformAge: player.appearance?.age,
        transformRace: player.appearance?.race,
        transformRaceFeatures: player.appearance?.raceFeatures,
        transformHeight: player.appearance?.height,
        transformMeasurements: player.appearance?.measurements,
        transformCupSize: player.appearance?.cupSize,
        transformOutfit: player.appearance?.outfit,
        transformLooks: player.appearance?.looks,
        transformWings: player.appearance?.silhouetteState?.hasWings,
        transformHorns: player.appearance?.silhouetteState?.hasHorns,
        transformPersonality: player.personality,
        transformBio: player.bio,
        transformCurrentSituation: player.currentSituation,
        transformGoal: player.goal,
        transformRelationships: player.relationships ? [...player.relationships] : [],
        transformIdentityPerception: 'koerpertausch'
      });
    }

    if (targetChar.abilities && Array.isArray(targetChar.abilities) && targetChar.abilities.length > 0) {
      targetChar.abilities.forEach((targetAb: any) => {
        if (!newAbilities.some(a => a.name === targetAb.name)) {
          newAbilities.push({
            ...targetAb,
            id: `swapped-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            source: `Körpertausch (${targetChar.name})`
          });
        }
      });
    }

    if (activeTransformation) {
      newAbilities = newAbilities.map(a => {
        if (a.id === activeTransformation.id) {
          return {
            ...a,
            transformIdentityPerception: 'koerpertausch' as const,
            transformSwappedCharacterId: targetChar.id,
            transformSwappedCharacterName: targetChar.name,
            transformSwappedCharacterSource: targetChar.source,
            transformSwappedOriginalData: backupOriginal,
            transformName: `Körpertausch: ${targetChar.name}`
          };
        }
        return a;
      });
    }

    const updatedPlayer: Character = {
      ...player,
      name: targetChar.name,
      role: targetChar.role || player.role,
      bio: targetChar.bio || player.bio,
      personality: targetChar.personality || player.personality,
      image: targetChar.image || player.image,
      appearance: updatedAppearance,
      powerName: targetChar.powerName || player.powerName,
      powerDescription: targetChar.powerDescription || player.powerDescription,
      powerSource: targetChar.powerSource || player.powerSource,
      powerCost: targetChar.powerCost || player.powerCost,
      skills: targetChar.skills || player.skills,
      techniques: targetChar.techniques || player.techniques,
      campaignPowerLevels: targetChar.campaignPowerLevels || player.campaignPowerLevels,
      relationships: targetChar.relationships || player.relationships,
      conducts: targetChar.conducts || player.conducts,
      relationship: targetChar.relationship || player.relationship,
      conduct: targetChar.conduct || player.conduct,
      abilities: newAbilities
    };

    onUpdatePlayerRef.current(updatedPlayer);
    syncReciprocalSwapToTargetChar(targetChar, true);
    setShowConfirmFullSwapModal(false);
    setSwapSuccessToast(`Vollständiger Körpertausch vollzogen! Du bist nun im Körper von "${targetChar.name}". Profil, Beziehungen & Kampffähigkeiten übertragen!`);
    setTimeout(() => setSwapSuccessToast(null), 5000);
  };

  const handleRevertBodySwap = () => {
    if (!onUpdatePlayerRef.current) return;
    if (currentSwappedChar) {
      syncReciprocalSwapToTargetChar(currentSwappedChar, false);
    }
    const original = activeTransformation?.transformSwappedOriginalData;

    if (original) {
      const restoredPlayer: Character = {
        ...player,
        name: original.name || player.name,
        rufName: original.rufName,
        nickname: original.nickname,
        role: original.role || player.role,
        bio: original.bio || player.bio,
        personality: original.personality || player.personality,
        appearance: original.appearance || player.appearance,
        powerName: original.powerName,
        powerDescription: original.powerDescription,
        powerSource: original.powerSource,
        powerCost: original.powerCost,
        skills: original.skills,
        techniques: original.techniques,
        campaignPowerLevels: original.campaignPowerLevels,
        relationships: original.relationships,
        conducts: original.conducts,
        relationship: original.relationship,
        conduct: original.conduct,
        abilities: (player.abilities || []).map(a => {
          if (a.id === activeTransformation?.id) {
            return {
              ...a,
              transformIdentityPerception: 'bekannt' as const,
              transformSwappedCharacterId: undefined,
              transformSwappedCharacterName: undefined,
              transformSwappedCharacterSource: undefined,
              transformSwappedOriginalData: undefined
            };
          }
          return a;
        })
      };
      onUpdatePlayerRef.current(restoredPlayer);
      setSwapSuccessToast('Körpertausch beendet! Ursprüngliches Profil, Beziehungen & Fähigkeiten wiederhergestellt.');
    } else {
      updateTransformationIdentity('bekannt');
      setSwapSuccessToast('Körpertausch-Modus deaktiviert.');
    }
    setTimeout(() => setSwapSuccessToast(null), 4500);
  };

  const handleIncreaseTransformationIntensity = (amount: number) => {
    if (readOnly || !onUpdatePlayerRef.current) return;
    const updated = incrementTransformationIntensity(playerRef.current, amount);
    onUpdatePlayerRef.current(updated);
  };

  const handleDecayTransformationIntensity = (amount: number = 20) => {
    if (readOnly || !onUpdatePlayerRef.current) return;
    const updated = decayTransformationIntensity(playerRef.current, amount);
    onUpdatePlayerRef.current(updated);
  };

  const handleSetTransformationIntensity = (val: number) => {
    if (readOnly || !onUpdatePlayerRef.current) return;
    const updated = updateTransformationIntensity(playerRef.current, val);
    onUpdatePlayerRef.current(updated);
  };


  const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
  const currentFat = state.bodyFat ?? resolvedBody.effectiveBodyFat ?? (resolvedApp.bodyFat ? parseInt(resolvedApp.bodyFat.replace(/\D/g, '')) : undefined) ?? (isFemale ? 24 : 16);
  const currentMuscle = state.muscleMass ?? resolvedBody.effectiveMuscleMass ?? (resolvedApp.muscleMass ? parseInt(resolvedApp.muscleMass.replace(/\D/g, '')) : undefined) ?? (isFemale ? 30 : 38);
  const currentWeight = state.weight ?? resolvedBody.effectiveWeightKg ?? (resolvedApp.weight ? parseInt(resolvedApp.weight.replace(/\D/g, '')) : undefined) ?? (isFemale ? 65 : 80);
  const pregMonth = state.pregnancyMonth || 0;
  
  const H = resolvedBody.effectiveHeightCm || parseInt(playerRef.current.appearance?.height || resolvedApp.height || '') || (isFemale ? 165 : 178);

  let computedWaist = 70;
  let computedHips = 90;
  let computedBust = 85;
  let computedCup = '-';

  if (isFemale) {
    // Waist
    const waistFatOffset = (currentFat - 12) * 1.05;
    const waistMuscleOffset = (currentMuscle - 22) * 0.15;
    const pregnancyWaist = pregMonth * 4.8;
    computedWaist = Math.round(Math.max(50, 58 + (H - 150) * 0.2 + waistFatOffset + waistMuscleOffset + pregnancyWaist));

    // Hips
    const hipsFatOffset = (currentFat - 12) * 1.15;
    const hipsMuscleOffset = (currentMuscle - 22) * 0.25;
    const pregnancyHips = pregMonth * 0.9;
    computedHips = Math.round(Math.max(60, 80 + (H - 150) * 0.4 + hipsFatOffset + hipsMuscleOffset + pregnancyHips));

    // Cup Size calculation based on custom selection, resolvedBody, or Body Fat and Pregnancy Month
    const cupNames = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let baseCup = 'B';
    if (state.customCupSize && cupNames.includes(state.customCupSize.toUpperCase())) {
      baseCup = state.customCupSize.toUpperCase();
    } else if (resolvedBody.effectiveCupSize && resolvedBody.effectiveCupSize !== '-' && cupNames.includes(resolvedBody.effectiveCupSize.toUpperCase())) {
      baseCup = resolvedBody.effectiveCupSize.toUpperCase();
    } else if (resolvedApp.cupSize && resolvedApp.cupSize !== '-' && cupNames.includes(resolvedApp.cupSize.toUpperCase())) {
      baseCup = resolvedApp.cupSize.toUpperCase();
    } else if (app.cupSize && app.cupSize !== '-' && cupNames.includes(app.cupSize.toUpperCase())) {
      baseCup = app.cupSize.toUpperCase();
    } else {
      let cupIdx = Math.max(0, Math.min(14, Math.floor((currentFat - 8) / 4.5)));
      baseCup = cupNames[cupIdx] || 'B';
    }

    if (pregMonth > 0 && cupNames.includes(baseCup)) {
      const pregCupSteps = Math.min(3, Math.ceil(pregMonth / 3));
      const baseIdx = cupNames.indexOf(baseCup);
      const newIdx = Math.min(cupNames.length - 1, baseIdx + pregCupSteps);
      computedCup = cupNames[newIdx];
    } else {
      computedCup = baseCup;
    }

    // Bust based on cup size, height, fat, and pregnancy breast expansion
    const cupAdd: Record<string, number> = {
      "AA": 72, "A": 78, "B": 84, "C": 89, "D": 94, "E": 98, "F": 102, "G": 106,
      "H": 110, "I": 114, "J": 118, "K": 122, "L": 126, "M": 130, "N": 134, "O": 138, "P": 142
    };
    const baseBustValue = cupAdd[computedCup] || 84;
    const heightBustFactor = (H - 165) * 0.35;
    const fatBustFactor = (currentFat - 24) * 0.25;
    const pregnancyBustFactor = pregMonth * 1.5;
    computedBust = Math.round(Math.max(65, baseBustValue + heightBustFactor + fatBustFactor + pregnancyBustFactor));
  } else {
    // Male
    const chestMuscleOffset = (currentMuscle - 32) * 1.35;
    const chestFatOffset = (currentFat - 12) * 0.8;
    computedBust = Math.round(Math.max(75, 90 + (H - 160) * 0.55 + chestMuscleOffset + chestFatOffset));

    const waistFatOffset = (currentFat - 12) * 1.45;
    const waistMuscleOffset = (currentMuscle - 32) * 0.2;
    computedWaist = Math.round(Math.max(65, 78 + (H - 160) * 0.4 + waistFatOffset + waistMuscleOffset));

    const hipsFatOffset = (currentFat - 12) * 0.75;
    const hipsMuscleOffset = (currentMuscle - 32) * 0.45;
    computedHips = Math.round(Math.max(70, 85 + (H - 160) * 0.35 + hipsFatOffset + hipsMuscleOffset));
    const cupNames = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    if (state.customCupSize && cupNames.includes(state.customCupSize.toUpperCase())) {
      computedCup = state.customCupSize.toUpperCase();
    } else if (resolvedBody.effectiveCupSize && resolvedBody.effectiveCupSize !== '-' && cupNames.includes(resolvedBody.effectiveCupSize.toUpperCase())) {
      computedCup = resolvedBody.effectiveCupSize.toUpperCase();
    } else if (resolvedApp.cupSize && resolvedApp.cupSize !== '-' && cupNames.includes(resolvedApp.cupSize.toUpperCase())) {
      computedCup = resolvedApp.cupSize.toUpperCase();
    } else if (app.cupSize && app.cupSize !== '-' && cupNames.includes(app.cupSize.toUpperCase())) {
      computedCup = app.cupSize.toUpperCase();
    } else {
      computedCup = '-';
    }
  }

  const hasLocalOverrides = state.weight !== undefined || state.bodyFat !== undefined || state.muscleMass !== undefined || state.customCupSize !== undefined;
  
  let computedMeasurements = '';
  if (!hasLocalOverrides && (resolvedBody.effectiveMeasurements || resolvedApp.measurements)) {
    computedMeasurements = (resolvedBody.effectiveMeasurements || resolvedApp.measurements || '').replace(/cm/gi, '').trim();
  } else {
    computedMeasurements = `${computedBust}-${computedWaist}-${computedHips}`;
  }

  let dynamicBuild = state.customBuild || resolvedBody.effectiveBuild || resolvedApp.build || 'Schlank';

  // Auto-sync internal simulation state (weight, bodyFat, muscleMass, build, cupSize, injuries, pregnancy, healing factor) safely live back to player/activeTransformation
  useEffect(() => {
    if (onUpdatePlayerRef.current && !readOnly) {
      const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
      const effWeight = state.weight !== undefined ? `${state.weight} kg` : resolvedApp.weight || `${resolvedBody.effectiveWeightKg} kg`;
      const effFat = state.bodyFat !== undefined ? `${state.bodyFat}%` : resolvedApp.bodyFat || `${resolvedBody.effectiveBodyFat}%`;
      const effMuscle = state.muscleMass !== undefined ? `${state.muscleMass}%` : resolvedApp.muscleMass || `${resolvedBody.effectiveMuscleMass}%`;
      const effBuild = state.customBuild || resolvedApp.build || 'Schlank';
      const effCup = state.customCupSize || resolvedApp.cupSize || '-';
      const effMeasurements = (state.weight !== undefined || state.bodyFat !== undefined || state.customCupSize !== undefined)
        ? `${computedBust}-${computedWaist}-${computedHips}`
        : resolvedApp.measurements || `${computedBust}-${computedWaist}-${computedHips}`;

      const baseApp: Appearance = playerRef.current.appearance || {
        hairColor: 'Schwarz',
        eyeColor: 'Braun',
        age: '20',
        build: 'Schlank',
        gender: 'Weiblich'
      };

      let updatedPlayer: Character;

      if (activeTransformation) {
        // Update transformation in abilities list
        const updatedAbilities = (playerRef.current.abilities || []).map(a => {
          if (a.id === activeTransformation.id) {
            return {
              ...a,
              transformBuild: effBuild,
              transformWeight: effWeight,
              transformBodyFat: effFat,
              transformMuscleMass: effMuscle,
              transformCupSize: effCup,
              transformMeasurements: effMeasurements,
            };
          }
          return a;
        });

        updatedPlayer = {
          ...playerRef.current,
          abilities: updatedAbilities,
          appearance: {
            ...baseApp,
            silhouetteState: state,
            pregnancyMonth: (state.isPregnant || pregMonth > 0) ? `${pregMonth || 1}` : undefined,
            isPregnant: state.isPregnant ?? (pregMonth > 0),
            fatherName: state.fatherName || undefined,
            healingFactor: state.healingFactor ?? 1,
          }
        };
      } else {
        // Update base player appearance
        const updatedAppearance: Appearance = {
          ...baseApp,
          build: effBuild,
          weight: effWeight,
          bodyFat: effFat,
          muscleMass: effMuscle,
          cupSize: effCup,
          measurements: effMeasurements,
          silhouetteState: state,
          pregnancyMonth: (state.isPregnant || pregMonth > 0) ? `${pregMonth || 1}` : undefined,
          isPregnant: state.isPregnant ?? (pregMonth > 0),
          fatherName: state.fatherName || undefined,
          healingFactor: state.healingFactor ?? 1,
        };

        if (baseApp.originalStandardAppearance) {
          updatedAppearance.originalStandardAppearance = {
            ...baseApp.originalStandardAppearance,
            build: effBuild,
            weight: effWeight,
            bodyFat: effFat,
            muscleMass: effMuscle,
            cupSize: effCup,
            measurements: effMeasurements,
          };
        }

        updatedPlayer = {
          ...playerRef.current,
          appearance: updatedAppearance
        };
      }

      const syncKey = JSON.stringify({
        app: updatedPlayer.appearance,
        transform: activeTransformation ? updatedPlayer.abilities?.find(a => a.id === activeTransformation.id) : null
      });

      if (lastSyncedAppearanceRef.current !== syncKey) {
        lastSyncedAppearanceRef.current = syncKey;
        onUpdatePlayerRef.current(updatedPlayer);
      }
    }
  }, [
    state.weight,
    state.bodyFat,
    state.muscleMass,
    state.customBuild,
    state.customCupSize,
    state.injuries,
    state.isPregnant,
    state.fatherName,
    state.healingFactor,
    state.isVirgin,
    state.hasChildren,
    state.childrenCount,
    pregMonth,
    computedBust,
    computedWaist,
    computedHips,
    computedCup,
    activeTransformation?.id,
    readOnly
  ]);

  // Derived state from props to prevent race conditions and infinite loops
  const [prevAppProps, setPrevAppProps] = useState({
    activeTransformationId,
    gender: resolvedApp.gender,
    weight: resolvedApp.weight,
    bodyFat: resolvedApp.bodyFat,
    muscleMass: resolvedApp.muscleMass,
    pregnancyMonth: resolvedApp.pregnancyMonth,
    healingFactor: (resolvedApp as any).healingFactor || (resolvedApp.silhouetteState as any)?.healingFactor,
    build: resolvedApp.build,
    cupSize: resolvedApp.cupSize,
    height: resolvedApp.height,
    measurements: resolvedApp.measurements,
    silhouetteState: resolvedApp.silhouetteState
  });

  const currentExtHealingFactor = (resolvedApp as any).healingFactor || (resolvedApp.silhouetteState as any)?.healingFactor;

  if (
    activeTransformationId !== prevAppProps.activeTransformationId ||
    resolvedApp.gender !== prevAppProps.gender ||
    resolvedApp.weight !== prevAppProps.weight ||
    resolvedApp.bodyFat !== prevAppProps.bodyFat ||
    resolvedApp.muscleMass !== prevAppProps.muscleMass ||
    resolvedApp.pregnancyMonth !== prevAppProps.pregnancyMonth ||
    currentExtHealingFactor !== prevAppProps.healingFactor ||
    resolvedApp.build !== prevAppProps.build ||
    resolvedApp.cupSize !== prevAppProps.cupSize ||
    resolvedApp.height !== prevAppProps.height ||
    resolvedApp.measurements !== prevAppProps.measurements ||
    resolvedApp.silhouetteState !== prevAppProps.silhouetteState
  ) {
    const isFormSwitched = activeTransformationId !== prevAppProps.activeTransformationId;

    setPrevAppProps({
      activeTransformationId,
      gender: resolvedApp.gender,
      weight: resolvedApp.weight,
      bodyFat: resolvedApp.bodyFat,
      muscleMass: resolvedApp.muscleMass,
      pregnancyMonth: resolvedApp.pregnancyMonth,
      healingFactor: currentExtHealingFactor,
      build: resolvedApp.build,
      cupSize: resolvedApp.cupSize,
      height: resolvedApp.height,
      measurements: resolvedApp.measurements,
      silhouetteState: resolvedApp.silhouetteState
    });

    setState(prev => {
      // Parse pregnancy month
      let extPregnancy = prev.pregnancyMonth;
      if (resolvedApp.pregnancyMonth !== undefined) {
        const pVal = parseInt(resolvedApp.pregnancyMonth);
        if (!isNaN(pVal)) extPregnancy = pVal;
      } else if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).pregnancyMonth !== undefined) {
        extPregnancy = (resolvedApp.silhouetteState as any).pregnancyMonth;
      }

      // Parse healing factor
      let extHealing = prev.healingFactor ?? 1;
      if (currentExtHealingFactor !== undefined) {
        const hVal = parseInt(currentExtHealingFactor);
        if (!isNaN(hVal)) extHealing = hVal;
      }

      // If they switched form, or edited measurements/height/gender/weight/fat/muscle/build/cup from the outside,
      // reset local overrides to force synchronization with props.
      if (
        isFormSwitched ||
        resolvedApp.gender !== prevAppProps.gender ||
        resolvedApp.height !== prevAppProps.height ||
        resolvedApp.measurements !== prevAppProps.measurements ||
        resolvedApp.weight !== prevAppProps.weight ||
        resolvedApp.bodyFat !== prevAppProps.bodyFat ||
        resolvedApp.muscleMass !== prevAppProps.muscleMass ||
        resolvedApp.build !== prevAppProps.build ||
        resolvedApp.cupSize !== prevAppProps.cupSize
      ) {
        let extVirgin = prev.isVirgin;
        if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).isVirgin !== undefined) {
          extVirgin = !!(resolvedApp.silhouetteState as any).isVirgin;
        }
        let extHasChildren = prev.hasChildren;
        if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).hasChildren !== undefined) {
          extHasChildren = !!(resolvedApp.silhouetteState as any).hasChildren;
        }
        let extChildrenCount = prev.childrenCount;
        if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).childrenCount !== undefined) {
          extChildrenCount = (resolvedApp.silhouetteState as any).childrenCount;
        }

        return {
          ...prev,
          weight: undefined,
          bodyFat: undefined,
          muscleMass: undefined,
          customBuild: undefined,
          customCupSize: undefined,
          pregnancyMonth: extPregnancy ?? 0,
          healingFactor: extHealing,
          isVirgin: extVirgin,
          hasChildren: extHasChildren,
          childrenCount: extChildrenCount,
        };
      }

      // Match props to local overrides. If props changed from somewhere else (e.g., Profile Editor),
      // we reset our local overrides to undefined so they smoothly fallback to the new props.
      const propWeight = resolvedApp.weight ? parseInt(resolvedApp.weight.replace(/\D/g, '')) : undefined;
      const nextWeight = (prev.weight !== undefined && propWeight === prev.weight) ? prev.weight : undefined;

      const propFat = resolvedApp.bodyFat ? parseInt(resolvedApp.bodyFat.replace(/\D/g, '')) : undefined;
      const nextFat = (prev.bodyFat !== undefined && propFat === prev.bodyFat) ? prev.bodyFat : undefined;

      const propMuscle = resolvedApp.muscleMass ? parseInt(resolvedApp.muscleMass.replace(/\D/g, '')) : undefined;
      const nextMuscle = (prev.muscleMass !== undefined && propMuscle === prev.muscleMass) ? prev.muscleMass : undefined;

      const propBuild = resolvedApp.build && resolvedApp.build !== '-' ? resolvedApp.build : undefined;
      const nextBuild = (prev.customBuild !== undefined && propBuild === prev.customBuild) ? prev.customBuild : undefined;

      const propCup = resolvedApp.cupSize && resolvedApp.cupSize !== '-' ? resolvedApp.cupSize : undefined;
      const nextCup = (prev.customCupSize !== undefined && propCup === prev.customCupSize) ? prev.customCupSize : undefined;

      let extVirgin = prev.isVirgin;
      if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).isVirgin !== undefined) {
        extVirgin = !!(resolvedApp.silhouetteState as any).isVirgin;
      }
      let extHasChildren = prev.hasChildren;
      if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).hasChildren !== undefined) {
        extHasChildren = !!(resolvedApp.silhouetteState as any).hasChildren;
      }
      let extChildrenCount = prev.childrenCount;
      if (resolvedApp.silhouetteState && (resolvedApp.silhouetteState as any).childrenCount !== undefined) {
        extChildrenCount = (resolvedApp.silhouetteState as any).childrenCount;
      }

      return {
        ...prev,
        weight: nextWeight,
        bodyFat: nextFat,
        muscleMass: nextMuscle,
        pregnancyMonth: extPregnancy ?? 0,
        healingFactor: extHealing,
        customBuild: nextBuild,
        customCupSize: nextCup,
        isVirgin: extVirgin,
        hasChildren: extHasChildren,
        childrenCount: extChildrenCount,
      };
    });
  }

  // Synchronize state.form dynamically with activeTransformation and raceFeatures!
  useEffect(() => {
    let targetForm: 'human' | 'child' | 'hybrid' | 'beast' = 'human';

    if (activeTransformation) {
      const tName = (activeTransformation.name || '').toLowerCase();
      const tRace = (activeTransformation.transformRace || '').toLowerCase();
      const tFeatures = (activeTransformation.transformRaceFeatures || '').toLowerCase();
      const tDesc = (activeTransformation.description || '').toLowerCase();

      if (tName.includes('tier') || tName.includes('beast') || tName.includes('bestie') || tRace.includes('tier') || tRace.includes('bestie') || tDesc.includes('tierform') || tDesc.includes('bestienform')) {
        targetForm = 'beast';
      } else if (tName.includes('hybrid') || tRace.includes('hybrid') || tFeatures.includes('hybrid') || tFeatures.includes('ohren') || tFeatures.includes('schwanz') || tFeatures.includes('schweif')) {
        targetForm = 'hybrid';
      } else if (tName.includes('kind') || tName.includes('child') || activeTransformation.transformAge?.toLowerCase().includes('kind')) {
        targetForm = 'child';
      } else {
        targetForm = 'human';
      }
    } else {
      const baseRace = (app.race || '').toLowerCase();
      const baseFeatures = (app.raceFeatures || '').toLowerCase();
      const baseAge = (app.age || '').toLowerCase();

      const isBaseChild = baseAge.includes('kind') || baseAge.includes('baby') || baseAge.includes('schüler') || (parseInt(baseAge) > 0 && parseInt(baseAge) < 12);
      
      if (state.isVampire && state.vampireBlood <= 20) {
        targetForm = 'child';
      } else if (isBaseChild) {
        targetForm = 'child';
      } else {
        const featuresLower = baseFeatures.toLowerCase();
        const hasAnimalFeatures = featuresLower.includes('ohren') || 
                                  featuresLower.includes('schwanz') || 
                                  featuresLower.includes('schweif') || 
                                  featuresLower.includes('tail') || 
                                  featuresLower.includes('ears') || 
                                  featuresLower.includes('katzen') || 
                                  featuresLower.includes('fuchs') || 
                                  featuresLower.includes('wolf') || 
                                  featuresLower.includes('hybrid');
        
        const isBeastRace = baseRace.includes('bestie') || baseRace.includes('tier') || featuresLower.includes('tierform') || featuresLower.includes('bestienform');

        if (isBeastRace) {
          targetForm = 'beast';
        } else if (hasAnimalFeatures) {
          targetForm = 'hybrid';
        } else {
          targetForm = 'human';
        }
      }
    }

    if (state.form !== targetForm) {
      setState(prev => ({ ...prev, form: targetForm }));
    }
  }, [
    activeTransformationId,
    resolvedApp.raceFeatures,
    resolvedApp.race,
    resolvedApp.age,
    state.isVampire,
    state.vampireBlood,
    state.form,
    activeTransformation,
    app.race,
    app.raceFeatures,
    app.age
  ]);

  const toggleInjury = (part: string, injury: string) => {
    if (readOnly) return;
    setState(prev => {
      const current = prev.injuries[part] || [];
      const updated = current.includes(injury)
        ? current.filter(i => i !== injury)
        : [...current, injury];
      return {
        ...prev,
        injuries: {
          ...prev.injuries,
          [part]: updated
        }
      };
    });
  };

  const addCustomInjury = (part: string) => {
    if (!newInjuryName.trim() || readOnly) return;
    setState(prev => {
      const current = prev.injuries[part] || [];
      if (current.includes(newInjuryName.trim())) return prev;
      return {
        ...prev,
        injuries: {
          ...prev.injuries,
          [part]: [...current, newInjuryName.trim()]
        }
      };
    });
    setNewInjuryName('');
  };

  const clearInjuriesOnPart = (part: string) => {
    if (readOnly) return;
    setState(prev => ({
      ...prev,
      injuries: {
        ...prev.injuries,
        [part]: []
      }
    }));
  };

  const clearAllInjuries = () => {
    if (readOnly) return;
    setState(prev => ({
      ...prev,
      injuries: {
        head: [],
        chest: [],
        l_arm: [],
        r_arm: [],
        l_leg: [],
        r_leg: []
      }
    }));
  };

  const BUILD_PRESETS: Record<string, {
    weightF: number; fatF: number; muscleF: number; cupF: string;
    weightM: number; fatM: number; muscleM: number;
    icon: string;
  }> = {
    'Zierlich': { weightF: 48, fatF: 17, muscleF: 22, cupF: 'A', weightM: 58, fatM: 10, muscleM: 28, icon: 'fa-feather-pointed text-pink-400' },
    'Schlank': { weightF: 56, fatF: 20, muscleF: 26, cupF: 'B', weightM: 70, fatM: 13, muscleM: 34, icon: 'fa-user text-sky-400' },
    'Normal': { weightF: 62, fatF: 24, muscleF: 30, cupF: 'B', weightM: 78, fatM: 16, muscleM: 38, icon: 'fa-user-check text-indigo-400' },
    'Sportlich': { weightF: 64, fatF: 18, muscleF: 36, cupF: 'C', weightM: 80, fatM: 11, muscleM: 44, icon: 'fa-person-running text-emerald-400' },
    'Kurvig': { weightF: 68, fatF: 28, muscleF: 28, cupF: 'D', weightM: 82, fatM: 18, muscleM: 38, icon: 'fa-hourglass-half text-amber-400' },
    'Muskulös': { weightF: 72, fatF: 14, muscleF: 44, cupF: 'B', weightM: 90, fatM: 9, muscleM: 52, icon: 'fa-dumbbell text-red-400' },
    'Mollig': { weightF: 78, fatF: 34, muscleF: 26, cupF: 'E', weightM: 92, fatM: 25, muscleM: 32, icon: 'fa-heart text-pink-400' },
    'Stämmig': { weightF: 86, fatF: 38, muscleF: 32, cupF: 'F', weightM: 102, fatM: 30, muscleM: 40, icon: 'fa-shield-halved text-purple-400' },
    'Hager': { weightF: 44, fatF: 11, muscleF: 20, cupF: 'AA', weightM: 62, fatM: 7, muscleM: 32, icon: 'fa-wheat-awn text-orange-400' },
  };

  const applyBuildPreset = (buildName: string) => {
    if (readOnly) return;
    const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
    const preset = BUILD_PRESETS[buildName] || BUILD_PRESETS['Normal'];

    const newWeight = isFemale ? preset.weightF : preset.weightM;
    const newFat = isFemale ? preset.fatF : preset.fatM;
    const newMuscle = isFemale ? preset.muscleF : preset.muscleM;
    const newCup = isFemale ? preset.cupF : '-';

    setState(prev => ({
      ...prev,
      weight: newWeight,
      bodyFat: newFat,
      muscleMass: newMuscle,
      customBuild: buildName,
      customCupSize: isFemale ? newCup : undefined
    }));
  };

  const updateCupSize = (newCup: string) => {
    if (readOnly) return;
    setState(prev => {
      const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
      if (!isFemale) return { ...prev, customCupSize: undefined };

      const cupList = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
      const targetIdx = cupList.indexOf(newCup.toUpperCase());
      if (targetIdx === -1) return prev;

      const targetBaseFat = Math.round(12 + targetIdx * 3.5);
      const currentF = prev.bodyFat ?? 24;
      const currentW = prev.weight ?? 65;

      let newFat = currentF;
      let newWeight = currentW;

      if (targetIdx >= 3) { // C cup or larger
        if (currentF < targetBaseFat - 6) {
          newFat = Math.min(50, targetBaseFat - 2);
          const fatDiff = newFat - currentF;
          newWeight = Math.round(currentW + fatDiff * 0.8);
        }
      } else { // AA, A, B
        if (currentF > targetBaseFat + 10) {
          newFat = Math.max(8, targetBaseFat + 4);
          const fatDiff = newFat - currentF;
          newWeight = Math.round(currentW + fatDiff * 0.8);
        }
      }

      let newBuild = prev.customBuild;
      if (['D', 'E', 'F', 'G', 'H', 'I', 'J'].includes(newCup.toUpperCase()) && (!newBuild || newBuild === 'Schlank' || newBuild === 'Normal')) {
        newBuild = 'Kurvig';
      } else if (['AA', 'A'].includes(newCup.toUpperCase()) && (!newBuild || newBuild === 'Kurvig' || newBuild === 'Mollig')) {
        newBuild = 'Schlank';
      }

      return {
        ...prev,
        bodyFat: newFat,
        weight: newWeight,
        customCupSize: newCup.toUpperCase(),
        customBuild: newBuild
      };
    });
  };

  const updateWeight = (weight: number) => {
    setState(prev => {
      const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
      const oldWeight = prev.weight ?? (isFemale ? 65 : 80);
      const diff = weight - oldWeight;
      const currentFat = prev.bodyFat ?? (isFemale ? 24 : 16);
      const currentMuscle = prev.muscleMass ?? (isFemale ? 30 : 38);
      
      const fatChange = diff > 0 ? (diff * 0.4) : (diff * 0.5);
      const muscleChange = diff > 0 ? (diff * 0.2) : (diff * 0.15);
      
      const newFat = Math.round(Math.max(3, Math.min(60, currentFat + fatChange)));
      const newMuscle = Math.round(Math.max(10, Math.min(70, currentMuscle + muscleChange)));
      
      return { ...prev, weight, bodyFat: newFat, muscleMass: newMuscle };
    });
  };

  const updateFat = (fat: number) => {
    setState(prev => {
      const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
      const oldFat = prev.bodyFat ?? (isFemale ? 24 : 16);
      const diff = fat - oldFat;
      const weightFactor = isFemale ? 0.9 : 1.2;
      const newWeight = Math.round(Math.max(30, Math.min(250, (prev.weight ?? (isFemale ? 65 : 80)) + diff * weightFactor)));
      return { ...prev, bodyFat: fat, weight: newWeight };
    });
  };

  const updateMuscle = (muscle: number) => {
    setState(prev => {
      const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
      const oldMuscle = prev.muscleMass ?? (isFemale ? 30 : 38);
      const diff = muscle - oldMuscle;
      const newWeight = Math.round(Math.max(30, Math.min(250, (prev.weight ?? (isFemale ? 65 : 80)) + diff * 1.1)));
      return { ...prev, muscleMass: muscle, weight: newWeight };
    });
  };

  const updatePregnancyMonth = (newMonth: number) => {
    setState(prev => {
      const oldMonth = prev.pregnancyMonth || 0;
      if (newMonth === oldMonth) return prev;

      const isFemale = (resolvedBody.effectiveGender || resolvedApp.gender || activeTransformation?.transformGender || initialGender).toLowerCase() === 'weiblich';
      const baseNonPregWeight = prev.weight !== undefined
        ? Math.max(30, prev.weight - Math.round(oldMonth * 1.4))
        : (resolvedBody.effectiveWeightKg - Math.round(oldMonth * 1.4));

      const baseNonPregFat = prev.bodyFat !== undefined
        ? Math.max(3, prev.bodyFat - Math.round(oldMonth * 0.6))
        : (resolvedBody.effectiveBodyFat - Math.round(oldMonth * 0.6));

      const newWeight = Math.max(30, Math.min(250, baseNonPregWeight + Math.round(newMonth * 1.4)));
      const newFat = Math.max(3, Math.min(60, baseNonPregFat + Math.round(newMonth * 0.6)));

      const defaultDays = Math.max(0, 270 - (newMonth - 1) * 30);

      return {
        ...prev,
        pregnancyMonth: newMonth,
        weight: newWeight,
        bodyFat: newFat,
        pregnancyDaysRemaining: defaultDays
      };
    });
  };

  const partLabels: Record<string, string> = {
    head: 'Kopf',
    chest: 'Torso / Oberkörper',
    l_arm: 'Linker Arm',
    r_arm: 'Rechter Arm',
    l_leg: 'Linkes Bein',
    r_leg: 'Rechtes Bein'
  };

  const isPartInjured = (part: string) => {
    return (state.injuries[part] || []).length > 0;
  };

  const toggleWings = () => {
    if (readOnly) return;
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformWings: !a.transformWings } 
          : a
      );
      if (onUpdatePlayerRef.current) {
        onUpdatePlayer({
          ...player,
          appearance: {
            ...player.appearance,
            // Trigger a shallow merge to make sure React state updates
            activeTransformationId: activeTransformationId
          },
          abilities: updatedAbilities
        });
      }
    } else {
      setState(prev => ({ ...prev, hasWings: !prev.hasWings }));
    }
  };

  const toggleHorns = () => {
    if (readOnly) return;
    if (activeTransformation) {
      const updatedAbilities = (player.abilities || []).map(a => 
        a.id === activeTransformation.id 
          ? { ...a, transformHorns: !a.transformHorns } 
          : a
      );
      if (onUpdatePlayerRef.current) {
        onUpdatePlayer({
          ...player,
          appearance: {
            ...player.appearance,
            // Trigger a shallow merge to make sure React state updates
            activeTransformationId: activeTransformationId
          },
          abilities: updatedAbilities
        });
      }
    } else {
      setState(prev => ({ ...prev, hasHorns: !prev.hasHorns }));
    }
  };

  // Render SVG Body Silhouette depending on Gender and Form
  const displayForm = (state.isVampire && state.vampireBlood <= 20) ? 'child' : state.form;

  // Render dynamic belly enlargement for pregnancy
  const pregFactor = isFemale ? (state.isPregnant === false ? 0 : (state.pregnancyMonth || 0)) : 0;

  // --- DYNAMIC SILHOUETTE MORPHING SYSTEM ---
  const appBuild = (resolvedBody.effectiveBuild || resolvedApp.build || '').toLowerCase();
  const appAge = (resolvedApp.age || '').toLowerCase();
  const appGender = (resolvedBody.effectiveGender || resolvedApp.gender || '').toLowerCase();
  const appRace = (resolvedBody.effectiveRace || resolvedApp.race || '').toLowerCase();
  const appHeight = (String(resolvedBody.effectiveHeightCm) || resolvedApp.height || '').toLowerCase();
  const appMeasurements = (resolvedBody.effectiveMeasurements || resolvedApp.measurements || '').toLowerCase();
  const appCupSize = (resolvedBody.effectiveCupSize || resolvedApp.cupSize || '-').toUpperCase();

  const baseWeight = isFemale ? 60 : 75;
  const baseFat = isFemale ? 22 : 14;
  const baseMuscle = isFemale ? 30 : 38;

  const weightRatio = currentWeight / baseWeight;
  const fatDeviation = (currentFat - baseFat) / 100;
  const muscleDeviation = (currentMuscle - baseMuscle) / 100;

  let torsoScaleX = Math.sqrt(weightRatio) + fatDeviation * 1.5 + muscleDeviation * 0.8;
  let torsoScaleY = 1.0 - Math.max(0, fatDeviation) * 0.12;
  let armScaleX = Math.sqrt(weightRatio) + fatDeviation * 0.9 + muscleDeviation * 1.4;
  let armScaleY = 1.0 + muscleDeviation * 0.12;
  let legScaleX = Math.sqrt(weightRatio) + fatDeviation * 1.1 + muscleDeviation * 0.9;
  let legScaleY = 1.0;
  let headScaleX = 1.0;
  let headScaleY = 1.0;

  // Clamp the continuous scales to realistic ranges so SVG doesn't break:
  torsoScaleX = Math.max(0.72, Math.min(1.85, torsoScaleX));
  torsoScaleY = Math.max(0.78, Math.min(1.25, torsoScaleY));
  armScaleX = Math.max(0.72, Math.min(1.75, armScaleX));
  armScaleY = Math.max(0.8, Math.min(1.3, armScaleY));
  legScaleX = Math.max(0.72, Math.min(1.75, legScaleX));
  legScaleY = Math.max(0.8, Math.min(1.3, legScaleY));

  // 2. Age (Alter) modifiers
  const isChild = displayForm === 'child' || appAge.includes('kind') || appAge.includes('baby') || appAge.includes('schüler') || (parseInt(appAge) > 0 && parseInt(appAge) < 12);
  const isTeenager = appAge.includes('teenager') || appAge.includes('teen') || appAge.includes('jugendlich') || (parseInt(appAge) >= 12 && parseInt(appAge) < 20);

  if (isChild) {
    headScaleX *= 1.18;
    headScaleY *= 1.18;
    torsoScaleY *= 0.78;
    armScaleY *= 0.8;
    legScaleY *= 0.75;
  } else if (isTeenager) {
    headScaleX *= 1.05;
    headScaleY *= 1.05;
    torsoScaleY *= 0.90;
    armScaleY *= 0.92;
    legScaleY *= 0.90;
    torsoScaleX *= 0.95;
  }

  // 3. Height (Größe) modifiers
  let parsedHeight = 175; // default in cm
  const heightMatch = appHeight.match(/(\d+)/);
  if (heightMatch) {
    parsedHeight = parseInt(heightMatch[1]);
  }

  if (parsedHeight < 140) {
    // Short race/build (e.g. Dwarf, Hobbit)
    torsoScaleY *= 0.82;
    legScaleY *= 0.72;
    armScaleY *= 0.78;
    if (appRace.includes('zwerg') || appRace.includes('dwarf')) {
      torsoScaleX *= 1.35;
      armScaleX *= 1.25;
      legScaleX *= 1.25;
    }
  } else if (parsedHeight > 200) {
    // Tall race/build (e.g. Giant, Riese)
    torsoScaleY *= 1.18;
    legScaleY *= 1.3;
    armScaleY *= 1.25;
    if (appRace.includes('riese') || appRace.includes('giant')) {
      torsoScaleX *= 1.4;
      armScaleX *= 1.35;
      legScaleX *= 1.35;
      headScaleX *= 1.12;
      headScaleY *= 1.12;
    }
  }

  // 4. Gender & Cup Size modifiers
  if (isFemale) {
    if (['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'].includes(appCupSize)) {
      torsoScaleX *= 1.08; // slightly wider bust
    } else if (['AA', 'A'].includes(appCupSize)) {
      torsoScaleX *= 0.94;
    }
  }

  // 5. Measurements (Bust-Waist-Hips)
  const measurementsMatch = appMeasurements.match(/(\d+)-(\d+)-(\d+)/);
  if (measurementsMatch) {
    const bust = parseInt(measurementsMatch[1]);
    const waist = parseInt(measurementsMatch[2]);
    const hips = parseInt(measurementsMatch[3]);

    const bustFactor = bust / 90;
    const waistFactor = waist / 60;
    const hipsFactor = hips / 90;

    // Apply scaling factor based on measurements deviation from average
    const measurementFactor = (bustFactor + waistFactor + hipsFactor) / 3;
    torsoScaleX *= Math.max(0.75, Math.min(1.5, measurementFactor));
  }

  // --- SKELETAL KINEMATICS PARENTING SYSTEM ---
  // Calculates joints translation based on parent (torso) dimensions so body parts stay fully attached
  const torsoCenterY = 54;
  const torsoCenterX = 50;

  // Vertical shifts of joints
  const armTranslateY = (torsoCenterY - 20 * torsoScaleY) - 34; // shoulder line originally at y = 34
  const legTranslateY = (torsoCenterY + 20 * torsoScaleY) - 74; // hip line originally at y = 74
  const headTranslateY = (torsoCenterY - 26 * torsoScaleY) - 28; // neck joint originally at y = 28

  // Horizontal shifts of joints due to torso width scale
  const leftArmTranslateX = (torsoCenterX - 14 * torsoScaleX) - 36;   // left shoulder originally at x = 36
  const rightArmTranslateX = (torsoCenterX + 14 * torsoScaleX) - 64;  // right shoulder originally at x = 64
  const leftLegTranslateX = (torsoCenterX - 6 * torsoScaleX) - 44;     // left hip originally at x = 44
  const rightLegTranslateX = (torsoCenterX + 6 * torsoScaleX) - 56;    // right hip originally at x = 56

  return (
    <div className={`flex flex-col gap-6 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md ${className}`}>
      
      {/* TOP SECTION: Silhouette (Left) & Status-Zusammenfassung (Right) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* 1. VISUAL SILHOUETTE VIEWER */}
        <div className="flex flex-col items-center shrink-0 mx-auto lg:mx-0 w-full lg:w-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
            <i className="fa-solid fa-child-body text-indigo-400"></i>
            Physische Gestalt-Silhouette
          </span>

        {/* Dynamic SVG Canvas */}
        <div className="relative w-full aspect-[2/3] max-w-[240px] bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-inner group">
          
          {/* Diagnostic Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-0.5 text-[9px] font-bold text-indigo-400 font-mono select-none pointer-events-none bg-slate-950/85 px-2 py-1 rounded border border-slate-800/80 z-10">
            <div>GESTALT: {activeTransformation ? activeTransformation.name : 'STANDARD'}</div>
            {isFemale && pregFactor > 0 && <div>SCHWANGER: {pregFactor}. Mon.</div>}
            {state.isVampire && <div>BLUT: {state.vampireBlood}%</div>}
          </div>

          <svg 
            viewBox="0 0 100 160" 
            className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.15)] select-none"
          >
            {/* SVG Gradients for Wound highlights and skin tones */}
            <defs>
              <radialGradient id="injury-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0.3" />
              </radialGradient>
              <linearGradient id="healthy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="healthy-grad-hover" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#312e81" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.95" />
              </linearGradient>
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* A. BACKGROUND / BEAST FEATURES */}
            {/* 1. Tail (Schweif) for Hybrid or Beast form */}
            {(displayForm === 'hybrid' || displayForm === 'beast') && (
              <path 
                d={displayForm === 'beast' 
                  ? "M 75 80 Q 85 70 95 80 Q 95 90 85 95 Q 80 90 82 85 Q 85 80 75 82" 
                  : "M 45 95 Q 20 110 15 90 Q 10 70 25 60 Q 30 70 28 85 Q 25 95 40 98"
                } 
                fill="#312e81" 
                stroke="#6366f1" 
                strokeWidth="1"
                className="opacity-70 animate-pulse"
                transform={displayForm === 'beast' ? '' : `translate(${leftLegTranslateX}, ${legTranslateY})`}
              />
            )}

            {/* 2. Wings (Flügel) */}
            {state.hasWings && (
              <g className="opacity-40" stroke="#f59e0b" strokeWidth="1" fill="none" transform={`translate(50, 48) scale(${torsoScaleX}, ${torsoScaleY}) translate(-50, -48)`}>
                {/* Left Wing */}
                <path d="M 38 48 Q 15 25 5 45 Q 15 55 25 50 Q 12 60 8 70 Q 20 65 34 52" fill="#78350f" fillOpacity="0.3" />
                {/* Right Wing */}
                <path d="M 62 48 Q 85 25 95 45 Q 85 55 75 50 Q 88 60 92 70 Q 80 65 66 52" fill="#78350f" fillOpacity="0.3" />
              </g>
            )}

            {/* B. MAIN INTERACTIVE BODY PARTS */}

            {/* 1. KOPF (HEAD) & Extras (Horns, Ears) */}
            <g transform={displayForm === 'beast' 
              ? `translate(25, ${65 + headTranslateY}) scale(${headScaleX}, ${headScaleY}) translate(-25, -65)`
              : `translate(50, ${20 + headTranslateY}) scale(${headScaleX}, ${headScaleY}) translate(-50, -20)`
            }>
              {/* Animal Ears if Hybrid */}
              {displayForm === 'hybrid' && (
                <g fill="#4338ca" stroke="#6366f1" strokeWidth="1">
                  {/* Left Ear */}
                  <polygon points="40,15 42,5 47,14" />
                  {/* Right Ear */}
                  <polygon points="60,15 58,5 53,14" />
                </g>
              )}

              {/* Horns if specified */}
              {state.hasHorns && (
                <g fill="none" stroke="#ef4444" strokeWidth="1.5">
                  {displayForm === 'beast' ? (
                    <>
                      {/* Beast Horns */}
                      <path d="M 18 60 Q 15 50 12 55" />
                      <path d="M 28 60 Q 33 50 35 55" />
                    </>
                  ) : (
                    <>
                      {/* Left Horn */}
                      <path d="M 43 15 Q 38 5 35 8" />
                      {/* Right Horn */}
                      <path d="M 57 15 Q 62 5 65 8" />
                    </>
                  )}
                </g>
              )}

              {/* Clickable Head Path */}
              {displayForm === 'beast' ? (
                <path 
                  d="M 15 70 Q 25 55 35 60 L 35 75 Q 25 80 15 70 Z"
                  fill={isPartInjured('head') ? 'url(#injury-glow)' : selectedPart === 'head' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                  stroke={isPartInjured('head') ? '#ef4444' : selectedPart === 'head' ? '#818cf8' : '#334155'}
                  strokeWidth="1.5"
                  onClick={() => !readOnly && setSelectedPart('head')}
                  className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                />
              ) : (
                <circle 
                  cx="50" 
                  cy="20" 
                  r="9"
                  fill={isPartInjured('head') ? 'url(#injury-glow)' : selectedPart === 'head' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                  stroke={isPartInjured('head') ? '#ef4444' : selectedPart === 'head' ? '#818cf8' : '#334155'}
                  strokeWidth="1.5"
                  onClick={() => !readOnly && setSelectedPart('head')}
                  className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                />
              )}
              {isPartInjured('head') && (
                displayForm === 'beast' 
                  ? <path d="M 15 70 Q 25 55 35 60 L 35 75 Q 25 80 15 70 Z" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping opacity-60 pointer-events-none" />
                  : <circle cx="50" cy="20" r="11" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping opacity-60 pointer-events-none" />
              )}
            </g>

            {/* Neck (Hals) */}
            {displayForm === 'beast' ? (
              <path d="M 32 70 L 40 85 L 35 90 L 28 75 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" transform={`translate(0, ${headTranslateY})`} />
            ) : (
              <rect x="48" y="28" width="4" height="6" fill="#1e293b" stroke="#334155" strokeWidth="1" transform={`translate(0, ${headTranslateY})`} />
            )}

            {/* 2. TORSO / OBERKÖRPER (CHEST / BELLY) */}
            {/* We support dynamic shape adjustments (Female curves, Male broadness, Child tiny, Beast, and Pregnant bulging!) */}
            <g transform={displayForm === 'beast' 
              ? `translate(55, 92.5) scale(${torsoScaleX}, ${torsoScaleY}) translate(-55, -92.5)`
              : `translate(${torsoCenterX}, ${torsoCenterY}) scale(${torsoScaleX}, ${torsoScaleY}) translate(-${torsoCenterX}, -${torsoCenterY})`
            }>
              {(() => {
                let torsoPath = "";
                
                if (displayForm === 'beast') {
                  // Quadruped/Beast Torso path (horizontal)
                  torsoPath = "M 35 80 Q 55 75 75 80 Q 80 100 75 105 Q 55 110 35 100 Z";
                } else if (displayForm === 'child') {
                  // Child torso: wider waist, shorter
                  torsoPath = "M 39 34 L 61 34 L 59 70 L 41 70 Z";
                } else {
                  // Human torso
                  if (isFemale) {
                    // Female silhouette: slender chest, defined narrow waist, expanding hips
                    // Let's morph the belly based on pregFactor and fatDeviation / muscleDeviation!
                    const fatOffset = Math.max(0, fatDeviation) * 16;
                    const shoulderOffset = Math.max(0, muscleDeviation) * 5;
                    
                    const leftShoulderF = 37 - shoulderOffset;
                    const rightShoulderF = 63 + shoulderOffset;
                    
                    const leftBellyX = 38 - fatOffset - (pregFactor * 0.8);
                    const rightBellyX = 62 + fatOffset + (pregFactor * 0.8);
                    const leftWaistX = 41 - fatOffset * 0.6 - (pregFactor * 0.3);
                    const rightWaistX = 59 + fatOffset * 0.6 + (pregFactor * 0.3);

                    torsoPath = `M ${leftShoulderF} 34 L ${rightShoulderF} 34 Q ${rightShoulderF - 2} 46 ${rightWaistX} 52 Q ${rightBellyX} 64 61 74 L 39 74 Q ${leftBellyX} 64 ${leftWaistX} 52 Q ${leftShoulderF + 2} 46 ${leftShoulderF} 34 Z`;
                  } else {
                    // Male silhouette: broad chest, V-shape, narrower hips
                    // Let's morph the torso based on fatDeviation / muscleDeviation!
                    const fatOffset = Math.max(0, fatDeviation) * 18;
                    const chestOffset = Math.max(0, muscleDeviation) * 8;
                    
                    const leftChestM = 35 - chestOffset;
                    const rightChestM = 65 + chestOffset;
                    const leftWaistM = 42 - fatOffset;
                    const rightWaistM = 58 + fatOffset;
                    const leftHipM = 44 - fatOffset * 0.5;
                    const rightHipM = 56 + fatOffset * 0.5;
                    
                    torsoPath = `M ${leftChestM} 34 L ${rightChestM} 34 L ${rightWaistM} 54 L ${rightHipM} 74 L ${leftHipM} 74 L ${leftWaistM} 54 Z`;
                  }
                }

                return (
                  <path 
                    d={torsoPath}
                    fill={isPartInjured('chest') ? 'url(#injury-glow)' : selectedPart === 'chest' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                    stroke={isPartInjured('chest') ? '#ef4444' : selectedPart === 'chest' ? '#818cf8' : '#334155'}
                    strokeWidth="1.5"
                    onClick={() => !readOnly && setSelectedPart('chest')}
                    className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                  />
                );
              })()}
              
              {/* Dynamic breast contour outlines for female characters responsive to cup size */}
              {(() => {
                if (!isFemale || displayForm === 'child' || displayForm === 'beast') return null;

                const cup = appCupSize.trim();
                let breastFactor = 0;
                if (cup === 'A') breastFactor = 0.25;
                else if (cup === 'B') breastFactor = 0.55;
                else if (cup === 'C') breastFactor = 0.9;
                else if (cup === 'D') breastFactor = 1.3;
                else if (cup === 'DD' || cup === 'E') breastFactor = 1.7;
                else if (cup === 'F') breastFactor = 2.1;
                else if (cup === 'G') breastFactor = 2.5;
                else if (cup === 'H') breastFactor = 2.9;
                else if (cup === 'I') breastFactor = 3.3;
                else if (cup === 'J') breastFactor = 3.7;
                else if (cup === 'K') breastFactor = 4.1;
                else if (cup === 'L') breastFactor = 4.5;
                else if (cup === 'M') breastFactor = 4.9;
                else if (cup.match(/^[N-Z]$/)) breastFactor = 5.3;
                else if (cup === '-') breastFactor = 0;
                else {
                  if (cup.includes('AA')) breastFactor = 0.1;
                  else breastFactor = 0.6; // fallback for non-empty general values
                }

                if (breastFactor <= 0) return null;

                const rX = 2.0 + breastFactor * 1.0;
                const rY = 1.8 + breastFactor * 0.95;

                return (
                  <g stroke="#6366f1" strokeWidth="0.8" fill="none" opacity="0.8" pointerEvents="none">
                    {/* Left Breast Curve */}
                    <path d={`M ${45.2 - rX} 43 Q ${45.2 - rX * 0.5} ${43 + rY} 49.5 45.2`} />
                    {/* Right Breast Curve */}
                    <path d={`M ${54.8 + rX} 43 Q ${54.8 + rX * 0.5} ${43 + rY} 50.5 45.2`} />
                    {/* Cleavage connection */}
                    {breastFactor >= 0.9 && (
                      <path d="M 49.5 45.2 Q 50 45.8 50.5 45.2" />
                    )}
                    {/* Cleavage vertical line (larger sizes) */}
                    {breastFactor >= 1.3 && (
                      <path d={`M 50 45.2 L 50 ${45.2 - Math.min(4.5, breastFactor * 0.9)}`} strokeWidth="0.65" />
                    )}
                  </g>
                );
              })()}

              {isPartInjured('chest') && (
                <path 
                  d={isFemale ? "M 45 42 Q 50 64 45 68" : "M 46 42 L 54 42 L 50 62 Z"} 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.5" 
                  className="animate-pulse" 
                />
              )}
            </g>

            {/* 3. LINKER ARM (LEFT ARM) - For Beast this is Left Front Leg */}
            <g transform={displayForm === 'beast' 
              ? `translate(38, ${100 + armTranslateY}) scale(${armScaleX}, ${armScaleY}) translate(-38, -100)`
              : `translate(${36 + leftArmTranslateX}, ${34 + armTranslateY}) scale(${armScaleX}, ${armScaleY}) translate(-36, -34)`
            }>
              {(() => {
                let armPath = "";
                if (displayForm === 'child') {
                  armPath = "M 39 34 Q 30 50 31 64 Q 28 64 28 66 L 33 66 Q 34 52 41 36 Z";
                } else if (displayForm === 'beast') {
                  // Digitigrade front leg structure for beast form (curved Z-shape)
                  armPath = "M 35 95 Q 38 110 33 125 Q 30 135 30 145 L 36 145 Q 36 135 39 125 Q 44 110 45 95 Z";
                } else {
                  // Standard human arm
                  armPath = "M 36 34 Q 26 56 27 76 Q 24 76 24 79 L 29 79 Q 30 58 39 36 Z";
                }
                return (
                  <path 
                    d={armPath}
                    fill={isPartInjured('l_arm') ? 'url(#injury-glow)' : selectedPart === 'l_arm' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                    stroke={isPartInjured('l_arm') ? '#ef4444' : selectedPart === 'l_arm' ? '#818cf8' : '#334155'}
                    strokeWidth="1.2"
                    onClick={() => !readOnly && setSelectedPart('l_arm')}
                    className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                  />
                );
              })()}
            </g>

            {/* 4. RECHTER ARM (RIGHT ARM) - For Beast this is Right Front Leg */}
            <g transform={displayForm === 'beast' 
              ? `translate(48, ${100 + armTranslateY}) scale(${armScaleX}, ${armScaleY}) translate(-48, -100)`
              : `translate(${64 + rightArmTranslateX}, ${34 + armTranslateY}) scale(${armScaleX}, ${armScaleY}) translate(-64, -34)`
            }>
              {(() => {
                let armPath = "";
                if (displayForm === 'child') {
                  armPath = "M 61 34 Q 70 50 69 64 Q 72 64 72 66 L 67 66 Q 66 52 59 36 Z";
                } else if (displayForm === 'beast') {
                  // Digitigrade front leg structure for beast form (curved Z-shape)
                  armPath = "M 44 95 Q 47 110 42 125 Q 39 135 39 145 L 45 145 Q 48 135 48 125 Q 53 110 52 95 Z";
                } else {
                  // Standard human arm
                  armPath = "M 64 34 Q 74 56 73 76 Q 76 76 76 79 L 71 79 Q 70 58 61 36 Z";
                }
                return (
                  <path 
                    d={armPath}
                    fill={isPartInjured('r_arm') ? 'url(#injury-glow)' : selectedPart === 'r_arm' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                    stroke={isPartInjured('r_arm') ? '#ef4444' : selectedPart === 'r_arm' ? '#818cf8' : '#334155'}
                    strokeWidth="1.2"
                    onClick={() => !readOnly && setSelectedPart('r_arm')}
                    className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                  />
                );
              })()}
            </g>

            {/* 5. LINKES BEIN (LEFT LEG) - For Beast this is Left Hind Leg */}
            <g transform={displayForm === 'beast' 
              ? `translate(60, ${100 + legTranslateY}) scale(${legScaleX}, ${legScaleY}) translate(-60, -100)`
              : `translate(${45 + leftLegTranslateX}, ${74 + legTranslateY}) scale(${legScaleX}, ${legScaleY}) translate(-45, -74)`
            }>
              {(() => {
                let legPath = "";
                if (displayForm === 'child') {
                  legPath = "M 41 70 Q 37 90 38 120 L 43 120 Q 42 90 48 70 Z";
                } else if (displayForm === 'beast') {
                  legPath = "M 60 95 Q 55 110 57 125 Q 60 135 55 145 L 61 145 Q 65 135 61 125 Q 59 110 68 95 Z";
                } else if (displayForm === 'hybrid') {
                  // Digitigrade (zehengängerisch / z-shaped) leg structure for hybrid
                  legPath = "M 40 74 Q 31 92 31 102 Q 41 118 41 128 L 33 148 L 39 148 Q 45 128 44 118 Q 37 102 49 74 Z";
                } else {
                  // Standard human leg
                  legPath = "M 40 74 Q 34 110 36 148 L 42 148 Q 40 110 49 74 Z";
                }
                return (
                  <path 
                    d={legPath}
                    fill={isPartInjured('l_leg') ? 'url(#injury-glow)' : selectedPart === 'l_leg' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                    stroke={isPartInjured('l_leg') ? '#ef4444' : selectedPart === 'l_leg' ? '#818cf8' : '#334155'}
                    strokeWidth="1.2"
                    onClick={() => !readOnly && setSelectedPart('l_leg')}
                    className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                  />
                );
              })()}
            </g>

            {/* 6. RECHTES BEIN (RIGHT LEG) - For Beast this is Right Hind Leg */}
            <g transform={displayForm === 'beast' 
              ? `translate(68, ${100 + legTranslateY}) scale(${legScaleX}, ${legScaleY}) translate(-68, -100)`
              : `translate(${55 + rightLegTranslateX}, ${74 + legTranslateY}) scale(${legScaleX}, ${legScaleY}) translate(-55, -74)`
            }>
              {(() => {
                let legPath = "";
                if (displayForm === 'child') {
                  legPath = "M 59 70 Q 63 90 62 120 L 57 120 Q 58 90 52 70 Z";
                } else if (displayForm === 'beast') {
                  legPath = "M 69 95 Q 65 110 67 125 Q 70 135 65 145 L 71 145 Q 75 135 71 125 Q 69 110 76 95 Z";
                } else if (displayForm === 'hybrid') {
                  // Digitigrade (zehengängerisch / z-shaped) leg structure for hybrid
                  legPath = "M 60 74 Q 69 92 69 102 Q 59 118 59 128 L 67 148 L 61 148 Q 55 128 56 118 Q 63 102 51 74 Z";
                } else {
                  // Standard human leg
                  legPath = "M 60 74 Q 66 110 64 148 L 58 148 Q 60 110 51 74 Z";
                }
                return (
                  <path 
                    d={legPath}
                    fill={isPartInjured('r_leg') ? 'url(#injury-glow)' : selectedPart === 'r_leg' ? 'rgba(99, 102, 241, 0.45)' : 'url(#healthy-grad)'}
                    stroke={isPartInjured('r_leg') ? '#ef4444' : selectedPart === 'r_leg' ? '#818cf8' : '#334155'}
                    strokeWidth="1.2"
                    onClick={() => !readOnly && setSelectedPart('r_leg')}
                    className="transition-all duration-200 hover:fill-indigo-900/40 hover:stroke-indigo-400 cursor-pointer"
                  />
                );
              })()}
            </g>
          </svg>

          {/* Quick Clear button on hover if not readOnly */}
          {!readOnly && Object.values(state.injuries).some(arr => arr.length > 0) && (
            <button 
              onClick={clearAllInjuries}
              className="absolute bottom-2 right-2 px-2 py-1 bg-red-950/80 border border-red-500/30 text-red-400 hover:text-white rounded text-[8px] font-bold tracking-wider uppercase transition-all"
            >
              Wunden heilen
            </button>
          )}
        </div>

        {/* Tip caption */}
        {!readOnly && (
          <p className="text-[10px] text-slate-500 text-center mt-1.5 leading-tight max-w-[240px]">
            Klicke auf eine Körperstelle in der Silhouette, um den physischen Status einzusehen.
          </p>
        )}
      </div>

      {/* 2. STATUS-ZUSAMMENFASSUNG (RIGHT TOP) */}
      <div className="flex-1 w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 text-left shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
          <span className="text-[10.5px] font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
            <i className="fa-solid fa-clipboard-user"></i> Status-Zusammenfassung
          </span>
          {isFemale && pregFactor > 0 && (
            <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="fa-solid fa-baby-carriage text-pink-400"></i>
              <span>{pregFactor}. Monat {state.fatherName ? `• Vater: ${state.fatherName}` : ''}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 text-[10px]">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold">Gewicht & KFA</span>
            <span className="font-bold text-slate-200">{currentWeight} kg / {currentFat}% KFA</span>
          </div>

          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold">Muskelmasse</span>
            <span className="font-bold text-emerald-400">{currentMuscle}%</span>
          </div>

          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold">Proportionen (B-T-H)</span>
            <span className="font-bold text-slate-200 truncate">{computedMeasurements}</span>
          </div>

          {isFemale ? (
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex flex-col">
              <span className="text-[9px] text-slate-400 font-semibold">Körbchengröße / Statur</span>
              <span className="font-bold text-pink-400">{computedCup} ({dynamicBuild})</span>
            </div>
          ) : (
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex flex-col">
              <span className="text-[9px] text-slate-400 font-semibold">Körperstatur</span>
              <span className="font-bold text-indigo-300">{dynamicBuild}</span>
            </div>
          )}

          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-semibold">Heilfaktor & Regeneration</span>
              <span className="font-bold text-emerald-400 text-[10px]">
                { (state.healingFactor || 1) === 1 && 'Stufe 1: Normal' }
                { (state.healingFactor || 1) === 2 && 'Stufe 2: Erhöht / Zäh' }
                { (state.healingFactor || 1) === 3 && 'Stufe 3: Schnell / Magisch' }
                { (state.healingFactor || 1) === 4 && 'Stufe 4: Extrem / Erwacht' }
                { (state.healingFactor || 1) === 5 && 'Stufe 5: Übernatürlich' }
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-emerald-300 font-extrabold bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
              {state.healingFactor || 1}x
            </span>
          </div>
        </div>

        {/* Active Injury Warning / Quick Heal */}
        {Object.values(state.injuries).some(arr => arr.length > 0) ? (
          <div className="bg-red-950/40 border border-red-500/30 p-2 rounded-lg flex justify-between items-center mt-1">
            <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold">
              <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>
              <span>
                {Object.values(state.injuries).flat().length} {Object.values(state.injuries).flat().length === 1 ? 'Verletzung' : 'Verletzungen'} aktiv
              </span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={clearAllInjuries}
                className="text-[9px] font-bold text-red-300 bg-red-900/60 hover:bg-red-800 px-2 py-1 rounded border border-red-500/40 transition-all cursor-pointer"
              >
                Alle heilen
              </button>
            )}
          </div>
        ) : (
          <div className="text-[9.5px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg flex items-center gap-1.5 font-medium">
            <i className="fa-solid fa-circle-check"></i>
            <span>Vollständig gesund & unverletzt</span>
          </div>
        )}

        {/* Active Conditions Preview on Silhouette Card */}
        {activeConditionsList.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9.5px] font-extrabold text-amber-400 tracking-wider flex items-center gap-1">
                <i className="fa-solid fa-sparkles text-amber-400 text-[10px]"></i>
                <span>Aktive Bedingungen ({activeConditionsList.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveSilhouetteTab('conditions')}
                className="text-[8.5px] text-amber-300 hover:underline cursor-pointer"
              >
                Verwalten →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeConditionsList.map(c => (
                <span
                  key={c.id}
                  className={`px-2 py-1 rounded-md text-[9.5px] font-bold border flex items-center gap-1.5 ${
                    c.type === 'curse'
                      ? 'bg-red-950/40 text-red-300 border-red-500/30'
                      : c.type === 'blessing'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  <i className={`fa-solid ${
                    c.type === 'curse' ? 'fa-skull' :
                    c.type === 'blessing' ? 'fa-hands-praying' :
                    c.type === 'gender_change' ? 'fa-venus-mars' :
                    c.type === 'race_change' ? 'fa-dna' : 'fa-sparkles'
                  } text-[9px]`}></i>
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* BOTTOM SECTION: DYNAMIC CONTROLS & MANAGEMENT (Der Rest darunter) */}
    <div className="w-full flex flex-col gap-3 pt-5 border-t border-slate-800/80">
        
        {/* TAB NAVIGATION BAR */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSilhouetteTab('conditions')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSilhouetteTab === 'conditions'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <i className="fa-solid fa-sparkles text-xs"></i>
            <span>Form & Effekte</span>
            {activeConditionsList.length > 0 && (
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold shrink-0 ${
                activeSilhouetteTab === 'conditions' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {activeConditionsList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSilhouetteTab('physical')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSilhouetteTab === 'physical'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <i className="fa-solid fa-user text-xs"></i>
            <span>Statur & Maße</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSilhouetteTab('injuries')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSilhouetteTab === 'injuries'
                ? 'bg-red-700 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <i className="fa-solid fa-bandage text-xs"></i>
            <span>Verletzungen</span>
            {Object.values(state.injuries).flat().length > 0 && (
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold shrink-0 ${
                activeSilhouetteTab === 'injuries' ? 'bg-white text-red-700' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {Object.values(state.injuries).flat().length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: CONDITIONS, CURSES, BLESSINGS, GENDER & RACE MORPHS */}
        {activeSilhouetteTab === 'conditions' && (
          <div className="animate-in fade-in duration-150">
            <BodyConditionsManager
              player={player}
              onUpdatePlayer={onUpdatePlayer || (() => {})}
              readOnly={readOnly}
            />
          </div>
        )}

        {/* TAB 2: PHYSICAL COMPOSITION & TRANSFORMATION SELECTION */}
        {activeSilhouetteTab === 'physical' && (
          <div className="space-y-3 animate-in fade-in duration-150">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-sliders text-indigo-400"></i>
            Körperliche Eigenschaften & Maße
          </h4>

          {/* Form selector */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Aktuelle Gestalt / Form
            </label>

            {/* SELECTION BUTTONS: Standard vs Transformations */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">
                Gestalt wechseln / Transformation aktivieren:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {/* Standard Form Button */}
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (onUpdatePlayerRef.current) {
                      onUpdatePlayer({
                        ...player,
                        appearance: {
                          ...player.appearance,
                          activeTransformationId: 'standard'
                        }
                      });
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    activeTransformationId === 'standard'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-md font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  <i className="fa-solid fa-user text-indigo-400"></i>
                  <span>Standardgestalt</span>
                </button>

                {/* Transformation Options */}
                {transformationList.map(t => {
                  const isSwapForm = t.transformSwappedCharacterName || t.transformIdentityPerception === 'koerpertausch';
                  const swappedTarget = t.transformSwappedCharacterName || (isSwapForm ? t.name : null);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        if (onUpdatePlayerRef.current) {
                          onUpdatePlayer({
                            ...player,
                            appearance: {
                              ...player.appearance,
                              activeTransformationId: t.id
                            }
                          });
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        activeTransformationId === t.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md font-bold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                      }`}
                    >
                      <i className={`fa-solid ${isSwapForm ? 'fa-arrows-rotate text-purple-400' : 'fa-bolt text-amber-400'}`}></i>
                      <span>{t.name || 'Unbenannte Transformation'}</span>
                      {isSwapForm && swappedTarget && (
                        <span className="text-[8.5px] font-bold text-amber-300 bg-amber-500/30 px-1.5 py-0.2 rounded border border-amber-500/40">
                          Körpertausch
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Empty Help Indicator if no transformations defined */}
                {transformationList.length === 0 && (
                  <p className="text-[9.5px] text-slate-400 leading-tight mt-1 flex items-center gap-1">
                    <i className="fa-solid fa-circle-info text-slate-400"></i>
                    <span>Keine Transformationen definiert. Unter <strong>"Fähigkeiten & Kräfte" → "Transformationen"</strong> kannst du eigene Gestalten anlegen.</span>
                  </p>
                )}
              </div>

              {/* ACTIVE TRANSFORMATION CONTROL CARD */}
              {activeTransformation && (
                <div className="mt-2.5 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-bolt text-amber-400 text-sm"></i>
                      <div>
                        <span className="text-xs font-bold text-amber-300 tracking-wide block">
                          Aktive Form: {activeTransformation.transformName || activeTransformation.name}
                        </span>
                        <span className="text-[9.5px] text-amber-400/80 font-medium">
                          Verwandlung & Wahrnehmung
                        </span>
                      </div>
                    </div>
                    
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setShowPermanentSwapModal(true)}
                        className="px-2.5 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                        title="Macht diese Gestalt dauerhaft zur neuen Hauptgestalt"
                      >
                        <i className="fa-solid fa-arrows-rotate text-xs"></i>
                        <span>Als neue Hauptgestalt festlegen</span>
                      </button>
                    )}
                  </div>

                  {/* KI WAHRNEHMUNG & IDENTITÄT */}
                  <div className="space-y-1.5 pt-0.5">
                    <label className="text-[10px] font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-masks-theater text-amber-400"></i>
                      <span>Identität & Wahrnehmung in der Spielwelt</span>
                    </label>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Bestimmt, wie Charaktere in der Geschichte die verwandelte Gestalt wahrnehmen:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => updateTransformationIdentity('bekannt')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          (activeTransformation.transformIdentityPerception || 'bekannt') === 'bekannt'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-[11px] font-bold flex items-center gap-1">
                          <i className="fa-solid fa-user-check text-emerald-400 mr-1"></i>
                          <span>Bekannte Identität</span>
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 leading-tight">
                          Charaktere wissen, dass es sich um {player.name} handelt.
                        </p>
                      </button>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => updateTransformationIdentity('getrennt')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          (activeTransformation.transformIdentityPerception || 'bekannt') === 'getrennt'
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold ring-1 ring-purple-500/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-[11px] font-bold flex items-center gap-1">
                          <i className="fa-solid fa-mask text-purple-400 mr-1"></i>
                          <span>Getrennte Identität</span>
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 leading-tight">
                          Charaktere nehmen diese Gestalt als fremde Person wahr.
                        </p>
                      </button>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => updateTransformationIdentity('koerpertausch')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          (activeTransformation.transformIdentityPerception || 'bekannt') === 'koerpertausch'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-[11px] font-black flex items-center gap-1">
                          <span>🔄</span> Körpertausch
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 leading-tight">
                          Körper, Beziehungen & Kampffähigkeiten eines Codex-Charakters übernehmen.
                        </p>
                      </button>
                    </div>

                    {/* KÖRPERTAUSCH MIT CODEX-CHARAKTER PANEL */}
                    {(activeTransformation.transformIdentityPerception || 'bekannt') === 'koerpertausch' && (
                      <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-b from-amber-950/30 via-slate-950/60 to-slate-950 border border-amber-500/40 space-y-3 shadow-inner">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                              <i className="fa-solid fa-people-arrows text-amber-400"></i>
                              <span>Codex-Körpertausch & Daten-Übertragung</span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 mt-0.5">
                              Wähle einen Charakter aus dem Codex oder den NPCs, um Profil, Beziehungen und Kampffähigkeiten auf die Transformation oder deinen Charakter zu übertragen.
                            </p>
                          </div>

                          {activeTransformation.transformSwappedCharacterName && (
                            <button
                              type="button"
                              onClick={handleRevertBodySwap}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-[9.5px] font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0 transition-all"
                            >
                              <i className="fa-solid fa-rotate-left text-slate-400"></i>
                              <span>Tausch beenden / Reset</span>
                            </button>
                          )}
                        </div>

                        {/* AUSKLAPPBARES MENÜ FÜR CODEX-CHARAKTER WAHL */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                              <span>📚</span>
                              <span>Codex-Charakter wählen</span>
                            </label>
                            <span className="text-[9px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {availableCodexCharacters.length} verfügbar
                            </span>
                          </div>

                          {availableCodexCharacters.length === 0 ? (
                            <div className="p-3 bg-slate-900/60 border border-dashed border-slate-700 rounded-xl text-center space-y-1">
                              <p className="text-xs text-amber-400 font-bold">
                                ℹ️ Keine Charaktere im Codex oder NPC-Pool gefunden
                              </p>
                              <p className="text-[9.5px] text-slate-400 max-w-sm mx-auto">
                                Erstelle im Codex (unter der Kategorie &quot;Charaktere&quot; oder &quot;Gegner&quot;) oder in der NPC-Verwaltung Charaktere mit Aussehen, Beziehungen und Kampffähigkeiten, um sie hier für den Körpertausch auszuwählen.
                              </p>
                            </div>
                          ) : (
                            <div className="relative">
                              <select
                                disabled={readOnly}
                                value={activeTransformation.transformSwappedCharacterId || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  if (!selectedId) {
                                    handleRevertBodySwap();
                                    return;
                                  }
                                  const targetChar = availableCodexCharacters.find(c => c.id === selectedId);
                                  if (targetChar) {
                                    handleSelectSwappedCharacter(targetChar);
                                  }
                                }}
                                className="w-full bg-slate-900/95 border border-slate-700 hover:border-amber-500/60 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold focus:outline-none transition-all cursor-pointer shadow-sm appearance-none pr-9"
                              >
                                <option value="" className="bg-slate-900 text-slate-400">
                                  -- Charakter auswählen (Körpertausch-Ziel) --
                                </option>

                                {availableCodexCharacters.some(c => c.source === 'player') && (
                                  <optgroup label="Nutzer / Hauptcharakter" className="bg-slate-950 text-amber-400 font-black">
                                    {availableCodexCharacters
                                      .filter(c => c.source === 'player')
                                      .map(c => {
                                        const cleanHeight = c.height ? String(c.height).replace(/cm/gi, '') : '170';
                                        return (
                                          <option key={c.id} value={c.id} className="bg-slate-900 text-amber-300 font-bold">
                                            👤 {c.name} (Nutzer / Hauptcharakter • {c.gender || 'W'} • {cleanHeight}cm{c.powerName ? ` • ${c.powerName}` : ''})
                                          </option>
                                        );
                                      })}
                                  </optgroup>
                                )}

                                {availableCodexCharacters.some(c => c.source === 'codex') && (
                                  <optgroup label="Codex-Charaktere" className="bg-slate-950 text-amber-300 font-black">
                                    {availableCodexCharacters
                                      .filter(c => c.source === 'codex')
                                      .map(c => {
                                        const cleanHeight = c.height ? String(c.height).replace(/cm/gi, '') : '170';
                                        return (
                                          <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200 font-normal">
                                            {c.name} ({c.role || c.race || 'Charakter'} • {c.gender || 'W'} • {cleanHeight}cm{c.powerName ? ` • ${c.powerName}` : ''})
                                          </option>
                                        );
                                      })}
                                  </optgroup>
                                )}

                                {availableCodexCharacters.some(c => c.source === 'npc') && (
                                  <optgroup label="NPCs & Begleiter" className="bg-slate-950 text-emerald-300 font-black">
                                    {availableCodexCharacters
                                      .filter(c => c.source === 'npc')
                                      .map(c => {
                                        const cleanHeight = c.height ? String(c.height).replace(/cm/gi, '') : '170';
                                        return (
                                          <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200 font-normal">
                                            {c.name} ({c.role || 'NPC'} • {c.gender || 'W'} • {cleanHeight}cm{c.powerName ? ` • ${c.powerName}` : ''})
                                          </option>
                                        );
                                      })}
                                  </optgroup>
                                )}
                              </select>

                              {/* Down arrow icon */}
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                                <i className="fa-solid fa-chevron-down"></i>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TRANSFORMATION PROGRESSION & INTENSITY CARD */}
                  <div className="mt-2.5 pt-2.5 border-t border-amber-500/20">
                    <TransformationIntensityCard
                      intensityVal={resolvedBody.transformationIntensityVal}
                      stageName={resolvedBody.transformationStageName}
                      onUpdateIntensity={handleSetTransformationIntensity}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              )}
            </div>


            {state.isVampire && state.vampireBlood <= 20 && (
              <p className="text-[9.5px] text-red-400 mt-1 italic font-medium bg-red-950/20 p-2 border border-red-500/20 rounded-lg">
                ⚠️ Blutmangel aktiv! Du bist auf Kindheitsgröße geschrumpft. Konsumiere Blut, um wieder die menschliche Form oder aktive Transformationen voll nutzen zu können.
              </p>
            )}
          </div>

          {/* PHYSICAL COMPOSITION SECTION (Build Presets, Cup Size, Weight, Body Fat %, Muscle Mass %) */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
              <i className="fa-solid fa-weight-scale"></i> Physische Zusammensetzung (Simulation)
            </span>

            {/* 0A. STATUR PRESETS */}
            <div className="space-y-1.5 pb-2 border-b border-slate-800/60">
              <div className="flex justify-between items-center">
                <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-person text-indigo-400"></i> Statur & Körperbau
                </span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {dynamicBuild}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 pt-1">
                {Object.entries(BUILD_PRESETS).map(([name, p]) => (
                  <button
                    key={name}
                    type="button"
                    disabled={readOnly}
                    onClick={() => applyBuildPreset(name)}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      dynamicBuild.toLowerCase() === name.toLowerCase()
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-md font-bold ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <i className={`fa-solid ${p.icon} text-xs`}></i>
                    <span className="truncate max-w-full text-[9.5px]">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 0B. KÖRBCHENGRÖSSE SELECTOR (Female only) */}
            {isFemale && (
              <div className="space-y-1.5 pb-2 border-b border-slate-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-shirt text-pink-400"></i> Körbchengröße & Brustumfang
                  </span>
                  <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    {computedCup} ({computedBust}cm)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(cup => (
                    <button
                      key={cup}
                      type="button"
                      disabled={readOnly}
                      onClick={() => updateCupSize(cup)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
                        computedCup.toUpperCase() === cup
                          ? 'bg-pink-600/30 border-pink-500 text-pink-300 font-bold shadow ring-1 ring-pink-500/40'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {cup}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1. WEIGHT SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-weight-scale text-indigo-400"></i> Körpergewicht
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {currentWeight} kg
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="220"
                disabled={readOnly}
                value={currentWeight}
                onChange={e => updateWeight(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
            </div>

            {/* 2. BODY FAT SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-fire text-amber-400"></i> Körperfettanteil (KFA)
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  currentFat >= (isFemale ? 35 : 28)
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : currentFat >= (isFemale ? 25 : 18)
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {currentFat} % {currentFat >= (isFemale ? 35 : 28) && '(Hoch)'}
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                disabled={readOnly}
                value={currentFat}
                onChange={e => updateFat(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
            </div>

            {/* 3. MUSCLE MASS SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-dumbbell text-emerald-400"></i> Muskelmasseanteil
                </span>
                <span className="text-[11px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {currentMuscle} %
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                disabled={readOnly}
                value={currentMuscle}
                onChange={e => updateMuscle(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
            </div>

            {/* PHYSICAL COMPOSITION COMPARISON */}
            {(() => {
              const isTransformActive = Boolean(activeTransformation && activeTransformation.id !== 'standard');

              const stdGenderVal = isTransformActive ? resolvedBody.standardGender : (resolvedApp.gender || app.gender || 'Weiblich');
              const effGenderVal = resolvedBody.effectiveGender || stdGenderVal;

              const stdRaceVal = isTransformActive ? resolvedBody.standardRace : (resolvedApp.race || app.race || 'Mensch');
              const effRaceVal = resolvedBody.effectiveRace || stdRaceVal;

              const stdBuildVal = isTransformActive ? resolvedBody.standardBuild : dynamicBuild;
              const effBuildVal = dynamicBuild;

              const stdHeightVal = isTransformActive ? resolvedBody.standardHeightCm : H;
              const effHeightVal = H;
              const diffHeight = effHeightVal - stdHeightVal;

              const stdWeightVal = isTransformActive ? resolvedBody.standardWeightKg : currentWeight;
              const effWeightVal = currentWeight;
              const diffWeight = effWeightVal - stdWeightVal;

              const stdFatVal = isTransformActive ? resolvedBody.standardBodyFat : currentFat;
              const effFatVal = currentFat;
              const diffFat = effFatVal - stdFatVal;

              const stdMuscleVal = isTransformActive ? resolvedBody.standardMuscleMass : currentMuscle;
              const effMuscleVal = currentMuscle;
              const diffMuscle = effMuscleVal - stdMuscleVal;

              const stdMeasurementsVal = isTransformActive ? resolvedBody.standardMeasurements : `${computedMeasurements} cm`;
              const effMeasurementsVal = `${computedMeasurements} cm`;

              const stdCupVal = isTransformActive ? resolvedBody.standardCupSize : computedCup;
              const effCupVal = computedCup;

              return (
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider block">
                    Physischer Vergleich: Standardgestalt vs. Aktive Form
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                    <table className="w-full text-left text-[10.5px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-450 font-extrabold uppercase tracking-wider text-[9px]">
                          <th className="pb-1.5 pl-1">Eigenschaft</th>
                          <th className="pb-1.5">Standardgestalt</th>
                          <th className="pb-1.5">Aktive Form</th>
                          <th className="pb-1.5 text-right pr-1">Änderung</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Geschlecht</td>
                          <td className="py-1.5">{stdGenderVal}</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effGenderVal}</td>
                          <td className="py-1.5 text-right pr-1 font-mono text-[9.5px]">
                            {stdGenderVal !== effGenderVal ? 'Geändert' : 'Identisch'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Spezies / Rasse</td>
                          <td className="py-1.5">{stdRaceVal}</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effRaceVal}</td>
                          <td className="py-1.5 text-right pr-1 font-mono text-[9.5px]">
                            {stdRaceVal !== effRaceVal ? 'Geändert' : 'Identisch'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Körperbau</td>
                          <td className="py-1.5">{stdBuildVal}</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effBuildVal}</td>
                          <td className="py-1.5 text-right pr-1 font-mono text-[9.5px]">
                            {stdBuildVal.toLowerCase() !== effBuildVal.toLowerCase() ? 'Geändert' : 'Identisch'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Körpergröße</td>
                          <td className="py-1.5">{stdHeightVal} cm</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effHeightVal} cm</td>
                          <td className={`py-1.5 text-right pr-1 font-mono font-bold ${
                            diffHeight > 0
                              ? 'text-emerald-400'
                              : diffHeight < 0
                              ? 'text-red-400'
                              : 'text-slate-500'
                          }`}>
                            {diffHeight > 0 ? `+${diffHeight}` : diffHeight === 0 ? '±0' : diffHeight} cm
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Körpergewicht</td>
                          <td className="py-1.5">{stdWeightVal} kg</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effWeightVal} kg</td>
                          <td className={`py-1.5 text-right pr-1 font-mono font-bold ${
                            diffWeight > 0
                              ? 'text-emerald-400'
                              : diffWeight < 0
                              ? 'text-red-400'
                              : 'text-slate-500'
                          }`}>
                            {diffWeight > 0 ? `+${diffWeight}` : diffWeight === 0 ? '±0' : diffWeight} kg
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Körperfettanteil</td>
                          <td className="py-1.5">{stdFatVal} %</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effFatVal} %</td>
                          <td className={`py-1.5 text-right pr-1 font-mono font-bold ${
                            diffFat > 0
                              ? 'text-emerald-400'
                              : diffFat < 0
                              ? 'text-red-400'
                              : 'text-slate-500'
                          }`}>
                            {diffFat > 0 ? `+${diffFat}` : diffFat === 0 ? '±0' : diffFat} %
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Muskelmasse</td>
                          <td className="py-1.5">{stdMuscleVal} %</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effMuscleVal} %</td>
                          <td className={`py-1.5 text-right pr-1 font-mono font-bold ${
                            diffMuscle > 0
                              ? 'text-emerald-400'
                              : diffMuscle < 0
                              ? 'text-red-400'
                              : 'text-slate-500'
                          }`}>
                            {diffMuscle > 0 ? `+${diffMuscle}` : diffMuscle === 0 ? '±0' : diffMuscle} %
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pl-1 font-bold text-slate-400">Körpermaße (B-W-H)</td>
                          <td className="py-1.5">{stdMeasurementsVal}</td>
                          <td className="py-1.5 font-bold text-indigo-300">{effMeasurementsVal}</td>
                          <td className="py-1.5 text-right pr-1 font-mono text-[9.5px]">
                            {stdMeasurementsVal !== effMeasurementsVal ? 'Geändert' : 'Identisch'}
                          </td>
                        </tr>
                        {(stdCupVal !== '-' || effCupVal !== '-') && (
                          <tr>
                            <td className="py-1.5 pl-1 font-bold text-slate-400">Körbchengröße</td>
                            <td className="py-1.5">{stdCupVal}</td>
                            <td className="py-1.5 font-bold text-indigo-300">{effCupVal}</td>
                            <td className="py-1.5 text-right pr-1 font-mono text-[9.5px]">
                              {stdCupVal !== effCupVal ? 'Geändert' : 'Identisch'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <p className="text-[9px] text-slate-500 leading-normal italic">
              💡 <strong>Intelligente Verknüpfung:</strong> Die Werte beeinflussen sich gegenseitig realitätsnah und verändern die Gestalt-Silhouette links live! Perfekt, um Abnehm- oder Trainingsgeschichten visuell zu begleiten.
            </p>
          </div>

          {/* HEALING FACTOR & REGENERATION SECTION */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-heart-pulse"></i> Heilfaktor & Regeneration
              </span>
              <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                (state.healingFactor || 1) >= 5
                  ? 'text-purple-300 bg-purple-500/20 border-purple-500/30'
                  : (state.healingFactor || 1) >= 4
                  ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                  : (state.healingFactor || 1) >= 3
                  ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                  : (state.healingFactor || 1) >= 2
                  ? 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30'
                  : 'text-slate-300 bg-slate-800/50 border-slate-700/60'
              }`}>
                { (state.healingFactor || 1) === 1 && 'Stufe 1: Normal (Menschlich / Standard)' }
                { (state.healingFactor || 1) === 2 && 'Stufe 2: Erhöht / Zäh' }
                { (state.healingFactor || 1) === 3 && 'Stufe 3: Schnell / Magisch' }
                { (state.healingFactor || 1) === 4 && 'Stufe 4: Extrem / Erwacht' }
                { (state.healingFactor || 1) === 5 && 'Stufe 5: Übernatürlich / Unsterblich' }
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1 pt-0.5">
              {[
                { lvl: 1, label: 'Normal', icon: 'fa-user text-slate-400' },
                { lvl: 2, label: 'Zäh', icon: 'fa-hand-fist text-cyan-400' },
                { lvl: 3, label: 'Schnell', icon: 'fa-bolt text-emerald-400' },
                { lvl: 4, label: 'Extrem', icon: 'fa-fire text-amber-400' },
                { lvl: 5, label: 'Unsterblich', icon: 'fa-infinity text-purple-400' }
              ].map(p => (
                <button
                  key={p.lvl}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setState(prev => ({ ...prev, healingFactor: p.lvl }))}
                  className={`py-1.5 px-1 rounded-lg text-[9.5px] font-bold transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                    (state.healingFactor || 1) === p.lvl
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-950/50 scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                  }`}
                >
                  <i className={`fa-solid ${p.icon} text-xs`}></i>
                  <span className="truncate w-full">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                <span>Regenerations-Multiplikator:</span>
                <span className="font-mono text-emerald-400 font-extrabold">
                  { (state.healingFactor || 1) === 1 ? '1x (Normale Dauer)' :
                    (state.healingFactor || 1) === 2 ? '2x (+25% HP/Ressourcen-Regen)' :
                    (state.healingFactor || 1) === 3 ? '4x (+50% HP/Ressourcen-Regen bei Rast)' :
                    (state.healingFactor || 1) === 4 ? '8x (+100% In-Fight Erholung)' :
                    '20x (Sofortige Gewebe-Regeneration)'
                  }
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                disabled={readOnly}
                value={state.healingFactor || 1}
                onChange={e => setState(prev => ({ ...prev, healingFactor: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[9.5px] pt-1">
              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-lg space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <i className="fa-solid fa-bandage text-emerald-400"></i> Wundheilungs-Dauer:
                </span>
                <p className="text-slate-300 leading-snug">
                  { (state.healingFactor || 1) === 1 && 'Schnittwunden: Tage. Knochenbrüche: Wochen/Monate.' }
                  { (state.healingFactor || 1) === 2 && 'Schnittwunden: Stunden. Knochenbrüche: Einige Tage.' }
                  { (state.healingFactor || 1) === 3 && 'Schnittwunden/Prellungen: Minuten–Stunden. Knochenbrüche: 1–2 Tage.' }
                  { (state.healingFactor || 1) === 4 && 'Wunden schließen sich im Kampf/Minuten. Knochenbrüche: Stunden.' }
                  { (state.healingFactor || 1) === 5 && 'Augenblickliche Gewebe- & Knochenregeneration.' }
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-lg space-y-1">
                <span className="font-bold text-indigo-400 flex items-center gap-1">
                  <i className="fa-solid fa-bolt text-indigo-400"></i> HP, Ausdauer & Kosten-Ressourcen:
                </span>
                <p className="text-slate-300 leading-snug">
                  { (state.healingFactor || 1) === 1 && 'Normale Regeneration bei langer Rast.' }
                  { (state.healingFactor || 1) === 2 && '+25% schnellere HP-, Mana- & Ausdauer-Erholung bei Rast.' }
                  { (state.healingFactor || 1) === 3 && '+50% Erholung bei Pausen. Hohe Ausdauer-Regeneration.' }
                  { (state.healingFactor || 1) === 4 && '+100% Erholung. Passive In-Fight Erholung von MP/Energie.' }
                  { (state.healingFactor || 1) === 5 && 'Kontinuierliche & sofortige HP- & Ressourcen-Auffüllung.' }
                </p>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 leading-normal flex items-center gap-1">
              <i className="fa-solid fa-circle-info text-slate-400"></i>
              <span>Der Heilfaktor beschleunigt die Wundheilung sowie die Erholung von Gesundheit (HP), Ausdauer und Energie-Kosten.</span>
            </p>
          </div>

          {/* Pregnancy Control Panel if female */}
          {isFemale && (
            <div className="bg-slate-950/30 border border-slate-800/60 p-3 rounded-xl space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-baby-carriage text-pink-400"></i> Schwangerschaft & Physische Zunahme
                </span>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                  (state.isPregnant || state.pregnancyMonth > 0)
                    ? 'text-pink-400 bg-pink-500/10 border-pink-500/30'
                    : 'text-slate-400 bg-slate-800/50 border-slate-700/50'
                }`}>
                  {(state.isPregnant || state.pregnancyMonth > 0)
                    ? `Schwanger (${state.pregnancyMonth || 1}. Monat)`
                    : 'Nicht schwanger'}
                </span>
              </div>

              {/* Ja / Nein Selection Menu */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">
                  Schwanger:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        isPregnant: false,
                        pregnancyMonth: 0
                      }));
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      (!state.isPregnant && (state.pregnancyMonth || 0) === 0)
                        ? 'bg-slate-800 text-slate-200 border-slate-600 shadow-sm'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800/80 hover:text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <i className="fa-solid fa-xmark text-slate-400"></i> Nein (Nicht schwanger)
                  </button>

                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        isPregnant: true,
                        pregnancyMonth: prev.pregnancyMonth > 0 ? prev.pregnancyMonth : 1
                      }));
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      (state.isPregnant || (state.pregnancyMonth || 0) > 0)
                        ? 'bg-pink-600/30 text-pink-300 border-pink-500/50 shadow-sm font-bold'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800/80 hover:text-pink-300 hover:bg-pink-950/30'
                    }`}
                  >
                    <i className="fa-solid fa-baby text-pink-400"></i> Ja (Schwanger)
                  </button>
                </div>
              </div>

              {/* Details when Pregnant (Ja) */}
              {(state.isPregnant || (state.pregnancyMonth || 0) > 0) && (
                <div className="space-y-3 pt-2 border-t border-slate-800/60 animate-in fade-in duration-200">
                  {/* Vater des Kindes Auswahl-Menü */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                      <i className="fa-solid fa-mars text-indigo-400"></i> Wer ist der Vater?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        disabled={readOnly}
                        value={
                          fatherCandidates.includes(state.fatherName || '')
                            ? (state.fatherName || '')
                            : (state.fatherName === 'Unbekannt' || !state.fatherName ? (state.fatherName || 'Unbekannt') : '__custom__')
                        }
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsCustomFatherInput(true);
                          } else {
                            setIsCustomFatherInput(false);
                            setState(prev => ({ ...prev, fatherName: val }));
                          }
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none focus:border-pink-500/50 cursor-pointer"
                      >
                        <option value="Unbekannt">Unbekannt / Anonym</option>
                        {playerName && (
                          <option value={`Spieler (${playerName})`}>Spieler ({playerName})</option>
                        )}
                        {fatherCandidates.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        <option value="__custom__">Freitext / Anderer Name...</option>
                      </select>

                      {(isCustomFatherInput || (!fatherCandidates.includes(state.fatherName || '') && state.fatherName !== 'Unbekannt' && !!state.fatherName)) && (
                        <input
                          type="text"
                          disabled={readOnly}
                          placeholder="Name des Vaters eingeben..."
                          value={state.fatherName || ''}
                          onChange={e => setState(prev => ({ ...prev, fatherName: e.target.value }))}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none focus:border-pink-500/50 placeholder:text-slate-600"
                        />
                      )}
                    </div>
                  </div>

                  {/* Schwangerschaftsmonat Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                      <span>Schwangerschaftsfortschritt:</span>
                      <span className="text-pink-400 font-bold">{state.pregnancyMonth || 1}. Monat</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="9"
                      disabled={readOnly}
                      value={state.pregnancyMonth || 1}
                      onChange={e => updatePregnancyMonth(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
                    />
                  </div>

                  {/* Countdown bis zur Geburt */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                      <span>Countdown bis zur Geburt:</span>
                      <span className="text-pink-400 font-bold">
                        {state.pregnancyDaysRemaining !== undefined ? state.pregnancyDaysRemaining : Math.max(0, 270 - ((state.pregnancyMonth || 1) - 1) * 30)} Tage
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="280"
                      disabled={readOnly}
                      value={state.pregnancyDaysRemaining !== undefined ? state.pregnancyDaysRemaining : Math.max(0, 270 - ((state.pregnancyMonth || 1) - 1) * 30)}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setState(prev => ({ ...prev, pregnancyDaysRemaining: val }));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
                    />
                  </div>

                  {/* HUD-Sichtbarkeit und Bedingungen */}
                  <div className="space-y-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-300 block">
                      Status-Sichtbarkeit im physischen HUD:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          setState(prev => ({ ...prev, pregnancyTestDone: !prev.pregnancyTestDone }));
                        }}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-start gap-2 cursor-pointer border ${
                          state.pregnancyTestDone
                            ? 'bg-pink-600/20 text-pink-300 border-pink-500/40'
                            : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                          state.pregnancyTestDone
                            ? 'border-pink-400 bg-pink-500/30 text-pink-200'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}>
                          <i className="fa-solid fa-check"></i>
                        </div>
                        <span>Test positiv durchgeführt</span>
                      </button>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => {
                          setState(prev => ({ ...prev, pregnancyChangesVisible: !prev.pregnancyChangesVisible }));
                        }}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-start gap-2 cursor-pointer border ${
                          state.pregnancyChangesVisible
                            ? 'bg-pink-600/20 text-pink-300 border-pink-500/40'
                            : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                          state.pregnancyChangesVisible
                            ? 'border-pink-400 bg-pink-500/30 text-pink-200'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}>
                          <i className="fa-solid fa-check"></i>
                        </div>
                        <span>Körperliche Veränderungen</span>
                      </button>
                    </div>

                    <div className="text-[9px] leading-relaxed text-slate-400">
                      { (state.pregnancyTestDone || state.pregnancyChangesVisible) ? (
                        <span className="text-emerald-400 font-medium">
                          Anzeige aktiv: Zustand und Countdown sind im HUD &amp; Status sichtbar.
                        </span>
                      ) : (
                        <span className="text-amber-500 font-medium">
                          Anzeige inaktiv: Der Zustand bleibt im HUD verborgen (Heimlichkeit).
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stat-Übersicht */}
                  <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                    <div className="bg-pink-950/20 border border-pink-500/20 rounded p-1.5 text-pink-300 flex items-center gap-1">
                      <i className="fa-solid fa-weight-scale text-pink-400"></i>
                      <span><strong>Gewicht:</strong> +{Math.round((state.pregnancyMonth || 1) * 1.4)} kg</span>
                    </div>
                    <div className="bg-amber-950/20 border border-amber-500/20 rounded p-1.5 text-amber-300 flex items-center gap-1">
                      <i className="fa-solid fa-fire text-amber-400"></i>
                      <span><strong>KFA-Zunahme:</strong> +{((state.pregnancyMonth || 1) * 0.6).toFixed(1)} %</span>
                    </div>
                    <div className="bg-indigo-950/20 border border-indigo-500/20 rounded p-1.5 text-indigo-300 flex items-center gap-1">
                      <i className="fa-solid fa-ruler-combined text-indigo-400"></i>
                      <span><strong>Taillenplus:</strong> +{Math.round((state.pregnancyMonth || 1) * 4.8)} cm</span>
                    </div>
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-1.5 text-emerald-300 flex items-center gap-1">
                      <i className="fa-solid fa-shirt text-emerald-400"></i>
                      <span><strong>Körbchen:</strong> +{Math.min(3, Math.ceil((state.pregnancyMonth || 1) / 3))} Stufe(n)</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-slate-400 leading-snug pt-0.5">
                    Die Gestalt-Silhouette dehnt den Rumpfbereich und die Brustpartie automatisch aus. Gewicht, KFA & Maße aktualisieren sich live.
                  </p>
                </div>
              )}

              {/* If Not Pregnant (Nein) */}
              {!state.isPregnant && (state.pregnancyMonth || 0) === 0 && (
                <div className="text-[9.5px] text-slate-500 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 space-y-1">
                  <p className="font-semibold text-slate-400 flex items-center gap-1">
                    <i className="fa-solid fa-venus text-pink-400"></i> Empfängnis, Zyklus & Feststellung im Chat:
                  </p>
                  <p>
                    • <strong>Fruchtbares Zeitfenster:</strong> Eine Frau kann im Rollenspiel/Chat schwanger werden, wenn es im Empfängniszeitfenster (ca. Tag 10–16 des ~28-Tage-Zyklus) zu Intimität kommt.
                  </p>
                  <p>
                    • <strong>Feststellung & Symptome:</strong> Ab Woche 3–4 (Ende 1. Monat) zeigen sich erste Symptome (Morgenübelkeit, Zyklusausfall, feine Magie-/Aura-Sensibilität von Heilern).
                  </p>
                  <p>
                    • <strong>Bauchwölbung & Dauer:</strong> Ab Monat 3–4 wird der Babybauch deutlich sichtbar. Reguläre Gesamtdauer: 9 Monate.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Jungfräulichkeits- und Nachkommen-Status */}
          <div className="bg-slate-950/30 border border-slate-800/60 p-3 rounded-xl space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-venus-mars text-indigo-400"></i> Körperlicher Status & Nachkommen
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Jungfräulichkeitsstatus */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-bold">Jungfräulichkeit:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={readOnly || state.hasChildren || (state.childrenCount || 0) > 0}
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        isVirgin: true
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      state.isVirgin
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800/80 hover:text-slate-300'
                    }`}
                    title={state.hasChildren || (state.childrenCount || 0) > 0 ? 'Charaktere mit Nachkommen können nicht jungfräulich sein' : ''}
                  >
                    Jungfrau
                  </button>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        isVirgin: false
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      !state.isVirgin
                        ? 'bg-slate-850 text-slate-200 border-slate-750 font-bold shadow-sm'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800/80 hover:text-slate-300'
                    }`}
                  >
                    Nein
                  </button>
                </div>
              </div>

              {/* Nachkommen / Kinder */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-bold">Anzahl der Kinder:</label>
                <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-lg p-1 min-h-[28px]">
                  <button
                    type="button"
                    disabled={readOnly || (state.childrenCount || 0) <= 0}
                    onClick={() => {
                      setState(prev => {
                        const newCount = Math.max(0, (prev.childrenCount || 0) - 1);
                        const hasKids = newCount > 0;
                        return {
                          ...prev,
                          childrenCount: newCount,
                          hasChildren: hasKids,
                          isVirgin: hasKids ? false : prev.isVirgin
                        };
                      });
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-750 border border-slate-700/60 rounded text-slate-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <i className="fa-solid fa-minus text-[9px]"></i>
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-200 text-center flex-1">
                    {state.childrenCount || 0}
                  </span>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      setState(prev => {
                        const newCount = (prev.childrenCount || 0) + 1;
                        return {
                          ...prev,
                          childrenCount: newCount,
                          hasChildren: true,
                          isVirgin: false
                        };
                      });
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-750 border border-slate-700/60 rounded text-slate-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-[9px]"></i>
                  </button>
                </div>
              </div>
            </div>
            {/* Neutral notice if applicable */}
            {(state.hasChildren || (state.childrenCount || 0) > 0) && (
              <p className="text-[9px] text-slate-400 leading-normal">
                Hinweis: Charaktere mit Nachkommen werden automatisch als nicht jungfräulich eingestuft.
              </p>
            )}
          </div>

          {/* Vampire blood control */}
          <div className="bg-slate-950/30 border border-slate-800/60 p-3 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-droplet text-red-500"></i> Vampirismus & Blutvorrat
              </span>
              <input 
                type="checkbox"
                disabled={readOnly}
                checked={state.isVampire}
                onChange={e => setState(prev => ({ ...prev, isVampire: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 accent-indigo-600"
              />
            </div>
            
            {state.isVampire && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800/40">
                <div className="flex justify-between text-[9.5px] font-mono">
                  <span className="text-slate-400 font-bold">Blutvorrat</span>
                  <span className={state.vampireBlood <= 20 ? 'text-red-500 font-bold' : 'text-indigo-400 font-bold'}>
                    {state.vampireBlood}% {state.vampireBlood <= 20 && '(STRENGER MANGEL)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={readOnly}
                  value={state.vampireBlood}
                  onChange={e => setState(prev => ({ ...prev, vampireBlood: parseInt(e.target.value) }))}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                    state.vampireBlood <= 20 ? 'accent-red-500 bg-red-950' : 'accent-indigo-500 bg-slate-800'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Quick toggle beast features */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/60">
            <button
              disabled={readOnly}
              onClick={toggleWings}
              className={`py-1 px-2.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                finalWings
                  ? 'bg-amber-600/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
            >
              <i className="fa-solid fa-feather"></i> Flügel {finalWings ? 'Aktiv' : 'Aus'}
            </button>
            <button
              disabled={readOnly}
              onClick={toggleHorns}
              className={`py-1 px-2.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                finalHorns
                  ? 'bg-red-600/10 border-red-500/40 text-red-400'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
            >
              <i className="fa-solid fa-democrat"></i> Hörner {finalHorns ? 'Aktiv' : 'Aus'}
            </button>
          </div>
        </div>
        )}

        {/* TAB 3: INJURIES & BODY ZONES */}
        {activeSilhouetteTab === 'injuries' && (
        <div className="bg-slate-950/50 p-3.5 border border-slate-850 rounded-xl flex-1 flex flex-col justify-between min-h-[140px] animate-in fade-in duration-150">
          {selectedPart ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    Körperzone: <span className="text-indigo-400">{partLabels[selectedPart]}</span>
                  </span>
                  {!readOnly && (
                    <button 
                      onClick={() => setSelectedPart(null)} 
                      className="text-[9.5px] font-bold text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded"
                    >
                      Schließen
                    </button>
                  )}
                </div>

                {/* Existing Injuries on this part */}
                <div className="space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar mb-3">
                  {(state.injuries[selectedPart] || []).length === 0 ? (
                    <span className="text-[11px] text-emerald-400 font-medium italic block py-1 flex items-center gap-1.5">
                      <i className="fa-solid fa-leaf text-emerald-400"></i> Keine Verletzungen. Vollkommen unbeschädigt!
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(state.injuries[selectedPart] || []).map((injury, idx) => (
                        <div key={idx} className="bg-red-950/40 border border-red-900/40 rounded px-2 py-0.5 flex items-center gap-1.5 text-[10.5px]">
                          <span className="text-red-400 font-medium">{injury}</span>
                          {!readOnly && (
                            <button 
                              onClick={() => toggleInjury(selectedPart, injury)}
                              className="text-red-500 hover:text-red-300 text-[10px] font-extrabold focus:outline-none ml-1 shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 py-8 text-slate-500 h-full flex-1">
              <i className="fa-solid fa-crosshairs text-xl text-slate-600 mb-1.5"></i>
              <p className="text-[11px] font-semibold text-slate-400">Kein Körperteil ausgewählt</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                Klicke auf die Silhouette links, um Zustände an Armen, Beinen oder dem Kopf einzusehen.
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* PERMANENT SWAP CONFIRMATION MODAL */}
      {showPermanentSwapModal && activeTransformation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-arrows-rotate"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Dauerhafter Körpertausch / Neue Hauptgestalt</h3>
                <p className="text-[10.5px] text-amber-400 font-medium">Endgültige Formveränderung des Charakters</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <p>
                Möchtest du die physischen Eigenschaften & Identität der Form <strong className="text-amber-300">&ldquo;{activeTransformation.transformName || activeTransformation.name}&rdquo;</strong> dauerhaft als deine neue Hauptgestalt festlegen?
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                <li className="text-emerald-400 font-semibold">Deine ursprüngliche Gestalt & Geburtsidentität wird dauerhaft gesichert, damit dein bisheriges Leben nicht verloren geht.</li>
                <li>Die bisherige Ursprungsform bleibt als verwandelbare Gestalt in deinen Fähigkeiten erhalten.</li>
                <li>Name, Aussehen, Größe & Profil dieser Form werden dein neues Standard-Fundament.</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowPermanentSwapModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleMakePermanentMainBody}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <i className="fa-solid fa-check"></i>
                <span>Ja, Körper dauerhaft festlegen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM FULL BODY SWAP MODAL */}
      {showConfirmFullSwapModal && targetCharForFullSwap && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-amber-400 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg">
                <i className="fa-solid fa-arrows-rotate text-amber-400"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Vollständigen Körpertausch durchführen?
                </h3>
                <p className="text-[10px] text-slate-400">
                  Überträgt Profil, Beziehungen & Kampffähigkeiten von &quot;{targetCharForFullSwap.name}&quot;
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-400"></i> Folgende Daten werden auf deinen Charakter übertragen:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[10.5px] text-slate-300">
                <li><strong>Physisches Profil:</strong> Name, Geschlecht ({targetCharForFullSwap.gender || 'W'}), Rasse ({targetCharForFullSwap.race || 'Mensch'}), Größe ({targetCharForFullSwap.height || '170'}cm), Statur, Haare & Aussehen.</li>
                <li><strong>Beziehungen & Verhalten:</strong> Alle sozialen Bindungen und Conduct-Muster des Codex-Charakters werden aktiv.</li>
                <li><strong>Kampffähigkeiten & Kräfte:</strong> {targetCharForFullSwap.powerName || 'Kräfte'} und Techniken werden deinem Profil hinzugefügt.</li>
                <li><em>Dein ursprünglicher Körper wird als Backup gesichert und kann jederzeit wiederhergestellt werden.</em></li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmFullSwapModal(false);
                  setTargetCharForFullSwap(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => handleExecuteFullBodySwap(targetCharForFullSwap)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <i className="fa-solid fa-shuffle"></i>
                <span>Ja, Körpertausch aktivieren</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS TOAST */}
      {swapSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl z-[300] text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <i className="fa-solid fa-circle-check text-emerald-400 text-base"></i>
          <span>{swapSuccessToast}</span>
        </div>
      )}
    </div>
  );
};
