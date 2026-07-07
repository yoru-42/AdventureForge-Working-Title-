
export interface CharacterAttribute {
  name: string;
  value: number;
  max: number;
}

export interface StatusElement {
  id: string;
  label: string;
  value: string;
}

export interface Appearance {
  hairColor: string;
  eyeColor: string;
  age: string;
  build: string;
  gender: string; 
  cupSize?: string;
  outfit?: string;
  height?: string;
  measurements?: string;
  origin?: string;
  family?: string;
  faction?: string;
  race?: string;
  raceFeatures?: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  preferredRole: string;
  appearance: {
    gender: string;
    age: string;
    build: string;
    hairColor: string;
    eyeColor: string;
    cupSize: string;
    raceFeatures?: string;
    height?: string;
    measurements?: string;
  };
}

export interface PowerAbility {
  id: string;
  source: string;
  cost: string;
  description: string;
  techniques: string;
  techniqueList?: { 
    id: string; 
    name: string; 
    description?: string; 
    type?: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support'; 
    subtype?: string;
    level?: number;
    xp?: number;
    maxLevel?: number;
    xpNeeded?: number;
    progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
    xpGainPerUse?: number;
    trainingRequired?: number;
    trainingProgress?: number;
    milestoneRequirement?: string;
    staticCost?: string;
    tier?: string;
    baseValue?: number;
    costFormula?: 'absolut' | 'proz.';
    costValue?: number;
    costResourceName?: string;
  }[];
}

export interface CharacterRelationship {
  id: string;
  targetCharacter: string;
  type: string;
  behavior?: string;
  _isCustom?: boolean;
}

export interface CharacterConduct {
  id: string;
  target: string;
  behavior: string;
}

export interface Character {
  name: string;
  nickname?: string;
  rufName?: string;
  role: string;
  personality: string;
  bio: string;
  appearance: Appearance;
  attributes: CharacterAttribute[];
  currentSituation?: string;
  goal?: string;
  image?: string;
  skills?: string;
  powerSource?: string;
  powerCost?: string;
  techniques?: string;
  abilities?: PowerAbility[];
  campaignPowerLevels?: Record<string, { value: number; potentialMax: number; xp?: number }>;
  relationship?: string;
  conduct?: string;
  relationships?: CharacterRelationship[];
  conducts?: CharacterConduct[];
  secretsStage1?: string; // Stufe 1: Öffentliches Wissen
  secretsStage2?: string; // Stufe 2: Indizien & Verdacht
  secretsStage3?: string; // Stufe 3: Absolutes Geheimnis
}

export interface NPC extends Character {
  id: string;
  isHostile: boolean;
}

export interface CampaignPowerParameter {
  min: number;
  max: number;
  levelUpLogic: string;
  scaleMin?: number;
  scaleMax?: number;
  category?: 'physical' | 'supernatural';
}

export interface CustomResourceMapping {
  id: string;
  name: string;
  icon: string;
  sourcePowers: string[];
  baseMax: number;
  effect: 'regen' | 'shield' | 'dmg_buff' | 'cost_reduction' | 'rage' | 'evade' | 'power_source';
  description: string;
}

export interface CustomStatAllocation {
  id: string;
  label: string;
  icon: string;
  selectedRadarNames: string[];
  isDefault?: boolean;
  coreRole?: string;
}

export interface CostResource {
  id: string;
  name: string;
  radarPowerName?: string;
  sourcePowers: string[];
  baseMax?: number;
}

export interface TechniqueTypeRule {
  type: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support';
  defaultSubtype: string;
  mainParameter: string;
  progressionCostValue: string | number;
  costResourceName: string;
  costValue: number;
  levelScaling: string;
}

export interface TechniqueRuleItem {
  id: string;
  type: 'Angriff' | 'Verteidigung' | 'Transformation' | 'Support';
  subtype: string;
  costResourceName: string;
  costFormula: 'absolut' | 'proz.';
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | string;
  baseValue: number;
  scalingAndEffect: string;
}

export interface WorldSetting {
  title: string;
  description: string;
  era: string;
  tone: string;
  isNsfw?: boolean;
  isHeroic?: boolean;
  dramaLevel?: 'Niedrig' | 'Mittel' | 'Hoch';
  campaignPowerSettings?: Record<string, number | CampaignPowerParameter>;
  healthPowerName?: string;
  costPowerName?: string;
  healthPowerNames?: string[];
  costPowerNames?: string[];
  healthLabel?: string;
  costLabel?: string;
  costResources?: CostResource[];
  customResourceMappings?: CustomResourceMapping[];
  customStatAllocations?: CustomStatAllocation[];
  techniqueProgressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  techniqueProgressionRate?: 'slow' | 'normal' | 'fast' | 'extreme' | string;
  techniqueRules?: Record<string, TechniqueTypeRule>;
  techniqueRulesList?: TechniqueRuleItem[];
}

export type LoreCategory = 'Charaktere' | 'Orte' | 'Fraktionen' | 'Gegenstände' | 'Fähigkeiten' | 'Events' | 'Weltregeln' | 'Gegner';

export interface EventStep {
  id: string;
  title?: string;
  description: string;
  status: 'happened' | 'pending';
  branch?: 'main' | 'side';
  unlockConditions?: string;
  chatInstruction?: string;
  travelPath?: string; // Geografische Stationen / Reise-Pfad
  travelDurationDays?: number; // Reise-Dauer in Tagen
  timeOfDay?: string; // Uhrzeit
}

export interface LoreEntry {
  id: string;
  category: LoreCategory;
  title: string;
  description: string;
  isUnlocked: boolean; // false until discovered, or true if it's general lore
  order?: number; // useful for chronological events
  image?: string;
  details?: {
    eventSteps?: EventStep[];
    [key: string]: any;
  };
  secretsStage1?: string; // Stufe 1: Öffentliches Wissen
  secretsStage2?: string; // Stufe 2: Indizien & Verdacht
  secretsStage3?: string; // Stufe 3: Absolutes Geheimnis
}

export interface CombatState {
  isCombatActive: boolean;
  selectedEnemyId: string;
  selectedEnemyIds?: string[];
  customEnemyName: string;
  opponents: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    count?: number;
    role?: string;
    isFodder?: boolean;
  }[];
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  enemyHp: number;
  enemyMaxHp: number;
  combatSubMenu: 'main' | 'attack' | 'skills' | 'defend' | 'items' | 'start';
}

export interface StructuredInventory {
  money?: number;
  currencyLabel?: string;
  weapons?: string[];
  armor?: {
    head?: string;
    chest?: string;
    hands?: string;
    legs?: string;
    feet?: string;
  };
  accessories?: {
    finger?: string;
    wrist?: string;
    waist?: string;
    back?: string;
    neck?: string;
  };
  generalItems?: string[];
}

export interface Adventure {
  id: string;
  authorId: string;
  isPublic: boolean;
  world: WorldSetting;
  player: Character;
  npcs: NPC[];
  loreDatabase?: LoreEntry[];
  inventory: string[];
  structuredInventory?: StructuredInventory;
  prologue: string;
  firstMessage?: string;
  chatHistory: ChatMessage[];
  backgroundImage?: string;
  statusElements: StatusElement[];
  summaryLog?: string;
  combatState?: CombatState;
  initialPlayer?: Character;
  initialStatusElements?: StatusElement[];
  initialStructuredInventory?: StructuredInventory;
  initialLoreDatabase?: LoreEntry[];
  initialNpcs?: NPC[];
  initialInventory?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  video?: string;
}

export enum GameViewMode {
  HOME = 'HOME',
  CREATE = 'CREATE',
  EDIT_WORLD = 'EDIT_WORLD',
  PLAY = 'PLAY',
  STATUS = 'STATUS',
  JOIN_CUSTOM_CHAR = 'JOIN_CUSTOM_CHAR',
  PROFILE = 'PROFILE'
}
