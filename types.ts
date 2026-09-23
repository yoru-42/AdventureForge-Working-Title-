
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

export type BodyArea =
  | 'head'
  | 'face'
  | 'neck'
  | 'shoulders'
  | 'arms'
  | 'hands'
  | 'chest'
  | 'back'
  | 'waist'
  | 'legs'
  | 'feet'
  | 'whole_body'
  | string;

export type BodyConditionType =
  | 'gender_change'
  | 'race_change'
  | 'curse'
  | 'blessing'
  | 'magical_mutation'
  | 'restraint'
  | 'injury'
  | 'physical_condition'
  | 'special';

export interface BodyCondition {
  id: string;
  name: string;
  type: BodyConditionType;
  category?: string; // 'Geschlechtswechsel' | 'Rassenwechsel' | 'Fluch' | 'Segen' | 'Mutation' | 'Spezial' | 'Fesselung / Fixierung' | 'Verletzung' | 'Körperlicher Zustand'
  icon?: string;
  isActive: boolean;
  severity?: 'leicht' | 'mittel' | 'stark' | 'vollständig';
  source?: string; // z.B. 'Eisenfesseln', 'Göttin der Sonne', 'Uralter Hexenfluch', 'Verwandlungstrank', 'Blutritual'
  duration?: string; // 'Permanent', 'Bis Sonnenaufgang', 'Temporär', 'Bis Fluch gebrochen', 'Bis gelöst'
  triggerCondition?: string; // z.B. 'Jeden Vollmond', 'Bei Absinken der HP unter 30%', 'Bei Sonnenuntergang', 'Nutzung von Magie', 'Alle 3 Tage', 'Nach Rast', 'Dauerhaft'
  linkedTransformationId?: string; // Verknüpfte Transformation / Auslöser-Form (z.B. ID einer Fähigkeit)
  description: string;

  // Körperbereiche & Ausrüstungs-Referenzen
  bodyAreas?: BodyArea[];
  sourceItemInstanceId?: string;
  isRestraint?: boolean;

  // Physische & visuelle Körper-Modifikatoren
  overrideGender?: 'Männlich' | 'Weiblich' | 'Androgyn' | 'Hermaphrodit' | 'Keines' | string;
  overrideRace?: string;
  overrideRaceFeatures?: string;
  heightModifierCm?: number; // z.B. +15cm oder -40cm (Schrumpffluch)
  weightModifierKg?: number; // z.B. +20kg oder -15kg
  cupSizeOverride?: string; // z.B. 'D', 'F', '-'
  muscleMassModifier?: number; // z.B. +15%
  bodyFatModifier?: number; // z.B. +10%
  skinToneOverride?: string; // z.B. 'Aschgrau (Versteinert)', 'Porzellanblass', 'Dunkelblau', 'Goldglänzend'
  eyeColorOverride?: string; // z.B. 'Rubinrot (Blutdürstig)', 'Gold leuchtend', 'Eisblau'
  hairColorOverride?: string; // z.B. 'Silberweiß', 'Mitternachtsschwarz', 'Flammenrot'
  specialFeatures?: string[]; // z.B. ['Engelsflügel', 'Dämonenhörner', 'Spitze Elfenohren', 'Fuchsschweif', 'Glühende Runen', 'Granithaut']
  wingsOverride?: boolean;
  hornsOverride?: boolean;
  healingFactorModifier?: number; // z.B. +2 Stufen Heilfaktor
  
  // HUD & Rollenspiel-Eigenschaften
  statusTag?: string; // z.B. 'Fesselung', 'Gesegnet', 'Gorgonen-Fluch'
  statBuffs?: {
    hpBonus?: number;
    mpBonus?: number;
    staminaBonus?: number;
  };
}

export interface EquipmentState {
  itemInstanceId: string;
  itemDefinitionId?: string;
  itemName: string;
  ownerId: string; // 'player' | Character-ID
  equipped: boolean;
  isRestraint?: boolean;
  slot?: 'weapon' | 'shield' | 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'finger' | 'neck' | 'wrist' | 'waist' | 'back' | 'pocket' | 'bag' | 'inventory' | string;
  bodyAreas?: BodyArea[];
  condition?: string;
  attachedAt?: string;
  source?: string;
  description?: string;
}

export interface SilhouetteState {
  hasWings?: boolean;
  hasHorns?: boolean;
  healingFactor?: number;
  skinTone?: string;
  pregnancyMonth?: number;
  isPregnant?: boolean;
  fatherName?: string;
  isVirgin?: boolean;
  hasChildren?: boolean;
  childrenCount?: number;
  pregnancyDaysRemaining?: number;
  pregnancyTestDone?: boolean;
  pregnancyChangesVisible?: boolean;
  injuries?: string;
  customBuild?: string;
  customCupSize?: string;
  bust?: number;
  waist?: number;
  hips?: number;
  heightCm?: number;
  weightKg?: number;
  bodyFat?: number;
  muscleMass?: number;
  weight?: number;
  form?: 'human' | 'child' | 'hybrid' | 'beast';
  isVampire?: boolean;
  vampireBlood?: number;
  [key: string]: any;
}

export interface WorldTime {
  day: number;
  hour: number;
  minute: number;
  totalMinutes?: number;
}

export interface TransformationState {
  activeTransformationId?: string;
  powerUsage: number; // 0-100% (Kraftnutzung / Exertion)
  currentIntensity: number; // 0-100% (Aktuelle Verwandlungsintensität)
  metamorphosisProgress: number; // 0-100% (Dauerhafter Metamorphose-Fortschritt)
  pointOfNoReturn: number; // Schwelle (z.B. 80%)
  permanent: boolean; // Dauerhafte Bindung nach PNR
  powerSource?: string; // Kraftquelle z.B. "MP", "Mana", "Ausdauer", "Ki", "Chakra"
  baseConversionRate: number; // Basis-Kraftumwandlung (z.B. 15%)
  currentConversionRate: number; // Aktuelle Kraftumwandlung (z.B. skaliert mit Metamorphose)
  maxConversionRate?: number; // Maximale Kraftumwandlung (z.B. 35%)
  conversionCurve?: 'linear' | 'stepped' | 'smooth' | 'exponential' | 'custom';
  decayRate?: number; // Abklingrate pro Ingame-Zeiteinheit
  reversibilityType?: 'fully_reversible' | 'slow_decay' | 'partially_permanent' | 'pnr_permanent' | 'fully_permanent';
  durationGameMinutes: number; // Ingame-Zeitdauer in dieser Form
  permanentChanges?: Record<string, boolean>; // Gesperrte Merkmale nach PNR
}

export interface UserEmotionState {
  emotion?: string; // z.B. 'lächelnd', 'zornig', 'besorgt', 'ruhig', 'überrascht'
  intensity?: 'subtil' | 'leicht' | 'mittel' | 'stark' | 'überwältigend'; // Emotionale Intensität
  tone?: string; // z.B. 'ruhig', 'flüsternd', 'sarkastisch', 'dominant', 'freundlich', 'kalt'
  lastUpdated?: string; // Zeitstempel oder Ingame-Zeit
}

export interface PhysicalChangeItem {
  id: string;
  category: 'dimension' | 'feature' | 'appearance' | 'condition';
  label: string; // z.B. "Körpergröße", "Brustumfang", "Haarfarbe", "Augenfarbe", "Geschlecht"
  type: 'numeric' | 'qualitative';
  baseValue: string | number;
  currentValue: string | number;
  deltaDisplay?: string; // z.B. "+1 cm (171 cm)" oder "verändert (Schwarz -> Silber)"
  deltaNumeric?: number;
  unit?: string;
  isSignificant: boolean;
}

export interface PhysicalChangeHistoryEntry {
  id: string;
  timestamp: string;
  transformationIntensity: number;
  stageName: string;
  changes: PhysicalChangeItem[];
  summary: string;
}

export interface NPCAppearanceObservation {
  npcId: string;
  npcName: string;
  familiarity: 'unbekannt' | 'fluechtig' | 'bekannt' | 'vertraut' | 'intim';
  attentionToAppearance?: 'niedrig' | 'normal' | 'scharfsinnig' | 'obsessiv';
  firstObservedTimestamp?: string;
  lastObservedTimestamp?: string;
  lastObservedAppearance: Record<string, any>;
  noticedChanges?: string[];
}

export interface HUDDetailDefinition {
  label: string;
  value: string | number | boolean;
}

export interface HUDFieldDefinition {
  id: string;
  category: 'Welt' | 'Charakter' | 'Sozial' | 'Wirtschaft' | 'Macht & Organisation' | string;
  label: string;
  icon?: string;
  dataSource: string;
  value?: string | number | boolean;
  priority?: number;
  displayFormat?: string;
  enabled?: boolean;
  showInHud?: boolean;
  details?: HUDDetailDefinition[];
}

export interface HUDConfiguration {
  fields?: HUDFieldDefinition[];

  // Körperlicher Zustand & Veränderungen
  showBodyCondition?: boolean;
  showPhysicalChanges?: boolean;

  // Metamorphose & Transformation
  showMetamorphosis?: boolean;
  showPowerUsage?: boolean;
  showCurrentIntensity?: boolean;
  showMetamorphosisProgress?: boolean;
  showPointOfNoReturn?: boolean;
  showDecayStatus?: boolean;
  showTransformationDuration?: boolean;
  showActiveConditions?: boolean;

  // Emotion & Tonart des Nutzers
  showEmotion?: boolean;
  showEmotionIntensity?: boolean;
  showTone?: boolean;

  // Persönlicher Status
  showTime?: boolean;
  showLocation?: boolean;
  showCurrency?: boolean;
  showInjuries?: boolean;
  showStatusEffects?: boolean;
  showReputation?: boolean;
  showInfluence?: boolean;
  showBounty?: boolean;
  showRankTitle?: boolean;

  // Organisation / Fraktion / Welt
  showEconomy?: boolean;
  showTerritory?: boolean;
  showFactionStatus?: boolean;
  showMilitaryStrength?: boolean;
}

export interface Appearance {
  hairColor: string;
  eyeColor: string;
  hasHeterochromia?: boolean;
  eyeColorLeft?: string;
  eyeColorRight?: string;
  age: string;
  build: string;
  gender: string; 
  cupSize?: string;
  personalityArchetype?: string;
  outfit?: string;
  looks?: string;
  height?: string;
  measurements?: string;
  weight?: string;
  bodyFat?: string;
  muscleMass?: string;
  pregnancyMonth?: string;
  isPregnant?: boolean;
  fatherName?: string;
  healingFactor?: number;
  isVirgin?: boolean;
  hasChildren?: boolean;
  childrenCount?: number;
  origin?: string;
  family?: string;
  faction?: string;
  race?: string;
  raceFeatures?: string;
  currentLocation?: string;
  activeTransformationId?: string;
  transformationIntensity?: number; // 0% bis 100% Verwandlungs- & Korruptions-Fortschritt
  transformationExertion?: number; // Anstiegsrate pro Kraftaufwand / Runde
  metamorphosisProgress?: number; // 0% bis 100% Dauerhafter Metamorphose-Fortschritt
  powerUsage?: number; // 0% bis 100% Kraftnutzung
  transformationState?: TransformationState;
  chestSize?: string;
  skinTone?: string;
  silhouetteState?: SilhouetteState | any;
  activeConditions?: BodyCondition[];
  customConditions?: BodyCondition[];
  originalStandardAppearance?: Partial<Appearance>;
}

export interface UserProfile {
  name: string;
  bio: string;
  preferredRole: string;
  personalityArchetype?: string;
  personalityTraits?: PersonalityTraits;
  appearance: {
    gender: string;
    age: string;
    build: string;
    hairColor: string;
    eyeColor: string;
    hasHeterochromia?: boolean;
    eyeColorLeft?: string;
    eyeColorRight?: string;
    cupSize: string;
    personalityArchetype?: string;
    raceFeatures?: string;
    height?: string;
    measurements?: string;
    weight?: string;
    bodyFat?: string;
    muscleMass?: string;
    pregnancyMonth?: string;
    chestSize?: string;
    silhouetteState?: any;
  };
}

export type AbilityType = 'creation' | 'manipulation' | 'creation_manipulation' | string;

export interface BaseAbility {
  id: string;
  powerSourceId?: string;
  powerSourceName?: string;
  name?: string;
  displayName: string;
  element: string;
  abilityType: AbilityType;
  description?: string;
  techniqueIds?: string[];
}

export interface TechniqueItem {
  id: string; 
  name: string; 
  description?: string; 
  type?: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support' | 'Heilung' | 'Zustandseffekt' | 'Spezial' | 'Beschwörung' | string; 
  subtype?: string;
  mode?: 'Normal' | 'Verstärkt' | 'Dauerhaft' | 'Aufgeladen' | 'Schnellzauber' | 'Konter' | 'Bereich' | 'Fernkampf' | 'Nahkampf' | 'Kanalisiert' | string;
  category?: 'Passive Fähigkeiten' | 'Techniken' | 'Ultimative Techniken' | 'Transformationen' | 'Waffenbeherrschung' | 'Talente' | string;
  baseAbilityIds?: string[]; // Liste verknüpfter Grundfähigkeiten
  baseAbilityNames?: string[]; // Anzeigenamen (z.B. ["Kryokinese", "Aerokinese"])
  powerSourceId?: string;
  powerSourceName?: string;
  element?: string;
  abilityType?: string;
  targetType?: string; // z.B. "Selbst / Verbündete / Feinde"
  effects?: string[]; // z.B. ["Schutz", "Einsperren", "Gebietskontrolle"]
  applications?: string[];
  range?: string;
  duration?: string;
  level?: number;
  xp?: number;
  maxLevel?: number;
  xpNeeded?: number;
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  xpGainPerUse?: number;
  trainingRequired?: number;
  trainingUnits?: number;
  trainingProgress?: number;
  score?: number;
  milestoneRequirement?: string;
  milestoneNote?: string;
  points?: number;
  staticCost?: string;
  cost?: string;
  tier?: string;
  baseValue?: number;
  effectValue?: string;
  costFormula?: 'absolut' | 'proz.';
  costValue?: number;
  costResourceName?: string;
  metamorphosisInfluence?: number; // 0-100% (Standard 100%) - Wie stark diese Technik zur Metamorphose beiträgt
  scaling?: string;
  summonCount?: number;
  summonCostValue?: number;
  summonCostFormula?: string;
  // Optionale Zusatzfelder für Transformationen / Bedingungen
  activationCondition?: string;
  transformName?: string;
  // Optionale Zusatzfelder für Waffenbeherrschung
  weaponType?: string;
  weaponCategory?: string;
  masteryLevel?: string;
  wieldingStyle?: string;
  weaponManeuver?: string;
}

export interface PowerAbility {
  id: string;
  name?: string;
  displayName?: string;
  category?: string;
  source: string;
  cost: string;
  description: string;
  techniques: string;
  powerSourceId?: string;
  element?: string; // z.B. "Eis"
  abilityType?: AbilityType; // z.B. "creation_manipulation"
  baseAbilityIds?: string[];
  baseAbilities?: BaseAbility[];
  activationCondition?: string;
  transformHairColor?: string;
  transformEyeColor?: string;
  transformHasHeterochromia?: boolean;
  transformEyeColorLeft?: string;
  transformEyeColorRight?: string;
  transformBuild?: string;
  transformAge?: string;
  transformRace?: string;
  transformRaceFeatures?: string;
  transformName?: string;
  transformRufName?: string;
  transformNickname?: string;
  transformRole?: string;
  transformGender?: string;
  transformSkinTone?: string;
  gender?: string;
  race?: string;
  raceFeatures?: string;
  skinTone?: string;
  transformCupSize?: string;
  transformHeight?: string;
  transformWeight?: string;
  transformBodyFat?: string;
  transformMuscleMass?: string;
  transformMeasurements?: string;
  transformOrigin?: string;
  transformFamily?: string;
  transformFaction?: string;
  transformOutfit?: string;
  transformLooks?: string;
  transformWings?: boolean;
  transformHorns?: boolean;
  transformPersonality?: string;
  transformPersonalityArchetype?: string;
  transformPersonalityTraits?: PersonalityTraits;
  transformBio?: string;
  transformCurrentSituation?: string;
  transformGoal?: string;
  transformIdentityPerception?: 'bekannt' | 'getrennt' | 'koerpertausch';
  transformSwappedCharacterId?: string;
  transformSwappedCharacterName?: string;
  transformSwappedCharacterSource?: 'codex' | 'npc';
  transformSwappedOriginalData?: any;
  transformRelationships?: CharacterRelationship[];
  techniqueList?: TechniqueItem[];
}

export interface CharacterPowerSource {
  id: string;
  source: string;
  cost?: string;
  powerName?: string;
  powerDescription?: string;
  baseAbilities?: BaseAbility[];
}

export interface DirectionalRelationshipValues {
  affection?: number; // Zuneigung (-100 bis +100 oder 0 bis 100)
  trust?: number; // Vertrauen (0 bis 100)
  respect?: number; // Respekt (0 bis 100)
  loyalty?: number; // Loyalität (0 bis 100)
  familiarity?: number; // Vertrautheit (0 bis 100)
  fear?: number; // Angst / Furcht (0 bis 100)
  bond?: number; // Bindung (0 bis 100)
  hostility?: number; // Feindseligkeit (0 bis 100)
}

export interface RelationshipEvent {
  id: string;
  title: string;
  description: string;
  dateOrChapter?: string;
  impact?: string;
}

export interface MotivationCore {
  mainGoal?: string; // Hauptziel / Bestrebungen (synchronisiert mit Character.goal)
  whyGoal?: string; // Warum verfolgt der Charakter dieses Ziel? (persönlicher Antrieb: Macht, Sicherheit, Freiheit, Rache, Anerkennung, Schutz, etc.)
  currentPriorities?: string; // Aktuelle Prioritäten (Was beschäftigt den Charakter momentan besonders?)
  needs?: string; // Bedürfnisse (Nahrung, Geld, Sicherheit, soziale Anerkennung, Einfluss, Schutz, Informationen, etc.)
  fears?: string; // Ängste / Dinge, die vermieden werden sollen (Gefahren oder Situationen, die Entscheidungen beeinflussen)
  valuesPrinciples?: string; // Werte / Prinzipien (Grundsätze, die das Verhalten bestimmen)
  methodsAndMeans?: string; // Mittel und Vorgehensweise (Diplomatie, Manipulation, Gewalt, Täuschung, Handel, Einschüchterung, langfristige Planung, etc.)
  changeTriggers?: string; // Veränderbarkeit (Welche Ereignisse können Ziele oder Prioritäten verändern?)
  shortTermPlan?: string; // Kurzfristige Etappen / Sofortmaßnahmen
  mediumTermPlan?: string; // Mittelfristige Etappen / Meilensteine
  longTermPlan?: string; // Langfristige Etappen / Vollendung
}

export type GoalTimeframe = 'langfristig' | 'mittelfristig' | 'kurzfristig';

export type GoalTargetType = 'character' | 'faction' | 'world' | 'self';

export type GoalPriority = 'niedrig' | 'normal' | 'hoch' | 'kritisch';

export type GoalStatus = 'aktiv' | 'pausiert' | 'erreicht' | 'gescheitert' | 'aufgegeben';

export interface CharacterGoal {
  id: string;
  title: string;
  description?: string;
  timeframe: GoalTimeframe;
  targetType?: GoalTargetType;
  targetId?: string;
  targetName?: string;
  priority?: GoalPriority | number;
  status?: GoalStatus;
  motivation?: string;
  activePlan?: string;
  shortTermPlan?: string;
  mediumTermPlan?: string;
  longTermPlan?: string;
  alternativePlans?: string[];
  obstacles?: string[];
  progress?: number;
  linkedRelationshipId?: string;
  parentGoalId?: string;
  mainGoalTitle?: string;
  isMainGoal?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharacterRelationship {
  id: string;
  targetCharacter: string;
  type: string;
  relationshipStatus?: string;
  isPotential?: boolean; // false/undefined = bestehende tatsächliche Beziehung; true = mögliche / zukünftige Dynamik
  duration?: string; // Seit wann besteht die Beziehung? (z.B. "10 Jahre", "seit der Kindheit", "wenige Tage")
  currentStance?: string; // Aktuelle Haltung (Wie empfindet dieser Charakter das Gegenüber momentan?)
  dependency?: string; // Abhängigkeit (Ist dieser Charakter auf das Gegenüber angewiesen?)
  fearIntimidation?: string; // Angst / Furcht / Einschüchterung
  addressFromSelfToTarget?: string;
  addressFromTargetToSelf?: string;
  behavior?: string;
  perceptionSelfToTarget?: string;
  perceptionTargetToSelf?: string;
  sharedPast?: string;
  keyMemories?: string;
  secretsAndMotives?: string;
  boundariesAndTaboos?: string;
  valuesSelfToTarget?: DirectionalRelationshipValues;
  valuesTargetToSelf?: DirectionalRelationshipValues;
  keyEvents?: RelationshipEvent[];
  aiDirectives?: string;
  _isCustom?: boolean;
}

export interface PersonalityTraits {
  freundlichkeit?: number; // 0 (unfreundlich) ↔ 100 (herzlich)
  geselligkeit?: number; // 0 (einzelgängerisch) ↔ 100 (gesellig)
  schuechternheit?: number; // 0 (selbstsicher) ↔ 100 (schüchtern)
  selbstvertrauen?: number; // 0 (unsicher) ↔ 100 (selbstsicher)
  geduld?: number; // 0 (ungeduldig) ↔ 100 (geduldig)
  temperament?: number; // 0 (ruhig) ↔ 100 (hitzköpfig)
  mut?: number; // 0 (ängstlich) ↔ 100 (mutig)
  risikobereitschaft?: number; // 0 (vorsichtig) ↔ 100 (risikofreudig)
  empathie?: number; // 0 (gefühllos) ↔ 100 (einfühlsam)
  ehrlichkeit?: number; // 0 (unehrlich) ↔ 100 (ehrlich)
  loyalitaet?: number; // 0 (wechselhaft) ↔ 100 (loyal)
  misstrauen?: number; // 0 (vertrauensvoll) ↔ 100 (misstrauisch)
  dominanz?: number; // 0 (unterwürfig) ↔ 100 (dominant)
  durchsetzungsvermoegen?: number; // 0 (nachgiebig) ↔ 100 (durchsetzungsstark)
  disziplin?: number; // 0 (undiszipliniert) ↔ 100 (diszipliniert)
  neugier?: number; // 0 (desinteressiert) ↔ 100 (neugierig)
  kreativitaet?: number; // 0 (pragmatisch) ↔ 100 (kreativ)
  intelligenzorientierung?: number; // 0 (intuitiv) ↔ 100 (analytisch)
  emotionalitaet?: number; // 0 (rational) ↔ 100 (emotional)
  impulsivitaet?: number; // 0 (bedacht) ↔ 100 (impulsiv)
  humor?: number; // 0 (ernst) ↔ 100 (verspielt)
  eitelkeit?: number; // 0 (bescheiden) ↔ 100 (eitel)
  materialismus?: number; // 0 (genügsam) ↔ 100 (materialistisch)
  ordnungsliebe?: number; // 0 (chaotisch) ↔ 100 (ordentlich)
}

export interface CharacterConduct {
  id: string;
  target: string;
  behavior: string;
}

export interface ProfessionCompetency {
  id: string;
  name: string;
  category: 'Grundlage' | 'Fortgeschritten' | 'Spezialisierung' | 'Meisterschaft';
  proficiency: number; // 0–100
  experiencePoints: number;
  talent: number; // 0–5 (0=kein bes. Talent, 1=langsam, 2=eher langsam, 3=normal, 4=talentiert, 5=außergewöhnlich)
  description?: string;
  notes?: string;
  practiceCount?: number;
  lastPracticedAt?: string;
  relatedCompetencyIds?: string[];
  professionId?: string;
}

export interface ProfessionExperience {
  years: number;
  months?: number;
  days?: number;
}

export interface ProfessionHistoryEntry {
  professionId?: string;
  professionName: string;
  fieldId?: string;
  specialization?: string;
  rank?: string;
  startedAt?: string;
  endedAt?: string;
  experienceYears?: number;
  experienceMonths?: number;
  reason?: string;
}

export interface SocialTitleState {
  id: string;
  title: string; // e.g. "Baron", "Graf", "Herzog", "Ritter"
  titleType?: 'nobility' | 'honorary' | 'civic' | string;
  grantedAt?: string;
  grantedBy?: string;
  inherited?: boolean;
  reason?: string;
}

export interface OfficeState {
  id: string;
  name: string; // e.g. "Bürgermeister", "Mitglied des Stadtrates", "Richter", "Gildenmeister"
  institution?: string; // e.g. "Stadtrat", "Handelsgilde"
  appointedAt?: string;
  appointedBy?: string;
  term?: string;
  description?: string;
}

export type ProfessionType = 'civil' | 'combat';

export interface ProfessionNode {
  id: string;
  fieldId: string;
  name: string;
  parentIds?: string[];
  childIds?: string[];
  specializationOf?: string;
  prerequisites?: ProfessionPrerequisite[];
  categoryId?: string;
  professionType?: 'civil' | 'combat';
  isMainProfession?: boolean;
  isSecondaryProfession?: boolean;
  isMasterQualification?: boolean;
  isTitleQualification?: boolean;
  description?: string;
}

export type ProfessionNodeType =
  | 'training'
  | 'profession'
  | 'specialization'
  | 'advanced_profession'
  | 'promotion'
  | 'leadership';

export interface ProfessionPrerequisite {
  type:
    | 'profession'
    | 'competency'
    | 'competence'
    | 'experience'
    | 'experience_years'
    | 'talent'
    | 'story'
    | 'story_requirement'
    | 'position'
    | 'education'
    | 'cross_profession'
    | 'knowledge'
    | 'attribute'
    | string;
  targetId?: string;
  targetName?: string;
  targetFieldId?: string;
  targetFieldName?: string;
  minimumValue?: number;
  minValue?: number;
  value?: number;
  label?: string;
  required?: boolean;
  description?: string;
}

export interface ProfessionCompetencyRequirement {
  competencyId?: string;
  competencyName: string;
  minimumProficiency: number; // 0-100
  requiredPracticeCount?: number;
  description?: string;
}

export interface ProfessionPosition {
  id: string;
  name: string;
  type:
    | 'deputy'
    | 'supervisor'
    | 'leadership'
    | 'executive';
  professionIds?: string[];
  prerequisites?: ProfessionPrerequisite[];
  grantsAuthority?: boolean;
  authorityScope?: string[];
  description?: string;
}

export interface ProfessionTreeNode {
  id: string;
  professionId?: string;
  name: string;
  fieldId: string;
  nodeType: ProfessionNodeType;
  parentIds?: string[];
  childIds?: string[];
  prerequisites?: ProfessionPrerequisite[];
  requiredCompetencies?: ProfessionCompetencyRequirement[];
  requiredExperience?: {
    years?: number;
    months?: number;
  };
  description?: string;
  grantsProfession?: boolean;
  grantsPosition?: boolean;
  positionId?: string;
  tier?: 'einstieg' | 'beruf' | 'spezialisierung' | 'meister';
  category?: string;
  rankOrder?: number;
  rankTitle?: string;
  categoryId?: string;
  professionType?: 'civil' | 'combat';
  isMasterQualification?: boolean;
  isTitleQualification?: boolean;
  isMainProfession?: boolean;
  isSecondaryProfession?: boolean;
  specializationOf?: string;
  nextRankProfession?: string;
  previousRankProfession?: string;
  suggestedCompetencies?: string[];
  possibleRanks?: string[];
  authorities?: string[];
  suggestedAuthorities?: string[];
  grantedAuthorities?: string[];
}

export interface PositionState {
  id: string;
  title: string; // e.g. "Kapitän der 'Morgenstern'", "Hauptmann der Stadtwache"
  holderCharacterId?: string;
  acquiredAt?: string;
  acquisitionMethod:
    | 'formal_training'
    | 'exam'
    | 'experience'
    | 'appointment'
    | 'recommendation'
    | 'election'
    | 'emergency_succession'
    | 'forced_assignment'
    | 'request'
    | 'inheritance'
    | 'political_decision'
    | 'religious_appointment'
    | 'guild_recognition'
    | 'military_command'
    | string;
  reason?: string;
  appointedBy?: string[];
  recognizedBy?: string[];
  voluntary?: boolean; // true = freiwillig, false = widerwillig / Pflichtübernahme / Zwang
}

export interface ProfessionProgress {
  professionId?: string;
  professionName: string;
  fieldId?: string;
  specialization?: string;
  level?: string;
  rank?: string;
  overallProficiency: number; // 0–100
  experiencePoints: number;
  experienceYears?: number;
  experienceMonths?: number;
  experienceDays?: number;
  experienceText?: string;
  promotionConditions?: string[];
}

export interface ProfessionCompetencyActivity {
  characterId?: string;
  characterName?: string;
  professionId?: string;
  professionName?: string;
  competencyId?: string;
  competencyName?: string;
  action?: 'practice' | 'work' | 'study' | 'experiment' | 'masterpiece' | string;
  difficulty?: 'trivial' | 'easy' | 'moderate' | 'medium' | 'hard' | 'extreme' | 'master' | string;
  successful?: boolean;
  success?: boolean;
  meaningfulPractice?: boolean;
  meaningfulContext?: boolean;
  notes?: string;
}

export interface SecondaryProfession {
  id: string;
  profession: string;
  professionLevel?: string;
  professionField?: string;
  specialization?: string;
  jobTitle?: string;
  description?: string;
  proficiencyScore?: number;
  experiencePoints?: number;
  experienceText?: string;
  promotionConditions?: string;
  authorities?: string[];
  professionProgress?: ProfessionProgress;
  professionCompetencies?: ProfessionCompetency[];
}

export interface Character {
  id?: string;
  name: string;
  nickname?: string;
  rufName?: string;
  role: string;
  personality: string;
  personalityArchetype?: string;
  personalityTraits?: PersonalityTraits;
  bio: string;
  appearance: Appearance;
  attributes: CharacterAttribute[];
  currentSituation?: string;
  goal?: string;
  motivationCore?: MotivationCore;
  goals?: CharacterGoal[];
  image?: string;
  expressions?: Record<string, string>;
  skills?: string;
  profession?: string;
  professionField?: string;
  professionSpecialization?: string;
  professionRank?: string;
  professionExperience?: ProfessionExperience;
  professionHistory?: ProfessionHistoryEntry[];
  socialTitles?: SocialTitleState[];
  offices?: OfficeState[];
  positions?: PositionState[];
  socialStatus?: string; // Soziale / rechtliche Lebenssituation (z.B. Freibürger, Adliger, Leibeigener, Sklave, Schüler, Student, Vogelfrei)
  professionLevel?: string;
  secondaryProfessions?: SecondaryProfession[];
  jobTitle?: string;
  authorities?: string[];
  professionDescription?: string;
  professionProficiencyScore?: number;
  professionExperiencePoints?: number;
  professionExperienceText?: string;
  professionPromotionConditions?: string;
  professionProgress?: ProfessionProgress;
  professionCompetencies?: ProfessionCompetency[];
  workplaceId?: string;
  workplaceName?: string;
  workplaceType?: 'economy' | 'administration' | 'military' | 'other';
  residenceId?: string;
  residenceName?: string;
  craftingSkills?: string;
  talents?: string;
  everydaySkills?: string;
  everydaySkillsProficiencyScore?: number;
  everydaySkillsExperienceText?: string;
  toolsAndEquipment?: string;
  powerName?: string;
  powerDescription?: string;
  powerSource?: string;
  powerCost?: string;
  powerSources?: CharacterPowerSource[];
  baseAbilities?: BaseAbility[];
  techniques?: string;
  techniqueList?: TechniqueItem[];
  abilities?: PowerAbility[];
  campaignPowerLevels?: Record<string, { value: number; potentialMax: number; xp?: number }>;
  relationship?: string;
  conduct?: string;
  relationships?: CharacterRelationship[];
  conducts?: CharacterConduct[];
  secretsStage1?: string; // Stufe 1: Öffentliches Wissen
  secretsStage2?: string; // Stufe 2: Indizien & Verdacht
  secretsStage3?: string; // Stufe 3: Absolutes Geheimnis
  knowledge?: string; // Verhüllung & Geteiltes Wissen / Fähigkeiten (Wer weiß was?)
  originalIdentity?: Partial<Character>; // Dauerhaft gesicherte Ursprüngliche Gestalt (Geburtsidentität & früheres Leben)
  emotionState?: UserEmotionState; // Aktuelle Emotion & Tonart des Nutzers
  physicalChangeHistory?: PhysicalChangeHistoryEntry[]; // Protokollierte körperliche Veränderungen
  tasks?: EconomyTask[]; // Persönliche rollenspezifische Aufgaben
  duties?: EconomyDuty[]; // Rollenspezifische wiederkehrende Pflichten
  characterKnowledge?: CharacterKnowledge; // Strukturiertes Charakterwissen & Wissensstand
  currentLocationContext?: CurrentLocationContext;
  presenceState?: CharacterPresenceState;
  equipment?: EquipmentState[];
  inventoryEntries?: InventoryEntry[];
}

export type InformationType =
  | 'location'
  | 'building'
  | 'person'
  | 'business'
  | 'trade'
  | 'contract'
  | 'task'
  | 'duty'
  | 'problem'
  | 'rumor'
  | 'personal'
  | 'report';

export type InformationSourceType =
  | 'npc'
  | 'report'
  | 'letter'
  | 'document'
  | 'conversation'
  | 'observation'
  | 'role'
  | 'experience'
  | 'story';

export interface InformationEvent {
  id: string;
  informationType: InformationType;
  sourceType: InformationSourceType;
  sourceCharacterId?: string;
  sourceCharacterName?: string;
  targetEntityId?: string;
  targetEntityType?: string;
  reliability?: 'certain' | 'likely' | 'uncertain' | 'rumor';
  revealedAt?: string;
  description?: string;
}

export interface CharacterKnowledgeEntry {
  id: string;
  category:
    | 'location'
    | 'building'
    | 'holding'
    | 'character'
    | 'organization'
    | 'resource'
    | 'producer'
    | 'supplier'
    | 'contract'
    | 'trade'
    | 'task'
    | 'duty'
    | 'problem'
    | 'rumor'
    | 'report'
    | string;
  entityId: string;
  entityName: string;
  title?: string;
  summary?: string;
  source?: 'experienced' | 'told_by_npc' | 'read' | 'observed' | 'duty_responsible' | 'assumed' | string;
  sourceDetail?: string;
  reliability?: 'certain' | 'plausible' | 'rumor' | string;
  sourceEvent?: InformationEvent;
  discoveredAt?: string;
  isNew?: boolean;
  isRelevant?: boolean;
}

export interface CharacterKnowledge {
  facts?: CharacterKnowledgeEntry[];
  knownLocations?: string[];
  knownBuildings?: string[];
  knownHoldings?: string[];
  knownCharacters?: string[];
  knownOrganizations?: string[];
  knownResources?: string[];
  knownProducers?: string[];
  knownSuppliers?: string[];
  knownContracts?: string[];
  knownTradeRelations?: string[];
  knownTasks?: string[];
  knownDuties?: string[];
  discoveredInformation?: CharacterKnowledgeEntry[];
  events?: InformationEvent[];
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
  type: 'Angriff' | 'Verteidigung' | 'Transformation' | 'Support' | 'Beschwörung';
  subtype: string;
  costResourceName: string;
  costFormula: 'absolut' | 'proz.';
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | string;
  baseValue: number;
  scalingAndEffect: string;
  summonCount?: number;
}

export interface WorldMapConfig {
  continentStencil?: 'complete' | 'rugged' | 'divided' | 'peninsula' | 'island_group' | 'archipelago' | 'ring' | 'central_sea' | string;
  coastlineStyle?: 'smooth' | 'rugged' | 'fjord' | 'beach' | 'cliff' | 'lagoon' | string;
  mountainStyle?: 'young' | 'rounded' | 'volcanic' | 'jagged' | 'plateau' | 'chain' | string;
  riverStyle?: 'branched' | 'parallel' | 'radial' | 'small_lake' | 'large_lake' | 'branched_lakes' | string;
  biomeStyle?: 'rainforest' | 'temperate_forest' | 'taiga' | 'grassland' | 'desert' | 'savanna' | 'tundra' | 'ice' | string;
  mapStyle?: 'watercolor' | 'handdrawn' | 'realistic' | 'parchment' | 'fantasy_saturated' | 'minimalist' | string;
  decorations?: string[];
  mapWidth?: number;
  mapHeight?: number;
  islandScale?: number;
  mapWidthKm?: number;
  mapHeightKm?: number;
  kmPerCoordinateUnit?: number;
}

export interface TerritorySpatialRelation {
  targetTerritoryId?: string;
  targetTerritoryName?: string;
  relationType: 'noerdlich_von' | 'suedlich_von' | 'oestlich_von' | 'westlich_von' | 'grenzt_direkt_an' | 'getrennt_durch_meer' | 'insel' | 'innerhalb';
}

export type LandShapeTemplate = 
  | 'organisch' 
  | 'rund' 
  | 'laenglich' 
  | 'schmal' 
  | 'grossflaechig' 
  | 'insel' 
  | 'kuestengebiet' 
  | 'binnengebiet';

export interface Territory {
  id: string;
  name: string;
  type: 'welt' | 'meer' | 'ozean' | 'bucht' | 'see' | 'fluss' | 'wasser' | 'kontinent' | 'koenigreich' | 'land' | 'region' | 'unabhaengiges_gebiet' | 'unbekanntes_land' | 'geografische_flaeche' | 'insel' | 'zone' | 'ort' | 'stadt' | 'gebäude' | 'dorf' | 'hafen' | 'festung' | 'biome_gras' | 'biome_wald' | 'biome_gebirge' | 'biome_wasser' | 'biome_wueste' | 'biome_schnee' | 'biome_sumpf' | 'biome_vulkan' | 'biome_dungeon' | (string & {});
  description: string;
  parentId: string | null;
  settlementType?: 'hauptstadt' | 'grossstadt' | 'stadt' | 'kleinstadt' | 'dorf' | 'hafenstadt' | string;
  poiType?: 'festung' | 'burg' | 'ruine' | 'turm' | 'tempel' | 'hoehle' | 'leuchtturm' | 'bruecke' | 'tor' | 'mine' | 'ort' | 'gebaeude' | string;
  controlledByFactionId?: string; // Politische Kontrolle (getrennt von geografischem parentId)
  ownerCharacterId?: string;
  ownerFactionId?: string;
  loreEntryId?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  shapeType?: 'circle' | 'rectangle' | 'polygon';
  landShapeTemplate?: LandShapeTemplate;
  spatialRelation?: TerritorySpatialRelation;
  points?: { x: number; y: number }[]; // For polygons/custom drawing
  seed?: number; // Randomization seed for organic coastlines
  coastlineRoughness?: number; // 0.0 (smooth) to 1.0 (rugged fjords)
  coastOpenDirection?: 'none' | 'north' | 'east' | 'south' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest'; // Open coast towards open sea
  hasReef?: boolean; // Shallow turquoise coral reef shelf
  hasBeach?: boolean; // Sand beach coast
  color?: string;
  climate?: string;
  terrain?: string;
  faction?: string;
  isWarZone?: boolean;
  controlPercentage?: number;
  tags?: string[];
  isUnlocked?: boolean;
  population?: string;
  populationCount?: number; // Numerischer Wert der Einwohnerzahl
  areaKm2?: number; // Tatsächliche, aus der Polygon-Geometrie abgeleitete Fläche in km²
  habitableAreaKm2?: number; // Bewohnbare Fläche abzüglich unbewohnbarer Naturmerkmale (Vulkane, Hochgebirge)
  populationDensity?: number; // Berechnete Dichte in Einwohner pro km²
  densityClassification?: 'niedrig' | 'normal' | 'hoch' | 'sehr_hoch' | 'extrem'; // Qualitative Dichteklassifizierung
  densityJustification?: string; // Kontextuelle Begründung (z.B. Handelszentrum, Hafen, Festung, Lore)
  plausibilityStatus?: 'plausibel' | 'ungewoehnlich_begruendet' | 'unplausibel_korrigiert'; // Status der Plausibilitätsprüfung
  ruler?: string;
  rulingTitle?: string; // Titel/Rang (z.B. Dorfältester, Schulze, Baron, Graf, Herzog, König)
  overlord?: string; // Übergeordnete Herrschaft / Lehnsherr (wer steht hierarchisch darüber)
  feudalRank?: string; // Feudale Rangstufe & Lehnshierarchie
  lawEnforcement?: string; // Ordnungshüter, Büttel, Stadtgarde, Gerichtsbarkeit
  culture?: string;

  // RPG Maker Tile Map Data for detailed grid/brush view
  tileData?: {
    tiles?: Record<string, string>;
    gridWidth?: number;
    gridHeight?: number;
    placedObjects?: any[];
    positions?: any;
    tileSizeMeters?: number;
  };

  // Geografie
  biome?: string;
  size?: string;
  borders?: string;
  waters?: string;
  mountains?: string;
  forests?: string;

  // Gesellschaft
  races?: string;
  language?: string;
  religion?: string;
  livingStandard?: string;

  // Politik
  allies?: string;
  enemies?: string;
  government?: string;

  // Wirtschaft, Berufe & Aufgaben
  resources?: string;
  trade?: string;
  currency?: string;
  exports?: string;
  imports?: string;
  dailyJobs?: string; // Berufe & Alltagsarbeiten der Bewohner (z.B. 60% Bauern, 15% Fischer/Jäger, 15% Handwerker)
  localTasks?: string; // Tägliche Aufgaben & Pflichten im Gebiet (z.B. Feldbestellung, Wehrmauerdienst, Holzschlag)
  tradeGoods?: string; // Warenangebot / Überschüsse für Händler
  tradeDemands?: string; // Nachgefragte Waren & Mangelgüter von eintreffenden Händlern
  merchantsAndFairs?: string; // Reisende Händler, Karawanen & Markttage
  tradeContracts?: string; // Handelsverträge, Zölle & Abkommen

  // Militär, Schutz & Verteidigung
  dangerLevel?: string;
  militaryStrength?: string;
  defense?: string;
  combatReadyPopulation?: string; // Wehrfähige Personen / Kampfkraft (z.B. 50 von 200 Einwohnern können kämpfen)
  standingArmy?: string; // Stehendes Militär, Garnison, Berufssoldaten (z.B. 10 bezahlte Stadtwachen)
  militiaAndConscripts?: string; // Miliz, Bürgerwehr, Landsturm
  defenseStructures?: string; // Schutzanlagen & Befestigung (z.B. Palisade, Wehrturm, Wassergraben)
  armamentAndSupply?: string; // Bewaffnung & Ausrüstung der Verteidiger (z.B. Jagdbögen, Speere, Äxte)

  // Besonderheiten
  landmarks?: string;
  pointsOfInterest?: string;
  dungeons?: string;
  dungeonDetails?: DungeonDetails;
  magicPlaces?: string;
  naturalWonders?: string;
  layoutPreset?: string;
  compassDirections?: string;
  envNeighbours?: string;
  distancesToNeighbours?: string;

  // Dynamische Reise & Erkundung
  travelTime?: string;
  distance?: string;
  direction?: string;
  routeFrom?: string;
  accessRoutes?: string; // Zuwege, Handelsstraßen & Pfade
  travelDangers?: string; // Gefahren auf den Reiserouten (Wegelagerer, Mautstellen, Bestien)

  // Ort-/Region-Marker
  placeMarkers?: any[];
  regionMarkers?: any[];

  // Quest 4: Fakten-Herkunft & Kanon-Schutz
  sourceType?: FactSourceType;
  factStatus?: FactStatus;
  knowledgeType?: KnowledgeType;
}

export interface EconomyUpgrade {
  id: string;
  name: string;
  cost: number;
  levelRequired: number;
  unlocked: boolean;
  description: string;
}

export type EconomyResourceCategory = 'money' | 'goods' | 'raw_material' | 'food_drink' | 'equipment' | 'inventory' | 'staff' | 'capacity' | 'land' | 'animals' | 'vehicles' | 'luxury' | 'special';

export interface EconomyResource {
  id: string;
  name: string;
  category?: EconomyResourceCategory;
  builderType?: string; // Gegenstandsart (z.B. "Nahrung", "Waffe", "Rohstoff", "Werkzeug")
  subCategory?: string; // Unterkategorie (z.B. "Getränke, Bier & Wein", "Schwerter & Klingen")
  loreItemId?: string;  // Verknüpfte Lore-Eintrags-ID aus dem Codex
  amount: number;
  maxCapacity: number;
  unit: string; // e.g. "Münzen", "Fässer", "Tonnen", "Kisten", "Köpfe", "Sätze", "Hektar"
  pricePerUnit: number;
  condition?: 'exzellent' | 'gut' | 'knapp' | 'verdorben' | 'beschaedigt' | 'leer';
  notes?: string;
}

export interface EconomyRoleTalent {
  name: string;
  score: number; // 1 to 5
  description?: string;
}

export interface EconomyRole {
  id?: string;
  name: string; // e.g. "Besitzer", "Verwalter", "Manager", "Butler", "Wirt", "Koch", "Händler", "Wächter", "Handwerker", "Diener", "Arbeiter"
  assignedToName: string; // NPC Name, or "Spieler" / "User"
  assignedCharacterId?: string; // Referenz auf Charakter im Codex
  isUserPosition?: boolean; // Markiert, ob dies die Position des Spielers ist
  superiorRole?: string; // Vorgesetzter
  subordinateRoles?: string[]; // Untergebene Rollen
  authorities: string[]; // e.g. ["Preise festlegen", "Personal einstellen", "Einnahmen abschöpfen", "Betrieb schließen", "Aufgaben delegieren", "Aufträge vergeben", "Lagerbestände verwalten", "Budget freigeben"]
  responsibilities?: string[]; // Verantwortlichkeiten / Pflichten
  salary?: number; // Lohn / Gehalt
  workplaceArea?: string; // Arbeitsplatz / Aufenthaltsbereich
  
  // Berufszweig & Qualifikationen
  professionBranch?: string;
  professionField?: string;
  professionLevel?: string; // e.g. "Ungelernt", "Lehrling", "Geselle / Fortgeschritten", "Meister / Führungskraft"
  professionRank?: string;
  competencies?: ProfessionCompetency[];
  talents?: EconomyRoleTalent[];
  experienceYears?: number;
  practiceHours?: number;
  experiencePoints?: number;
  progressPercent?: number; // 0 - 100
  experienceNotes?: string;
}

export interface EconomyStaffGroup {
  id: string;
  roleName: string; // e.g. "Wachen", "Mägde", "Diener", "Köche", "Stallpersonal", "Handwerker", "Minenarbeiter", "Matrosen"
  count: number; // e.g. 12
  workplaceArea: string; // e.g. "Gästezimmer & Flure", "Tor & Mauern", "Ställe", "Küche"
  duties: string[]; // e.g. ["Zimmer reinigen", "Wäsche waschen", "Gäste bewirten"]
  status: 'aktiv' | 'überlastet' | 'unterbesetzt' | 'streikend' | 'zufrieden' | 'in_bereitschaft';
  assignedLeaderOrManager?: string; // e.g. "Haushälterin", "Hauptmann der Wache"
  dailyCostPerUnit?: number; // Lohn / Kosten pro Kopf
  notes?: string;
}

export interface EconomyTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  progress?: number; // 0-100%
  requiredResources?: string;
  reward: string;
  assigneeName?: string;
  assigneeId?: string;
  assigneeGroupId?: string;
  assigneeGroupName?: string;
  createdByName?: string;
  createdById?: string;
  parentOrderId?: string;
  taskType?: 'manual' | 'generated' | 'routine' | 'delegated' | 'emergency';
  canDelegate?: boolean;
  requiredJob?: string;
  requiredRank?: string;
  dependencies?: string[];
  consequenceOnFailure?: string;
  generatedByAI?: boolean;
  generatedReason?: string;
}

export interface TemporaryAuthority {
  id: string;
  authority: string;
  grantedToId?: string;
  grantedToName: string;
  grantedById?: string;
  grantedByName?: string;
  reason?: string;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
}

export interface WorkWorkflowTemplate {
  id: string;
  title: string;
  description?: string;
  category?: string;
  steps: {
    title: string;
    description?: string;
    suggestedRole?: string;
  }[];
}

export interface EconomyDuty {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'always' | 'shift';
  assignedRoleName?: string;
  assigneeRole?: string;
  assigneeId?: string;
  isFulfilled: boolean;
  consequences?: string;
}

export interface TradeContract {
  id: string;
  holdingId?: string;
  holdingName?: string;
  partnerName: string;
  partnerId?: string;
  partnerType?: 'npc' | 'holding' | 'faction' | 'merchant' | string;
  contractType: 'Handelsabkommen' | 'Liefervertrag' | 'Schutzvertrag' | 'Pachtvertrag' | 'Dienstleistung' | string;
  resourceName?: string;
  quantityPerInterval?: number;
  pricePerInterval?: number;
  interval?: 'täglich' | 'wöchentlich' | 'monatlich' | 'einmalig' | string;
  status: 'aktiv' | 'ausstehend' | 'erfüllt' | 'gekündigt' | 'gebrochen' | string;
  startDate?: string;
  terms?: string;
  notes?: string;
}

export interface EconomyOrder {
  id: string;
  title: string;
  issuerName: string; // Auftraggeber (Besitzer, Vorgesetzter, Fraktion, KI, Spieler)
  issuerId?: string;
  recipientName: string; // Empfänger
  recipientId?: string;
  targetGoal: string; // Ziel / Zweck
  requiredResources?: string; // Benötigte Ressourcen / Budget
  deadline?: string; // Frist
  priority: 'normal' | 'hoch' | 'kritisch';
  progress: number; // 0 - 100%
  reward?: string; // Belohnung
  consequences?: string; // Konsequenzen bei Misserfolg
  status: 'offen' | 'in_bearbeitung' | 'delegiert' | 'erfuellt' | 'abgebrochen' | 'fehlgeschlagen';
  delegatedTo?: string; // Weitergabe an andere NPCs
  notes?: string;
}

export interface EconomyDecisionOption {
  id: string;
  label: string;
  outcomeDescription: string;
  cost?: number;
  reputationChange?: number;
}

export interface EconomyDecision {
  id: string;
  title: string;
  description: string;
  category?: 'personal' | 'finanzen' | 'gebaeude' | 'kunden' | 'sicherheit' | 'fraktion' | 'produktion';
  urgency: 'niedrig' | 'mittel' | 'hoch';
  requiredAuthority?: string; // Benötigte Befugnis
  options: EconomyDecisionOption[];
  status: 'offen' | 'entschieden' | 'eskaliert';
  selectedOptionId?: string;
  escalatedTo?: string; // Z.B. "Besitzer", "Vorgesetzter"
  resolutionDate?: string;
}

export interface EconomyLogEntry {
  id: string;
  timestamp: string;
  actorName?: string; // z.B. "Magd Anna", "Butler Johann", "Wache Boris"
  actorRole?: string; // z.B. "Magd", "Butler", "Stadtwache"
  type: 'staff_action' | 'issue_report' | 'task_update' | 'financial' | 'order_progress' | 'visitor' | 'incident';
  message: string;
  severity?: 'info' | 'warning' | 'urgent' | 'positive';
}

export type EconomyEntityCategory = 
  | 'betrieb'          // Betriebe: Taverne, Gasthaus, Schmiede, Bäckerei, Werkstatt, Manufaktur, Magierladen
  | 'produktion'       // Produktion: Bauernhof, Mine, Sägewerk, Fischerei
  | 'handel'           // Handel: Marktstand, Handelskontor, Laden, Werft, Hafenbetrieb, Schiff, Gilde
  | 'dienstleistung'   // Dienstleistung: Herberge, Schänke, Gasthaus, Fuhrbetrieb
  | 'gebaeude_anwesen';// Gebäude & Anwesen: Wohnhaus, Rathaus, Gutshof, Herrenhaus, Burg, Schloss, Lagerhaus, Adelssitz, Fraktionssitz

export type EconomicUnitCategory = EconomyEntityCategory;

export type EconomyHoldingType =
  // Betriebe
  | 'taverne' 
  | 'gasthaus' 
  | 'schmiede' 
  | 'baeckerei' 
  | 'werkstatt' 
  | 'manufaktur' 
  | 'magierladen'
  // Produktion
  | 'bauernhof' 
  | 'mine' 
  | 'saegewerk' 
  | 'fischerei'
  // Handel & Dienstleistungen
  | 'markt' 
  | 'haendler' 
  | 'herberge' 
  | 'werft' 
  | 'hafenbetrieb' 
  | 'schiff' 
  | 'gilde'
  // Gebäude & Anwesen
  | 'wohnhaus' 
  | 'rathaus' 
  | 'gutshof' 
  | 'herrenhaus' 
  | 'burg' 
  | 'schloss' 
  | 'lagerhaus' 
  | 'anwesen' 
  | 'adelssitz' 
  | 'fraktionsgebaeude'
  // Individuell
  | 'custom'
  | (string & {});

/**
 * Raumtypen-Katalog für Holdings / Gebäude
 */
export type HoldingRoomType =
  // Wohn- und Schlafräume
  | 'family_room'
  | 'bedroom'
  | 'guest_room'
  | 'staff_room'
  | 'shared_staff_room'
  | 'dormitory'
  | 'servant_room'
  | 'guard_quarters'
  | 'barracks_room'
  // Wirtschafts- und Arbeitsräume
  | 'kitchen'
  | 'workshop'
  | 'forge'
  | 'office'
  | 'sales_room'
  | 'tap_room'
  | 'dining_room'
  | 'production_room'
  // Lagerung
  | 'storage'
  | 'pantry'
  | 'warehouse_room'
  | 'cellar'
  | 'cold_storage'
  // Versorgung
  | 'bathroom'
  | 'washroom'
  | 'toilet'
  | 'utility_room'
  | 'heating_room'
  // Verwaltung / Öffentlichkeit / Religion
  | 'meeting_room'
  | 'council_room'
  | 'archive'
  | 'classroom'
  | 'prayer_room'
  | 'chapel'
  | 'audience_room'
  // Erschließung
  | 'entrance'
  | 'hallway'
  | 'corridor'
  | 'stairway'
  | 'stairwell'
  | 'vestibule'
  // Außen-/Funktionsbereiche
  | 'courtyard'
  | 'yard'
  | 'garden'
  | 'terrace'
  | 'stable_yard'
  | 'work_yard'
  | (string & {});

export type RoomOccupancyMode =
  | 'private'
  | 'shared'
  | 'family'
  | 'guest'
  | 'staff'
  | 'mixed'
  | (string & {});

export type RoomPrivacy = 'private' | 'shared' | 'public' | (string & {});

export interface HoldingRoom {
  id: string;
  name: string; // z.B. "Schankraum", "Gästezimmer", "Küche"
  count: number; // Anzahl identischer Räume
  roomType?: HoldingRoomType; // Kategorie-Typ des Raumes
  purpose?: string; // Zweck / Nutzung

  // Betten- und Belegungsmodell
  bedsPerRoom?: number; // Betten je Zimmer (z.B. 1, 2, 4)
  totalBeds?: number; // Gesamtbetten (count × bedsPerRoom)
  occupiedBeds?: number; // Aktuell belegte Betten
  freeBeds?: number; // Aktuell freie Betten (totalBeds - occupiedBeds)

  occupancyMode?: RoomOccupancyMode; // Belegungsart (private, shared, family, guest, staff, mixed)
  privacy?: RoomPrivacy; // Privatsphäre (private, shared, public)

  capacity?: number; // Maximale Personenkapazität (z.B. Gaststube: 40 Gäste)
  currentOccupancy?: number; // Aktuelle Personenzahl

  required?: boolean; // Betriebsnotwendig
  optional?: boolean; // Optionaler Zusatzbereich

  floor?: string; // z.B. "Keller", "Erdgeschoss", "1. OG", "2. OG", "Dachgeschoss", "Außenbereich"

  occupantIds?: string[]; // IDs zugewiesener Charaktere/Bewohner
  occupantNames?: string[]; // Namen zugewiesener Charaktere/Bewohner
  assignedTaskId?: string; // Verknüpfte betriebliche Aufgabe
  assignedRoleName?: string; // Zuständige Mitarbeiter-Rolle oder Personalstelle
  notes?: string; // Zusätzliche Anmerkungen
}

export interface EconomyHolding {
  id: string;
  name: string;
  category?: EconomicUnitCategory; // Logische Zuordnung: betrieb | produktion | handel | gebaeude_anwesen
  type: EconomyHoldingType;
  icon?: string;
  description?: string;
  level: number; // 1-5
  ownerType: 'user' | 'character' | 'faction';
  assignedCharacterId?: string;
  assignedCharacterName?: string;
  assignedManagerId?: string; // Verwalter ID (neu)
  assignedManagerName?: string; // Verwalter Name (neu)
  userRoleName?: string; // Position des Nutzers in diesem Objekt (z.B. "Besitzer", "Verwalter", "Wächter", "Gast")
  incomePerInterval: number;
  upkeepPerInterval: number;
  staffCount: number;
  reputation?: number; // 0-100
  status: 'active' | 'damaged' | 'expanding' | 'bankrupt' | 'under_siege';
  upgrades?: EconomyUpgrade[];
  locationName?: string; // Name des Ortes / Gebiets (z.B. "Dorf Falkengrund", "Silberhafen")
  locationId?: string; // Stabile Referenz auf geografisches Territory (Ort / Gebiet)
  territoryId?: string; // Synonym für locationId
  buildingId?: string; // Optional: ID des Gebäudes/Anwesens, in dem dieser Betrieb liegt
  buildingName?: string; // Optional: Name des übergeordneten Gebäudes/Anwesens (z.B. "Gutshof Falkenstein", "Westtor-Turm")
  loreEntryId?: string; // Referenz auf zugehörigen Codex-Eintrag
  ownerCharacterId?: string; // Besitzer-Charakter ID aus Codex
  ownerFactionId?: string; // Besitzer-Fraktion ID aus Codex
  ownerFactionName?: string; // Besitzer-Fraktion Name aus Codex
  controlledByFactionId?: string; // Kontrollierende Fraktion ID
  controlledByFactionName?: string; // Kontrollierende Fraktion Name
  resources?: EconomyResource[];
  tasks?: EconomyTask[];
  duties?: EconomyDuty[];
  roles?: EconomyRole[];
  staffGroups?: EconomyStaffGroup[]; // Namenlose NPC-Gruppen (z.B. 12 Mägde, 8 Wachen, etc.)
  orders?: EconomyOrder[]; // Aufträge / Direktiven
  contracts?: TradeContract[]; // Handels- & Lieferverträge
  decisions?: EconomyDecision[]; // Management-Entscheidungen & Vorfälle
  activityLogs?: EconomyLogEntry[]; // Lebendige Hintergrundaktivität & Betriebs-Log
  temporaryAuthorities?: TemporaryAuthority[]; // Vergebene Sonderrechte & temporäre Befugnisse
  workTemplates?: WorkWorkflowTemplate[]; // Vorlagen für Arbeitsabläufe
  employeeIds?: string[]; // Verknüpfte Mitarbeiter- / Angestellten-Charakter-IDs
  employeeNames?: string[]; // Verknüpfte Mitarbeiter- / Angestellten-Charakter-Namen
  source?: 'auto-derived' | 'explicit' | string; // Quelle des Betriebs (z.B. auto-derived aus Charakter-Erstellung)
  derivedFromCharacterId?: string; // Charakter-ID, aus der dieser Betrieb abgeleitet wurde
  derivedFromProfession?: string; // Beruf, aus dem dieser Betrieb abgeleitet wurde

  // Physischer Zustand & Allgemeine Gebäudeinformationen
  physicalCondition?: string; // Zustand (z.B. "Hervorragend", "Gut", "Reparaturbedürftig", "Ruine")
  physicalSize?: string; // Größe (z.B. "Klein", "Mittel", "Groß", "Monumental")
  physicalCapacity?: string; // Kapazität (z.B. "50 Gäste", "25 Mitarbeiter")
  physicalUsage?: string; // Zweck / Aktuelle Nutzung (z.B. "Wohnen", "Gewerbe", "Militär", "Kult")
  roomsOrAreas?: string | string[]; // Räume / Bereiche (Text-Zusammenfassung)
  buildingRooms?: HoldingRoom[]; // Detaillierte Liste der Räume mit Anzahl und Zweck
  damages?: string | string[]; // Schäden / Mängel
  accessibility?: string; // Zugänglichkeit (z.B. Öffentlich, Geheim, Nur Befugte, Privat)
  residentsOrVisitors?: string; // Bewohner / Besucher
  ownerFaction?: string; // Nutzer / Fraktion
  budget?: number; // Budget / Barvermögen
  storageCapacity?: string | number; // Lagerkapazität (z.B. "200 Kisten", "150 Fässer" oder 200)
  currentIssuesOrDecisions?: string | string[]; // Aktuelle Probleme / Dringende Entscheidungen
  plannedProjects?: string | string[]; // Geplante Projekte
  upgradeRequirements?: string; // Voraussetzungen für Upgrades

  // Modulare Sichtbarkeiten / Optionale Bereiche
  useResourcesModule?: boolean; // resources/Lager
  useStaffModule?: boolean; // roles & staffGroups/Personal
  useFinanceModule?: boolean; // income/upkeep/Wirtschaft
  useManagementModule?: boolean; // tasks/duties/Management
  useOrdersModule?: boolean; // orders/Aufträge
  useDecisionsModule?: boolean; // decisions/Entscheidungen
  useLogsModule?: boolean; // activityLogs/Hintergrundaktivität

  // Quest 4: Fakten-Konsistenz, Quellen & Historie
  sourceType?: FactSourceType;
  factStatus?: FactStatus;
  history?: {
    id: string;
    previousOwnerType?: 'user' | 'character' | 'faction';
    previousOwnerName?: string;
    changedAt?: string;
    reason?: string;
  }[];
}

export type FactSourceType = 'author' | 'user' | 'established_story' | 'ai_inference' | 'calculated';
export type FactStatus = 'known' | 'implied' | 'unknown';
export type KnowledgeType = 'fact' | 'belief' | 'rumor' | 'inference' | 'proposal';

export interface WorldFact {
  id: string;
  subjectId: string;
  subjectName?: string;
  predicate: 
    | 'located_in' 
    | 'north_of' 
    | 'south_of' 
    | 'east_of' 
    | 'west_of' 
    | 'distance_from' 
    | 'connected_to' 
    | 'bordered_by' 
    | 'separated_by' 
    | 'owns' 
    | 'controls' 
    | 'member_of' 
    | 'allied_with' 
    | 'enemy_of' 
    | 'profession_is' 
    | 'has_trait' 
    | 'rumor_about' 
    | 'belief_about' 
    | (string & {});
  objectId?: string;
  objectName?: string;
  value?: any;
  sourceType: FactSourceType;
  status: FactStatus;
  knowledgeType: KnowledgeType;
  confidence?: number; // 0 to 100
  validFrom?: string;
  validTo?: string;
  isCurrent?: boolean;
  note?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface WorldFactConflict {
  id: string;
  existingFact: WorldFact;
  proposedFact: WorldFact;
  reason: string;
  severity: 'critical' | 'warning' | 'info';
  detectedAt: number;
  resolved?: boolean;
  resolutionNote?: string;
  resolvedBy?: 'keep_existing' | 'accept_proposed' | 'convert_to_rumor' | 'custom';
}

export interface WorldFactChangeLogEntry {
  id: string;
  entityId: string;
  entityName?: string;
  entityType: 'territory' | 'holding' | 'character' | 'faction' | 'lore' | 'fact' | string;
  whatChanged: string;
  oldValue?: any;
  newValue?: any;
  source: FactSourceType;
  reason?: string;
  timestamp: number;
}

export interface RelevantWorldContextParams {
  locationId?: string;
  locationName?: string;
  topic?: string;
  radius?: number;
  characterIds?: string[];
  factionIds?: string[];
}

export type WorldEntityType =
  | 'race'
  | 'enemy'
  | 'faction'
  | 'character'
  | 'npc'
  | 'territory'
  | 'place'
  | 'holding'
  | 'event'
  | 'lore';

export interface WorldEntityReference {
  entityId: string;
  entityType: WorldEntityType;
  displayName?: string;
  category?: string;
  sourceType?: FactSourceType;
  metadata?: Record<string, any>;
}

export interface ResolutionResult<T> {
  value: T | null;
  status: 'resolved' | 'ambiguous' | 'unresolved';
  confidence: number;
  candidates?: T[];
  reason?: string;
  source?: 'id' | 'exact_name' | 'alias' | 'normalized' | 'fact' | 'fuzzy';
}

export interface WorldEventIntent {
  type?: 'observation' | 'movement' | 'raid' | 'attack' | 'discovery' | 'camp' | 'threat' | 'info' | string;
  subject?: string;
  faction?: string;
  race?: string;
  enemyType?: string;
  leader?: string;
  origin?: string;
  target?: string;
  count?: number;
  objective?: string;
  hostility?: 'neutral' | 'suspicious' | 'hostile';
  movement?: boolean;
  attack?: boolean;
  discoveredByPlayer?: boolean;
  tacticalRelevant?: boolean;
  confidence?: number;
  rawText?: string;
}

export interface EventPreconditions {
  locationExists?: boolean;
  territoryControlledByFactionId?: string;
  routeActive?: boolean;
  minimumUnitCount?: number;
  customCheckKey?: string;
  requiredWorldFactPredicate?: string;
}

export interface EventConsequences {
  damageToLocation?: string;
  controlTransferFactionId?: string;
  spawnBattleInstance?: boolean;
  economicImpact?: 'damaged' | 'under_siege' | 'operational' | 'boosted';
  followUpEventDelayMinutes?: number;
  followUpEventType?: string;
  followUpEventTitle?: string;
  holdingStatusUpdate?: { holdingId: string; status: 'operational' | 'under_siege' | 'damaged' | 'destroyed' };
  generatedFactText?: string;
}

export interface WorldEvent {
  id: string;
  type: 'raid' | 'movement' | 'siege' | 'reinforcement' | 'trade_shift' | 'economic_payout' | 'observation' | 'general' | string;
  title?: string;
  description?: string;
  createdAtWorldTime: WorldTime;
  scheduledForWorldTime: WorldTime;
  sourceType?: 'character' | 'faction' | 'territory' | 'location' | 'encounter_force' | 'system';
  sourceId?: string;
  territoryId?: string;
  locationId?: string;
  factionId?: string;
  characterId?: string;
  battleInstanceId?: string;
  status: 'scheduled' | 'pending' | 'resolved' | 'cancelled';
  priority?: number;
  preconditions?: EventPreconditions;
  consequences?: EventConsequences;
  isPlayerVisible?: boolean;
  processingDepth?: number;
  data?: Record<string, any>;
}

export interface EncounterForce {
  id: string;
  name: string;
  factionId?: string;
  factionName?: string;
  raceId?: string;
  raceName?: string;
  enemyTypeId?: string;
  enemyTypeName?: string;
  leaderCharacterId?: string;
  leaderCharacterName?: string;
  originId?: string;
  originName?: string;
  targetId?: string;
  targetName?: string;
  count: number;
  objective?: string; // 'raid' | 'patrol' | 'defense' | 'scout' | 'assault' | 'siege' | 'travel' | 'camp' | 'unknown' | string
  context?: string;
  hostility?: 'neutral' | 'suspicious' | 'hostile';
  escalation?: 'local' | 'regional' | 'major' | 'unknown';
  status?: 'detected' | 'moving' | 'mobilized' | 'engaged' | 'retreated' | 'defeated' | 'dispersed' | 'resolved';
  tacticalGroupId?: string;
  isTacticalSpawned?: boolean;
  createdAt?: number;
  updatedAt?: number;
  metadata?: Record<string, any>;
}

export interface FactionWorldState {
  factionId: string;
  factionName?: string;
  currentTerritoryId?: string;
  currentTerritoryName?: string;
  currentLeaderId?: string;
  currentLeaderName?: string;
  availableForce?: number;
  mobilizedForce?: number;
  casualtyCount?: number;
  morale?: number; // 0 to 100
  resources?: Record<string, any>;
  currentGoal?: string;
  activeEvents?: string[];
  activeThreats?: string[];
  relationships?: Record<string, string>; // targetId -> 'allied' | 'hostile' | 'neutral' | 'tensed' | string
  isWeakened?: boolean;
  lastUpdated?: number;
}

export interface WorldLocationReference {
  id: string;
  territoryId: string;
  name: string;
  type: string; // 'stadt' | 'dorf' | 'gebaeude' | 'strasse' | 'hafen' | 'festung' | 'poi' | string
  x?: number;
  y?: number;
  description?: string;
  terrainType?: string;
  parentLocationId?: string;
  loreEntryId?: string;
  controlledByFactionId?: string;
  ownerFactionId?: string;
  ownerCharacterId?: string;
  placedObjects?: PlacedCombatObject[];
  tileData?: any;
  metadata?: Record<string, any>;
}

export interface BattleParticipantRelation {
  fromForceId: string;
  toForceId: string;
  relation: 'ally' | 'hostile' | 'neutral' | 'disputed';
}

export interface BattleInstance {
  id: string;
  worldStateId?: string;
  territoryId: string;
  locationId?: string;
  locationName?: string;
  battleMapId?: string;
  startedAtWorldTime?: WorldTime;
  status: 'active' | 'completed' | 'retreated' | 'aborted';

  participatingFactionIds: string[];
  participatingCharacterIds: string[];
  participatingEncounterForceIds?: string[];
  tacticalGroupIds: string[];
  participantRelations?: BattleParticipantRelation[];

  terrainSnapshot?: {
    terrainType?: string;
    biome?: string;
    gridWidth: number;
    gridHeight: number;
    blockedCells?: Record<string, boolean>;
    terrainCells?: Record<string, string>;
  };
  objectSnapshot?: {
    placedObjects?: PlacedCombatObject[];
  };

  result?: {
    winnerFactionId?: string;
    casualties?: Record<string, number>;
    destroyedObjects?: string[];
    damagedObjects?: string[];
    territoryChanges?: {
      territoryId: string;
      previousFactionId?: string;
      newFactionId?: string;
    };
    locationChanges?: {
      locationId?: string;
      damageDescription?: string;
    };
    details?: string;
  };
  createdAt?: number;
  completedAt?: number;
}

export interface CombatResultFeedback {
  forceId?: string;
  factionId?: string;
  enemyTypeId?: string;
  initialCount?: number;
  casualties?: number;
  survivors?: number;
  targetId?: string;
  outcome?: 'victory' | 'defeat' | 'retreat' | 'stalemate';
  leaderStatus?: 'unharmed' | 'injured' | 'captured' | 'fallen' | 'retreated' | string;
  damageToTargetLocation?: string;
  relationshipImpact?: string;
  timestamp?: number;
  details?: string;
  battleInstanceId?: string;
  destroyedObjectIds?: string[];
  damagedObjectIds?: string[];
  conqueredTerritoryId?: string;
  newControllingFactionId?: string;
}

export interface DynamicWorldState {
  factions?: Record<string, FactionWorldState>;
  encounterForces?: Record<string, EncounterForce>;
  battleInstances?: Record<string, BattleInstance>;
  locations?: Record<string, WorldLocationReference>;
  currentLocationId?: string;
  currentTerritoryId?: string;
  scheduledEvents?: WorldEvent[];
  eventHistory?: WorldEvent[];
  activeThreats?: string[];
  activeEvents?: string[];
  recentCombatOutcomes?: CombatResultFeedback[];
  simulationSeed?: number;
  lastUpdated?: number;
}

export interface RelevantWorldContextResult {
  currentLocation?: Territory | null;
  nearbyTerritories: Territory[];
  relevantHoldings: EconomyHolding[];
  relevantCodexEntries: LoreEntry[];
  relevantCharacters: Character[];
  relevantFacts: WorldFact[];
  relevantConnections: any[];
  activeRumors: WorldFact[];
  unresolvedConflicts: WorldFactConflict[];
  contextSummaryText: string;
}

export interface EconomyConfig {
  currencyName: string;
  currencyIcon: string;
  payoutInterval: 'daily' | 'weekly' | 'after_adventure';
  allowPassiveIncome: boolean;
  enableRandomEvents: boolean;
  holdings: EconomyHolding[];
}

export interface WorldSetting {
  title: string;
  description: string;
  era: string;
  tone: string;
  isNsfw?: boolean;
  isHeroic?: boolean;
  isOnePiece?: boolean;
  dramaLevel?: 'Niedrig' | 'Mittel' | 'Hoch';
  mapConfig?: WorldMapConfig;
  economyConfig?: EconomyConfig;
  economy?: EconomyConfig;
  territories?: Territory[];
  locations?: WorldLocationReference[];
  battleInstances?: BattleInstance[];
  loreDatabase?: LoreEntry[];
  facts?: WorldFact[];
  conflicts?: WorldFactConflict[];
  changeLog?: WorldFactChangeLogEntry[];
  encounterForces?: EncounterForce[];
  scheduledEvents?: WorldEvent[];
  dynamicWorldState?: DynamicWorldState;
  connections?: { id?: string; fromId?: string; toId?: string; fromPlace?: string; toPlace?: string; label?: string; travelTime?: string; distance?: string; duration?: string; type?: 'land' | 'sea' | 'air' | string; isUnlocked?: boolean; isBlocked?: boolean; blockReason?: string }[];
  startLocationId?: string;
  startLocationName?: string;
  currentLocationId?: string;
  currentTerritoryId?: string;
  borders?: { id: string; name: string; points: { x: number; y: number }[]; color?: string; isLandmass?: boolean; isClosed?: boolean; isDashed?: boolean; cx?: number; cy?: number; radius?: number }[];
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
  worldTime?: WorldTime;
  hudConfig?: HUDConfiguration;
  transformationConfig?: Partial<TransformationState>;
  worldStructure?: {
    worldName?: string;
    type?: string;
    shape?: string;
    continentsCount?: number;
    seasCount?: number;
    islandsCount?: number;
  };
  physicalGeography?: {
    worldSize?: string;
    continentsCount?: number;
    oceans?: string;
    islands?: string;
    mountains?: string;
    rivers?: string;
    lakes?: string;
    coasts?: string;
    forests?: string;
    swamps?: string;
    deserts?: string;
    tundra?: string;
    volcanoes?: string;
    climateZones?: string;
  };
  relationships?: {
    fromPlace: string;
    toPlace: string;
    direction: string;
    distance: string;
  }[];
  terrains?: {
    id?: string;
    type: 'Gebirge' | 'Wald' | 'Fluss' | 'See' | 'Sumpf' | 'Wüste' | 'Tundra' | 'Vulkan' | 'Küste' | 'Inselgruppe' | 'Ozean' | string;
    name: string;
    description: string;
    x: number;
    y: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    width?: number;
    height?: number;
    radius?: number;
    color?: string;
    shapeType?: 'circle' | 'rectangle' | 'river' | string;
    adjacentZones?: string;
    customShape?: { x: number; y: number }[];
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    controlX?: number;
    controlY?: number;
    parentTerritoryId?: string;
  }[];
  civilization?: {
    countries?: string;
    kingdoms?: string;
    factions?: string;
    borders?: string;
    tradeRoutes?: string;
    ports?: string;
    capitals?: string;
    villages?: string;
    civilizationAnalysis?: string;
    races?: string;
    cultures?: string;
    religions?: string;
    governments?: string;
    economy?: string;
    languages?: string;
    currencies?: string;
    countriesList?: {
      name: string;
      capital: string;
      borders: string;
      population: string;
      ruler: string;
      flag: string;
      culture: string;
    }[];
  };
  civilizationMarkers?: {
    id?: string;
    type: 'Hauptstadt' | 'Hafen' | 'Dorf' | 'Grenzposten' | 'Handelsstützpunkt' | string;
    name: string;
    description: string;
    x: number;
    y: number;
    associatedFaction?: string;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    width?: number;
    height?: number;
    color?: string;
    adjacentZones?: string;
    customShape?: { x: number; y: number }[];
    parentTerritoryId?: string;
  }[];
  regions?: {
    forests?: string;
    mountainPasses?: string;
    archipelagos?: string;
    ruins?: string;
    temples?: string;
    dungeons?: string;
    regionsAnalysis?: string;
    regionsList?: {
      name: string;
      type: string;
      biome: string;
      climate: string;
      features: string;
      threats: string;
      resources: string;
      population: string;
    }[];
  };
  regionMarkers?: {
    id?: string;
    type: 'Wald' | 'Gebirgspass' | 'Inselgruppe' | 'Ruine' | 'Tempel' | 'Dungeon' | string;
    name: string;
    description: string;
    x: number;
    y: number;
    hazardLevel?: string;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    width?: number;
    height?: number;
    color?: string;
    adjacentZones?: string;
    customShape?: { x: number; y: number }[];
    parentTerritoryId?: string;
  }[];
  places?: {
    cities?: string;
    houses?: string;
    taverns?: string;
    castles?: string;
    mines?: string;
    farms?: string;
    placesAnalysis?: string;
    placesList?: {
      name: string;
      type: string;
      population: string;
      economy: string;
      merchants: string;
      guards: string;
      faction: string;
      prosperity: string;
      crime: string;
      buildings?: {
        name: string;
        type: string;
        owner: string;
        function: string;
      }[];
    }[];
  };
  placeMarkers?: {
    id?: string;
    type: 'Stadt' | 'Haus' | 'Taverne' | 'Burg' | 'Mine' | 'Bauernhof' | string;
    name: string;
    description: string;
    x: number;
    y: number;
    associatedFaction?: string;
    inhabitantCount?: string;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    width?: number;
    height?: number;
    color?: string;
    adjacentZones?: string;
    customShape?: { x: number; y: number }[];
    parentTerritoryId?: string;
  }[];
  worldNpcs?: {
    citizens?: string;
    merchants?: string;
    monsters?: string;
    factions?: string;
    armies?: string;
    npcsAnalysis?: string;
    npcsList?: {
      name: string;
      age: string;
      gender: string;
      race: string;
      job: string;
      personality: string;
      goals: string;
      relationships: string;
      location: string;
      inventory: string;
      skills: string;
      faction: string;
      reputation: string;
    }[];
    monstersList?: {
      name: string;
      spawnArea: string;
      behavior: string;
      aggressiveness: string;
      packSize: string;
    }[];
  };
  worldNpcMarkers?: {
    type: 'Einwohner' | 'Händler' | 'Monster' | 'Fraktion' | 'Armee' | string;
    name: string;
    description: string;
    x: number;
    y: number;
    dangerLevel?: string;
    sizeOrPower?: string;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    width?: number;
    height?: number;
    color?: string;
    adjacentZones?: string;
    customShape?: { x: number; y: number }[];
  }[];
  worldStory?: {
    quests?: string;
    events?: string;
    mainStory?: string;
    sideQuests?: string;
    storyAnalysis?: string;
    era?: string;
    history?: string;
    wars?: string;
    disasters?: string;
    legends?: string;
    heroes?: string;
    ancientEmpires?: string;
    religions?: string;
    myths?: string;
    timeline?: string;
  };
  worldStoryMarkers?: {
    type: 'Quest' | 'Ereignis' | 'Hauptstory' | 'Nebenquest' | string;
    name: string;
    description: string;
    x: number;
    y: number;
    difficulty?: string;
    rewards?: string;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    width?: number;
    height?: number;
    color?: string;
    adjacentZones?: string;
    customShape?: { x: number; y: number }[];
  }[];
}

export type LoreCategory = 'Charaktere' | 'Rassen' | 'Orte' | 'Fraktionen' | 'Gegenstände' | 'Verbotenes Wissen' | 'Story & Quests' | 'Weltregeln' | 'Gegner' | 'Zeitlinie';

export interface RaceDetails {
  // Grunddaten & Einordnung
  subraces?: string; // Alternative Bezeichnungen, Unterarten oder Stämme
  lifespan?: string; // Durchschnittliche Lebenserwartung & Reifealter
  originHabitat?: string; // Heimatgebiet, Kontinent oder bevorzugter Lebensraum
  rarity?: string; // Verbreitung / Häufigkeit (Häufig, Regional, Selten, Fast ausgestorben, Legendär)
  languages?: string; // Sprache, Dialekte und Schriftsystem

  // Physische & Anatomische Merkmale
  averageHeight?: string; // Durchschnittsgröße
  averageWeight?: string; // Durchschnittliches Gewicht / Statur
  distinctiveFeatures?: string; // Besondere Merkmale (Hörner, Schweif, Schuppen, Ohren, Flügel etc.)
  skinAndHair?: string; // Typische Haut-, Fell- oder Schuppentöne sowie Haarfarben
  eyeFeatures?: string; // Augenmerkmale, Nachtsicht oder Sinnesorgane
  biologyAndDiet?: string; // Biologische Besonderheiten, Stoffwechsel, Ernährung und Schlafbedarf

  // Kultur, Glauben & Gesellschaft
  socialStructure?: string; // Gesellschaftsordnung, Sippenstruktur und Herrschaftssystem
  valuesAndPhilosophy?: string; // Kulturelle Grundwerte, Ehrenkodex und Philosophie
  religionsAndGods?: string; // Religiöser Glaube, Ahnenkult und Gottheiten
  traditionsAndRituals?: string; // Bräuche, Riten, Feste und Zeremonien
  typicalProfessions?: string; // Typische Tätigkeitsfelder, Handwerkskunst und Rollen

  // Fähigkeiten, Magie & Resistenzen
  naturalTraits?: string; // Angeborene Begabungen und körperliche Talente
  magicalAffinities?: string; // Magische Begabung, Elementaraffinitäten oder Energienutzung
  resistances?: string; // Resistenzen und Immunitäten (z.B. Hitze, Kälte, Gift)
  weaknesses?: string; // Schwächen und Verwundbarkeiten

  // Diplomatie & Beziehungen
  relationsAllies?: string; // Befreundete oder verbündete Völker
  relationsRivals?: string; // Angespannte Verhältnisse und Rivalitäten
  relationsEnemies?: string; // Feindseligkeiten oder historische Erbfeinde
  attitudeTowardsOutsiders?: string; // Haltung gegenüber Fremden (Gastfreundlich, Misstrauisch, Isoliert etc.)
  reputation?: string; // Weltweiter Ruf und Stereotypen

  // Namenskonventionen & Bekannte Vertreter
  namingMale?: string; // Männliche Beispielnamen und Konventionen
  namingFemale?: string; // Weibliche Beispielnamen und Konventionen
  namingSurnames?: string; // Sippennamen, Clan-Bezeichnungen oder Titel
  prominentFigures?: string; // Bedeutende historische Persönlichkeiten oder Anführer
}

export interface ItemIngredient {
  id?: string;
  name: string;
  amount: number;
  unit: string;
  itemId?: string; // Optionaler Verweis auf Item im Codex
}

export interface ItemDetails {
  // 1. Kategorisierung & Identifikation
  mainCategory?: string; // z.B. 'Rohstoffe', 'Materialien & Zwischenprodukte', 'Produkte', 'Alltags- & Haushaltsgegenstände', 'Nahrung', 'Kleidung & Textilien', 'Waffen', 'Rüstung & Schutzausrüstung', 'Werkzeuge', 'Landwirtschaft', 'Tiere', 'Transportmittel', 'Militärbedarf', 'Medizin', 'Handelswaren', 'Magische Gegenstände', 'Quest-/Story-Gegenstände'
  subCategory?: string; // z.B. 'Metallerze', 'Schwerter & Klingen', 'Frischwaren', etc.
  itemType?: string; // Spezifische Typbezeichnung (z.B. 'Einhändiges Langschwert', 'Heilbalsam')
  isUnique?: string; // 'Unikat / Legendär', 'Seltenes Einzelstück', 'Regionale Spezialität', 'Massenware / Standard'
  rarity?: string; // 'Gewöhnlich / Alltäglich', 'Solide / Gehoben', 'Selten / Hochwertig', 'Meisterlich / Kostbar', 'Legendär / Einzigartig', 'Mythisch / Antik'
  currentLocation?: string; // Aufenthaltsort / Vorkommen / Verbleib

  // 2. Physische Eigenschaften & Zustand
  unit?: string; // 'Stück', 'kg', 'Portionen', 'Flaschen', 'Säcke', 'Tiere', 'Fahrzeuge', etc.
  weight?: number | string; // Gewicht pro Einheit
  dimensions?: string; // Abmessungen / Packmaß
  condition?: string; // 'exzellent', 'gut', 'knapp', 'beschaedigt', 'verdorben'
  durability?: number | string; // Haltbarkeit / Zustandspunkte
  maxDurability?: number | string;

  // 3. Wirtschaft, Handel & Produktion
  pricePerUnit?: number; // Richtpreis / Handelswert in Goldmünzen
  costPrice?: number; // Herstellungskosten
  stockAmount?: number; // Aktueller Lagerbestand
  maxCapacity?: number; // Maximale Lagerkapazität
  producingHoldingName?: string; // Name des produzierenden / lagernden Betriebs
  producingHoldingId?: string; // Referenz auf Holding ID
  productionHoldingType?: string; // Erforderlicher Betriebstyp (z.B. 'Schmiede', 'Bäckerei')
  requiredProfession?: string; // Erforderlicher Handwerksberuf (z.B. 'Schmied')
  requiredTools?: string; // Benötigte Werkzeuge / Ausstattung
  productionTime?: string; // Herstellungsdauer
  byproducts?: string; // Anfallende Nebenprodukte
  producedFrom?: string; // Textuelle Ausgangsstoffe
  processedInto?: string; // Textuelle Folgeprodukte
  ingredients?: ItemIngredient[]; // Strukturierte Ausgangsstoffe

  // 4. Waffen- & Kampf-Spezifika
  weaponType?: string; // Klingenwaffe, Wuchtwaffe, Stangenwaffe, Bogen, etc.
  damageType?: string; // Hieb, Stich, Wucht, Magisch, Feuer, Eis, Blitz, etc.
  damageValue?: string; // z.B. '1d8 + 2', '24-32'
  range?: string; // Nahkampf, 30m, 100m
  attackSpeed?: string; // Sehr schnell, Schnell, Normal, Langsam
  twoHanded?: boolean;

  // 5. Rüstungs- & Schutz-Spezifika
  armorType?: string; // Leicht, Mittel, Schwer, Schild, Helm, etc.
  armorValue?: number | string; // Rüstungsschutz / AC
  coverage?: string; // Ganzer Körper, Torso, Kopf, Arme, Beine
  movementPenalty?: string; // Bewegungsabzug / Belastung

  // 6. Nahrung, Konsumgüter & Medizin
  shelfLifeDays?: number | string; // Haltbarkeit in Tagen / Verfall
  nutritionValue?: string; // Sättigungswert / Erholungsgrad
  servingSize?: string;
  medicalEffect?: string; // Heilwirkung, Schmerzlinderung, Wunddesinfektion
  dosage?: string; // Dosierung / Einnahmehinweis
  sideEffects?: string; // Nebenwirkungen / Toxizität

  // 7. Tiere & Transportmittel
  animalSpecies?: string; // Rasse / Tierart
  temperament?: string; // Sanftmütig, Stur, Aggressiv, Gelehrig
  speedKmH?: number | string; // Geschwindigkeit in km/h
  carryingCapacityKg?: number | string; // Tragkraft / Zuladung
  crewRequirement?: string; // Erforderliche Besatzung / Gespannführer
  feedRequirement?: string; // Futterbedarf pro Tag

  // 8. Magie, Runen & Effekte
  effects?: string; // Primäre Wirkung / Funktion
  magicalProperties?: string; // Magische Verzauberungen / Runen
  manaCost?: string; // Manakosten bei Aktivierung
  charges?: number | string; // Aufladungen / Verwendungsanzahl

  // 9. Militärischer Bedarf & Tross
  militaryRole?: string; // 'Standardausrüstung (Infantrie)', 'Fernkampfausrüstung', 'Kavallerie', etc.
  troopConsumptionRate?: string; // Verbrauch pro 100 Soldaten / Tag

  // 10. Quest & Story
  questImportance?: string; // Wichtigkeit für Quests
  ownerCharacterId?: string; // Besitzer-NPC
  secretProperties?: string; // Verborgene Eigenschaften

  // 11. Loot, Monster-Drops, Dungeons & Wertschöpfungskette
  originSourceType?: string; // 'Monsterbeute', 'Dungeon-Vorkommen', 'Handwerk / Produktion', 'Schatztruhe / Lager', 'Landwirtschaft / Ernte', 'Handel / Import', 'Quest / Relikt'
  droppedByMonsterId?: string; // Referenz auf Monster (LoreEntry Gegner)
  droppedByMonsterName?: string; // Monstername
  harvestedBodyPart?: string; // z.B. 'Fleisch', 'Fell', 'Leder / Haut', 'Knochen', 'Horn / Geweih', 'Zähne', 'Krallen', 'Schuppen', 'Drüsen', 'Giftorgan', 'Federn', 'Blut', 'Kristallkern', 'Besonderes Organ', 'Ausrüstung / Beute'
  lootType?: string; // 'Standardbeute', 'Seltene Beute', 'Bedingte Beute', 'Boss- / Spezialbeute', 'Story- / Questbeute'
  dropChance?: number | string; // Dropchance (z.B. 60 oder '60%')
  dropQuantityRange?: string; // z.B. '1 - 3'
  dropConditions?: string; // z.B. 'Unbeschädigter Kadaver', 'Gezielter Schnitt', 'Nur bei Vollmond'
  dungeonLocationId?: string; // Referenz auf Dungeon / Ort (LoreEntry Orte)
  dungeonLocationName?: string; // Dungeonname (z.B. 'Goblin-Höhle', 'Alte Silbermine')
  dungeonFloorLevel?: string; // z.B. 'Ebene 1-2', 'Tiefste Krypta'
  dungeonSourceType?: string; // 'Monster-Drop', 'Schatztruhe', 'Erzader / Natürliches Vorkommen', 'Verstecktes Lager', 'Leichen / Trümmer', 'Boss-Kammer', 'Quest-Objekt'
  dungeonAccessCondition?: string; // z.B. 'Spitzhacke erforderlich', 'Dietrich Stufe 2'
  chainDungeonOrigin?: string; // Kette Schritt 1: Dungeon / Habitat
  chainMonsterOrigin?: string; // Kette Schritt 2: Monster / Kreatur
  chainRawResource?: string; // Kette Schritt 3: Dieser Rohstoff
  chainRefiningProfession?: string; // Kette Schritt 4: Handwerksberuf (z.B. Gerber, Schmied, Alchemist)
  chainRefiningHolding?: string; // Kette Schritt 4b: Betrieb (z.B. Gerberei, Schmiede)
  chainEndProduct?: string; // Kette Schritt 5: Endprodukt (z.B. Drachenschuppenrüstung, Wolfslederwams)
}

export interface MonsterLootItem {
  id: string;
  itemName: string;
  itemId?: string; // Referenz auf Gegenstands-Codex LoreEntry
  category?: string; // Rohstoffe, Materialien, Beute, Trophäe, Quest
  dropChance: number; // 0 - 100%
  isGuaranteed?: boolean; // 100% Drop
  minQuantity: number;
  maxQuantity: number;
  unit: string; // Stück, kg, Portionen, etc.
  harvestCondition?: string; // z.B. "Unversehrte Haut", "Erfordert Alchemie Stufe 2", "Nur bei Nacht"
  partType?: 'Fleisch' | 'Fell' | 'Leder' | 'Haut' | 'Knochen' | 'Horn' | 'Zähne' | 'Krallen' | 'Schuppen' | 'Drüsen' | 'Gift' | 'Federn' | 'Blut' | 'Kristallkern' | 'Ausrüstung' | 'Schatz' | 'Sonstiges';
  notes?: string;
}

export interface DungeonFloor {
  levelNumber: number;
  name: string;
  description?: string;
  dangerLevel?: string;
  monsters?: string[]; // Monster Namen oder IDs
  bossName?: string;
  bossEnemyId?: string;
  trapsAndHazards?: string;
  lootChests?: string;
  resourceVeins?: string;
}

export interface DungeonMonsterSpawn {
  enemyId?: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  spawnArea?: string;
  quantity?: string;
}

export interface DungeonDetails {
  dungeonType?: string; // Höhle, Ruine, Mine, Tempel, Grabstätte, Katakombe, Festung, Turm, unterirdische Stadt, Monsterbau / Nest, natürliche Tiefenzone, magischer Dungeon, versunkene Anlage, dimensionsfremder Ort, Sonstiges
  originAndHistory?: string; // Ursprung, Erbauer und Historie
  age?: string; // Alter des Dungeons
  sizeAndDepth?: string; // Ausdehnung, Tiefe und Anzahl der Ebenen
  entryAccess?: string; // Eingang, Zugangsbedingungen und Schlüssel
  environmentAndAtmosphere?: string; // Beleuchtung, Luft, Temperatur, Geruch
  trapsAndHazards?: string; // Mechanische und magische Fallen, Einsturzgefahr
  floors?: DungeonFloor[]; // Detaillierte Etagen / Ebenen
  monsterPopulations?: DungeonMonsterSpawn[]; // Monster-Populationen mit Codex-Verknüpfung
  bossEnemyId?: string; // Hauptboss aus dem Gegner-Codex
  bossName?: string;
  resourceVeins?: string; // Rohstoffvorkommen & Erzadern (referenziert Item-Codex)
  treasureChests?: string; // Schatztruhen & versteckte Lager
  bossLoot?: string; // Einzigartige Boss-Beute
  regenerationRules?: string; // Respawn & Regenerationslogik des Dungeon-Ökosystems
}

export interface EnemyDetails {
  // Klassifizierung & Typ
  enemyType?: string; // Scherge / Fußsoldat, Regulärer Gegner, Elite / Champion, Miniboss, Dungeonboss / Gebietsboss, Weltboss / Epischer Boss, Schwarm / Rudel
  species?: string; // Humanoid, Untoter, Bestie / Tier, Dämon / Unhold, Konstrukt / Golem, Elementar, Monstrum, Drache / Drachenblut, Pflanze / Pilz, Geist / Phantom, Aberration / Kosmisch
  subSpecies?: string; // Unterart / Variante
  threatLevel?: string; // Harmlos (Stufe 1), Niedrig (Stufe 2-3), Mittel (Stufe 4-5), Gefährlich (Stufe 6-7), Tödlich / Heroisch (Stufe 8-9), Kataklysmisch (Stufe 10+)
  habitat?: string; // Bevorzugter Lebensraum, Spawn-Gebiete, Dungeons, Zonen
  typicalGroupSize?: string; // Einzelgänger, Kleines Rudel (2-4), Kampftrupp (4-8), Große Horde (10-25), Massenhafter Schwarm (30+)
  tacticalFormation?: string; // Keilformation (Wedge), Schlachtlinie (Line), Umzingelung (Surround), Zangenangriff (Flank), Verstreut / Plänkler (Skirmish)
  faction?: string; // Zugehörige Fraktion oder Organisation
  alignment?: string; // Gesinnung / Wesen (Aggressiv-Raubtierhaft, Fanatisch-Böse, Territorial-Neutral, Kontrolliert/Konstrukt)

  // Ökologie, Verhalten & Sozialstruktur
  diet?: string; // Fleischfresser, Pflanzenfresser, Aasfresser, Allesfresser, Magie-/Seelenfresser
  socialBehavior?: string; // Einzelgänger, Rudel, Schwarm, Bienenstaat / Schwarmintelligenz, Parasitisch
  reproduction?: string; // Fortpflanzung, Vermehrungsrate, Gelege/Nestbau

  // Physische & Sensorische Merkmale
  appearance?: string; // Physische Erscheinung, Panzerung, Klauen, Schuppen, Aura
  sensoryPerception?: string; // Sinne & Wahrnehmung (Dunkelsicht, Wärmesinn, Erschütterungssinn, Geruchssinn, Magiesinn)
  sizeCategory?: string; // Winzig, Klein, Mittel, Groß, Riesig, Kolossal

  // Kampfattribute & Basiseinstufung
  baseHp?: number | string; // Basis-Lebenspunkte
  baseMp?: number | string; // Basis-Mana / Energie / Ausdauer
  armor?: number | string; // Rüstung / Schadensreduktion
  magicResistance?: number | string; // Magieresistenz
  movementSpeed?: string; // Bewegungsreichweite / Tempo / Mobilität

  // Kampftaktik, KI-Verhalten & Moral
  combatBehavior?: string; // Taktisches Verhalten im Gefecht (Aggressiv, Hinterhalt, Kiting/Distanz, Schildwall, Fokusfeuer, Unterstützung)
  combatBehaviorCustom?: string; // Zusätzliche benutzerdefinierte KI-Anweisungen
  targetPriority?: string; // Zielpriorität (Magier & Heiler zuerst, Schwächster Nahkämpfer, Nächstes Ziel, Höchste Aggro/Bedrohung)
  moraleBehavior?: string; // Moral & Fluchtverhalten (Kämpft bis zum Tod, Flucht bei <20% LP, Verzweiflungs-Berserker, Ruft Verstärkung)

  // Schwächen, Resistenzen & Immunitäten
  vulnerabilities?: string; // Elementare & physische Schwachstellen
  damageResistances?: string; // Schadensresistenzen
  statusImmunities?: string; // Statuseffekt-Immunitäten

  // Macht- & Kampfeinstufung (Power-Level)
  campaignPowerData?: Record<string, { value: number; potentialMax: number }>;
  campaignPowerLevels?: Record<string, { value: number; potentialMax: number }>;
  abilities?: any[]; // Passive Fähigkeiten, Techniken, Ultimative Techniken, Transformationen, Talente
  powerSources?: any[];

  // Beute & Rohstoffe (Loot-Tabelle)
  guaranteedDrops?: string; // Garantierte Beute (Text)
  rareDrops?: string; // Seltene Drops & Schätze (Text)
  harvestableParts?: string; // Verwertbare Handwerksmaterialien (Text)
  goldDrop?: string; // Währungsausbeute (Text)
  lootTable?: MonsterLootItem[]; // Strukturierte Beute- und Rohstofftabelle
  harvestRequirements?: string; // Benötigte Werkzeuge / Fertigkeiten zur Verwertung
  associatedDungeonIds?: string[]; // Vorkommen in Dungeons
  territoryIds?: string[]; // Zugeordnete Habitate / Territorien
}

export interface EventStep {
  id: string;
  title?: string;
  description: string;
  status: 'happened' | 'pending';
  branch?: 'main' | 'side';
  stepType?: 'story' | 'quest'; // 'story' or 'quest'
  questOutcome?: 'success' | 'failure' | 'open'; // outcome for quest type
  unlockConditions?: string;
  chatInstruction?: string;
  travelPath?: string; // Geografische Stationen / Reise-Pfad
  travelDurationDays?: number; // Reise-Dauer in Tagen
  timeOfDay?: string; // Uhrzeit
  revealedKnowledge?: string; // Enthülltes / Verborgenes Wissen
  trigger?: string; // Auslöser (Trigger)
  cast?: string; // Besetzung (Wer)
  setting?: string; // Kulisse (Wo)
  conflict?: string; // Konflikt (Was)
}

export interface FactionMember {
  id: string;
  name: string;
  characterId?: string; // Referenz auf Charakter/NPC im Codex
  job: string; // Job, Funktion oder Rolle in der Fraktion
  tasks: string; // Aufgaben für das Wirtschafts- & Managementsystem
  joinedDate: string; // Seit wann in der Fraktion
  status?: string; // Status (z.B. Aktiv, Beurlaubt, Außendienst)
  notes?: string; // Anmerkungen / Notizen
}

export interface FactionDetails {
  // 1. Gründungsanlass & Ursprung
  foundingReason?: string; // Warum wurde die Fraktion gegründet? (Schutz, Religion, Krieg, Handel, Widerstand, Macht, Überleben etc.)
  
  // 2. Ursprüngliches Ziel
  originalGoal?: string; // Was wollte die Fraktion ursprünglich erreichen?
  
  // 3. Aktuelle & langfristige Ziele
  currentGoal?: string; // Was will die Fraktion heute erreichen? (Hauptziel & langfristige Ausrichtung)
  
  // 4. Prägende historische Ereignisse
  keyHistoricalEvents?: string; // 2–4 Schlüsselereignisse (Krieg, Verrat, Niederlage, Aufstieg, Katastrophe, Erfolg etc.)
  
  // 5. Wandel & Entwicklung
  evolutionAndChange?: string; // Wie hat sich die Fraktion dadurch verändert? Entwicklung seit Gründung
  
  // 6. Führungsstruktur & Leitung
  leadershipStructure?: string; // Führungsstruktur (Einzelner Anführer, Rat, Königsfamilie, demokratisch, religiöse Autorität, Clans etc.)
  leader?: string; // Name des Anführers / Ratsvorsitzenden / Gründers
  
  // 7. Zusammenhalt der Mitglieder
  cohesion?: string; // Was hält die Mitglieder zusammen? (Ideologie, Loyalität, Sold, Religion, Herkunft, Furcht, Feindbild, Bindungen)
  
  // 8. Interne Konflikte & Spannungen
  internalConflicts?: string; // Interne Konflikte (Machtkämpfe, Ideologien, alte Fehden, Generationskonflikte etc.)
  
  // 9. Beziehungen zu anderen Fraktionen
  allies?: string; // Natürliche Verbündete
  rivals?: string; // Rivalen
  enemies?: string; // Feinde
  convenienceAlliances?: string; // Zweckallianzen
  unresolvedConflicts?: string; // Ungelöste Konflikte
  status?: string; // Allgemeiner Beziehungsstatus zu Abenteurern / Spieler
  
  // 10. Ressourcen & Machtpotenzial
  resourceEconomy?: string; // Geld / Wirtschaft
  resourceTerritory?: string; // Territorium & Stützpunkte
  resourceMaterials?: string; // Rohstoffe
  resourceMembers?: string; // Mitglieder & Rekrutierung
  resourceMilitary?: string; // Militär / bewaffnete Kräfte
  resourceInfluence?: string; // Politischer Einfluss
  resourceKnowledge?: string; // Wissen / Technologie / Magie
  resourceTrade?: string; // Handelsnetzwerk
  
  // Ergänzend & Rückwärtskompatibilität
  philosophy?: string; // Leitmotiv / Grundphilosophie
  maxMembers?: number; // Maximale Mitgliederzahl / Gruppengröße
  members?: FactionMember[]; // Mitgliederliste für Wirtschafts- & Managementsystem
  motivationCore?: MotivationCore;
  goals?: CharacterGoal[];
}

export interface LoreEntry {
  id: string;
  category: LoreCategory;
  title: string;
  description: string;
  isUnlocked: boolean; // false until discovered, or true if it's general lore
  order?: number; // useful for chronological events
  image?: string;
  expressions?: Record<string, string>;
  details?: {
    eventSteps?: EventStep[];
    [key: string]: any;
  };
  secretsStage1?: string; // Stufe 1: Öffentliches Wissen
  secretsStage2?: string; // Stufe 2: Indizien & Verdacht
  secretsStage3?: string; // Stufe 3: Absolutes Geheimnis
  knowledge?: string; // Verhüllung & Geteiltes Wissen / Fähigkeiten (Wer weiß was?)

  // Quest 4: Fakten-Herkunft & Kanon-Schutz
  sourceType?: FactSourceType;
  factStatus?: FactStatus;
  knowledgeType?: KnowledgeType;
}

/**
 * ItemDefinition: Beschreibt was ein Gegenstand grundsätzlich ist (Gegenstands-Codex).
 * Beantwortet die Frage: „Was ist das?“
 * Enthält keine Marktpreise, Händler, Produktionsketten, Bestände oder konkrete Zustände.
 */
export interface ItemDefinition {
  id: string;
  name: string;
  category: string; // Gegenstandsart (z. B. 'Waffe', 'Rohstoff', 'Nahrung', 'Tier')
  subcategory: string; // Unterkategorie (z. B. 'Schwert', 'Metallerz', 'Brot')
  description?: string; // Grundbeschreibung
  properties?: string; // Besondere Eigenschaften, falls vorhanden
  material?: string; // Material / grundlegende Beschaffenheit (optional)
  weaponType?: string; // z. B. 'Langschwert' (optional)
  weaponMastery?: string; // Referenz auf Waffenbeherrschung (z. B. 'Schwertkampf')
  isUpgradeable?: boolean; // Nur falls ausdrücklich entwicklungsfähiger Gegenstand / Artefakt
  progressionRef?: string; // Referenz auf globale Progressionslogik (optional)
  
  // Feste physische & funktionale Grundmerkmale
  baseWeight?: string | number;
  combatStats?: {
    damageType?: string;
    armorClass?: string;
    range?: string;
  };
  craftingDiscipline?: string;
  nutritionSaturation?: string;
  magicSchoolAffinity?: string;
}

/**
 * ItemInstance: Beschreibt ein konkretes Exemplar in der Spielwelt (Inventar, Lager, Fundort).
 * Beantwortet die Frage: „Welches konkrete Exemplar existiert gerade und in welchem Zustand?“
 * Überschreibt niemals die permanente Codex-Definition.
 */
export interface ItemInstance {
  id: string;
  itemDefinitionId: string; // Referenz auf ItemDefinition
  name?: string;
  description?: string; // Instanz-Beschreibung / Zustand
  condition?: string; // z. B. 'alt / stark verrostet', 'neuwertig', 'beschädigt', 'hervorragend erhalten'
  quality?: string; // optional, z. B. 'aus besonders hochwertigem Stahl'
  owner?: string; // Besitzer / Charakter / Betrieb
  location?: string; // Aufenthaltsort / Inventar / Dachboden
  quantity?: number;
  currentState?: string;
  durability?: number;
  maxDurability?: number;
  weightKg?: number; // Gewicht in Kilogramm
  category?: string;
  isCorpseOrBody?: boolean; // Kennzeichnet Tier- oder Monsterkadaver
  isHarvestable?: boolean; // Erlaubt Zerlegen / Kristalle sammeln
  isHeavyOrRestricted?: boolean;
  sourceLootId?: string; // Verweis auf ursprüngliche Lootquelle
}

export type LootSourceType =
  | 'world_item'
  | 'chest'
  | 'defeated_enemy'
  | 'corpse'
  | 'animal_body'
  | 'monster_body'
  | 'battlefield'
  | 'resource_node';

export interface LootSourceHarvestOptions {
  allowExamine?: boolean;
  allowHarvestCrystals?: boolean;
  crystalYield?: { name: string; quantity: number; weightKg?: number; category?: string }[];
  allowButcher?: boolean;
  butcherYield?: { name: string; quantity: number; weightKg?: number; category?: string }[];
  allowTakeBody?: boolean;
  bodyItem?: ItemInstance;
  isBodyHarvested?: boolean;
  isCrystalsHarvested?: boolean;
}

export interface LootSource {
  id: string;
  type: LootSourceType;
  title: string;
  description?: string;
  sourceCharacterId?: string;
  sourceCharacterName?: string;
  locationContext?: CurrentLocationContext;
  items: ItemInstance[];
  rawResources?: { name: string; quantity: number; unit?: string; category?: string; weightKg?: number }[];
  harvestOptions?: LootSourceHarvestOptions;
  factionOwner?: string;
  isSearched?: boolean;
  createdAt?: string;
}

export interface PendingPickupProposal {
  id: string;
  sourceTitle: string;
  sourceType: LootSourceType;
  items: ItemInstance[];
  lootSourceId?: string;
  sourceCharacterId?: string;
  isDangerousOrHeavy?: boolean;
  requiresExplicitConfirmation?: boolean;
  timestamp?: string;
}

export interface PendingItemTransferProposal {
  id: string;
  itemInstanceId: string;
  fromOwnerId: string;
  fromOwnerName: string;
  toOwnerId: string;
  toOwnerName: string;
  quantity?: number;
  itemName: string;
  description?: string;
  createdAt: number;
}

export interface InventoryNotification {
  id: string;
  itemName: string;
  quantity: number;
  weightKg?: number;
  action: 'gained' | 'lost' | 'equipped' | 'unequipped' | 'dropped' | 'harvested' | 'used';
  timestamp?: string;
}

export interface CollectionTask {
  id: string;
  title: string;
  description?: string;
  targetQuantity: number;
  collectedQuantity: number;
  unit?: string;
  itemKeywords?: string[];
  sourceLocation?: string;
  assignedToCharacterId?: string; // 'player' oder Begleiter-NPC ID oder 'party'
  assignedToCharacterName?: string;
  targetStorage?: 'player' | 'party' | 'faction_storage' | string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt?: string;
  updatedAt?: string;
}

export interface WorldDropItem {
  id: string;
  itemInstance: ItemInstance;
  locationContext?: CurrentLocationContext;
  droppedAtTime?: string;
  droppedByCharacterId?: string;
}

export interface InventorySettings {
  pickupConfirmationMode?: 'always_confirm' | 'auto_small' | 'auto_all';
  maxCarryCapacityKg?: number;
}

/**
 * InventoryEntry: Repräsentiert den Besitz- und Ausrüstungs-Status im Charakter-Inventar oder Lager.
 */
export interface InventoryEntry {
  id: string;
  itemDefinitionId: string;
  itemInstanceId?: string; // Referenz auf ein spezifisches ItemInstance
  quantity?: number;
  slot?: 'weapon' | 'shield' | 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'finger' | 'neck' | 'wrist' | 'waist' | 'back' | 'pocket' | 'bag' | 'inventory';
  equipped?: boolean;
}

/**
 * ProductionRelation: Beschreibt Herstellungs- und Verarbeitungsbeziehungen im Wirtschaftssystem.
 */
export interface ProductionRelation {
  id: string;
  inputItemIds: string[];
  outputItemIds: string[];
  facilityId?: string;
  professionId?: string;
  process?: string;
  duration?: string;
  quantity?: number;
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
    spawnSource?: string;
  }[];
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  enemyHp: number;
  enemyMaxHp: number;
  combatSubMenu: 'main' | 'attack' | 'skills' | 'defend' | 'items' | 'start';
  positions?: { [charName: string]: { x: number; y: number } };
  tiles?: { [coordKey: string]: string };
  placedObjects?: PlacedCombatObject[];
  weather?: string;
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
  gridWidth?: number;
  gridHeight?: number;
  battleInstanceId?: string;
  territoryId?: string;
  locationId?: string;
  locationName?: string;
  buildingId?: string;
  buildingName?: string;
  roomId?: string;
  roomName?: string;
  currentLocationContext?: CurrentLocationContext;
  tacticalEntities?: Record<string, TacticalEntity>;
  tacticalGroups?: Record<string, TacticalGroup>;
  tacticalCommands?: TacticalCommand[];
  tacticalRound?: number;
  tacticalMode?: boolean;
  legacyAutoMove?: boolean;
  fireTurnCount?: number;
  participantRelations?: BattleParticipantRelation[];
}

export type TacticalFormation =
  | 'line'
  | 'column'
  | 'wedge'
  | 'square'
  | 'circle'
  | 'loose'
  | 'swarm'
  | 'spread'
  | 'defensive_line'
  | 'archer_line'
  | 'wall'
  | 'scattered';

export type TacticalDirection =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'northeast'
  | 'northwest'
  | 'southeast'
  | 'southwest';

export type TacticalSpawnSource =
  | 'point'
  | 'area'
  | 'forest_edge'
  | 'map_edge'
  | 'building'
  | 'road'
  | 'ship'
  | 'around_entity';

export interface TacticalEntity {
  id: string;
  worldEntityId?: string; // Referenz auf Codex Charakter/NPC/Fraktion
  displayName: string;
  factionId?: string;
  groupId?: string;
  encounterForceId?: string;
  enemyTypeId?: string;
  raceId?: string;
  unitType?: string;
  sourceType?: 'character' | 'faction' | 'territory' | 'encounter_force' | 'npc' | 'location' | string;
  sourceId?: string;
  position: {
    x: number;
    y: number;
  };
  status?: string[];
  anonymous?: boolean;
  promotedToCharacterId?: string;
  role?: string;
  morale?: number;
  movementPoints?: number;
  actionPoints?: number;
  hp?: number;
  maxHp?: number;
  isLeader?: boolean;
  assignedSlotIndex?: number;
  metadata?: Record<string, any>;
}

export interface TacticalGroup {
  id: string;
  name: string;
  factionId?: string;
  encounterForceId?: string;
  enemyTypeId?: string;
  raceId?: string;
  sourceType?: 'character' | 'faction' | 'territory' | 'encounter_force' | 'npc' | 'location' | string;
  sourceId?: string;
  unitIds: string[];
  formation?: TacticalFormation;
  direction?: TacticalDirection;
  requestedCount?: number;
  spawnedCount?: number;
  spawnSource?: TacticalSpawnSource | string;
  center?: {
    x: number;
    y: number;
  };
  anchorPosition?: {
    x: number;
    y: number;
  };
  facingDirection?: TacticalDirection;
  leaderId?: string; // TacticalEntity ID
  targetId?: string; // TacticalEntity oder TacticalGroup ID
  targetPosition?: {
    x: number;
    y: number;
  };
  behavior?: 'aggressive' | 'defensive' | 'cautious' | 'passive' | 'fleeing' | string;
  morale?: number;
  active: boolean;
  metadata?: Record<string, any>;
}

export type TacticalCommandType = 
  | 'move'
  | 'move_entity'
  | 'move_group'
  | 'formation'
  | 'formation_move'
  | 'stop'
  | 'hold'
  | 'attack'
  | 'defend'
  | 'retreat'
  | 'follow'
  | 'move_to_entity'
  | 'split_group'
  | 'merge_group'
  | 'flee';

export interface TacticalCommand {
  id: string;
  type: TacticalCommandType;
  issuerId?: string; // TacticalEntity ID oder "player" oder "system"
  entityId?: string; // Ziel TacticalEntity
  groupId?: string; // Ziel TacticalGroup
  targetEntityId?: string;
  targetPosition?: {
    x: number;
    y: number;
  };
  formation?: TacticalFormation;
  priority?: number;
  source?: 'ai' | 'player' | 'system';
  status?: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface PlacedCombatObject {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  category: string;
  description: string;
  rules?: string;
  setting?: string;
  loreEntryId?: string;
  faction?: string;
  currentCount?: number;
  maxCapacity?: number;
  population?: number;
  minCrew?: number;
  shipSize?: 'klein' | 'mittel' | 'groß';
  defense?: number;
  attack?: number;
  durability?: number;
  isSummon?: boolean;
  summonOwner?: string;
  condition?: 'intact' | 'damaged' | 'ruined' | 'under_construction';
  isDestroyed?: boolean;
}

export interface CustomInventoryItem {
  id: string;
  name: string;
  category?: string;
  subCategory?: string;
  itemType?: string;
  slot?: 'weapon' | 'shield' | 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'finger' | 'neck' | 'wrist' | 'waist' | 'back' | 'pocket' | 'bag' | 'inventory';
  equipped?: boolean;
  rarity?: 'Gewöhnlich' | 'Ungewöhnlich' | 'Selten' | 'Episch' | 'Legendär' | 'Mythisch' | 'Artefakt' | 'Unikat';
  quality?: string;
  material?: string;
  weight?: string | number;
  value?: number;
  currency?: string;
  description?: string;
  specialEffects?: string;
  combatStats?: {
    damage?: string | number;
    damageType?: string;
    defense?: string | number;
    range?: string;
    scalingStat?: string;
    attackSpeed?: string;
    armorClass?: 'Leicht' | 'Mittel' | 'Schwer' | 'Stoff' | string;
    resists?: string;
    mobilityPenalty?: string;
  };
  enchantments?: string;
  originHistory?: string;
  requirements?: string;
  durability?: string;
  codexItemId?: string;
  
  // Category-specific properties
  // Rohstoffe & Materialien
  purityGrade?: string;
  depositLocation?: string;
  miningToolRequired?: string;
  processedInto?: string;
  processingFacility?: string;
  hardnessOrMeltingPoint?: string;
  stackSize?: number | string;
  unit?: string;

  // Nahrung & Genussmittel & Landwirtschaft
  nutritionSaturation?: string;
  freshnessDuration?: string;
  spoilageState?: string;
  regenerationEffect?: string;
  tasteQuality?: string;
  preparationMethod?: string;
  seedGrowthTime?: string;

  // Medizin, Tränke & Alchemie
  healingOrPoisonEffect?: string;
  effectDuration?: string;
  toxicityOrSideEffects?: string;
  dosesOrUses?: string;
  alchemyRecipe?: string;

  // Magische Gegenstände & Relikte
  magicSchoolAffinity?: string;
  manaCapacityOrCharges?: string;
  activatedSpellEffect?: string;
  curseOrAstralResonance?: string;
  attunementRequired?: boolean | string;
  ancientOriginEra?: string;

  // Werkzeuge & Alltagsgegenstände
  craftingDiscipline?: string;
  craftingBonus?: string;
  maxToolUses?: string;
  intendedUsageField?: string;

  // Tiere & Transportmittel
  carryingCapacity?: string;
  speedOrPace?: string;
  crewOrPassengers?: string;
  feedOrMaintenanceCost?: string;
  tamenessDegree?: string;

  // Bücher, Schriften & Quest
  textExcerptOrInscription?: string;
  languageOrLoreField?: string;
  authenticityStatus?: string;
  associatedQuestOrLock?: string;

  // Progression Logic Properties (Synchronized with Step 2 of 9)
  progressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  progressionLevel?: string | number;
  epBonus?: string;
  scalingWithLevel?: string;
  killRequirement?: string;
  trainingProficiencyBonus?: string;
  masteryRank?: string;
  practiceUsageCount?: string;
  trainingNotes?: string;
  milestoneUnlockReq?: string;
  awakeningStages?: string;
  reputationOrTitle?: string;
  staticTalentCost?: string | number;
  staticRequirements?: string;
  isFixedStats?: boolean;
}

/**
 * Migration Helper: Konvertiert ein altes CustomInventoryItem in saubere getrennte Objekte
 * (ItemDefinition, ItemInstance, InventoryEntry).
 */
export function migrateCustomItemToNewModel(item: CustomInventoryItem, defaultOwner?: string): {
  definition: ItemDefinition;
  instance: ItemInstance;
  entry: InventoryEntry;
} {
  const defId = item.codexItemId || `def_${item.id}`;
  const instId = `inst_${item.id}`;

  const definition: ItemDefinition = {
    id: defId,
    name: item.name,
    category: item.category || 'Waffen',
    subcategory: item.subCategory || 'Ausrüstung',
    description: item.description || '',
    properties: item.specialEffects || '',
    material: item.material || '',
    baseWeight: item.weight,
    combatStats: item.combatStats ? {
      damageType: item.combatStats.damageType,
      armorClass: item.combatStats.armorClass,
      range: item.combatStats.range
    } : undefined,
    craftingDiscipline: item.craftingDiscipline,
    nutritionSaturation: item.nutritionSaturation,
    magicSchoolAffinity: item.magicSchoolAffinity
  };

  const instance: ItemInstance = {
    id: instId,
    itemDefinitionId: defId,
    name: item.name,
    condition: item.spoilageState || 'neuwertig',
    quality: item.quality || item.rarity || 'Gewöhnlich',
    owner: defaultOwner || '',
    quantity: typeof item.stackSize === 'number' ? item.stackSize : 1,
    durability: typeof item.durability === 'number' ? item.durability : 100,
    maxDurability: 100
  };

  const entry: InventoryEntry = {
    id: item.id,
    itemDefinitionId: defId,
    itemInstanceId: instId,
    quantity: typeof item.stackSize === 'number' ? item.stackSize : 1,
    slot: item.slot || 'inventory',
    equipped: !!item.equipped
  };

  return { definition, instance, entry };
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
  customItems?: CustomInventoryItem[];
}

export interface StoryEntityItem {
  id: string;
  category: 'Charaktere' | 'Gegner' | 'Fraktionen' | 'Orte' | 'Gegenstände' | 'Techniken' | 'Quests' | 'Berufe' | 'Gruppen' | 'Gebäude' | 'Ressourcen' | 'Waren' | 'Beziehungen' | 'Ziele' | string;
  title: string;
  subtitle?: string;
  description: string;
  details?: Record<string, any>;
  createdAt?: string;
  sourceStoryMessageId?: string;
  isNewInStory?: boolean;
  promotedToCodex?: boolean;
}

export interface CurrentLocationContext {
  worldId?: string;
  worldName?: string;

  regionId?: string;
  regionName?: string;

  territoryId?: string;
  territoryName?: string;

  locationId?: string;
  locationName?: string;

  buildingId?: string;
  buildingName?: string;

  roomId?: string;
  roomName?: string;

  sceneId?: string;
  sceneName?: string;

  positionDescription?: string;

  updatedAt?: string;
}

export interface CharacterPresenceState {
  state: 'absent' | 'present' | 'scene_participant';
  locationContext?: CurrentLocationContext;
  sceneId?: string;
  updatedAt?: string;
}

export interface StoryInfoState {
  currentLocationContext?: CurrentLocationContext;
  currentLocationName?: string;
  currentTerritoryName?: string;
  activeSituation?: string;
  activeGoals?: string[];
  relationships?: { fromName: string; toName: string; relationType: string; description?: string }[];
  storyEntities: StoryEntityItem[];
  characterKnowledge?: CharacterKnowledge;
  processedFirstMessage?: boolean;
  processedFirstMessageFingerprint?: string;
  lastUpdatedTime?: string;
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
  itemDefinitions?: ItemDefinition[];
  itemInstances?: ItemInstance[];
  inventoryEntries?: InventoryEntry[];
  equipmentState?: EquipmentState[];
  prologue: string;
  firstMessage?: string;
  chatHistory: ChatMessage[];
  backgroundImage?: string;
  worldTime?: WorldTime;
  hudConfig?: HUDConfiguration;
  statusElements: StatusElement[];
  summaryLog?: string;
  currentLocation?: CurrentLocationContext;
  combatState?: CombatState;
  encounterForces?: EncounterForce[];
  dynamicWorldState?: DynamicWorldState;
  storyState?: StoryInfoState;
  characterKnowledge?: CharacterKnowledge;
  lootSources?: LootSource[];
  pendingPickup?: PendingPickupProposal | null;
  pendingTransfer?: PendingItemTransferProposal | null;
  worldDrops?: WorldDropItem[];
  collectionTasks?: CollectionTask[];
  inventorySettings?: InventorySettings;
  emotionState?: UserEmotionState;
  physicalChangeHistory?: PhysicalChangeHistoryEntry[];
  npcAppearanceMemory?: Record<string, NPCAppearanceObservation>;
  updatedAt?: string;
  lastSaved?: string;
  initialPlayer?: Character;
  initialWorld?: WorldSetting;
  initialWorldTime?: WorldTime;
  initialStatusElements?: StatusElement[];
  initialStructuredInventory?: StructuredInventory;
  initialLoreDatabase?: LoreEntry[];
  initialNpcs?: NPC[];
  initialInventory?: string[];
  initialItemInstances?: ItemInstance[];
  initialInventoryEntries?: InventoryEntry[];
  initialEquipmentState?: EquipmentState[];
  initialStoryState?: StoryInfoState;
  initialCharacterKnowledge?: CharacterKnowledge;
  initialCurrentLocation?: CurrentLocationContext;
  initialLootSources?: LootSource[];
  initialWorldDrops?: WorldDropItem[];
  initialCollectionTasks?: CollectionTask[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  video?: string;
  isDialogue?: boolean;
  dialogueType?: 'user_npc' | 'npc_npc' | 'group';
  dialogueSpeakerName?: string;
  dialogueSpeakerId?: string;
  dialogueTargetName?: string;
  dialogueTargetId?: string;
  dialogueParticipantIds?: string[];
  storyChanges?: AIStoryStateChanges;
}

export interface AIEntityDiscovery {
  type: 'character' | 'building' | 'room' | 'location' | 'territory' | 'item' | 'creature' | 'organization' | 'event';
  id?: string;
  name: string;
  role?: string;
  description?: string;
  locationContext?: {
    locationName?: string;
    buildingName?: string;
    roomName?: string;
  };
  details?: Record<string, any>;
}

export interface AILocationChange {
  locationName?: string;
  buildingId?: string;
  buildingName?: string;
  roomId?: string;
  roomName?: string;
  territoryName?: string;
  regionName?: string;
  sceneId?: string;
}

export interface AIPresenceChange {
  characterId?: string;
  characterName: string;
  state: 'present' | 'scene_participant' | 'mentioned_only' | 'absent';
  locationContext?: {
    locationName?: string;
    buildingName?: string;
    roomName?: string;
  };
}

export interface AIKnowledgeUpdate {
  subject: string;
  information: string;
  source?: string;
  learnedByPlayer?: boolean;
  topic?: string;
}

export interface AIStoryEvent {
  title: string;
  description: string;
  type?: 'world_event' | 'situation' | 'opportunity' | 'task_offered';
  isPlayerTask?: boolean;
}

export interface AIInventoryChange {
  item: string;
  action: 'added' | 'removed' | 'updated' | 'equip' | 'unequip' | 'attach' | 'detach' | 'transfer';
  quantity?: number;
  ownerId?: string;
  ownerName?: string;
  toOwnerId?: string;
  toOwnerName?: string;
  slot?: string;
  bodyAreas?: BodyArea[];
  isRestraint?: boolean;
  condition?: string;
  itemInstanceId?: string;
  itemDefinitionId?: string;
  description?: string;
}

export interface AIBodyConditionChange {
  action: 'added' | 'removed' | 'updated';
  name: string;
  type?: BodyConditionType;
  characterId?: string;
  characterName?: string;
  bodyAreas?: BodyArea[];
  sourceItemInstanceId?: string;
  isRestraint?: boolean;
  description?: string;
  duration?: string;
  severity?: 'leicht' | 'mittel' | 'stark' | 'vollständig';
  isActive?: boolean;
}

export interface AIRelationshipChange {
  characterName: string;
  characterId?: string;
  changeDescription: string;
  relationshipLevel?: string;
}

export interface AIWorldChange {
  description: string;
  scope?: 'local' | 'regional' | 'global';
}

export interface AIStoryStateChanges {
  discoveredEntities?: AIEntityDiscovery[];
  locationChange?: AILocationChange;
  presenceChanges?: AIPresenceChange[];
  knowledgeUpdates?: AIKnowledgeUpdate[];
  events?: AIStoryEvent[];
  inventoryChanges?: AIInventoryChange[];
  bodyConditionChanges?: AIBodyConditionChange[];
  relationshipChanges?: AIRelationshipChange[];
  worldChanges?: AIWorldChange[];
}

export interface AIServiceResponse {
  narrativeText: string;
  storyChanges?: AIStoryStateChanges;
  hasStructuredData?: boolean;
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
