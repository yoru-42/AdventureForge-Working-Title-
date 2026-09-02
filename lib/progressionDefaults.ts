import { CampaignPowerParameter, CustomStatAllocation, CostResource } from '../types';

export const EP_DEFAULT_PARAMETERS: Record<string, CampaignPowerParameter> = {
  'Stärke': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'physical'
  },
  'Magie': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'supernatural'
  },
  'Geschicklichkeit': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'physical'
  },
  'Konstitution': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'physical'
  },
  'Intelligenz': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'supernatural'
  },
  'Glück': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'supernatural'
  },
  'Geschwindigkeit': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'physical'
  },
  'Abwehr': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'physical'
  },
  'Magie Abwehr': {
    min: 10,
    max: 100,
    scaleMin: 0,
    scaleMax: 100,
    levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP.",
    category: 'supernatural'
  }
};

export const EP_DEFAULT_STAT_ALLOCATIONS: CustomStatAllocation[] = [
  {
    id: 'phys_attack',
    label: 'Physical Attack',
    icon: '⚔️',
    selectedRadarNames: ['Stärke'],
    coreRole: 'CORE_PHYS_DAMAGE'
  },
  {
    id: 'phys_defense',
    label: 'Physical Defense',
    icon: '🛡️',
    selectedRadarNames: ['Abwehr', 'Konstitution'],
    coreRole: 'CORE_PHYS_DEFENSE'
  },
  {
    id: 'magical_attack',
    label: 'Magical Attack',
    icon: '🔮',
    selectedRadarNames: ['Magie', 'Intelligenz'],
    coreRole: 'CORE_MAGIC_DAMAGE'
  },
  {
    id: 'magical_defense',
    label: 'Magical Defense',
    icon: '💠',
    selectedRadarNames: ['Magie Abwehr', 'Intelligenz'],
    coreRole: 'CORE_MAGIC_DEFENSE'
  },
  {
    id: 'attack_speed',
    label: 'Angriffsgeschwindigkeit',
    icon: '⚡',
    selectedRadarNames: ['Geschwindigkeit', 'Geschicklichkeit'],
    coreRole: 'CORE_ATTACK_SPEED'
  },
  {
    id: 'evasion',
    label: 'Ausweichen',
    icon: '💨',
    selectedRadarNames: ['Geschwindigkeit', 'Geschicklichkeit'],
    coreRole: 'CORE_EVASION'
  },
  {
    id: 'reflexes',
    label: 'Reflexe',
    icon: '👁️',
    selectedRadarNames: ['Geschicklichkeit', 'Geschwindigkeit'],
    coreRole: 'CORE_REFLEXES'
  },
  {
    id: 'crit_rate',
    label: 'Crit Rate',
    icon: '🎯',
    selectedRadarNames: ['Glück', 'Geschicklichkeit'],
    coreRole: 'CORE_CRIT_RATE'
  },
  {
    id: 'crit_attack',
    label: 'Crit Attack',
    icon: '💥',
    selectedRadarNames: ['Stärke', 'Geschicklichkeit'],
    coreRole: 'CORE_CRIT_ATTACK'
  },
  {
    id: 'crit_damage',
    label: 'Crit Damage',
    icon: '🩸',
    selectedRadarNames: ['Stärke', 'Glück'],
    coreRole: 'CORE_CRIT_DAMAGE'
  },
  {
    id: 'counter',
    label: 'Konter',
    icon: '🔄',
    selectedRadarNames: ['Geschicklichkeit', 'Abwehr'],
    coreRole: 'CORE_COUNTER'
  }
];

export const EP_DEFAULT_COST_RESOURCES: CostResource[] = [
  {
    id: 'res-mp',
    name: 'MP',
    radarPowerName: 'Magie',
    sourcePowers: ['Magie', 'Intelligenz'],
    baseMax: 100
  },
  {
    id: 'res-sp',
    name: 'SP',
    radarPowerName: 'Stärke',
    sourcePowers: ['Stärke', 'Geschicklichkeit', 'Konstitution'],
    baseMax: 100
  }
];

export const EP_DEFAULT_HEALTH_NAMES = ['Konstitution', 'Abwehr'];
export const EP_DEFAULT_COST_NAMES = ['MP', 'SP'];

export function createEpDefaultWorldSettings() {
  return {
    techniqueProgressionLogic: 'ep' as const,
    techniqueProgressionRate: 'normal',
    campaignPowerSettings: JSON.parse(JSON.stringify(EP_DEFAULT_PARAMETERS)),
    customStatAllocations: JSON.parse(JSON.stringify(EP_DEFAULT_STAT_ALLOCATIONS)),
    costResources: JSON.parse(JSON.stringify(EP_DEFAULT_COST_RESOURCES)),
    healthPowerNames: [...EP_DEFAULT_HEALTH_NAMES],
    costPowerNames: [...EP_DEFAULT_COST_NAMES],
    healthLabel: 'Gesundheit (HP)',
    costLabel: 'Kraftquellen (MP / SP)'
  };
}
