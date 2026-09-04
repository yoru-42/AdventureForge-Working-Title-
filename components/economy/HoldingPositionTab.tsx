import React from 'react';
import { EconomyHolding, EconomyRole } from '../../types';
import { STANDARD_AUTHORITIES } from './EconomyPresets';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface HoldingPositionTabProps {
  holding: EconomyHolding;
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
}

export const HoldingPositionTab: React.FC<HoldingPositionTabProps> = ({
  holding,
  onUpdateHolding
}) => {
  const roles = holding.roles || [];
  const myRole = roles.find(r => r.isUserPosition || r.assignedToName?.toLowerCase().includes('spieler') || r.assignedToName?.toLowerCase().includes('user'));
  const superiorRole = myRole?.superiorRole ? roles.find(r => r.name === myRole.superiorRole) : null;
  const subordinateRoles = myRole ? roles.filter(r => r.superiorRole === myRole.name) : [];
  const myAuthorities = myRole?.authorities || [];

  const handleSetUserRole = (roleIndex: number) => {
    const updated = roles.map((r, idx) => ({
      ...r,
      isUserPosition: idx === roleIndex,
      assignedToName: idx === roleIndex ? 'Spieler' : (r.assignedToName === 'Spieler' ? '' : r.assignedToName)
    }));
    onUpdateHolding(holding.id, { roles: updated });
  };

  const handleUpdateMyRole = (updates: Partial<EconomyRole>) => {
    if (!myRole) return;
    const updated = roles.map(r => r.id === myRole.id || (r.isUserPosition && !r.id) ? { ...r, ...updates } : r);
    onUpdateHolding(holding.id, { roles: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Active User Position Header */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
              Spieler-Rolle in diesem Betrieb
            </span>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-user-shield text-amber-400"></i>
              {myRole ? myRole.name : 'Keine spezifische Rolle zugewiesen'}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Position wechseln:</span>
            <select
              value={roles.findIndex(r => r.isUserPosition)}
              onChange={e => {
                const idx = parseInt(e.target.value);
                if (idx >= 0) handleSetUserRole(idx);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold outline-none cursor-pointer focus:border-amber-500"
            >
              <option value="-1">(Keine Position)</option>
              {roles.map((r, idx) => (
                <option key={r.id || idx} value={idx}>{r.name} ({r.assignedToName || 'Unbesetzt'})</option>
              ))}
            </select>
          </div>
        </div>

        {myRole ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Arbeitsbereich / Aufenthaltsort</label>
              <input
                type="text"
                value={myRole.workplaceArea || ''}
                onChange={e => handleUpdateMyRole({ workplaceArea: e.target.value })}
                placeholder="Räumlichkeit oder Arbeitsbereich"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Direkter Vorgesetzter</label>
              <input
                type="text"
                value={myRole.superiorRole || ''}
                onChange={e => handleUpdateMyRole({ superiorRole: e.target.value })}
                placeholder="Rolle oder Person der nächsthöheren Instanz"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vergütung / Lohn</label>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 px-3">
                <input
                  type="number"
                  value={myRole.salary || 0}
                  onChange={e => handleUpdateMyRole({ salary: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xs text-amber-300 font-bold outline-none font-mono"
                />
                <span className="text-amber-400 text-xs font-bold">Gold</span>
              </div>
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Aufgaben & Verantwortungsbereiche</label>
              <AutoExpandingTextarea
                value={(myRole.responsibilities || []).join('\n')}
                onChange={e => handleUpdateMyRole({ responsibilities: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Tägliche Aufgaben, Pflichten und Arbeitsabläufe in dieser Rolle (eine Aufgabe pro Zeile)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 min-h-[50px]"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 rounded-xl text-xs text-slate-400 text-center">
            Du bist aktuell als externer Beobachter oder Gast eingetragen. Wähle oben eine Position oder erstelle im Tab "Jobs & Personal" eine neue Rolle.
          </div>
        )}
      </div>

      {/* Authorities Matrix */}
      {myRole && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-stamp text-emerald-400"></i> Meine Befugnisse & Handlungsrechte
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Befugnisse bestimmen, welche Entscheidungen du selbst treffen kannst, ohne bei Vorgesetzten rückfragen zu müssen.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {myAuthorities.length} von {STANDARD_AUTHORITIES.length} aktiv
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {STANDARD_AUTHORITIES.map(auth => {
              const has = myAuthorities.includes(auth);
              return (
                <button
                  key={auth}
                  type="button"
                  onClick={() => {
                    const newAuths = has
                      ? myAuthorities.filter(a => a !== auth)
                      : [...myAuthorities, auth];
                    handleUpdateMyRole({ authorities: newAuths });
                  }}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                    has
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>{auth}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${has ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-600'}`}>
                    {has ? 'Erlaubt' : 'Eskalieren'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hierarchy Overview (Superior & Subordinates) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Superior */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i className="fa-solid fa-arrow-up text-amber-400"></i> Vorgesetzte Instanz
          </span>
          {superiorRole ? (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <strong className="text-xs text-white block">{superiorRole.name}</strong>
                <span className="text-[10px] text-slate-400">Besetzt von: {superiorRole.assignedToName || 'Unbekannt'}</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                Eskalationskontakt
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 text-xs text-slate-400">
              Kein direkter Vorgesetzter eingetragen (Höchste Autorität im Betrieb).
            </div>
          )}
        </div>

        {/* Subordinates */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i className="fa-solid fa-arrow-down text-indigo-400"></i> Unterstellte Positionen ({subordinateRoles.length})
          </span>
          {subordinateRoles.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {subordinateRoles.map((sub, idx) => (
                <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{sub.name}</span>
                  <span className="text-[10px] text-slate-400">{sub.assignedToName || 'Unbesetzt'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 text-xs text-slate-400">
              Keine Positionen direkt unterstellt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
