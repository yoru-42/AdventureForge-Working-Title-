import { Character, PowerAbility, TechniqueItem, CharacterPowerSource, BaseAbility } from '../types';
import { 
  CATEGORY_TABS, 
  CATEGORY_ADD_LABELS, 
  CATEGORY_EMPTY_LABELS,
  TRANS_CATEGORY_TABS,
  TRANS_CATEGORY_ADD_LABELS,
  TRANS_CATEGORY_EMPTY_LABELS
} from '../components/TechniqueHierarchyTree';
import { normalizeAbilityHierarchy, syncCharacterAbilityTree } from '../utils/abilityHierarchy';
import { resolveEffectiveMoveset, getTransformationChain } from '../utils/movesetResolver';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

export function runTechniqueHierarchyTreeTransformationTests() {
  console.log('\n--- Starte TechniqueHierarchyTree & Transformation-Trennung Tests ---');

  // Test 1: CATEGORY_TABS darf keine "Transformationen" mehr enthalten
  console.log('\n--- Test 1: CATEGORY_TABS Überprüfung ---');
  assert(!((CATEGORY_TABS as readonly string[]).includes('Transformationen')), 'Test 1a: CATEGORY_TABS enthält NICHT "Transformationen"');
  assert((CATEGORY_TABS as readonly string[]).includes('Passive Fähigkeiten'), 'Test 1b: Enthält "Passive Fähigkeiten"');
  assert((CATEGORY_TABS as readonly string[]).includes('Techniken'), 'Test 1c: Enthält "Techniken"');
  assert((CATEGORY_TABS as readonly string[]).includes('Ultimative Techniken'), 'Test 1d: Enthält "Ultimative Techniken"');
  assert((CATEGORY_TABS as readonly string[]).includes('Waffenbeherrschung'), 'Test 1e: Enthält "Waffenbeherrschung"');
  assert(CATEGORY_TABS.length === 4, 'Test 1f: Genau 4 Standard-Kategorien definiert');

  // Test 2: CATEGORY_ADD_LABELS & EMPTY_LABELS
  console.log('\n--- Test 2: Labels Überprüfung ---');
  assert(!('Transformationen' in CATEGORY_ADD_LABELS), 'Test 2a: CATEGORY_ADD_LABELS enthält keine Transformationen');
  assert(!('Transformationen' in CATEGORY_EMPTY_LABELS), 'Test 2b: CATEGORY_EMPTY_LABELS enthält keine Transformationen');

  // Test 3: Saubere Trennung von Standard-Fähigkeiten und Transformationen im Datenmodell
  console.log('\n--- Test 3: Normalisierung & Trennung ---');
  const mockPlayer: Character = {
    id: 'char-hero-1',
    name: 'Lysander',
    role: 'Magier',
    personality: 'Ruhig und analytisch',
    bio: 'Ein Meister der Elementarkunst.',
    attributes: {} as any,
    appearance: {
      activeTransformationId: 'standard'
    } as any,
    powerSources: [
      {
        id: 'ps_mana',
        source: 'Mana-Kern',
        powerName: 'Mana-Kern',
        cost: 'MP'
      }
    ],
    baseAbilities: [
      {
        id: 'ba_fire',
        powerSourceId: 'ps_mana',
        powerSourceName: 'Mana-Kern',
        name: 'Pyrokinese',
        displayName: 'Pyrokinese',
        element: 'Feuer',
        abilityType: 'creation_manipulation',
        techniqueIds: ['tech_1', 'tech_2', 'trans_1']
      }
    ],
    techniqueList: [
      {
        id: 'tech_1',
        name: 'Feuerball',
        category: 'Techniken',
        type: 'Angriff',
        costValue: 10,
        baseAbilityIds: ['ba_fire']
      },
      {
        id: 'tech_2',
        name: 'Feueraura',
        category: 'Passive Fähigkeiten',
        type: 'Support',
        costValue: 0,
        baseAbilityIds: ['ba_fire']
      },
      {
        id: 'trans_1',
        name: 'Phönix-Gestalt',
        transformName: 'Phönix-Gestalt',
        category: 'Transformationen',
        type: 'Transformation',
        metamorphosisInfluence: 100,
        parentTransformationId: 'standard',
        chibiForm: {
          enabled: true,
          bodyScale: 0.65
        },
        baseAbilityIds: ['ba_fire']
      }
    ]
  };

  const { powerSources, baseAbilities, techniques } = normalizeAbilityHierarchy(mockPlayer);

  const standardTechs = techniques.filter(t => t.type !== 'Transformation' && t.category !== 'Transformationen');
  const transTechs = techniques.filter(t => t.type === 'Transformation' || t.category === 'Transformationen');

  assert(standardTechs.length === 2, 'Test 3a: Genau 2 Standard-Techniken identifiziert (Feuerball, Feueraura)');
  assert(transTechs.length === 1, 'Test 3b: Genau 1 Transformation identifiziert (Phönix-Gestalt)');
  assert(transTechs[0].transformName === 'Phönix-Gestalt', 'Test 3c: Transformationsdaten bleiben intakt');
  assert(transTechs[0].chibiForm?.enabled === true, 'Test 3d: Chibi-Konfiguration bleibt erhalten');

  // Test 4: Mehrstufige Transformationen (Parent-Child Kette)
  console.log('\n--- Test 4: Mehrstufige Transformationen ---');
  const multiStagePlayer: Character = {
    ...mockPlayer,
    techniqueList: [
      ...mockPlayer.techniqueList!,
      {
        id: 'trans_2',
        name: 'Ewiger Phönix',
        transformName: 'Ewiger Phönix',
        category: 'Transformationen',
        type: 'Transformation',
        metamorphosisInfluence: 100,
        parentTransformationId: 'trans_1',
        baseAbilityIds: ['ba_fire']
      }
    ]
  };

  const syncedPlayer = syncCharacterAbilityTree(
    multiStagePlayer,
    powerSources,
    baseAbilities,
    multiStagePlayer.techniqueList!
  );

  const movesetNormal = resolveEffectiveMoveset(syncedPlayer, 'standard');
  assert(movesetNormal.some(t => t.name === 'Feuerball'), 'Test 4a: Feuerball ist in Normalform aktiv');

  const chainStandard = getTransformationChain(syncedPlayer, 'standard');
  assert(chainStandard.length === 0, 'Test 4b: Normalform hat keine Transformation in der Kette');

  const chainTrans1 = getTransformationChain(syncedPlayer, 'trans_1');
  assert(chainTrans1.length === 1, 'Test 4c: Stufe 1 Transformation hat 1 Kettenglied');
  assert(chainTrans1[0].name === 'Phönix-Gestalt' || chainTrans1[0].transformName === 'Phönix-Gestalt', 'Test 4d: Korrekte Stufe 1 aufgelöst');

  const chainTrans2 = getTransformationChain(syncedPlayer, 'trans_2');
  assert(chainTrans2.length === 2, 'Test 4e: Stufe 2 Transformation erbt von Stufe 1 (2 Kettenglieder)');
  assert(chainTrans2[0].name === 'Ewiger Phönix' || chainTrans2[0].transformName === 'Ewiger Phönix', 'Test 4f: Stufe 2 steht an erster Stelle');
  assert(chainTrans2[1].name === 'Phönix-Gestalt' || chainTrans2[1].transformName === 'Phönix-Gestalt', 'Test 4g: Stufe 1 ist Eltern-Transformation');

  // Test 5: Rückwärtskompatibilität für alte Charaktere mit category: 'Transformationen'
  console.log('\n--- Test 5: Rückwärtskompatibilität alter Charaktere ---');
  const legacyChar: Character = {
    id: 'legacy-char-1',
    name: 'Alte Heldin',
    role: 'Kriegerin',
    personality: 'Entschlossen',
    bio: 'Test',
    attributes: {} as any,
    appearance: {} as any,
    abilities: [
      {
        id: 'leg_trans_1',
        name: 'Drachengestalt',
        transformName: 'Drachengestalt',
        category: 'Transformationen',
        type: 'Transformation',
        source: 'Drachenblut',
        cost: '20 MP'
      } as PowerAbility,
      {
        id: 'leg_tech_1',
        name: 'Drachenhieb',
        category: 'Techniken',
        type: 'Angriff',
        source: 'Drachenblut',
        cost: '10 MP',
        techniques: 'Drachenhieb'
      } as PowerAbility
    ]
  };

  const normLegacy = normalizeAbilityHierarchy(legacyChar);
  const legStandard = normLegacy.techniques.filter(t => t.type !== 'Transformation' && t.category !== 'Transformationen');
  const legTrans = normLegacy.techniques.filter(t => t.type === 'Transformation' || t.category === 'Transformationen');

  assert(legStandard.length === 1 && legStandard[0].name === 'Drachenhieb', 'Test 5a: Legacy-Standardtechnik Drachenhieb erhalten');
  assert(legTrans.length === 1 && (legTrans[0].transformName === 'Drachengestalt' || legTrans[0].name === 'Drachengestalt'), 'Test 5b: Legacy-Transformation Drachengestalt erhalten');

  // Test 6: Transformationseigene Passive & Techniken (z.B. Esper -> Levitation als Passiv, Elementarerschaffung als Technik)
  console.log('\n--- Test 6: Transformationseigene Kategorien & Techniken (Esper) ---');
  assert((TRANS_CATEGORY_TABS as readonly string[]).includes('Passive Fähigkeiten'), 'Test 6a: TRANS_CATEGORY_TABS enthält "Passive Fähigkeiten"');
  assert((TRANS_CATEGORY_TABS as readonly string[]).includes('Techniken'), 'Test 6b: TRANS_CATEGORY_TABS enthält "Techniken"');
  assert((TRANS_CATEGORY_TABS as readonly string[]).includes('Ultimative Techniken'), 'Test 6c: TRANS_CATEGORY_TABS enthält "Ultimative Techniken"');
  assert('Passive Fähigkeiten' in TRANS_CATEGORY_ADD_LABELS, 'Test 6d: TRANS_CATEGORY_ADD_LABELS für Passive vorhanden');
  assert('Techniken' in TRANS_CATEGORY_ADD_LABELS, 'Test 6e: TRANS_CATEGORY_ADD_LABELS für Techniken vorhanden');

  const esperPlayer: Character = {
    id: 'char-esper-1',
    name: 'Aria',
    role: 'Esper',
    attributes: {} as any,
    appearance: {} as any,
    powerSources: [{ id: 'ps_psi', source: 'Psi-Energie', powerName: 'Psi-Energie', cost: 'Psi' }],
    baseAbilities: [
      {
        id: 'ba_telekinesis',
        displayName: 'Begrenzte Telekinese',
        element: 'Geist',
        abilityType: 'manipulation'
      }
    ],
    techniqueList: [
      {
        id: 'tech_tele_strike',
        name: 'Telekinetischer Stoß',
        category: 'Techniken',
        type: 'Angriff',
        baseAbilityIds: ['ba_telekinesis']
      },
      {
        id: 'trans_esper',
        name: 'Esper',
        transformName: 'Esper',
        category: 'Transformationen',
        type: 'Transformation'
      },
      {
        id: 'tech_levitation',
        name: 'Levitation',
        category: 'Passive Fähigkeiten',
        type: 'Support',
        unlockedByTransformationId: 'trans_esper',
        isTransformationOnly: true
      },
      {
        id: 'tech_elem_create',
        name: 'Elementarerschaffung',
        category: 'Techniken',
        type: 'Angriff',
        unlockedByTransformationId: 'trans_esper',
        isTransformationOnly: true
      }
    ]
  };

  const normEsper = normalizeAbilityHierarchy(esperPlayer);
  const esperStandardOnly = normEsper.techniques.filter(t => 
    t.type !== 'Transformation' && 
    t.category !== 'Transformationen' && 
    !t.isTransformationOnly && 
    !t.unlockedByTransformationId
  );
  const esperTransOnly = normEsper.techniques.filter(t => t.unlockedByTransformationId === 'trans_esper');

  assert(esperStandardOnly.length === 1 && esperStandardOnly[0].name === 'Telekinetischer Stoß', 'Test 6f: Standard-Moveset enthält nur Telekinetischer Stoß');
  assert(esperTransOnly.length === 2, 'Test 6g: Genau 2 form-exklusive Fähigkeiten für Esper');
  assert(esperTransOnly.some(t => t.name === 'Levitation' && t.category === 'Passive Fähigkeiten'), 'Test 6h: Levitation ist form-eigenes Passiv');
  assert(esperTransOnly.some(t => t.name === 'Elementarerschaffung' && t.category === 'Techniken'), 'Test 6i: Elementarerschaffung ist form-eigene Technik');

  console.log('\n✨ ALLE TECHNIQUE-HIERARCHY-TREE & TRANSFORMATION-TRENNUNG TESTS BESTANDEN! ✨\n');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('techniqueHierarchyTreeTransformation.test')) {
  runTechniqueHierarchyTreeTransformationTests();
}
