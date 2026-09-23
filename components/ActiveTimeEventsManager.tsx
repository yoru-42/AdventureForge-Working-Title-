import React, { useState } from 'react';
import {
  ActiveTimeEvent,
  ATEParticipant,
  ATEStage,
  ATECategory,
  ATEStatus,
  ATERevealLevel,
  Adventure
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { ActiveTimeEventService } from '../services/activeTimeEventService';

interface Props {
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
}

export const ActiveTimeEventsManager: React.FC<Props> = ({ adventure, onUpdateAdventure }) => {
  const ates = ActiveTimeEventService.getActiveTimeEvents(adventure);
  const [selectedAteId, setSelectedAteId] = useState<string | null>(ates[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // New ATE Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState<ATECategory>('investigation');
  const [newOriginLocation, setNewOriginLocation] = useState(adventure.currentLocation?.locationName || '');
  const [newBackgroundContext, setNewBackgroundContext] = useState('');
  const [newConvergenceCondition, setNewConvergenceCondition] = useState('');
  const [newConvergenceConsequence, setNewConvergenceConsequence] = useState('');

  // Participant Form State
  const [partName, setPartName] = useState('');
  const [partGoal, setPartGoal] = useState('');
  const [partMotivation, setPartMotivation] = useState('');
  const [partLocation, setPartLocation] = useState('');

  // Stage Form State
  const [stageTitle, setStageTitle] = useState('');
  const [stageDesc, setStageDesc] = useState('');
  const [stageTruth, setStageTruth] = useState('');
  const [stageTrigger, setStageTrigger] = useState('');
  const [stageDelay, setStageDelay] = useState<number>(120);
  const [stageClue, setStageClue] = useState('');

  const filteredAtes = ates.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return a.status === 'active';
    if (filterStatus === 'converged') return a.status === 'converged' || a.isConverged;
    if (filterStatus === 'foreshadowed') return a.revealLevel === 'foreshadowed';
    return a.status === filterStatus;
  });

  const selectedAte = ates.find(a => a.id === selectedAteId);

  const handleSaveATE = (updatedAte: ActiveTimeEvent) => {
    const updatedList = ates.map(a => (a.id === updatedAte.id ? updatedAte : a));
    onUpdateAdventure(ActiveTimeEventService.setActiveTimeEvents(adventure, updatedList));
  };

  const handleDeleteATE = (id: string) => {
    const updatedList = ates.filter(a => a.id !== id);
    onUpdateAdventure(ActiveTimeEventService.setActiveTimeEvents(adventure, updatedList));
    if (selectedAteId === id) {
      setSelectedAteId(updatedList[0]?.id || null);
    }
  };

  const handleCreateATE = () => {
    if (!newTitle.trim()) return;

    const initialStage: ATEStage = {
      stageIndex: 0,
      title: 'Ausgangssituation',
      description: newSummary || 'Die Hintergrundentwicklung nimmt ihren Anfang.',
      internalTruth: newBackgroundContext || 'Erste Vorbereitungen im Verborgenen.',
      triggerConditionText: 'Aktivierung',
      triggerTimeMinutes: 0,
      foreshadowingClues: [],
      revealedToPlayer: false
    };

    const initialParticipant: ATEParticipant = partName.trim() ? {
      id: `part_${Date.now()}`,
      characterName: partName.trim(),
      goal: partGoal.trim() || 'Verfolgt eigene Pläne',
      motivation: partMotivation.trim() || 'Persönlicher Antrieb',
      currentLocationName: partLocation.trim() || newOriginLocation || 'Unbekannt'
    } : {
      id: `part_${Date.now()}`,
      characterName: 'Involvierte Partei',
      goal: 'Sicherung der eigenen Interessen',
      motivation: 'Selbsterhaltung und Einflussnahme',
      currentLocationName: newOriginLocation || 'Unbekannter Ort'
    };

    const newAte = ActiveTimeEventService.createATE({
      title: newTitle.trim(),
      summary: newSummary.trim() || 'Paralleler Handlungsstrang in der Spielwelt.',
      category: newCategory,
      status: 'active',
      revealLevel: 'hidden',
      originLocationName: newOriginLocation.trim(),
      backgroundContext: newBackgroundContext.trim(),
      participants: [initialParticipant],
      stages: [initialStage],
      convergenceCondition: newConvergenceCondition.trim() || 'Sobald der Spieler am Ursprungsort ermittelt oder den Beteiligten begegnet.',
      convergenceConsequence: newConvergenceConsequence.trim() || 'Die Hintergrundentwicklung überschneidet sich direkt mit dem Hauptgeschehen.',
      worldTime: adventure.worldTime
    });

    const updatedList = [...ates, newAte];
    onUpdateAdventure(ActiveTimeEventService.setActiveTimeEvents(adventure, updatedList));
    setSelectedAteId(newAte.id);
    setIsCreating(false);

    // Reset form
    setNewTitle('');
    setNewSummary('');
    setNewBackgroundContext('');
    setNewConvergenceCondition('');
    setNewConvergenceConsequence('');
    setPartName('');
    setPartGoal('');
    setPartMotivation('');
    setPartLocation('');
  };

  const handleAddParticipant = () => {
    if (!selectedAte || !partName.trim()) return;

    const newPart: ATEParticipant = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      characterName: partName.trim(),
      goal: partGoal.trim() || 'Sicherung der eigenen Ziele',
      motivation: partMotivation.trim() || 'Bestehende Handlungsgründe',
      currentLocationName: partLocation.trim() || selectedAte.originLocationName || 'Unbekannt'
    };

    const updated = {
      ...selectedAte,
      participants: [...selectedAte.participants, newPart]
    };
    handleSaveATE(updated);

    setPartName('');
    setPartGoal('');
    setPartMotivation('');
    setPartLocation('');
  };

  const handleRemoveParticipant = (partId: string) => {
    if (!selectedAte) return;
    const updated = {
      ...selectedAte,
      participants: selectedAte.participants.filter(p => p.id !== partId)
    };
    handleSaveATE(updated);
  };

  const handleAddStage = () => {
    if (!selectedAte || !stageTitle.trim()) return;

    const newIndex = selectedAte.stages.length;
    const newStage: ATEStage = {
      stageIndex: newIndex,
      title: stageTitle.trim(),
      description: stageDesc.trim() || 'Neue Phase im Hintergrundablauf.',
      internalTruth: stageTruth.trim() || stageDesc.trim() || 'Verborgener Zustand.',
      triggerConditionText: stageTrigger.trim() || `${stageDelay} Minuten Zeitablauf`,
      triggerTimeMinutes: stageDelay,
      foreshadowingClues: stageClue.trim() ? [stageClue.trim()] : [],
      revealedToPlayer: false
    };

    const updated = {
      ...selectedAte,
      stages: [...selectedAte.stages, newStage]
    };
    handleSaveATE(updated);

    setStageTitle('');
    setStageDesc('');
    setStageTruth('');
    setStageTrigger('');
    setStageClue('');
  };

  const handleRemoveStage = (index: number) => {
    if (!selectedAte || selectedAte.stages.length <= 1) return;
    const updatedStages = selectedAte.stages
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, stageIndex: idx }));

    const newCurrentIdx = Math.min(selectedAte.currentStageIndex, updatedStages.length - 1);
    const updated = {
      ...selectedAte,
      stages: updatedStages,
      currentStageIndex: newCurrentIdx
    };
    handleSaveATE(updated);
  };

  const handleAdvanceStage = () => {
    if (!selectedAte) return;
    if (selectedAte.currentStageIndex < selectedAte.stages.length - 1) {
      const nextIdx = selectedAte.currentStageIndex + 1;
      const updated = {
        ...selectedAte,
        currentStageIndex: nextIdx,
        revealLevel: selectedAte.revealLevel === 'hidden' ? ('foreshadowed' as ATERevealLevel) : selectedAte.revealLevel
      };
      handleSaveATE(updated);
    }
  };

  const handleTriggerConvergence = () => {
    if (!selectedAte) return;
    const updated = {
      ...selectedAte,
      status: 'converged' as ATEStatus,
      isConverged: true,
      revealLevel: 'fully_revealed' as ATERevealLevel,
      currentStageIndex: selectedAte.stages.length - 1
    };
    handleSaveATE(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 space-y-4 rounded-lg overflow-y-auto">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Parallele Handlungsstränge (Active Time Events)
          </h2>
          <p className="text-xs text-slate-400">
            Hintergrundereignisse, Charakter-Motivationen und kaskadierende Welt-Entwicklungen
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Alle Handlungsstränge</option>
            <option value="active">Aktiv</option>
            <option value="foreshadowed">Gerüchte / Hinweise</option>
            <option value="converged">Konvergiert</option>
            <option value="paused">Pausiert</option>
            <option value="resolved">Aufgelöst</option>
          </select>

          <button
            onClick={() => setIsCreating(true)}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded transition"
          >
            Neuer ATE-Strang
          </button>
        </div>
      </div>

      {/* Creation Modal / Inline Section */}
      {isCreating && (
        <div className="bg-slate-800 border border-amber-500/40 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400">
            Neuen parallelen Handlungsstrang anlegen
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Titel des Handlungsstrangs</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="z.B. Ermittlung der Stadtwache am Handelshafen"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Kategorie</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as ATECategory)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="investigation">Ermittlung / Nachforschung</option>
                <option value="political">Politische Ränkespiele</option>
                <option value="conflict">Konflikt / Fehde</option>
                <option value="faction">Fraktionsbewegung</option>
                <option value="personal">Persönliche Motivation</option>
                <option value="resource">Ressourcen & Handel</option>
                <option value="travel">Reise / Truppenbewegung</option>
                <option value="custom">Benutzerdefiniert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Ursprungsort</label>
            <input
              type="text"
              value={newOriginLocation}
              onChange={e => setNewOriginLocation(e.target.value)}
              placeholder="z.B. Rheinfels Tuchhändlerviertel"
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Zusammenfassung des Geschehens</label>
            <AutoExpandingTextarea
              value={newSummary}
              onChange={e => setNewSummary(e.target.value)}
              minRows={2}
              placeholder="Genaue Beschreibung, was im Hintergrund abläuft..."
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded p-2 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Vorgeschichte & Historischer Kontext (Keine plötzlichen Figuren)</label>
            <AutoExpandingTextarea
              value={newBackgroundContext}
              onChange={e => setNewBackgroundContext(e.target.value)}
              minRows={2}
              placeholder="Welche früheren Ereignisse und Codex-Fakten erklären die Beteiligung der Charaktere..."
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded p-2 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hauptbeteiligter Charakter / Gruppe</label>
              <input
                type="text"
                value={partName}
                onChange={e => setPartName(e.target.value)}
                placeholder="z.B. Hauptmann Kaelen"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Konkretes Ziel des Akteurs</label>
              <input
                type="text"
                value={partGoal}
                onChange={e => setPartGoal(e.target.value)}
                placeholder="z.B. Schmuggelware vor der Wache sichern"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Innere Motivation (Grund der Handlung)</label>
            <AutoExpandingTextarea
              value={partMotivation}
              onChange={e => setPartMotivation(e.target.value)}
              minRows={2}
              placeholder="Warum handelt der Akteur so? Selbsterhaltung, Angst vor Aufdeckung..."
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded p-2 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Konvergenz-Bedingung</label>
              <input
                type="text"
                value={newConvergenceCondition}
                onChange={e => setNewConvergenceCondition(e.target.value)}
                placeholder="Wann trifft der Strang mit dem Spieler zusammen?"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Konvergenz-Folge</label>
              <input
                type="text"
                value={newConvergenceConsequence}
                onChange={e => setNewConvergenceConsequence(e.target.value)}
                placeholder="Auswirkung bei Zusammentreffen..."
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 px-3 py-1.5 rounded"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCreateATE}
              className="bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-slate-950 px-4 py-1.5 rounded"
            >
              Handlungsstrang Speichern
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Split View / List + Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {/* Left List of ATEs */}
        <div className="bg-slate-800/80 border border-slate-800 rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Handlungsstränge ({filteredAtes.length})
          </h3>

          {filteredAtes.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              Keine passenden Handlungsstränge vorhanden.
            </p>
          ) : (
            filteredAtes.map(ate => {
              const isSelected = ate.id === selectedAteId;
              const currentStage = ate.stages[ate.currentStageIndex] || ate.stages[0];

              return (
                <div
                  key={ate.id}
                  onClick={() => setSelectedAteId(ate.id)}
                  className={`p-3 rounded border text-left cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/60'
                      : 'bg-slate-900 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {ate.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      ate.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' :
                      ate.status === 'converged' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {ate.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                    {ate.summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Phase {ate.currentStageIndex + 1}/{ate.stages.length}: {currentStage?.title}</span>
                    <span>Sichtbarkeit: {ate.revealLevel}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Details Panel */}
        <div className="md:col-span-2 bg-slate-800/80 border border-slate-800 rounded-lg p-4 space-y-5">
          {!selectedAte ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-500 italic">
              Wähle einen Handlungsstrang aus der Liste, um Details zu sehen und zu bearbeiten.
            </div>
          ) : (
            <>
              {/* Selected ATE Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={selectedAte.title}
                      onChange={e => handleSaveATE({ ...selectedAte, title: e.target.value })}
                      className="text-base font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>Kategorie: {selectedAte.category || 'Allgemein'}</span>
                    <span>•</span>
                    <span>Ursprung: {selectedAte.originLocationName || 'Nicht angegeben'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedAte.status}
                    onChange={e => handleSaveATE({ ...selectedAte, status: e.target.value as ATEStatus })}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Aktiv</option>
                    <option value="paused">Pausiert</option>
                    <option value="converged">Konvergiert</option>
                    <option value="resolved">Aufgelöst</option>
                    <option value="cancelled">Abgebrochen</option>
                  </select>

                  <button
                    onClick={() => handleDeleteATE(selectedAte.id)}
                    className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs px-2.5 py-1 rounded"
                  >
                    Löschen
                  </button>
                </div>
              </div>

              {/* Summary & Background Context */}
              <div className="space-y-3 bg-slate-900/60 p-3 rounded border border-slate-700/50">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aktueller Stand & Zusammenfassung
                  </label>
                  <AutoExpandingTextarea
                    value={selectedAte.summary}
                    onChange={e => handleSaveATE({ ...selectedAte, summary: e.target.value })}
                    minRows={2}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Historische Vorgeschichte & Verankerung in der Welt
                  </label>
                  <AutoExpandingTextarea
                    value={selectedAte.backgroundContext || ''}
                    onChange={e => handleSaveATE({ ...selectedAte, backgroundContext: e.target.value })}
                    minRows={2}
                    placeholder="Erklärt, warum beteiligte Personen existieren und handeln..."
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded p-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Participant & Motivations Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Beteiligte Akteure & Motivationen
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {selectedAte.participants.map(part => (
                    <div key={part.id} className="bg-slate-900 border border-slate-700/60 rounded p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{part.characterName}</span>
                        <button
                          onClick={() => handleRemoveParticipant(part.id)}
                          className="text-slate-500 hover:text-rose-400 text-[11px]"
                        >
                          Entfernen
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Ziel:</span>
                          <span className="text-slate-200">{part.goal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Motivation:</span>
                          <span className="text-slate-200">{part.motivation}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Aktueller Ort:</span>
                          <span className="text-slate-200">{part.currentLocationName || 'Unbekannt'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Nächster Schritt:</span>
                          <span className="text-slate-200">{part.nextStep || 'In Planung'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Participant Input Row */}
                <div className="bg-slate-900/80 border border-slate-700/40 rounded p-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Weitere Person / Fraktion hinzufügen</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={partName}
                      onChange={e => setPartName(e.target.value)}
                      placeholder="Name der Person / Fraktion"
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={partGoal}
                      onChange={e => setPartGoal(e.target.value)}
                      placeholder="Konkretes Ziel"
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={partMotivation}
                      onChange={e => setPartMotivation(e.target.value)}
                      placeholder="Innere Motivation"
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAddParticipant}
                      className="bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 px-3 py-1 rounded"
                    >
                      Akteur hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage Progression Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Ablauf-Phasen ({selectedAte.stages.length})
                  </h4>
                  <button
                    onClick={handleAdvanceStage}
                    disabled={selectedAte.currentStageIndex >= selectedAte.stages.length - 1}
                    className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-semibold text-xs px-3 py-1 rounded"
                  >
                    Nächste Phase auslösen
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedAte.stages.map((stg, idx) => {
                    const isCurrent = idx === selectedAte.currentStageIndex;
                    const isPast = idx < selectedAte.currentStageIndex;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded border text-xs space-y-1.5 transition ${
                          isCurrent
                            ? 'bg-amber-950/30 border-amber-500/70'
                            : isPast
                            ? 'bg-slate-900/40 border-slate-800 opacity-75'
                            : 'bg-slate-900 border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                              isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}>
                              Phase {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-200">{stg.title}</span>
                          </div>
                          {selectedAte.stages.length > 1 && (
                            <button
                              onClick={() => handleRemoveStage(idx)}
                              className="text-slate-500 hover:text-rose-400 text-[11px]"
                            >
                              Entfernen
                            </button>
                          )}
                        </div>

                        <p className="text-slate-300">{stg.description}</p>

                        <div className="bg-slate-950/60 p-2 rounded border border-slate-800 space-y-1 text-[11px]">
                          <div>
                            <span className="text-amber-400 font-semibold">Interne Wahrheit (KI-Kontext): </span>
                            <span className="text-slate-300">{stg.internalTruth}</span>
                          </div>
                          {stg.foreshadowingClues && stg.foreshadowingClues.length > 0 && (
                            <div>
                              <span className="text-sky-400 font-semibold">Wahrnehmbare Hinweise (Gerüchte): </span>
                              <span className="text-slate-300">{stg.foreshadowingClues.join('; ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Stage Input Form */}
                <div className="bg-slate-900/80 border border-slate-700/40 rounded p-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Neue Phase anhängen</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={stageTitle}
                      onChange={e => setStageTitle(e.target.value)}
                      placeholder="Phasentitel"
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={stageTrigger}
                      onChange={e => setStageTrigger(e.target.value)}
                      placeholder="Auslösebedingung (z.B. Ortswechsel)"
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <AutoExpandingTextarea
                    value={stageDesc}
                    onChange={e => setStageDesc(e.target.value)}
                    minRows={1}
                    placeholder="Beschreibung des ablaufs..."
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded p-2 focus:outline-none focus:border-amber-500"
                  />
                  <AutoExpandingTextarea
                    value={stageTruth}
                    onChange={e => setStageTruth(e.target.value)}
                    minRows={1}
                    placeholder="Interne Wahrheit..."
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded p-2 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={stageClue}
                    onChange={e => setStageClue(e.target.value)}
                    placeholder="Indirekter Hinweis / Gerücht (Foreshadowing)"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAddStage}
                      className="bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 px-3 py-1 rounded"
                    >
                      Phase Hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Convergence & Impact History */}
              <div className="space-y-3 border-t border-slate-700/60 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Konvergenz & Spieler-Einfluss
                  </h4>
                  <button
                    onClick={handleTriggerConvergence}
                    disabled={selectedAte.status === 'converged'}
                    className="bg-rose-800 hover:bg-rose-700 disabled:opacity-40 text-slate-100 text-xs px-3 py-1 rounded"
                  >
                    Jetzt Konvergieren Lassen
                  </button>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-700/50 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Bedingung für Zusammentreffen:</span>
                    <span className="text-slate-200">{selectedAte.convergenceCondition || 'Nicht definiert'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Auswirkung bei Konvergenz:</span>
                    <span className="text-slate-200">{selectedAte.convergenceConsequence || 'Nicht definiert'}</span>
                  </div>
                </div>

                {selectedAte.playerImpactLogs && selectedAte.playerImpactLogs.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">Einfluss des Spielers bisher:</span>
                    <div className="space-y-1">
                      {selectedAte.playerImpactLogs.map((log, lIdx) => (
                        <div key={lIdx} className="bg-slate-900/80 p-2 rounded text-[11px] border border-slate-800 text-slate-300">
                          <span className="text-amber-400 font-mono">[{log.timestamp}]</span> {log.actionDescription} → {log.effectOnThread}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
