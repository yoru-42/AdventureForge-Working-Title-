// -*- coding: utf-8 -*-
import { Character, TechniqueItem, PowerAbility } from '../types';
import { resolveEffectiveMoveset } from '../utils/movesetResolver';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`[PASS] ${msg}`);
}

export function runMovesetResolverTests() {
  console.log('=== RUNNING TRANSFORMATION MOVESET RESOLVER TESTS ===');

  // Testfall aus der Spezifikation:
  // Normal:
  // 1. Elementarmanipulation
  // 2. Heilende Berührung
  // 3. Begrenzte Telekinese
  // 4. Empathie spüren
  // 5. Schutzbarrieren
  //
  // Esper:
  // Elementarmanipulation -> Esper: Elementarkontrolle (weiterentwickelt)
  // Begrenzte Telekinese -> Esper: Telekinese (weiterentwickelt)
  // Heilende Berührung -> Esper: unverändert
  // Empathie spüren -> Esper: unverändert
  // Schutzbarrieren -> Esper: unverändert
  // Esper freigeschaltet:
  // + Dimensionsrisse
  // + Levitation
  // + Absorption
  // + Unterdrückung / Energieexplosion

  const baseTech1: TechniqueItem = {
    id: 't_elem',
    name: 'Elementarmanipulation',
    description: 'Einfache Kontrolle über Elemente.',
    type: 'Angriff',
    tier: 'Tier 1',
    cost: '10 MP',
    costValue: 10,
    transformationModifiers: [
      {
        transformationId: 'trans_esper',
        transformationName: 'Esper',
        modifierType: 'weiterentwicklung',
        overrideName: 'Elementarkontrolle',
        overrideDescription: 'Präzise und mächtige Kontrolle aller Elemente.',
        overrideTier: 'Tier 3',
        overrideCost: '25 MP',
        overrideCostValue: 25
      },
      {
        transformationId: 'trans_awakened_esper',
        transformationName: 'Erwachte Esper',
        modifierType: 'ersetzung',
        overrideName: 'Kosmische Elementarbeherrschung',
        overrideDescription: 'Vollendete Beherrschung aller Naturgesetze.',
        overrideTier: 'Tier 4',
        overrideCost: '50 MP',
        overrideCostValue: 50
      }
    ]
  };

  const baseTech2: TechniqueItem = {
    id: 't_heal',
    name: 'Heilende Berührung',
    description: 'Heilt leichte Wunden durch Berührung.',
    type: 'Heilung',
    cost: '15 MP',
    costValue: 15
    // Kein Modifikator: bleibt in Esper unverändert
  };

  const baseTech3: TechniqueItem = {
    id: 't_tele',
    name: 'Begrenzte Telekinese',
    description: 'Hebt kleine Gegenstände an.',
    type: 'Support',
    cost: '5 MP',
    costValue: 5,
    transformationModifiers: [
      {
        transformationId: 'trans_esper',
        modifierType: 'weiterentwicklung',
        overrideName: 'Telekinese',
        overrideDescription: 'Mächtige psychokinetische Manipulation von Objekten und Feinden.'
      }
    ]
  };

  const baseTech4: TechniqueItem = {
    id: 't_empathy',
    name: 'Empathie spüren',
    description: 'Nimmt Gefühle von Wesen in der Nähe wahr.',
    type: 'Support',
    cost: '0 MP',
    costValue: 0
  };

  const baseTech5: TechniqueItem = {
    id: 't_shield',
    name: 'Schutzbarrieren',
    description: 'Errichtet eine schwache Barriere.',
    type: 'Verteidigung',
    cost: '20 MP',
    costValue: 20
  };

  const unlockedTech1: TechniqueItem = {
    id: 't_rift',
    name: 'Dimensionsrisse',
    description: 'Reißt den Raum auf.',
    type: 'Angriff',
    cost: '40 MP',
    unlockedByTransformationId: 'trans_esper'
  };

  const unlockedTech2: TechniqueItem = {
    id: 't_levitate',
    name: 'Levitation',
    description: 'Schwebt frei in der Luft.',
    type: 'Support',
    cost: '10 MP',
    unlockedByTransformationId: 'trans_esper'
  };

  const esperAbility: PowerAbility = {
    id: 'trans_esper',
    name: 'Esper',
    transformName: 'Esper',
    category: 'Transformationen',
    source: 'Esper-Kräfte',
    cost: '30 MP',
    description: 'Entfesselt das volle psychische Potenzial.',
    techniques: 'Dimensionsrisse, Levitation, Absorption, Unterdrückung / Energieexplosion',
    techniqueList: [
      {
        id: 't_absorb',
        name: 'Absorption',
        description: 'Saugt gegnerische Energie ab.',
        type: 'Support',
        cost: '20 MP'
      },
      {
        id: 't_suppress',
        name: 'Unterdrückung / Energieexplosion',
        description: 'Entlädt eine Schockwelle psychischer Energie.',
        type: 'Angriff',
        cost: '50 MP'
      }
    ]
  };

  const awakenedEsperAbility: PowerAbility = {
    id: 'trans_awakened_esper',
    name: 'Erwachte Esper',
    transformName: 'Erwachte Esper',
    parentTransformationId: 'trans_esper', // Stufenhierarchie
    category: 'Transformationen',
    source: 'Kosmische Esper-Kräfte',
    cost: '60 MP',
    description: 'Göttliche Stufe der Esper-Erweckung.',
    techniques: 'Singularität',
    techniqueList: [
      {
        id: 't_singularity',
        name: 'Singularität',
        description: 'Erschafft ein kosmisches Gravitationszentrum.',
        type: 'Angriff',
        cost: '80 MP'
      }
    ]
  };

  const testChar: Character = {
    name: 'Hoshiko',
    role: 'Schülerin & Esper',
    powerSource: 'Psychische Energie',
    personality: 'Ruhig und konzentriert',
    bio: 'Eine talentierte Esper-Schülerin.',
    attributes: [],
    appearance: {
      activeTransformationId: 'standard',
      gender: 'Weiblich',
      race: 'Mensch',
      hairColor: 'Schwarz',
      eyeColor: 'Dunkelbraun',
      age: '17',
      build: 'Schlank'
    },
    abilities: [esperAbility, awakenedEsperAbility],
    techniqueList: [
      baseTech1,
      baseTech2,
      baseTech3,
      baseTech4,
      baseTech5,
      unlockedTech1,
      unlockedTech2
    ]
  };

  // 1. Test Standard-Moveset (Normal)
  const normalMoveset = resolveEffectiveMoveset(testChar, 'standard');
  assert(normalMoveset.length === 5, 'Normaler Zustand hat exakt die 5 Basistechniken');
  const normalNames = normalMoveset.map(t => t.name);
  assert(normalNames.includes('Elementarmanipulation'), 'Normal hat Elementarmanipulation');
  assert(normalNames.includes('Begrenzte Telekinese'), 'Normal hat Begrenzte Telekinese');
  assert(normalNames.includes('Heilende Berührung'), 'Normal hat Heilende Berührung');
  assert(normalNames.includes('Empathie spüren'), 'Normal hat Empathie spüren');
  assert(normalNames.includes('Schutzbarrieren'), 'Normal hat Schutzbarrieren');
  assert(!normalNames.includes('Elementarkontrolle'), 'Normal hat NICHT Elementarkontrolle');
  assert(!normalNames.includes('Dimensionsrisse'), 'Normal hat NICHT die Esper-exklusiven Dimensionsrisse');
  assert(!normalNames.includes('Absorption'), 'Normal hat NICHT Esper Absorption');

  // 2. Test Esper-Moveset (Transformiert)
  const esperMoveset = resolveEffectiveMoveset(testChar, 'trans_esper');
  const esperNames = esperMoveset.map(t => t.name);

  assert(esperNames.includes('Elementarkontrolle'), 'Esper hat modifizierte Elementarkontrolle');
  assert(!esperNames.includes('Elementarmanipulation'), 'Esper hat Elementarmanipulation ersetzt');
  assert(esperNames.includes('Telekinese'), 'Esper hat modifizierte Telekinese');
  assert(!esperNames.includes('Begrenzte Telekinese'), 'Esper hat Begrenzte Telekinese ersetzt');
  assert(esperNames.includes('Heilende Berührung'), 'Esper behält Heilende Berührung unverändert');
  assert(esperNames.includes('Empathie spüren'), 'Esper behält Empathie spüren unverändert');
  assert(esperNames.includes('Schutzbarrieren'), 'Esper behält Schutzbarrieren unverändert');

  // Freigeschaltete Techniken in Esper
  assert(esperNames.includes('Dimensionsrisse'), 'Esper schaltet Dimensionsrisse frei');
  assert(esperNames.includes('Levitation'), 'Esper schaltet Levitation frei');
  assert(esperNames.includes('Absorption'), 'Esper schaltet Absorption frei');
  assert(esperNames.includes('Unterdrückung / Energieexplosion'), 'Esper schaltet Unterdrückung / Energieexplosion frei');
  assert(esperMoveset.length === 9, 'Esper Moveset umfasst exakt 9 Techniken (5 Basis modifiziert/unverändert + 4 freigeschaltet)');

  const elemTech = esperMoveset.find(t => t.name === 'Elementarkontrolle');
  assert(elemTech?.isModifiedByTransformation === true, 'Elementarkontrolle ist als modifiziert markiert');
  assert(elemTech?.originalTechniqueName === 'Elementarmanipulation', 'Originalname ist Elementarmanipulation');
  assert(elemTech?.cost === '25 MP', 'Modifizierte Kosten sind 25 MP');
  assert(elemTech?.tier === 'Tier 3', 'Modifizierter Tier ist Tier 3');

  const healTech = esperMoveset.find(t => t.name === 'Heilende Berührung');
  assert(healTech?.isModifiedByTransformation === false, 'Heilende Berührung ist nicht als modifiziert markiert');

  const dimTech = esperMoveset.find(t => t.name === 'Dimensionsrisse');
  assert(dimTech?.isUnlockedByTransformation === true, 'Dimensionsrisse ist als freigeschaltet markiert');

  // 3. Test Stufenhierarchie (Erwachte Esper erbt Esper-Techniken & überschreibt Kosmisch)
  const awakenedMoveset = resolveEffectiveMoveset(testChar, 'trans_awakened_esper');
  const awakenedNames = awakenedMoveset.map(t => t.name);

  assert(awakenedNames.includes('Kosmische Elementarbeherrschung'), 'Erwachte Esper hat Kosmische Elementarbeherrschung');
  assert(awakenedNames.includes('Telekinese'), 'Erwachte Esper erbt Telekinese von Esper');
  assert(awakenedNames.includes('Singularität'), 'Erwachte Esper schaltet Singularität frei');
  assert(awakenedNames.includes('Dimensionsrisse'), 'Erwachte Esper erbt freigeschaltete Dimensionsrisse');

  // 4. Test Deaktivierung: Deaktivierte Technik wird nicht im Moveset angezeigt
  const disabledChar: Character = {
    ...testChar,
    techniqueList: [
      {
        ...baseTech1,
        transformationModifiers: [
          {
            transformationId: 'trans_esper',
            modifierType: 'deaktiviert',
            disabled: true
          }
        ]
      },
      baseTech2
    ]
  };
  const movesetWithDisabled = resolveEffectiveMoveset(disabledChar, 'trans_esper');
  const namesWithDisabled = movesetWithDisabled.map(t => t.name);
  assert(!namesWithDisabled.includes('Elementarmanipulation'), 'Deaktivierte Technik ist im effektiven Moveset nicht enthalten');
  assert(namesWithDisabled.includes('Heilende Berührung'), 'Nicht deaktivierte Technik bleibt enthalten');

  const movesetWithDisabledIncluded = resolveEffectiveMoveset(disabledChar, 'trans_esper', { includeDisabled: true });
  const disabledItem = movesetWithDisabledIncluded.find(t => t.name === 'Elementarmanipulation');
  assert(disabledItem?.isDisabledInTransformation === true, 'Mit includeDisabled wird die Technik als gesperrt markiert');

  // 5. Test Rückverwandlung: Sobald activeTransformationId wieder standard ist, ist das Basismoveset wieder da
  const detransformedMoveset = resolveEffectiveMoveset(testChar, 'standard');
  assert(detransformedMoveset.length === 5, 'Rückverwandlung auf Standard liefert wieder exakt die 5 Basistechniken');
  assert(detransformedMoveset.some(t => t.name === 'Elementarmanipulation'), 'Elementarmanipulation ist wieder da');
  assert(!detransformedMoveset.some(t => t.name === 'Elementarkontrolle'), 'Elementarkontrolle ist nicht mehr da');

  console.log('=== ALL TRANSFORMATION MOVESET RESOLVER TESTS PASSED ===\n');
}

runMovesetResolverTests();
