
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

export type BodyConditionType = 'gender_change' | 'race_change' | 'curse' | 'blessing' | 'magical_mutation';

export interface BodyCondition {
  id: string;
  name: string;
  type: BodyConditionType;
  category?: string; // 'Geschlechtswechsel' | 'Rassenwechsel' | 'Fluch' | 'Segen' | 'Mutation' | 'Spezial'
  icon?: string; // Emoji oder Symbol (z.B. '⚧️', '🧝', '☠️', '🪽', '🦊', '🦇', '🔥', '❄️')
  isActive: boolean;
  severity?: 'leicht' | 'mittel' | 'stark' | 'vollständig';
  source?: string; // z.B. 'Göttin der Sonne', 'Uralter Hexenfluch', 'Verwandlungstrank', 'Blutritual'
  duration?: string; // 'Permanent', 'Bis Sonnenaufgang', 'Temporär', 'Bis Fluch gebrochen'
  triggerCondition?: string; // z.B. 'Jeden Vollmond', 'Bei Absinken der HP unter 30%', 'Bei Sonnenuntergang', 'Nutzung von Magie', 'Alle 3 Tage', 'Nach Rast', 'Dauerhaft'
  linkedTransformationId?: string; // Verknüpfte Transformation / Auslöser-Form (z.B. ID einer Fähigkeit)
  description: string;

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
  statusTag?: string; // z.B. '🪽 Gesegnet', '☠️ Gorgonen-Fluch', '⚧️ Feminisierung'
  statBuffs?: {
    hpBonus?: number;
    mpBonus?: number;
    staminaBonus?: number;
  };
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

export interface PowerAbility {
  id: string;
  name?: string;
  category?: string;
  source: string;
  cost: string;
  description: string;
  techniques: string;
  powerSourceId?: string;
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
  techniqueList?: { 
    id: string; 
    name: string; 
    description?: string; 
    type?: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support' | 'Heilung' | 'Zustandseffekt' | 'Spezial' | 'Beschwörung'; 
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
    cost?: string;
    tier?: string;
    baseValue?: number;
    effectValue?: string;
    costFormula?: 'absolut' | 'proz.';
    costValue?: number;
    costResourceName?: string;
    metamorphosisInfluence?: number; // 0-100% (Standard 100%) - Wie stark diese Technik zur Metamorphose beiträgt
    applications?: string[];
    scaling?: string;
    summonCount?: number;
  }[];
}

export interface CharacterPowerSource {
  id: string;
  source: string;
  cost?: string;
  powerName?: string;
  powerDescription?: string;
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
  knowledge?: string; // Verhüllung & Geteiltes Wissen / Fähigkeiten (Wer weiß was?)
  originalIdentity?: Partial<Character>; // Dauerhaft gesicherte Ursprüngliche Gestalt (Geburtsidentität & früheres Leben)
  emotionState?: UserEmotionState; // Aktuelle Emotion & Tonart des Nutzers
  physicalChangeHistory?: PhysicalChangeHistoryEntry[]; // Protokollierte körperliche Veränderungen
  tasks?: EconomyTask[]; // Persönliche rollenspezifische Aufgaben
  duties?: EconomyDuty[]; // Rollenspezifische wiederkehrende Pflichten
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

  // Wirtschaft
  resources?: string;
  trade?: string;
  currency?: string;
  exports?: string;
  imports?: string;

  // Militär
  dangerLevel?: string;
  militaryStrength?: string;
  defense?: string;

  // Besonderheiten
  landmarks?: string;
  pointsOfInterest?: string;
  dungeons?: string;
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

export type EconomyResourceCategory = 'money' | 'goods' | 'raw_material' | 'food_drink' | 'equipment' | 'inventory' | 'staff' | 'capacity' | 'land' | 'animals' | 'vehicles' | 'special';

export interface EconomyResource {
  id: string;
  name: string;
  category?: EconomyResourceCategory;
  amount: number;
  maxCapacity: number;
  unit: string; // e.g. "Münzen", "Fässer", "Tonnen", "Kisten", "Köpfe", "Sätze", "Hektar"
  pricePerUnit: number;
  condition?: 'exzellent' | 'gut' | 'knapp' | 'verdorben' | 'beschaedigt' | 'leer';
  notes?: string;
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
  isFulfilled: boolean;
  consequences?: string;
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

export interface EconomyHolding {
  id: string;
  name: string;
  type: 'taverne' | 'anwesen' | 'schloss' | 'koenigreich' | 'schiff' | 'werkstatt' | 'mine' | 'gilde' | 'schmiede' | 'baeckerei' | 'markt' | 'haendler' | 'gasthaus' | 'bauernhof' | 'saegewerk' | 'werft' | 'hafenbetrieb' | 'manufaktur' | 'magierladen' | 'adelssitz' | 'burg' | 'fraktionsgebaeude' | 'custom' | (string & {});
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
  locationName?: string;
  territoryId?: string; // Stabile Referenz auf geografisches Territory (Standort)
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
  decisions?: EconomyDecision[]; // Management-Entscheidungen & Vorfälle
  activityLogs?: EconomyLogEntry[]; // Lebendige Hintergrundaktivität & Betriebs-Log
  temporaryAuthorities?: TemporaryAuthority[]; // Vergebene Sonderrechte & temporäre Befugnisse
  workTemplates?: WorkWorkflowTemplate[]; // Vorlagen für Arbeitsabläufe

  // Physischer Zustand & Allgemeine Gebäudeinformationen
  physicalCondition?: string; // Zustand (z.B. "Hervorragend", "Gut", "Reparaturbedürftig", "Ruine")
  physicalSize?: string; // Größe (z.B. "Klein", "Mittel", "Groß", "Monumental")
  physicalCapacity?: string; // Kapazität (z.B. "50 Gäste", "25 Mitarbeiter")
  physicalUsage?: string; // Zweck / Aktuelle Nutzung (z.B. "Wohnen", "Gewerbe", "Militär", "Kult")
  roomsOrAreas?: string | string[]; // Räume / Bereiche
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
  status?: 'detected' | 'mobilized' | 'engaged' | 'defeated' | 'retreated' | 'dispersed';
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
}

export interface DynamicWorldState {
  factions?: Record<string, FactionWorldState>;
  encounterForces?: Record<string, EncounterForce>;
  activeThreats?: string[];
  activeEvents?: string[];
  recentCombatOutcomes?: CombatResultFeedback[];
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
  loreDatabase?: LoreEntry[];
  facts?: WorldFact[];
  conflicts?: WorldFactConflict[];
  changeLog?: WorldFactChangeLogEntry[];
  encounterForces?: EncounterForce[];
  dynamicWorldState?: DynamicWorldState;
  connections?: { id?: string; fromId?: string; toId?: string; fromPlace?: string; toPlace?: string; label?: string; travelTime?: string; distance?: string; duration?: string; type?: 'land' | 'sea' | 'air' | string; isUnlocked?: boolean }[];
  startLocationId?: string;
  startLocationName?: string;
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

export interface EnemyDetails {
  // Klassifizierung & Typ
  enemyType?: string; // Scherge / Fußsoldat, Regulärer Gegner, Elite / Champion, Miniboss, Dungeonboss / Gebietsboss, Weltboss / Epischer Boss, Schwarm / Rudel
  species?: string; // Humanoid, Untoter, Bestie / Tier, Dämon / Unhold, Konstrukt / Golem, Elementar, Monstrum, Drache / Drachenblut, Pflanze / Pilz, Geist / Phantom, Aberration / Kosmisch
  threatLevel?: string; // Harmlos (Stufe 1), Niedrig (Stufe 2-3), Mittel (Stufe 4-5), Gefährlich (Stufe 6-7), Tödlich / Heroisch (Stufe 8-9), Kataklysmisch (Stufe 10+)
  habitat?: string; // Bevorzugter Lebensraum, Spawn-Gebiete, Dungeons, Zonen
  typicalGroupSize?: string; // Einzelgänger, Kleines Rudel (2-4), Kampftrupp (4-8), Große Horde (10-25), Massenhafter Schwarm (30+)
  tacticalFormation?: string; // Keilformation (Wedge), Schlachtlinie (Line), Umzingelung (Surround), Zangenangriff (Flank), Verstreut / Plänkler (Skirmish)
  faction?: string; // Zugehörige Fraktion oder Organisation
  alignment?: string; // Gesinnung / Wesen (Aggressiv-Raubtierhaft, Fanatisch-Böse, Territorial-Neutral, Kontrolliert/Konstrukt)

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
  guaranteedDrops?: string; // Garantierte Beute
  rareDrops?: string; // Seltene Drops & Schätze
  harvestableParts?: string; // Verwertbare Handwerksmaterialien
  goldDrop?: string; // Währungsausbeute
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
  tacticalEntities?: Record<string, TacticalEntity>;
  tacticalGroups?: Record<string, TacticalGroup>;
  tacticalCommands?: TacticalCommand[];
  tacticalRound?: number;
  tacticalMode?: boolean;
  legacyAutoMove?: boolean;
  fireTurnCount?: number;
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
  worldTime?: WorldTime;
  hudConfig?: HUDConfiguration;
  statusElements: StatusElement[];
  summaryLog?: string;
  combatState?: CombatState;
  encounterForces?: EncounterForce[];
  dynamicWorldState?: DynamicWorldState;
  emotionState?: UserEmotionState;
  physicalChangeHistory?: PhysicalChangeHistoryEntry[];
  npcAppearanceMemory?: Record<string, NPCAppearanceObservation>;
  initialPlayer?: Character;
  initialWorldTime?: WorldTime;
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
  isDialogue?: boolean;
  dialogueType?: 'user_npc' | 'npc_npc' | 'group';
  dialogueSpeakerName?: string;
  dialogueTargetName?: string;
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
