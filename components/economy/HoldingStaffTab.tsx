import React, { useState } from 'react';
import { EconomyHolding, EconomyRole, EconomyStaffGroup, LoreEntry, NPC, WorldSetting } from '../../types';
import { STANDARD_AUTHORITIES } from './EconomyPresets';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import ProfessionSelect from '../ProfessionSelect';
import CharacterAssigneeSelect from '../CharacterAssigneeSelect';
import { upgradeNamelessStaffToCharacter } from '../../services/geminiService';
import { syncHoldingRolesFromLoreMembers } from '../../lib/economySync';

interface HoldingStaffTabProps {
  holding: EconomyHolding;
  world: WorldSetting;
  loreDatabase: LoreEntry[];
  npcs: NPC[];
  onUpdateHolding: (id: string, updates: Partial<EconomyHolding>) => void;
  onAddCodexEntry?: (entry: LoreEntry) => void;
}

export const HoldingStaffTab: React.FC<HoldingStaffTabProps> = ({
  holding,
  world,
  loreDatabase,
  npcs,
  onUpdateHolding,
  onAddCodexEntry
}) => {
  const [upgradingGroup, setUpgradingGroup] = useState<EconomyStaffGroup | null>(null);
  const [characterNameSuggestion, setCharacterNameSuggestion] = useState('');
  const [upgradeFocusPrompt, setUpgradeFocusPrompt] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<any | null>(null);

  // --- Handlers for Roles ---
  const handleSyncRolesFromFaction = () => {
    const { updatedRoles } = syncHoldingRolesFromLoreMembers(holding, loreDatabase);
    onUpdateHolding(holding.id, { roles: updatedRoles });
  };

  const handleAddRole = () => {
    const newRole: EconomyRole = {
      id: `role-${Date.now()}`,
      name: 'Neue Position',
      assignedToName: '',
      authorities: ['Tagesgeschäft leiten'],
      responsibilities: ['Tagesaufgaben koordinieren'],
      salary: 15,
      workplaceArea: 'Hauptbereich'
    };
    onUpdateHolding(holding.id, { roles: [...(holding.roles || []), newRole] });
  };

  const handleUpdateRole = (idx: number, updates: Partial<EconomyRole>) => {
    const updated = [...(holding.roles || [])];
    const oldRole = updated[idx];
    const newRole = { ...oldRole, ...updates };
    updated[idx] = newRole;

    onUpdateHolding(holding.id, { roles: updated });

    // Immediate Codex character sync if role name or assignee changed
    const assignedName = (newRole.assignedToName || '').trim().toLowerCase();
    const newRoleTitle = (newRole.name || '').trim();

    if (assignedName && newRoleTitle && newRoleTitle !== 'Mitarbeiter' && newRoleTitle !== 'Mitglied' && newRoleTitle !== 'Neue Position') {
      const existingLoreChar = loreDatabase.find(l =>
        (l.category === 'Charaktere' || l.category === 'Gegner') &&
        ((newRole.assignedCharacterId && l.id === newRole.assignedCharacterId) || (l.title && l.title.trim().toLowerCase() === assignedName))
      );

      if (existingLoreChar && onAddCodexEntry) {
        const currentDetails = existingLoreChar.details || {};
        if (currentDetails.role !== newRoleTitle || currentDetails.profession !== newRoleTitle) {
          onAddCodexEntry({
            ...existingLoreChar,
            details: {
              ...currentDetails,
              role: newRoleTitle,
              profession: newRoleTitle,
              jobTitle: newRoleTitle
            }
          });
        }
      }
    }
  };

  const handleRemoveRole = (idx: number) => {
    const updated = (holding.roles || []).filter((_, i) => i !== idx);
    onUpdateHolding(holding.id, { roles: updated });
  };

  const handleToggleRoleAuthority = (idx: number, auth: string) => {
    const current = holding.roles?.[idx]?.authorities || [];
    const updatedAuths = current.includes(auth) ? current.filter(a => a !== auth) : [...current, auth];
    handleUpdateRole(idx, { authorities: updatedAuths });
  };

  // --- Handlers for Staff Groups ---
  const handleAddStaffGroup = () => {
    const newGroup: EconomyStaffGroup = {
      id: `sg-${Date.now()}`,
      roleName: 'Hilfskräfte / Personal',
      count: 4,
      workplaceArea: 'Betriebsgelände',
      duties: ['Tägliche Routinearbeiten', 'Aufräumen & Instandhaltung'],
      status: 'aktiv',
      dailyCostPerUnit: 2
    };
    onUpdateHolding(holding.id, { staffGroups: [...(holding.staffGroups || []), newGroup] });
  };

  const handleUpdateStaffGroup = (id: string, updates: Partial<EconomyStaffGroup>) => {
    const updated = (holding.staffGroups || []).map(sg => sg.id === id ? { ...sg, ...updates } : sg);
    onUpdateHolding(holding.id, { staffGroups: updated });
  };

  const handleRemoveStaffGroup = (id: string) => {
    const updated = (holding.staffGroups || []).filter(sg => sg.id !== id);
    onUpdateHolding(holding.id, { staffGroups: updated });
  };

  // --- AI / Direct Promotion to Character ---
  const handleStartUpgrade = (group: EconomyStaffGroup) => {
    setUpgradingGroup(group);
    setCharacterNameSuggestion('');
    setUpgradeFocusPrompt('');
    setPromotionResult(null);
  };

  const handleExecuteUpgrade = async () => {
    if (!upgradingGroup) return;
    setIsPromoting(true);
    try {
      const generated = await upgradeNamelessStaffToCharacter(
        {
          roleName: upgradingGroup.roleName,
          workplaceArea: upgradingGroup.workplaceArea,
          duties: upgradingGroup.duties,
          holdingName: holding.name,
          holdingType: holding.type
        },
        world
      );

      setPromotionResult(generated);

      // Also add as named role if desired
      const newNamedRole: EconomyRole = {
        id: `role-${Date.now()}`,
        name: `${generated.role || upgradingGroup.roleName} (Hauptkraft)`,
        assignedToName: generated.name,
        responsibilities: [upgradingGroup.roleName || 'Aufgaben im Betrieb'],
        salary: (upgradingGroup.dailyCostPerUnit || 2) * 5,
        workplaceArea: upgradingGroup.workplaceArea,
        authorities: ['Tagesgeschäft leiten']
      };

      // Reduce group count if count > 1
      let updatedGroups = holding.staffGroups || [];
      if (upgradingGroup.count > 1) {
        updatedGroups = updatedGroups.map(sg => sg.id === upgradingGroup.id ? { ...sg, count: sg.count - 1 } : sg);
      }

      onUpdateHolding(holding.id, {
        roles: [...(holding.roles || []), newNamedRole],
        staffGroups: updatedGroups
      });

      // If callback to add codex entry is provided, add it
      if (onAddCodexEntry) {
        const newLore: LoreEntry = {
          id: `lore-char-${Date.now()}`,
          title: generated.name,
          category: 'Charaktere',
          description: `Rolle: ${generated.role}\nRasse: ${generated.race}, Alter: ${generated.age}\n\nPersönlichkeit: ${generated.personality}\n\nBiografie: ${generated.bio}\n\nEigenart / Geheimnis: ${generated.quirk} / ${generated.secrets}`,
          isUnlocked: true
        };
        onAddCodexEntry(newLore);
      }
    } catch (err) {
      console.error('Upgrade to character failed:', err);
    } finally {
      setIsPromoting(false);
    }
  };

  const roles = holding.roles || [];
  const staffGroups = holding.staffGroups || [];
  const totalStaffCount = roles.length + staffGroups.reduce((acc, g) => acc + (g.count || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner with Stats */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-users text-indigo-400"></i> Belegschaft & Personalübersicht
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Insgesamt <strong className="text-white font-mono">{totalStaffCount} Personen</strong> beschäftigt ({roles.length} Führungskräfte/Einzelrollen, {staffGroups.reduce((a, g) => a + (g.count || 0), 0)} in Gruppen).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddRole}
            className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-xl text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer"
          >
            + Führungskraft / Einzelrolle
          </button>
          <button
            type="button"
            onClick={handleAddStaffGroup}
            className="px-3 py-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold border border-amber-500/30 transition-all cursor-pointer"
          >
            + Personalgruppe (Mägde, Wachen...)
          </button>
        </div>
      </div>

      {/* SECTION 1: NAMENTLICHE ROLLEN & FÜHRUNGSKRÄFTE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-user-tie"></i> 1. Namentliche Positionen & Führungskräfte ({roles.length})
          </h5>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncRolesFromFaction}
              className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Mitglieder aus Fraktion/Codex in Führungskräfte übernehmen"
            >
              <i className="fa-solid fa-rotate text-[11px]"></i>
              <span>Aus Fraktion/Codex synchronisieren</span>
            </button>
            <button
              type="button"
              onClick={handleAddRole}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <i className="fa-solid fa-plus text-[11px]"></i>
              <span>Führungskraft</span>
            </button>
          </div>
        </div>

        {/* Datalist with Codex & Faction Member names for suggestions */}
        <datalist id={`holding-members-${holding.id}`}>
          {loreDatabase
            .filter(l => l.category === 'Charaktere' || l.category === 'Gegner' || l.category === 'Fraktionen')
            .map(l => (
              <option key={l.id} value={l.title} />
            ))}
        </datalist>

        {roles.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400">
            Keine Einzelpositionen oder Führungskräfte eingetragen.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role, idx) => (
              <div key={role.id || idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Position #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(idx)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs cursor-pointer shrink-0 transition flex items-center gap-1"
                    title="Position löschen"
                  >
                    <i className="fa-solid fa-trash"></i> Löschen
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Rolle / Titel</label>
                    <ProfessionSelect
                      value={role.name || ''}
                      onChange={val => handleUpdateRole(idx, { name: val })}
                      placeholder="Rolle oder Titel wählen..."
                      showNobleChildrenButton={false}
                      selectClassName="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-amber-500 transition"
                      inputClassName="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Besetzt durch</label>
                    <CharacterAssigneeSelect
                      value={role.assignedToName || ''}
                      onChange={val => handleUpdateRole(idx, { assignedToName: val })}
                      loreDatabase={loreDatabase}
                      npcs={npcs}
                      holding={holding}
                      placeholder="Person auswählen oder eintragen..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Arbeitsbereich</label>
                    <input
                      type="text"
                      value={role.workplaceArea || ''}
                      onChange={e => handleUpdateRole(idx, { workplaceArea: e.target.value })}
                      placeholder="Räumlichkeit oder Einsatzort"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Vorgesetzter</label>
                    <input
                      type="text"
                      value={role.superiorRole || ''}
                      onChange={e => handleUpdateRole(idx, { superiorRole: e.target.value })}
                      placeholder="Vorgesetzte Instanz oder Rolle"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Gehalt / Lohn (Gold)</label>
                    <input
                      type="number"
                      value={role.salary || 0}
                      onChange={e => handleUpdateRole(idx, { salary: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Aufgaben & Pflichten</label>
                    <AutoExpandingTextarea
                      value={(role.responsibilities || []).join('\n')}
                      onChange={e => handleUpdateRole(idx, { responsibilities: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Aufgaben und Verantwortungsbereiche dieser Position (eine pro Zeile)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[44px]"
                    />
                  </div>

                  {/* Authorities selector */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Befugnisse & Weisungsrechte:</span>
                    <div className="flex flex-wrap gap-1">
                      {STANDARD_AUTHORITIES.slice(0, 6).map(auth => {
                        const has = (role.authorities || []).includes(auth);
                        return (
                          <button
                            key={auth}
                            type="button"
                            onClick={() => handleToggleRoleAuthority(idx, auth)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                              has ? 'bg-amber-950/30 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {auth}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: NAMENLOSE PERSONALDETAILS & PERSONALGRUPPEN */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div>
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-people-group"></i> 2. Namenlose Personalgruppen & Bedienstete ({staffGroups.length})
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gruppen von Bediensteten und Hilfskräften definieren. Mitglieder können bei Bedarf direkt zu Charakteren aufgewertet werden.
            </p>
          </div>
        </div>

        {staffGroups.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
            <p>Keine Personalgruppen angelegt.</p>
            <button
              type="button"
              onClick={handleAddStaffGroup}
              className="px-3 py-1.5 bg-amber-600/20 text-amber-300 rounded-xl text-xs font-bold"
            >
              + Standard-Personalgruppe anlegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffGroups.map((group, idx) => (
              <div key={group.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Personalgruppe #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartUpgrade(group)}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-600/30 to-indigo-600/30 hover:from-amber-600/50 hover:to-indigo-600/50 text-amber-200 border border-amber-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Einen Mitarbeiter dieser Gruppe zu einem vollen Codex-NSC aufwerten"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i> Aufwerten
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStaffGroup(group.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-xs cursor-pointer transition"
                      title="Gruppe entfernen"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Anzahl Personen</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={group.count ?? 1}
                      onChange={e => handleUpdateStaffGroup(group.id, { count: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-extrabold font-mono text-amber-300 outline-none focus:border-amber-500"
                      title="Anzahl Personen"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Beruf / Rolle der Gruppe</label>
                    <ProfessionSelect
                      value={group.roleName || ''}
                      onChange={val => handleUpdateStaffGroup(group.id, { roleName: val })}
                      placeholder="Beruf / Rolle der Gruppe wählen..."
                      selectClassName="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-amber-500 transition"
                      inputClassName="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-amber-500 transition"
                      showNobleChildrenButton={false}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Arbeitsbereich</label>
                    <input
                      type="text"
                      value={group.workplaceArea || ''}
                      onChange={e => handleUpdateStaffGroup(group.id, { workplaceArea: e.target.value })}
                      placeholder="Räumlichkeit oder Arbeitsbereich angeben"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Zuständiger Leiter</label>
                    <CharacterAssigneeSelect
                      value={group.assignedLeaderOrManager || ''}
                      onChange={val => handleUpdateStaffGroup(group.id, { assignedLeaderOrManager: val })}
                      loreDatabase={loreDatabase}
                      npcs={npcs}
                      holding={holding}
                      placeholder="Leiter wählen oder eintragen..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kosten / Tag / Kopf (Gold)</label>
                    <input
                      type="number"
                      value={group.dailyCostPerUnit || 2}
                      onChange={e => handleUpdateStaffGroup(group.id, { dailyCostPerUnit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Hauptaufgaben & Pflichten</label>
                    <AutoExpandingTextarea
                      value={(group.duties || []).join('\n')}
                      onChange={e => handleUpdateStaffGroup(group.id, { duties: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Aufgaben und Pflichten dieser Personalgruppe (eine pro Zeile)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL / DIALOG: UPGRADE TO CHARACTER */}
      {upgradingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-sparkles"></i> Personalmitglied zu vollem Charakter aufwerten
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aus der Gruppe <strong>"{upgradingGroup.roleName}"</strong> in {holding.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUpgradingGroup(null)}
                className="text-slate-400 hover:text-white p-2"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {promotionResult ? (
              <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl text-emerald-300">
                    <i className="fa-solid fa-user-check"></i>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">{promotionResult.name}</h5>
                    <span className="text-xs text-emerald-400 font-semibold">{promotionResult.occupation}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>Kurzbeschreibung:</strong> {promotionResult.brief}</p>
                  <p><strong>Persönlichkeit:</strong> {promotionResult.personality}</p>
                  <p><strong>Eigenart / Geheimnis:</strong> {promotionResult.secretOrQuirk}</p>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl text-xs text-emerald-300 border border-emerald-500/20">
                  Der Charakter wurde erfolgreich zu den Einzelrollen von {holding.name} hinzugefügt und im Codex registriert.
                </div>

                <button
                  type="button"
                  onClick={() => setUpgradingGroup(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fertigstellen & Schließen
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Die KI generiert einen widerspruchsfreien, detaillierten Charakter mit Name, Persönlichkeit, Arbeitsbereich und Geheimnis, der nahtlos in die Welt und diesen Betrieb passt.
                </p>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold block">Wunschnachname / Vorname (Optional)</label>
                  <input
                    type="text"
                    value={characterNameSuggestion}
                    onChange={e => setCharacterNameSuggestion(e.target.value)}
                    placeholder="Name eingeben oder leer lassen für automatischen Vorschlag"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold block">Besondere Vorgaben / Persönlichkeits-Fokus (Optional)</label>
                  <AutoExpandingTextarea
                    value={upgradeFocusPrompt}
                    onChange={e => setUpgradeFocusPrompt(e.target.value)}
                    placeholder="Vorgaben oder Persönlichkeitsmerkmale für den Charakter beschreiben..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUpgradingGroup(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteUpgrade}
                    disabled={isPromoting}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPromoting ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i> Erstelle Charakter...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-bolt"></i> Vollwertigen Charakter generieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
