import React, { useState } from 'react';
import { LoreEntry, RaceDetails, WorldSetting } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { GeminiService } from '../services/geminiService';

interface Props {
  editForm: Partial<LoreEntry>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<LoreEntry>>>;
  isEditing: string | null;
  setIsEditing: (id: string | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  lore: LoreEntry[];
  onUpdateLore: (lore: LoreEntry[]) => void;
  worldTitle?: string;
  isNsfw?: boolean;
  world?: WorldSetting | any;
}

const RARITY_OPTIONS = [
  'Häufig (Weit verbreitet)',
  'Regional verbreitet',
  'Mäßig verbreitet',
  'Selten',
  'Sehr selten',
  'Vom Aussterben bedroht',
  'Legendär / Mythisch',
  'Unbekannt'
];

export const RaceLoreForm: React.FC<Props> = ({
  editForm,
  setEditForm,
  isEditing,
  onSave,
  onDelete,
  onCancel,
  lore,
  worldTitle,
  isNsfw,
  world
}) => {
  const [activeTab, setActiveTab] = useState<
    'basis' | 'anatomie' | 'kultur' | 'eigenschaften' | 'diplomatie' | 'namen' | 'geheimnisse'
  >('basis');

  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [smartFillPrompt, setSmartFillPrompt] = useState('');
  const [keepExistingDetails, setKeepExistingDetails] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const getDetail = (field: keyof RaceDetails, fallback: string = ''): string => {
    return (editForm.details?.[field] as string) || fallback;
  };

  const updateDetail = (field: keyof RaceDetails, value: string) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [field]: value
      }
    }));
  };

  const handleSmartFill = async () => {
    if (!smartFillPrompt.trim()) return;
    setIsSmartFilling(true);
    try {
      const existingRaces = lore
        .filter(l => l.category === 'Rassen')
        .map(l => l.title)
        .filter(Boolean);

      const data = await GeminiService.autofillLoreEntry(
        smartFillPrompt,
        'Rassen',
        undefined,
        undefined,
        existingRaces,
        keepExistingDetails ? editForm : { title: editForm.title, category: 'Rassen' },
        world,
        undefined,
        lore
      );

      if (data) {
        setEditForm(prev => ({
          ...prev,
          title: data.title || prev.title || '',
          description: data.description || prev.description || '',
          secretsStage1: data.secretsStage1 || prev.secretsStage1 || '',
          secretsStage2: data.secretsStage2 || prev.secretsStage2 || '',
          secretsStage3: data.secretsStage3 || prev.secretsStage3 || '',
          details: {
            ...(keepExistingDetails ? (prev.details || {}) : {}),
            ...(data.details || {})
          }
        }));
      }
    } catch (err) {
      console.error('Fehler beim automatischen Ausfüllen der Rasse:', err);
    } finally {
      setIsSmartFilling(false);
    }
  };

  const handleGenerateRaceIllustration = async () => {
    if (!editForm.title?.trim()) return;
    setIsGeneratingImage(true);
    try {
      const name = editForm.title.trim();
      const habitat = getDetail('originHabitat');
      const features = getDetail('distinctiveFeatures');
      const skinHair = getDetail('skinAndHair');
      const height = getDetail('averageHeight');
      const style = 'Konzeptkunst, detaillierte Völkerdarstellung, neutraler Hintergrund, Fantasy / Sci-Fi Stil passend zur Welt, keine Beschriftung';

      const prompt = `Darstellung eines typischen Vertreters der Rasse "${name}" in der Spielwelt "${worldTitle || 'Fantasy'}".
Merkmale:
- Besondere Merkmale: ${features || 'Klassische Volksmerkmale'}
- Haut, Fell oder Haare: ${skinHair || 'Natürliche Tönung'}
- Statur und Größe: ${height || 'Mittlere Statur'}
- Herkunft / Lebensraum: ${habitat || 'Traditionelle Heimat'}
- Beschreibung: ${editForm.description || ''}
Stil: ${style}. Hochwertige digitale Illustration.`;

      const imageUrl = await GeminiService.generateImage(prompt, isNsfw);
      if (imageUrl) {
        setEditForm(prev => ({ ...prev, image: imageUrl }));
      }
    } catch (err) {
      console.error('Fehler bei der Bildgenerierung:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const base64 = e.target?.result as string;
      if (base64) {
        try {
          const compressed = await GeminiService.compressImageBase64(base64, 512, 0.75);
          setEditForm(prev => ({ ...prev, image: compressed }));
        } catch {
          setEditForm(prev => ({ ...prev, image: base64 }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-dna text-emerald-400"></i>
            <span>
              {isEditing
                ? `Rasse bearbeiten: ${editForm.title || ''}`
                : 'Neue Rasse anlegen'}
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Definiere Biologie, Kultur, Merkmale, Fähigkeiten und gesellschaftliche Ordnung dieses Volkes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => onDelete(isEditing)}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Rasse löschen"
            >
              <i className="fa-solid fa-trash-can text-rose-400"></i>
              <span>Löschen</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all cursor-pointer"
          >
            Zurücksetzen
          </button>
        </div>
      </div>

      {/* Smart-Fill Box */}
      <div className="bg-slate-800/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Automatische Rassen-Ausarbeitung (Smart-Fill)</span>
          </span>
          <button
            type="button"
            onClick={handleSmartFill}
            disabled={isSmartFilling || !smartFillPrompt.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <i className={`fa-solid ${isSmartFilling ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
            <span>{isSmartFilling ? 'Wird generiert...' : 'Automatisch ausfüllen'}</span>
          </button>
        </div>

        <AutoExpandingTextarea
          value={smartFillPrompt}
          onChange={e => setSmartFillPrompt(e.target.value)}
          placeholder="Beschreibe die Rasse in eigenen Worten (z.B. Anatomie, Lebensraum, magische Talente oder Verhaltensweisen)... Die KI füllt alle Formularfelder strukturiert aus."
          className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-slate-200 text-xs min-h-[60px] outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            id="keepExistingRaceDetailsCheckbox"
            checked={keepExistingDetails}
            onChange={e => setKeepExistingDetails(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 accent-indigo-600"
          />
          <label htmlFor="keepExistingRaceDetailsCheckbox" className="text-[11px] text-slate-300 font-medium cursor-pointer">
            <span className="text-emerald-400 font-bold">Ergänzungs-Modus:</span> Bestehende Angaben beibehalten und gezielt neue Daten ergänzen
          </label>
        </div>
      </div>

      {/* Core Fields: Name, Image & Main Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Image / Visual */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="w-full aspect-[4/5] rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden relative group">
            {editForm.image ? (
              <>
                <img
                  src={editForm.image}
                  alt={editForm.title || 'Rassenabbildung'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <label className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer">
                    <i className="fa-solid fa-upload"></i>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, image: undefined }))}
                    className="p-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs cursor-pointer"
                    title="Bild entfernen"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                <i className="fa-solid fa-dna text-3xl mb-2 text-slate-700"></i>
                <span className="text-xs text-slate-500">Keine Illustration vorhanden</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateRaceIllustration}
              disabled={isGeneratingImage || !editForm.title?.trim()}
              className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <i className={`fa-solid ${isGeneratingImage ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'} text-emerald-400`}></i>
              <span>{isGeneratingImage ? 'Generiere...' : 'Bild generieren'}</span>
            </button>

            <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0">
              <i className="fa-solid fa-upload"></i>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Right: Title & Main Description */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Rassenname / Volksbezeichnung
            </label>
            <input
              type="text"
              value={editForm.title || ''}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Name des Volkes oder der Rasse (z.B. Lunarier, Hochelfen, Mondschatten-Katzenvolk)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Hintergrund &amp; Gesamteindruck (Hauptbeschreibung)
            </label>
            <AutoExpandingTextarea
              value={editForm.description || ''}
              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Umfassende Beschreibung des Volkes: Erscheinungsbild, Wesen, kultureller Hintergrund und typischer Lebensstil..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[120px]"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation for Detailed Sections */}
      <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: 'basis', label: 'Grunddaten & Lebensraum', icon: 'fa-earth-americas' },
            { id: 'anatomie', label: 'Anatomie & Physiologie', icon: 'fa-heart-pulse' },
            { id: 'kultur', label: 'Kultur & Gesellschaft', icon: 'fa-landmark' },
            { id: 'eigenschaften', label: 'Fähigkeiten & Resistenzen', icon: 'fa-shield-halved' },
            { id: 'diplomatie', label: 'Diplomatie & Beziehungen', icon: 'fa-handshake' },
            { id: 'namen', label: 'Namen & Leitfiguren', icon: 'fa-signature' },
            { id: 'geheimnisse', label: 'Geheimnisse & Ursprung', icon: 'fa-eye-slash' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-[11px]`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Section 1: Grunddaten & Lebensraum */}
        {activeTab === 'basis' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Grunddaten und Lebensraum
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Alternative Bezeichnungen &amp; Unterarten
                </label>
                <AutoExpandingTextarea
                  value={getDetail('subraces')}
                  onChange={e => updateDetail('subraces', e.target.value)}
                  placeholder="Unterrassen, bekannte Stämme, Sippen oder alternative Bezeichnungen..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Ursprünglicher Lebensraum &amp; Regionen
                </label>
                <AutoExpandingTextarea
                  value={getDetail('originHabitat')}
                  onChange={e => updateDetail('originHabitat', e.target.value)}
                  placeholder="Heimatgebiete, bevorzugte Klimazonen, Gebirge, Meere oder Kontinente..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Verbreitung &amp; Häufigkeit
                </label>
                <select
                  value={getDetail('rarity', RARITY_OPTIONS[0])}
                  onChange={e => updateDetail('rarity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                >
                  {RARITY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Durchschnittliche Lebenserwartung &amp; Reifung
                </label>
                <input
                  type="text"
                  value={getDetail('lifespan')}
                  onChange={e => updateDetail('lifespan', e.target.value)}
                  placeholder="z.B. 120 Jahre, erwachsen mit 18 Jahren, unverändert über Jahrhunderte"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Sprachen, Dialekte &amp; Schriftsystem
                </label>
                <AutoExpandingTextarea
                  value={getDetail('languages')}
                  onChange={e => updateDetail('languages', e.target.value)}
                  placeholder="Muttersprache, Akzente, typische Redewendungen, historische Schriftsprache..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Anatomie & Physiologie */}
        {activeTab === 'anatomie' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Anatomie und Physiologie
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Durchschnittsgröße &amp; Proportionen
                </label>
                <input
                  type="text"
                  value={getDetail('averageHeight')}
                  onChange={e => updateDetail('averageHeight', e.target.value)}
                  placeholder="z.B. 1,75 m bis 2,10 m, langgliedrig und schlank"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Gewicht &amp; typischer Körperbau
                </label>
                <input
                  type="text"
                  value={getDetail('averageWeight')}
                  onChange={e => updateDetail('averageWeight', e.target.value)}
                  placeholder="z.B. 70 - 110 kg, kräftig und sehnig"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Haut-, Fell- oder Schuppentöne sowie Haarfarben
                </label>
                <AutoExpandingTextarea
                  value={getDetail('skinAndHair')}
                  onChange={e => updateDetail('skinAndHair', e.target.value)}
                  placeholder="Typische Farbvarianten von Haut, Schuppen, Fell und Haaren..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Augenmerkmale &amp; Wahrnehmungsorgane
                </label>
                <AutoExpandingTextarea
                  value={getDetail('eyeFeatures')}
                  onChange={e => updateDetail('eyeFeatures', e.target.value)}
                  placeholder="Augenfarben, Pupillenform, Nachtsicht, Wärmesinn, Geruchssinn..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Besondere physische Merkmale
                </label>
                <AutoExpandingTextarea
                  value={getDetail('distinctiveFeatures')}
                  onChange={e => updateDetail('distinctiveFeatures', e.target.value)}
                  placeholder="Hörner, Kiemen, Schweif, Krallen, Flügel, Reißzähne, Schwimmhäute oder Muster..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Biologische Besonderheiten, Ernährung &amp; Stoffwechsel
                </label>
                <AutoExpandingTextarea
                  value={getDetail('biologyAndDiet')}
                  onChange={e => updateDetail('biologyAndDiet', e.target.value)}
                  placeholder="Nahrungsaufnahme, Stoffwechsel, Ruhephasen, Anfälligkeiten für Umwelteinflüsse..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Kultur & Gesellschaft */}
        {activeTab === 'kultur' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Kultur, Glaube und Gesellschaft
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Gesellschaftsordnung &amp; Führung
                </label>
                <AutoExpandingTextarea
                  value={getDetail('socialStructure')}
                  onChange={e => updateDetail('socialStructure', e.target.value)}
                  placeholder="Herrschaftsform, Ratsversammlung, Sippensystem, Kastensystem, Meritokratie..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Grundwerte &amp; Lebensphilosophie
                </label>
                <AutoExpandingTextarea
                  value={getDetail('valuesAndPhilosophy')}
                  onChange={e => updateDetail('valuesAndPhilosophy', e.target.value)}
                  placeholder="Leitprinzipien, Tugenden, Ehrbegriff, Tabus und moralische Maßstäbe..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Religion, Gottheiten &amp; Ahnenkult
                </label>
                <AutoExpandingTextarea
                  value={getDetail('religionsAndGods')}
                  onChange={e => updateDetail('religionsAndGods', e.target.value)}
                  placeholder="Verehrte Götter, Elementargeister, Schöpfungsmythen oder Ahnenverehrung..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Traditionen, Bräuche &amp; Feste
                </label>
                <AutoExpandingTextarea
                  value={getDetail('traditionsAndRituals')}
                  onChange={e => updateDetail('traditionsAndRituals', e.target.value)}
                  placeholder="Initiationsriten, Hochzeits- und Bestattungsbräuche, Jahreszeitenfeste..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Typische Berufsfelder &amp; Handwerkskunst
                </label>
                <AutoExpandingTextarea
                  value={getDetail('typicalProfessions')}
                  onChange={e => updateDetail('typicalProfessions', e.target.value)}
                  placeholder="Spezialisierte Handwerke, Kriegskunst, Alchemie, Landwirtschaft, Seefahrt..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Fähigkeiten & Resistenzen */}
        {activeTab === 'eigenschaften' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Biologische Eigenschaften, Magie und Resistenzen
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Angeborene körperliche Stärken &amp; Talente
                </label>
                <AutoExpandingTextarea
                  value={getDetail('naturalTraits')}
                  onChange={e => updateDetail('naturalTraits', e.target.value)}
                  placeholder="Hohe Körperkraft, ausgeprägte Agilität, Tarnung, Tauchfähigkeit..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Magische Begabung &amp; Elementaraffinitäten
                </label>
                <AutoExpandingTextarea
                  value={getDetail('magicalAffinities')}
                  onChange={e => updateDetail('magicalAffinities', e.target.value)}
                  placeholder="Inhärente Magiebegabung, Naturverbundenheit, Gedankenübertragung, Geisterbande..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Resistenzen &amp; Immunitäten
                </label>
                <AutoExpandingTextarea
                  value={getDetail('resistances')}
                  onChange={e => updateDetail('resistances', e.target.value)}
                  placeholder="Widerstand gegen Kälte, Hitze, Krankheiten, Gifte oder bestimmte Zauberschulen..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Schwächen &amp; Verwundbarkeiten
                </label>
                <AutoExpandingTextarea
                  value={getDetail('weaknesses')}
                  onChange={e => updateDetail('weaknesses', e.target.value)}
                  placeholder="Lichtempfindlichkeit, Anfälligkeit für bestimmte Metalle, Magieintoleranz..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Diplomatie & Beziehungen */}
        {activeTab === 'diplomatie' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Diplomatie und Völkerbeziehungen
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Verbündete &amp; befreundete Völker
                </label>
                <AutoExpandingTextarea
                  value={getDetail('relationsAllies')}
                  onChange={e => updateDetail('relationsAllies', e.target.value)}
                  placeholder="Partner mit jahrhundertealten Bündnissen oder gemeinsamen Werten..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Rivalitäten &amp; gespannte Verhältnisse
                </label>
                <AutoExpandingTextarea
                  value={getDetail('relationsRivals')}
                  onChange={e => updateDetail('relationsRivals', e.target.value)}
                  placeholder="Wettstreit um Territorien, Handelsrouten oder alte Rechnungen..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Erbfeindschaften &amp; offene Kriege
                </label>
                <AutoExpandingTextarea
                  value={getDetail('relationsEnemies')}
                  onChange={e => updateDetail('relationsEnemies', e.target.value)}
                  placeholder="Historische Feinde, unversöhnliche Konflikte oder kriegerische Nachbarn..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Haltung gegenüber Fremden &amp; Außenstehenden
                </label>
                <AutoExpandingTextarea
                  value={getDetail('attitudeTowardsOutsiders')}
                  onChange={e => updateDetail('attitudeTowardsOutsiders', e.target.value)}
                  placeholder="Offen, gastfreundlich, misstrauisch, herablassend oder strikt isolationistisch..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Weltweiter Ruf &amp; Stereotypen
                </label>
                <AutoExpandingTextarea
                  value={getDetail('reputation')}
                  onChange={e => updateDetail('reputation', e.target.value)}
                  placeholder="Wie die übrige Welt über dieses Volk denkt..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Namen & Leitfiguren */}
        {activeTab === 'namen' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              Namenskonventionen und bedeutende Vertreter
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Männliche Beispielnamen
                </label>
                <AutoExpandingTextarea
                  value={getDetail('namingMale')}
                  onChange={e => updateDetail('namingMale', e.target.value)}
                  placeholder="Typische männliche Vornamen und Klangmuster..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Weibliche Beispielnamen
                </label>
                <AutoExpandingTextarea
                  value={getDetail('namingFemale')}
                  onChange={e => updateDetail('namingFemale', e.target.value)}
                  placeholder="Typische weibliche Vornamen und Klangmuster..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Sippen-, Clan- oder Familiennamen
                </label>
                <AutoExpandingTextarea
                  value={getDetail('namingSurnames')}
                  onChange={e => updateDetail('namingSurnames', e.target.value)}
                  placeholder="Typische Sippennamen, Hausnamen oder Ehrenbezeichnungen..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[55px]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Bekannte historische Persönlichkeiten &amp; Anführer
                </label>
                <AutoExpandingTextarea
                  value={getDetail('prominentFigures')}
                  onChange={e => updateDetail('prominentFigures', e.target.value)}
                  placeholder="Namhafte Herrscher, legendäre Helden, Gelehrte oder Pioniere dieses Volkes..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 7: Geheimnisse & Ursprung */}
        {activeTab === 'geheimnisse' && (
          <div className="bg-slate-950/60 border border-purple-900/30 p-4 rounded-xl flex flex-col gap-4 animate-in fade-in duration-150">
            <h5 className="text-xs font-bold text-purple-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <i className="fa-solid fa-eye-slash text-purple-400"></i>
              <span>Geheimnisse, Ursprungslegenden und Verborgenes Wissen</span>
            </h5>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-purple-400/90 font-bold uppercase block mb-1">
                  Stufe 1: Gerüchte &amp; Mythen (Allgemein bekannt)
                </label>
                <AutoExpandingTextarea
                  value={editForm.secretsStage1 || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, secretsStage1: e.target.value }))}
                  placeholder="Populäre Geschichten, Volkssagen oder Gerüchte über die Rasse..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-purple-400/90 font-bold uppercase block mb-1">
                  Stufe 2: Gelehrtenwissen &amp; Indizien (Eingeweiht)
                </label>
                <AutoExpandingTextarea
                  value={editForm.secretsStage2 || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }))}
                  placeholder="Dokumentierte archäologische Funde, alte Schriften oder vertrauliche Berichte..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[55px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-purple-400/90 font-bold uppercase block mb-1">
                  Stufe 3: Die absolute Wahrheit (Verborgener Ursprung)
                </label>
                <AutoExpandingTextarea
                  value={editForm.secretsStage3 || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, secretsStage3: e.target.value }))}
                  placeholder="Die wahre, verborgene Entstehung, göttliche Intervention oder dunkle Verbindung..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 min-h-[55px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Abbrechen
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!editForm.title?.trim() || !editForm.description?.trim()}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/20 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          <span>{isEditing ? 'Rasse aktualisieren' : 'Im Codex speichern'}</span>
        </button>
      </div>
    </div>
  );
};
