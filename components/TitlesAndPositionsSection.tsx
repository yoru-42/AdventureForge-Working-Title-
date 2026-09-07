import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SocialTitleState, OfficeState, PositionState } from '../types';
import { ACQUISITION_METHODS, SOCIAL_TITLE_TYPES } from '../services/positionService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { Plus, Trash2, Edit3, Shield, Award, Landmark, Check, X, Info } from 'lucide-react';

interface TitlesAndPositionsSectionProps {
  socialTitles?: SocialTitleState[];
  offices?: OfficeState[];
  positions?: PositionState[];
  onChangeSocialTitles: (titles: SocialTitleState[]) => void;
  onChangeOffices: (offices: OfficeState[]) => void;
  onChangePositions: (positions: PositionState[]) => void;
}

export const TitlesAndPositionsSection: React.FC<TitlesAndPositionsSectionProps> = ({
  socialTitles = [],
  offices = [],
  positions = [],
  onChangeSocialTitles,
  onChangeOffices,
  onChangePositions
}) => {
  // Modal states for creating / editing
  const [editingTitle, setEditingTitle] = useState<SocialTitleState | null>(null);
  const [isAddingTitle, setIsAddingTitle] = useState(false);

  const [editingOffice, setEditingOffice] = useState<OfficeState | null>(null);
  const [isAddingOffice, setIsAddingOffice] = useState(false);

  const [editingPosition, setEditingPosition] = useState<PositionState | null>(null);
  const [isAddingPosition, setIsAddingPosition] = useState(false);

  // Lock body scroll while any modal is open
  useEffect(() => {
    const isAnyModalOpen = editingTitle !== null || editingOffice !== null || editingPosition !== null;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [editingTitle, editingOffice, editingPosition]);

  // Social Title Handlers
  const handleSaveTitle = (title: SocialTitleState) => {
    if (!title.title.trim()) return;
    const current = [...socialTitles];
    const idx = current.findIndex(t => t.id === title.id);
    if (idx > -1) {
      current[idx] = title;
    } else {
      current.push(title);
    }
    onChangeSocialTitles(current);
    setEditingTitle(null);
    setIsAddingTitle(false);
  };

  const handleDeleteTitle = (id: string) => {
    onChangeSocialTitles(socialTitles.filter(t => t.id !== id));
  };

  // Office Handlers
  const handleSaveOffice = (office: OfficeState) => {
    if (!office.name.trim()) return;
    const current = [...offices];
    const idx = current.findIndex(o => o.id === office.id);
    if (idx > -1) {
      current[idx] = office;
    } else {
      current.push(office);
    }
    onChangeOffices(current);
    setEditingOffice(null);
    setIsAddingOffice(false);
  };

  const handleDeleteOffice = (id: string) => {
    onChangeOffices(offices.filter(o => o.id !== id));
  };

  // Position Handlers
  const handleSavePosition = (pos: PositionState) => {
    if (!pos.title.trim()) return;
    const current = [...positions];
    const idx = current.findIndex(p => p.id === pos.id);
    if (idx > -1) {
      current[idx] = pos;
    } else {
      current.push(pos);
    }
    onChangePositions(current);
    setEditingPosition(null);
    setIsAddingPosition(false);
  };

  const handleDeletePosition = (id: string) => {
    onChangePositions(positions.filter(p => p.id !== id));
  };

  return (
    <div id="titles-and-positions-container" className="flex flex-col gap-6">
      {/* Informational Banner */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <span className="font-semibold text-white">
            Systemische Trennung von Berufen, Titeln und Positionen:
          </span>
          <p className="text-slate-400">
            Adelstitel, Ämter und aktuelle Führungsrollen sind eigenständige gesellschaftliche Ebenen. Sie beeinflussen das Ansehen in der Spielwelt, verändern jedoch nicht automatisch die handwerklichen oder nautischen Fachkompetenzen eines Charakters.
          </p>
        </div>
      </div>

      {/* 1. ADELSTITEL & GESELLSCHAFTLICHE TITEL */}
      <div id="section-social-titles" className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Adelstitel & Gesellschaftliche Titel
            </h4>
          </div>
          <button
            type="button"
            id="add-social-title-btn"
            onClick={() => {
              setEditingTitle({
                id: `title_${Date.now()}`,
                title: '',
                titleType: 'nobility',
                inherited: false,
                reason: ''
              });
              setIsAddingTitle(true);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Titel hinzufügen</span>
          </button>
        </div>

        {socialTitles.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-950/20 rounded-lg border border-dashed border-slate-800">
            Keine gesellschaftlichen Titel oder Adelstitel hinterlegt.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {socialTitles.map(title => (
              <div
                key={title.id}
                id={`social-title-card-${title.id}`}
                className="p-3 bg-slate-950/40 border border-slate-800/70 rounded-xl flex items-start justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {title.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {SOCIAL_TITLE_TYPES[title.titleType || 'nobility'] || title.titleType}
                    </span>
                    {title.inherited && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60">
                        Geerbt
                      </span>
                    )}
                  </div>
                  {title.grantedBy && (
                    <span className="text-[11px] text-slate-400">
                      Verliehen durch: <strong className="text-slate-300 font-medium">{title.grantedBy}</strong>
                    </span>
                  )}
                  {title.reason && (
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {title.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    id={`edit-social-title-${title.id}`}
                    onClick={() => {
                      setEditingTitle({ ...title });
                      setIsAddingTitle(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Bearbeiten"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id={`delete-social-title-${title.id}`}
                    onClick={() => handleDeleteTitle(title.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Entfernen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ÄMTER */}
      <div id="section-offices" className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Offizielle Ämter & Funktionen
            </h4>
          </div>
          <button
            type="button"
            id="add-office-btn"
            onClick={() => {
              setEditingOffice({
                id: `off_${Date.now()}`,
                name: '',
                institution: '',
                appointedBy: '',
                term: '',
                description: ''
              });
              setIsAddingOffice(true);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Amt hinzufügen</span>
          </button>
        </div>

        {offices.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-950/20 rounded-lg border border-dashed border-slate-800">
            Keine offiziellen Ämter hinterlegt.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {offices.map(office => (
              <div
                key={office.id}
                id={`office-card-${office.id}`}
                className="p-3 bg-slate-950/40 border border-slate-800/70 rounded-xl flex items-start justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {office.name}
                    </span>
                    {office.institution && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-800/60">
                        {office.institution}
                      </span>
                    )}
                    {office.term && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Amtszeit: {office.term}
                      </span>
                    )}
                  </div>
                  {office.appointedBy && (
                    <span className="text-[11px] text-slate-400">
                      Ernannt durch: <strong className="text-slate-300 font-medium">{office.appointedBy}</strong>
                    </span>
                  )}
                  {office.description && (
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {office.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    id={`edit-office-${office.id}`}
                    onClick={() => {
                      setEditingOffice({ ...office });
                      setIsAddingOffice(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Bearbeiten"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id={`delete-office-${office.id}`}
                    onClick={() => handleDeleteOffice(office.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Entfernen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. AKTUELLE POSITIONEN & ROLLEN */}
      <div id="section-positions" className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Aktuelle Positionen & Rollen
            </h4>
          </div>
          <button
            type="button"
            id="add-position-btn"
            onClick={() => {
              setEditingPosition({
                id: `pos_${Date.now()}`,
                title: '',
                acquisitionMethod: 'appointment',
                voluntary: true,
                appointedBy: [],
                recognizedBy: [],
                reason: ''
              });
              setIsAddingPosition(true);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Position hinzufügen</span>
          </button>
        </div>

        {positions.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-950/20 rounded-lg border border-dashed border-slate-800">
            Keine spezifischen Positionen oder Rollen erfasst.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {positions.map(pos => {
              const methodLabel = ACQUISITION_METHODS[pos.acquisitionMethod] || pos.acquisitionMethod;
              return (
                <div
                  key={pos.id}
                  id={`position-card-${pos.id}`}
                  className="p-3.5 bg-slate-950/40 border border-slate-800/70 rounded-xl flex items-start justify-between gap-3"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {pos.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 font-medium">
                        {methodLabel}
                      </span>
                      {pos.voluntary === false ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60">
                          Pflichtübernahme / Zwang
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Freiwillig
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                      {pos.appointedBy && pos.appointedBy.length > 0 && (
                        <span>
                          Ernannt durch: <strong className="text-slate-300 font-medium">{pos.appointedBy.join(', ')}</strong>
                        </span>
                      )}
                      {pos.recognizedBy && pos.recognizedBy.length > 0 && (
                        <span>
                          Anerkannt von: <strong className="text-slate-300 font-medium">{pos.recognizedBy.join(', ')}</strong>
                        </span>
                      )}
                    </div>

                    {pos.reason && (
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {pos.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      id={`edit-position-${pos.id}`}
                      onClick={() => {
                        setEditingPosition({ ...pos });
                        setIsAddingPosition(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Bearbeiten"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`delete-position-${pos.id}`}
                      onClick={() => handleDeletePosition(pos.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: EDIT / ADD SOCIAL TITLE */}
      {editingTitle && typeof document !== 'undefined' && createPortal(
        <div
          id="social-title-modal"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingTitle(null);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isAddingTitle ? 'Gesellschaftlichen Titel anlegen' : 'Titel bearbeiten'}
              </h3>
              <button
                type="button"
                id="close-title-modal-btn"
                onClick={() => setEditingTitle(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Titelbezeichnung</label>
                <input
                  type="text"
                  id="title-input-name"
                  value={editingTitle.title}
                  onChange={e => setEditingTitle({ ...editingTitle, title: e.target.value })}
                  placeholder="z.B. Baron, Graf von Falkenstein, Ritter"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Titelart</label>
                <select
                  id="title-select-type"
                  value={editingTitle.titleType || 'nobility'}
                  onChange={e => setEditingTitle({ ...editingTitle, titleType: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="nobility">Adelstitel</option>
                  <option value="honorary">Ehrentitel</option>
                  <option value="civic">Bürgerlicher Titel</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="title-checkbox-inherited"
                  checked={Boolean(editingTitle.inherited)}
                  onChange={e => setEditingTitle({ ...editingTitle, inherited: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="title-checkbox-inherited" className="text-xs text-slate-300 cursor-pointer">
                  Erbliche Übertragung (geerbt)
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Verliehen durch (optional)</label>
                <input
                  type="text"
                  id="title-input-grantedby"
                  value={editingTitle.grantedBy || ''}
                  onChange={e => setEditingTitle({ ...editingTitle, grantedBy: e.target.value })}
                  placeholder="z.B. König Aldor, Magistrat"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Begründung / Herkunft (optional)</label>
                <AutoExpandingTextarea
                  id="title-textarea-reason"
                  value={editingTitle.reason || ''}
                  onChange={e => setEditingTitle({ ...editingTitle, reason: e.target.value })}
                  placeholder="Anlass der Verleihung oder geschichtlicher Hintergrund..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                id="cancel-title-modal-btn"
                onClick={() => setEditingTitle(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                id="save-title-modal-btn"
                onClick={() => handleSaveTitle(editingTitle)}
                disabled={!editingTitle.title.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: EDIT / ADD OFFICE */}
      {editingOffice && typeof document !== 'undefined' && createPortal(
        <div
          id="office-modal"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingOffice(null);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isAddingOffice ? 'Amt hinzufügen' : 'Amt bearbeiten'}
              </h3>
              <button
                type="button"
                id="close-office-modal-btn"
                onClick={() => setEditingOffice(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Amtsbezeichnung</label>
                <input
                  type="text"
                  id="office-input-name"
                  value={editingOffice.name}
                  onChange={e => setEditingOffice({ ...editingOffice, name: e.target.value })}
                  placeholder="z.B. Bürgermeister, Richter, Gildenmeister"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Institution / Körperschaft</label>
                <input
                  type="text"
                  id="office-input-institution"
                  value={editingOffice.institution || ''}
                  onChange={e => setEditingOffice({ ...editingOffice, institution: e.target.value })}
                  placeholder="z.B. Stadtrat, Handelsgilde, Königshof"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Amtszeit / Dauer (optional)</label>
                <input
                  type="text"
                  id="office-input-term"
                  value={editingOffice.term || ''}
                  onChange={e => setEditingOffice({ ...editingOffice, term: e.target.value })}
                  placeholder="z.B. Auf Lebenszeit, 3 Jahre, Bis zur nächsten Wahl"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Ernannt durch (optional)</label>
                <input
                  type="text"
                  id="office-input-appointedby"
                  value={editingOffice.appointedBy || ''}
                  onChange={e => setEditingOffice({ ...editingOffice, appointedBy: e.target.value })}
                  placeholder="z.B. Bürgerschaft, Senat"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Zuständigkeiten / Beschreibung (optional)</label>
                <AutoExpandingTextarea
                  id="office-textarea-desc"
                  value={editingOffice.description || ''}
                  onChange={e => setEditingOffice({ ...editingOffice, description: e.target.value })}
                  placeholder="Aufgabenbereich, Vollmachten und Pflichten..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                id="cancel-office-modal-btn"
                onClick={() => setEditingOffice(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                id="save-office-modal-btn"
                onClick={() => handleSaveOffice(editingOffice)}
                disabled={!editingOffice.name.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: EDIT / ADD POSITION */}
      {editingPosition && typeof document !== 'undefined' && createPortal(
        <div
          id="position-modal"
          onClick={e => {
            if (e.target === e.currentTarget) setEditingPosition(null);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isAddingPosition ? 'Neue Position / Führungsrolle anlegen' : 'Position bearbeiten'}
              </h3>
              <button
                type="button"
                id="close-position-modal-btn"
                onClick={() => setEditingPosition(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Positionsbezeichnung</label>
                <input
                  type="text"
                  id="position-input-title"
                  value={editingPosition.title}
                  onChange={e => setEditingPosition({ ...editingPosition, title: e.target.value })}
                  placeholder="z.B. Kapitän der 'Morgenstern', Hauptmann der Stadtwache"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Erwerbsart der Position</label>
                <select
                  id="position-select-method"
                  value={editingPosition.acquisitionMethod}
                  onChange={e => setEditingPosition({ ...editingPosition, acquisitionMethod: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Object.entries(ACQUISITION_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="position-voluntary"
                    checked={editingPosition.voluntary !== false}
                    onChange={() => setEditingPosition({ ...editingPosition, voluntary: true })}
                    className="border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Freiwillig übernommen</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="position-voluntary"
                    checked={editingPosition.voluntary === false}
                    onChange={() => setEditingPosition({ ...editingPosition, voluntary: false })}
                    className="border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Pflichtübernahme / Zwang</span>
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Ernannt durch (Komma-getrennt)</label>
                <input
                  type="text"
                  id="position-input-appointedby"
                  value={(editingPosition.appointedBy || []).join(', ')}
                  onChange={e =>
                    setEditingPosition({
                      ...editingPosition,
                      appointedBy: e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder="z.B. Stadtrat, Admiralität, Oberbefehlshaber"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Anerkannt von (Komma-getrennt)</label>
                <input
                  type="text"
                  id="position-input-recognizedby"
                  value={(editingPosition.recognizedBy || []).join(', ')}
                  onChange={e =>
                    setEditingPosition({
                      ...editingPosition,
                      recognizedBy: e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder="z.B. Besatzung der Morgenstern, Gardisten"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Begründung / Kontext</label>
                <AutoExpandingTextarea
                  id="position-textarea-reason"
                  value={editingPosition.reason || ''}
                  onChange={e => setEditingPosition({ ...editingPosition, reason: e.target.value })}
                  placeholder="z.B. Nach dem Tod des Kapitäns im Sturm von der Mannschaft einstimmig gebeten, das Kommando zu führen..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 min-h-[65px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                id="cancel-position-modal-btn"
                onClick={() => setEditingPosition(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                id="save-position-modal-btn"
                onClick={() => handleSavePosition(editingPosition)}
                disabled={!editingPosition.title.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
