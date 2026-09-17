import React, { useState } from 'react';
import { 
  Users, 
  User, 
  Plus, 
  RefreshCw, 
  BookOpen, 
  Briefcase, 
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { EconomyHolding, EconomyRole, LoreEntry, NPC, WorldSetting } from '../../types';
import { HOLDING_TYPES, getDefaultJobPositionsForHoldingType } from './EconomyPresets';
import { syncHoldingRolesFromLoreMembers } from '../../lib/economySync';
import { HoldingRoleCard } from './HoldingRoleCard';
import { getBranchInfoForRole } from './professionBranchService';

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
  loreDatabase = [],
  npcs = [],
  onUpdateHolding,
  onAddCodexEntry
}) => {
  // Accordion state: Track expanded state of individual roles
  const [expandedRoleIds, setExpandedRoleIds] = useState<Record<string, boolean>>({});

  const roles = Array.isArray(holding.roles) ? holding.roles : [];
  const legacyStaffGroups = Array.isArray(holding.staffGroups) ? holding.staffGroups : [];
  const safeLoreDatabase = Array.isArray(loreDatabase) ? loreDatabase : [];
  const safeNpcs = Array.isArray(npcs) ? npcs : [];

  // Statistics
  const assignedCodexCount = roles.filter(r => {
    const name = (r.assignedToName || '').trim().toLowerCase();
    return name && name !== 'spieler' && safeLoreDatabase.some(l => 
      ((l.category as string) === 'Charaktere' || (l.category as string) === 'Gegner' || (l.category as string) === 'Akteure' || (l.category as string) === 'Fraktionen') && 
      l.title && l.title.trim().toLowerCase() === name
    );
  }).length;

  const noNameCount = roles.filter(r => !(r.assignedToName || '').trim()).length;
  const assignedOtherCount = roles.length - assignedCodexCount - noNameCount;

  // Label for holding type
  const typePreset = HOLDING_TYPES.find(t => t.type === holding.type);
  const holdingTypeLabel = typePreset?.label || holding.type;

  // Add a new role
  const handleAddRole = () => {
    const newId = `role-${Date.now()}`;
    const branchInfo = getBranchInfoForRole('Allrounder / Gehilfe', holding.type);
    
    const newRole: EconomyRole = {
      id: newId,
      name: 'Allrounder / Gehilfe',
      assignedToName: '',
      authorities: ['Tagesgeschäft leiten'],
      responsibilities: branchInfo.suggestedDuties,
      salary: 15,
      workplaceArea: 'Betrieb',
      professionField: branchInfo.fieldName,
      professionBranch: branchInfo.branchName,
      competencies: branchInfo.suggestedCompetencies,
      talents: branchInfo.suggestedTalents,
      experienceYears: branchInfo.defaultExperienceYears,
      practiceHours: branchInfo.defaultPracticeHours,
      experiencePoints: branchInfo.defaultXp,
      progressPercent: branchInfo.defaultProgressPercent
    };

    const updated = [...roles, newRole];
    onUpdateHolding(holding.id, { roles: updated, staffCount: updated.length });
    setExpandedRoleIds(prev => ({ ...prev, [newId]: true }));
  };

  // Update an existing role
  const handleUpdateRole = (idx: number, updates: Partial<EconomyRole>) => {
    const updated = [...roles];
    const oldRole = updated[idx];
    const newRole = { ...oldRole, ...updates };
    updated[idx] = newRole;

    onUpdateHolding(holding.id, { roles: updated, staffCount: updated.length });

    // Sync title to Codex entry if linked
    const assignedName = (newRole.assignedToName || '').trim().toLowerCase();
    const newRoleTitle = (newRole.name || '').trim();

    if (assignedName && newRoleTitle && newRoleTitle !== 'Freie Stelle' && onAddCodexEntry) {
      const existingLoreChar = loreDatabase.find(l =>
        ((l.category as string) === 'Charaktere' || (l.category as string) === 'Gegner' || (l.category as string) === 'Akteure') &&
        ((newRole.assignedCharacterId && l.id === newRole.assignedCharacterId) || (l.title && l.title.trim().toLowerCase() === assignedName))
      );

      if (existingLoreChar) {
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

  // Remove a role
  const handleRemoveRole = (idx: number) => {
    const updated = roles.filter((_, i) => i !== idx);
    onUpdateHolding(holding.id, { roles: updated, staffCount: updated.length });
  };

  // Load default positions for holding type & physicalSize
  const handleLoadDefaultPositions = () => {
    const defaultPositions = getDefaultJobPositionsForHoldingType(
      holding.type, 
      holding.physicalSize || 'Mittel'
    );

    if (roles.length > 0) {
      if (!confirm(`Möchtest du die ${defaultPositions.length} Standard-Stellen für ${holdingTypeLabel} (${holding.physicalSize || 'Mittel'}) laden? Bereits vorhandene Stellen bleiben erhalten.`)) {
        return;
      }
    }

    const newRoles: EconomyRole[] = defaultPositions.map((pos, i) => {
      const branchInfo = getBranchInfoForRole(pos.name, holding.type);
      return {
        id: `role-preset-${Date.now()}-${i}`,
        name: pos.name,
        assignedToName: '',
        workplaceArea: pos.workplaceArea,
        salary: pos.salary,
        responsibilities: pos.responsibilities || branchInfo.suggestedDuties,
        authorities: pos.authorities || ['Tagesgeschäft leiten'],
        professionField: branchInfo.fieldName,
        professionBranch: branchInfo.branchName,
        competencies: branchInfo.suggestedCompetencies,
        talents: branchInfo.suggestedTalents,
        experienceYears: branchInfo.defaultExperienceYears,
        practiceHours: branchInfo.defaultPracticeHours,
        experiencePoints: branchInfo.defaultXp,
        progressPercent: branchInfo.defaultProgressPercent
      };
    });

    const updated = [...roles, ...newRoles];
    onUpdateHolding(holding.id, { roles: updated, staffCount: updated.length });
  };

  // Sync with lore database
  const handleSyncWithLore = () => {
    const { updatedRoles } = syncHoldingRolesFromLoreMembers(holding, loreDatabase);
    onUpdateHolding(holding.id, { roles: updatedRoles, staffCount: updatedRoles.length });
  };

  const toggleRoleExpand = (roleKey: string) => {
    setExpandedRoleIds(prev => ({
      ...prev,
      [roleKey]: !prev[roleKey]
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. STATUS & ÜBERSICHT */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Benötigte Stellen & Berufe ({holdingTypeLabel})
            </h3>
            <p className="text-xs text-slate-400">
              Gebäudegröße: <strong className="text-amber-300">{holding.physicalSize || 'Mittel'}</strong> • Berufe sind vorgegeben und direkt mit Aufgaben, Fachkompetenzen & Berufszweigen verknüpft.
            </p>
          </div>
        </div>

        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Gesamt:</span>
            <span className="font-mono font-bold text-white">{roles.length}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-200">Codex:</span>
            <span className="font-mono font-bold text-indigo-300">{assignedCodexCount}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">No-Name:</span>
            <span className="font-mono font-bold text-slate-300">{noNameCount}</span>
          </div>

          {assignedOtherCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-sky-950/40 border border-sky-800/40 flex items-center gap-2 text-xs">
              <span className="text-sky-300">Andere:</span>
              <span className="font-mono font-bold text-sky-200">{assignedOtherCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddRole}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Stelle hinzufügen</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDefaultPositions}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
            title="Lädt die für diese Betriebsart und Gebäudegröße typischen Stellen"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Stellen nach Betriebsgröße ({holding.physicalSize || 'Mittel'}) laden</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSyncWithLore}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer"
          title="Gleicht Positionen mit bestehenden Codex-Charakteren der Fraktion ab"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Codex-Sync</span>
        </button>
      </div>

      {/* 3. ROLES LIST */}
      {roles.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-4 bg-slate-950/40">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Noch keine Stellen eingerichtet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Für ein {holdingTypeLabel} ({holding.physicalSize || 'Mittel'}) können typische Arbeitsplätze und Aufgaben automatisch geladen werden.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleLoadDefaultPositions}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Standard-Stellen für {holding.physicalSize || 'Mittel'} laden</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role, idx) => {
            const roleKey = role.id || `role-${idx}`;
            const isExpanded = !!expandedRoleIds[roleKey];

            return (
              <HoldingRoleCard
                key={roleKey}
                role={role}
                index={idx}
                holdingType={holding.type}
                loreDatabase={safeLoreDatabase}
                npcs={safeNpcs}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleRoleExpand(roleKey)}
                onUpdate={(updates) => handleUpdateRole(idx, updates)}
                onRemove={() => handleRemoveRole(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
