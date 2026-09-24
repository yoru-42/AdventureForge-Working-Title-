import { Appearance, Character, ChibiFormState, ChibiFormSource, PowerAbility, TransformationState } from '../types';

export interface ResolveChibiFormParams {
  player: Character;
  activeTransformation?: PowerAbility | null;
  transformationState?: TransformationState | null;
  world?: any;
}

export interface ResolvedChibiForm {
  active: boolean;
  source?: ChibiFormSource;
  sourceId?: string;
  sourceName?: string;
  bodyScale: number;
  heightScale: number;
  visualAge?: string;
  physicalChanges: string[];
  movementModifier?: string;
  equipmentRule?: string;
  visualOnly: boolean;
  description?: string;
}

export function resolveChibiForm(params: ResolveChibiFormParams): ResolvedChibiForm {
  const { player, activeTransformation, transformationState } = params;
  if (!player) {
    return {
      active: false,
      bodyScale: 1.0,
      heightScale: 1.0,
      physicalChanges: [],
      visualOnly: true
    };
  }

  const appearance = (player.appearance || {}) as Partial<Appearance>;
  const currentChibi = appearance.chibiForm;

  // 1. Check explicit manual state
  if (currentChibi?.enabled && (currentChibi.source === 'manual' || !currentChibi.source)) {
    return {
      active: true,
      source: 'manual',
      sourceId: currentChibi.sourceId || 'manual',
      sourceName: currentChibi.sourceName || 'Manuelle Chibi-Form',
      bodyScale: currentChibi.bodyScale ?? 0.65,
      heightScale: currentChibi.heightScale ?? 0.70,
      visualAge: currentChibi.visualAge || 'kindlich dargestellt',
      physicalChanges: currentChibi.physicalChanges || ['verkleinerte Körperproportionen', 'größere Kopfproportion', 'kürzere Gliedmaßen'],
      movementModifier: currentChibi.movementModifier || 'flink und flauschig',
      equipmentRule: currentChibi.equipmentRule || 'angepasst',
      visualOnly: currentChibi.visualOnly ?? true,
      description: currentChibi.description || 'Manuell aktivierte Chibi-Darstellung.'
    };
  }

  // 2. Check active transformation chibi config
  if (activeTransformation) {
    const tChibi = activeTransformation.chibiForm;
    if (tChibi?.enabled) {
      return {
        active: true,
        source: 'transformation',
        sourceId: activeTransformation.id,
        sourceName: activeTransformation.transformName || activeTransformation.displayName || activeTransformation.name || 'Transformation',
        bodyScale: tChibi.bodyScale ?? 0.65,
        heightScale: tChibi.heightScale ?? 0.70,
        visualAge: tChibi.visualAge || 'kindlich dargestellt',
        physicalChanges: tChibi.physicalChanges || ['verkleinerte Körperproportionen', 'größere Kopfproportion', 'kürzere Gliedmaßen'],
        movementModifier: tChibi.movementModifier || 'flink',
        equipmentRule: tChibi.equipmentRule || 'angepasst',
        visualOnly: tChibi.visualOnly ?? true,
        description: `Chibi-Form als Eigenschaft der Transformation ${activeTransformation.displayName || activeTransformation.name || ''}.`
      };
    }
  }

  // 3. Check race feature chibi config
  if (appearance.race) {
    const raceChibi = (appearance as any).raceChibiForm || (player as any).raceChibiForm;
    if (raceChibi?.enabled) {
      return {
        active: true,
        source: 'race',
        sourceId: appearance.race,
        sourceName: appearance.race,
        bodyScale: raceChibi.bodyScale ?? 0.65,
        heightScale: raceChibi.heightScale ?? 0.70,
        visualAge: raceChibi.visualAge || 'kindlich dargestellt',
        physicalChanges: raceChibi.physicalChanges || ['verkleinerte Körperproportionen', 'rassenspezifische Chibi-Gestalt'],
        movementModifier: raceChibi.movementModifier || 'leichtfüßig',
        equipmentRule: raceChibi.equipmentRule || 'angepasst',
        visualOnly: raceChibi.visualOnly ?? true,
        description: `Chibi-Form als Eigenschaft der Rasse ${appearance.race}.`
      };
    }
  }

  // 4. Check Power Overload (Kraftüberlastung) with Hysteresis
  const currentPowerUsage = transformationState?.powerUsage ?? appearance.powerUsage ?? 0;
  const currentIntensity = transformationState?.currentIntensity ?? appearance.transformationIntensity ?? 0;
  const effectivePower = Math.max(currentPowerUsage, currentIntensity);

  const overloadConfig = activeTransformation?.chibiOnPowerOverload ||
    activeTransformation?.chibiForm?.chibiOnPowerOverload ||
    (player as any)?.chibiOnPowerOverload ||
    appearance.chibiOnPowerOverload;

  const isCurrentlyOverloadChibi = currentChibi?.enabled && currentChibi.source === 'power_overload';

  if (overloadConfig?.enabled) {
    const actThreshold = overloadConfig.activationThreshold ?? 100;
    const recThreshold = overloadConfig.recoveryThreshold ?? actThreshold;

    let shouldBeActive = false;
    if (isCurrentlyOverloadChibi) {
      // Hysteresis: stays active until power falls below recoveryThreshold
      shouldBeActive = effectivePower >= recThreshold;
    } else {
      // Activates when power reaches or exceeds activationThreshold
      shouldBeActive = effectivePower >= actThreshold;
    }

    if (shouldBeActive) {
      return {
        active: true,
        source: 'power_overload',
        sourceId: 'power_overload',
        sourceName: 'Kraftüberlastung',
        bodyScale: currentChibi?.bodyScale ?? 0.65,
        heightScale: currentChibi?.heightScale ?? 0.70,
        visualAge: currentChibi?.visualAge || 'kindlich / geschrumpft durch Überlastung',
        physicalChanges: currentChibi?.physicalChanges || ['verkleinerte Körperproportionen', 'überlastungsbedingter Gestaltverlust zur Kleinkindform'],
        movementModifier: currentChibi?.movementModifier || 'eingeschränkt',
        equipmentRule: currentChibi?.equipmentRule || 'lockere Stofffalten',
        visualOnly: currentChibi?.visualOnly ?? false,
        description: `Automatische Chibi-Form durch Kraftüberlastung (${effectivePower}% Kraftnutzung).`
      };
    }
  } else if (effectivePower >= 120 || (isCurrentlyOverloadChibi && effectivePower >= 80)) {
    // Default fallback power overload trigger (>=120% activation, 80% recovery)
    const recThreshold = 80;
    const shouldBeActive = isCurrentlyOverloadChibi ? effectivePower >= recThreshold : effectivePower >= 120;

    if (shouldBeActive) {
      return {
        active: true,
        source: 'power_overload',
        sourceId: 'power_overload',
        sourceName: 'Kraftüberlastung',
        bodyScale: 0.65,
        heightScale: 0.70,
        visualAge: 'kindlich / geschrumpft durch Überlastung',
        physicalChanges: ['verkleinerte Körperproportionen', 'überlastungsbedingter Gestaltverlust zur Kleinkindform'],
        movementModifier: 'eingeschränkt',
        equipmentRule: 'lockere Stofffalten',
        visualOnly: false,
        description: `Automatische Chibi-Form durch Kraftüberlastung (${effectivePower}% Kraftnutzung).`
      };
    }
  }

  // Inactive default result
  return {
    active: false,
    bodyScale: 1.0,
    heightScale: 1.0,
    physicalChanges: [],
    visualOnly: true
  };
}
