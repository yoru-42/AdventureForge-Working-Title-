// -*- coding: utf-8 -*-
import {
  Character,
  TechniqueItem,
  EffectiveTechniqueItem,
  TechniqueTransformationModifier,
  TransformationModifierType,
  PowerAbility,
  Adventure
} from '../types';
import { normalizeAbilityHierarchy } from './abilityHierarchy';

/**
 * Normalisiert Modifier-Typen für einheitlichen Vergleich.
 */
export function normalizeModifierType(type?: string): TransformationModifierType {
  if (!type) return 'weiterentwicklung';
  const norm = type.toLowerCase().trim();
  if (norm === 'unchanged' || norm === 'unverändert' || norm === 'unveraendert') return 'unverändert';
  if (norm === 'evolve' || norm === 'weiterentwicklung') return 'weiterentwicklung';
  if (norm === 'enhance' || norm === 'verstärkung' || norm === 'verstaerkung') return 'verstärkung';
  if (norm === 'modify' || norm === 'veränderung' || norm === 'veraenderung') return 'veränderung';
  if (norm === 'replace' || norm === 'ersetzung') return 'ersetzung';
  if (norm === 'disable' || norm === 'deaktiviert' || norm === 'gesperrt') return 'deaktiviert';
  return 'weiterentwicklung';
}

/**
 * Ermittelt die Liste aller Transformation-Stufen (inkl. Vererbungskette / parentTransformationId).
 */
export function getTransformationChain(
  character: Character,
  activeTransId: string
): PowerAbility[] {
  if (!activeTransId || activeTransId === 'standard') return [];

  const abilities = character.abilities || [];
  const chain: PowerAbility[] = [];
  const visited = new Set<string>();

  let currentId: string | undefined = activeTransId;

  while (currentId && currentId !== 'standard' && !visited.has(currentId)) {
    visited.add(currentId);
    const found = abilities.find(
      a => (a.category === 'Transformationen' || (a.type || '').toLowerCase().includes('transform') || !!a.transformName) &&
           (a.id === currentId || a.name?.toLowerCase() === currentId?.toLowerCase() || a.transformName?.toLowerCase() === currentId?.toLowerCase())
    );

    if (found) {
      chain.push(found);
      currentId = found.parentTransformationId;
    } else {
      break;
    }
  }

  return chain;
}

export interface ResolveMovesetOptions {
  /**
   * Wenn true, werden auch deaktivierte Techniken im Ergebnis behalten (mit isDisabledInTransformation: true)
   */
  includeDisabled?: boolean;
  /**
   * Wenn true, wird die Transformations-Aktivierung selbst nicht herausgefiltert
   */
  includeTransformActivation?: boolean;
}

/**
 * Zentrale Auflösung des effektiven Movesets für einen Charakter.
 * 
 * Modell:
 * Character
 *    ↓
 * Basis-Techniken
 *    ↓
 * aktive Transformation (falls != 'standard')
 *    ↓
 * Transformation-Modifikatoren
 *    ↓
 * effektives Moveset (unveränderte Basis-Techniken + modifizierte/weiterentwickelte Techniken + freigeschaltete Techniken)
 */
export function resolveEffectiveMoveset(
  character: Character,
  activeTransIdOverride?: string,
  options: ResolveMovesetOptions = {}
): EffectiveTechniqueItem[] {
  if (!character) return [];

  const activeTransId = activeTransIdOverride !== undefined
    ? activeTransIdOverride
    : (character.appearance?.activeTransformationId || 'standard');

  const { includeDisabled = false, includeTransformActivation = false } = options;

  // 1. Alle Techniken über die zentrale Hierarchie ermitteln
  const hierarchy = normalizeAbilityHierarchy(character);
  const allTechniques: TechniqueItem[] = hierarchy.techniques;

  // 2. Transformation-Abilities sammeln
  const allAbilities = character.abilities || [];
  const transAbilities = allAbilities.filter(
    a => a.category === 'Transformationen' || (a.type || '').toLowerCase().includes('transform') || !!a.transformName
  );

  const activeTransChain = getTransformationChain(character, activeTransId);
  const activeTrans = activeTransChain[0] || transAbilities.find(
    t => t.id === activeTransId || t.transformName === activeTransId || t.name === activeTransId
  );

  const activeTransKeys = new Set<string>();
  if (activeTransId && activeTransId !== 'standard') {
    activeTransKeys.add(activeTransId.toLowerCase());
  }
  activeTransChain.forEach(t => {
    if (t.id) activeTransKeys.add(t.id.toLowerCase());
    if (t.name) activeTransKeys.add(t.name.toLowerCase());
    if (t.transformName) activeTransKeys.add(t.transformName.toLowerCase());
  });

  // 3. Basistechniken vs. nur in Transformation verfügbare Techniken trennen
  const isTechniqueRestrictedToTransformation = (tech: TechniqueItem): boolean => {
    if (tech.isTransformationOnly) return true;
    if (tech.unlockedByTransformationId && tech.unlockedByTransformationId.trim().length > 0) return true;
    if (Array.isArray(tech.unlockedByTransformationIds) && tech.unlockedByTransformationIds.length > 0) return true;
    
    // Prüfen, ob die Technik in den unlockedTechniqueIds einer Transformation vorkommt
    const isUnlockedByAnyTrans = transAbilities.some(ta => 
      Array.isArray(ta.unlockedTechniqueIds) && 
      (ta.unlockedTechniqueIds.includes(tech.id) || (tech.name && ta.unlockedTechniqueIds.includes(tech.name)))
    );
    if (isUnlockedByAnyTrans) return true;

    // Prüfen, ob die Technik aus einer Transformations-Ability stammt
    const parentTrans = transAbilities.find(ta =>
      ta.id === tech.powerSourceId ||
      (Array.isArray(ta.techniqueList) && ta.techniqueList.some(t => t.id === tech.id || t.name?.toLowerCase() === tech.name?.toLowerCase()))
    );
    if (parentTrans) {
      if (!tech.unlockedByTransformationId) {
        tech.unlockedByTransformationId = parentTrans.id;
      }
      return true;
    }

    return false;
  };

  const isTransformActivationOrDetransform = (tech: TechniqueItem): boolean => {
    const nameLower = (tech.name || '').toLowerCase();
    if (nameLower.startsWith('verwandlung:') || nameLower.startsWith('zurückverwandlung')) return true;
    if (tech.category === 'Transformationen' && tech.type === 'Transformation') {
      // Wenn es eine Aktivierungstechnik ist
      if (transAbilities.some(t => (t.transformName || t.name || '').toLowerCase() === nameLower)) {
        return true;
      }
    }
    return false;
  };

  const baseTechniques: TechniqueItem[] = [];
  const unlockedPool: TechniqueItem[] = [];

  allTechniques.forEach(t => {
    if (!includeTransformActivation && isTransformActivationOrDetransform(t)) {
      return;
    }

    if (isTechniqueRestrictedToTransformation(t)) {
      unlockedPool.push(t);
    } else {
      baseTechniques.push(t);
    }
  });

  // Lookup-Map aller verfügbaren Techniken für saubere ID-basierte Referenzierung
  const allAvailableTechniquesMap = new Map<string, TechniqueItem>();
  allTechniques.forEach(t => {
    if (t.id) allAvailableTechniquesMap.set(t.id, t);
    if (t.name) allAvailableTechniquesMap.set(t.name.toLowerCase(), t);
  });
  if (Array.isArray(character.techniqueList)) {
    character.techniqueList.forEach(t => {
      if (t.id && !allAvailableTechniquesMap.has(t.id)) allAvailableTechniquesMap.set(t.id, t);
      if (t.name && !allAvailableTechniquesMap.has(t.name.toLowerCase())) allAvailableTechniquesMap.set(t.name.toLowerCase(), t);
    });
  }
  allAbilities.forEach(a => {
    if (Array.isArray(a.techniqueList)) {
      a.techniqueList.forEach(t => {
        if (t.id && !allAvailableTechniquesMap.has(t.id)) allAvailableTechniquesMap.set(t.id, t);
        if (t.name && !allAvailableTechniquesMap.has(t.name.toLowerCase())) allAvailableTechniquesMap.set(t.name.toLowerCase(), t);
      });
    }
  });

  // 4. Wenn Standardform (keine Verwandlung aktiv)
  if (!activeTransId || activeTransId === 'standard' || !activeTrans) {
    return baseTechniques.map(base => ({
      ...base,
      originalTechniqueId: base.id,
      originalTechniqueName: base.name,
      isModifiedByTransformation: false,
      isUnlockedByTransformation: false,
      isDisabledInTransformation: false
    }));
  }

  // 5. Verwandlung ist aktiv: Wende Modifikatoren auf Basis-Techniken an
  const effectiveList: EffectiveTechniqueItem[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  baseTechniques.forEach(base => {
    // Suche nach dem passenden Modifikator in der Kette (spezifischste Stufe zuerst)
    let matchedModifier: TechniqueTransformationModifier | undefined = undefined;

    if (Array.isArray(base.transformationModifiers)) {
      for (const transKey of activeTransKeys) {
        matchedModifier = base.transformationModifiers.find(m =>
          m.transformationId?.toLowerCase() === transKey ||
          (m.transformationName && m.transformationName.toLowerCase() === transKey)
        );
        if (matchedModifier) break;
      }
    }

    // Wenn kein direkter Modifikator auf der Technik definiert ist,
    // prüfe ob die Transformation selbst eine Technik-Überschreibung für diesen Namen/ID hat
    if (!matchedModifier && Array.isArray((activeTrans as any).transformationMovesetModifiers)) {
      const transMods: TechniqueTransformationModifier[] = (activeTrans as any).transformationMovesetModifiers;
      matchedModifier = transMods.find(m =>
        m.transformationId === base.id ||
        (m.overrideName && m.overrideName.toLowerCase() === base.name.toLowerCase())
      );
    }

    if (matchedModifier) {
      const modType = normalizeModifierType(matchedModifier.modifierType);
      const isDisabled = matchedModifier.disabled === true || modType === 'deaktiviert';

      if (isDisabled) {
        if (includeDisabled) {
          seenIds.add(base.id);
          seenNames.add(base.name.toLowerCase());
          effectiveList.push({
            ...base,
            originalTechniqueId: base.id,
            originalTechniqueName: base.name,
            isModifiedByTransformation: true,
            modificationType: 'deaktiviert',
            appliedModifier: matchedModifier,
            isDisabledInTransformation: true,
            transformationId: activeTransId,
            transformationName: activeTrans.transformName || activeTrans.name
          });
        }
        // Ansonsten wird deaktivierte Technik aus dem aktiven Moveset weggelassen
        return;
      }

      if (modType === 'unverändert') {
        // Explizit unverändert
        seenIds.add(base.id);
        seenNames.add(base.name.toLowerCase());
        effectiveList.push({
          ...base,
          originalTechniqueId: base.id,
          originalTechniqueName: base.name,
          isModifiedByTransformation: false,
          modificationType: 'unverändert',
          appliedModifier: matchedModifier,
          isDisabledInTransformation: false,
          transformationId: activeTransId,
          transformationName: activeTrans.transformName || activeTrans.name
        });
        return;
      }

      // Weiterentwickeln / Verstärken / Verändern / Ersetzen
      const effectiveName = matchedModifier.overrideName?.trim() || base.name;
      const effectiveId = `${base.id}_trans_${activeTransId}`;
      seenIds.add(base.id);
      seenIds.add(effectiveId);
      seenNames.add(effectiveName.toLowerCase());

      const effectiveTech: EffectiveTechniqueItem = {
        ...base,
        id: effectiveId,
        name: effectiveName,
        description: matchedModifier.overrideDescription !== undefined ? matchedModifier.overrideDescription : base.description,
        cost: matchedModifier.overrideCost !== undefined ? matchedModifier.overrideCost : base.cost,
        costValue: matchedModifier.overrideCostValue !== undefined ? matchedModifier.overrideCostValue : base.costValue,
        costResourceName: matchedModifier.overrideCostResourceName !== undefined ? matchedModifier.overrideCostResourceName : base.costResourceName,
        type: matchedModifier.overrideType || base.type,
        subtype: matchedModifier.overrideSubtype !== undefined ? matchedModifier.overrideSubtype : base.subtype,
        mode: matchedModifier.overrideMode || base.mode,
        tier: matchedModifier.overrideTier || base.tier,
        effects: matchedModifier.overrideEffects || base.effects,
        baseValue: matchedModifier.overrideBaseValue !== undefined ? matchedModifier.overrideBaseValue : base.baseValue,
        effectValue: matchedModifier.overrideEffectValue !== undefined ? matchedModifier.overrideEffectValue : base.effectValue,
        range: matchedModifier.overrideRange !== undefined ? matchedModifier.overrideRange : base.range,
        duration: matchedModifier.overrideDuration !== undefined ? matchedModifier.overrideDuration : base.duration,
        originalTechniqueId: base.id,
        originalTechniqueName: base.name,
        isModifiedByTransformation: true,
        modificationType: modType,
        appliedModifier: matchedModifier,
        isDisabledInTransformation: false,
        transformationId: activeTransId,
        transformationName: activeTrans.transformName || activeTrans.name
      };

      effectiveList.push(effectiveTech);
    } else {
      // Kein Modifikator vorhanden: Technik bleibt UNVERÄNDERT im Moveset erhalten!
      seenIds.add(base.id);
      seenNames.add(base.name.toLowerCase());
      effectiveList.push({
        ...base,
        originalTechniqueId: base.id,
        originalTechniqueName: base.name,
        isModifiedByTransformation: false,
        isUnlockedByTransformation: false,
        isDisabledInTransformation: false
      });
    }
  });

  // 6. Freigeschaltete Techniken der aktiven Transformation hinzufügen

  // 6a. Strukturierte ID-Referenzen aus PowerAbility.unlockedTechniqueIds (bevorzugt)
  activeTransChain.forEach(transAbil => {
    if (Array.isArray(transAbil.unlockedTechniqueIds)) {
      transAbil.unlockedTechniqueIds.forEach(targetId => {
        if (!targetId || !targetId.trim()) return;
        const targetClean = targetId.trim();
        const found = allAvailableTechniquesMap.get(targetClean) || allAvailableTechniquesMap.get(targetClean.toLowerCase());
        if (found) {
          const lower = found.name.toLowerCase();
          if (!seenIds.has(found.id) && !seenNames.has(lower)) {
            seenIds.add(found.id);
            seenNames.add(lower);
            effectiveList.push({
              ...found,
              id: found.id, // Original-ID exakt erhalten
              originalTechniqueId: found.id,
              originalTechniqueName: found.name,
              isModifiedByTransformation: false,
              isUnlockedByTransformation: true,
              transformationId: activeTransId,
              transformationName: activeTrans.transformName || activeTrans.name,
              isDisabledInTransformation: false
            });
          }
        }
      });
    }
  });

  // 6b. Aus unlockedPool (unlockedByTransformationId / unlockedByTransformationIds)
  const isUnlockedForCurrentTransformation = (tech: TechniqueItem): boolean => {
    if (tech.unlockedByTransformationId) {
      const matchId = tech.unlockedByTransformationId.trim().toLowerCase();
      if (activeTransKeys.has(matchId)) return true;
    }
    if (Array.isArray(tech.unlockedByTransformationIds)) {
      if (tech.unlockedByTransformationIds.some(id => activeTransKeys.has(id.trim().toLowerCase()))) {
        return true;
      }
    }
    return false;
  };

  unlockedPool.forEach(unlocked => {
    if (isUnlockedForCurrentTransformation(unlocked)) {
      const lower = unlocked.name.toLowerCase();
      if (!seenIds.has(unlocked.id) && !seenNames.has(lower)) {
        seenIds.add(unlocked.id);
        seenNames.add(lower);
        effectiveList.push({
          ...unlocked,
          id: unlocked.id, // Original-ID erhalten
          originalTechniqueId: unlocked.id,
          originalTechniqueName: unlocked.name,
          isModifiedByTransformation: false,
          isUnlockedByTransformation: true,
          transformationId: activeTransId,
          transformationName: activeTrans.transformName || activeTrans.name,
          isDisabledInTransformation: false
        });
      }
    }
  });

  // 6c. Legacy-Kompatibilität: Aus der Transformation Ability selbst (techniqueList auf der Ability)
  activeTransChain.forEach(transAbil => {
    if (Array.isArray(transAbil.techniqueList)) {
      transAbil.techniqueList.forEach(t => {
        if (!t || !t.name || !t.name.trim()) return;
        if (!includeTransformActivation && isTransformActivationOrDetransform(t)) return;

        const lower = t.name.trim().toLowerCase();
        const tId = t.id || `unlocked_${transAbil.id}_${Math.random().toString(36).substr(2, 6)}`;
        if (!seenIds.has(tId) && !seenNames.has(lower)) {
          seenIds.add(tId);
          seenNames.add(lower);
          effectiveList.push({
            ...t,
            id: tId,
            name: t.name.trim(),
            category: t.category || 'Techniken',
            type: t.type || 'Angriff',
            isModifiedByTransformation: false,
            isUnlockedByTransformation: true,
            transformationId: activeTransId,
            transformationName: activeTrans.transformName || activeTrans.name,
            isDisabledInTransformation: false
          });
        }
      });
    }
  });

  return effectiveList;
}

/**
 * Helfer zur Ermittlung des Movesets direkt aus einem Adventure-Objekt.
 */
export function resolveAdventurePlayerMoveset(
  adventure: Adventure,
  options?: ResolveMovesetOptions
): EffectiveTechniqueItem[] {
  if (!adventure || !adventure.player) return [];
  const activeTransId = adventure.player.appearance?.activeTransformationId || 'standard';
  return resolveEffectiveMoveset(adventure.player, activeTransId, options);
}
