import React, { useState, useEffect } from 'react';
import { 
  WorldSetting, 
  LoreEntry, 
  NPC, 
  EconomyHolding, 
  EconomyConfig,
  CombatState
} from '../types';
import { HOLDING_TYPES, getHoldingPresets } from './economy/EconomyPresets';
import { HoldingDetailsTab } from './economy/HoldingDetailsTab';
import { HoldingPositionTab } from './economy/HoldingPositionTab';
import { HoldingStaffTab } from './economy/HoldingStaffTab';
import { HoldingResourcesTab } from './economy/HoldingResourcesTab';
import { HoldingTasksTab } from './economy/HoldingTasksTab';
import { HoldingOrdersTab } from './economy/HoldingOrdersTab';
import { HoldingDecisionsTab } from './economy/HoldingDecisionsTab';
import { HoldingLogsTab } from './economy/HoldingLogsTab';
import { HoldingFinancesTab } from './economy/HoldingFinancesTab';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { smartFillEconomyHolding } from '../services/geminiService';
import * as LucideIcons from 'lucide-react';
import { syncEconomyWithWorld, createLoreEntryFromHolding, registerAllHoldingsInCodex } from '../lib/economySync';

import { TacticalManagementTab } from './economy/TacticalManagementTab';

const HoldingIcon = ({ icon, className = "" }: { icon: string; className?: string }) => {
  // If it's a known Lucide icon name
  const IconComponent = (LucideIcons as any)[icon];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  
  // Fallback to emoji if it's still one (though we try to avoid them) or a generic icon
  const isEmoji = /\p{Emoji}/u.test(icon);
  if (isEmoji) {
    return <span className={className}>{icon}</span>;
  }

  return <LucideIcons.Building2 className={className} />;
};

interface EconomyManagerProps {
  world: WorldSetting;
  setWorld: React.Dispatch<React.SetStateAction<WorldSetting>>;
  loreDatabase: LoreEntry[];
  npcs: NPC[];
  isGenerating?: boolean;
  onGenerateEconomy?: () => void;
  onAddCodexEntry?: (entry: LoreEntry) => void;
  onDeleteOrteEntries?: () => void;
  combatState?: CombatState;
  onUpdateCombatState?: (updates: Partial<CombatState>) => void;
}

export const EconomyManager: React.FC<EconomyManagerProps> = ({
  world,
  setWorld,
  loreDatabase,
  npcs,
  isGenerating = false,
  onGenerateEconomy,
  onAddCodexEntry,
  onDeleteOrteEntries,
  combatState,
  onUpdateCombatState
}) => {
  const [mainTab, setMainTab] = useState<'overview' | 'holdings' | 'resources' | 'finances' | 'tactical' | 'management'>('overview');
  const [filterOwner, setFilterOwner] = useState<'all' | 'user' | 'character' | 'faction'>('all');
  const [filterCodexOnly, setFilterCodexOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'details' | 'position' | 'staff' | 'resources' | 'tasks' | 'orders' | 'decisions' | 'logs' | 'finances'
  >('details');
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [isSupplementMode, setIsSupplementMode] = useState(true);
  const [smartFillPrompt, setSmartFillPrompt] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Initialize economyConfig if not present
  const economy: EconomyConfig = world.economyConfig || {
    currencyName: 'Goldmünzen',
    currencyIcon: '🪙',
    payoutInterval: 'weekly',
    allowPassiveIncome: true,
    enableRandomEvents: true,
    holdings: [
      {
        id: 'holding-default-taverne',
        name: 'Stammtaverne "Zum Seebären"',
        type: 'taverne',
        icon: 'Beer',
        description: 'Eine gut besuchte Hafen-Taverne mit treuen Stammgästen und regelmäßigen Gerüchten.',
        level: 1,
        ownerType: 'user',
        incomePerInterval: 180,
        upkeepPerInterval: 40,
        staffCount: 6,
        reputation: 60,
        status: 'active',
        locationName: 'Hafenviertel',
        upgrades: [
          { id: 'upg-1', name: 'Weinkeller-Erweiterung', cost: 300, levelRequired: 1, unlocked: false, description: '+60 Gold Einnahmen pro Woche' },
          { id: 'upg-2', name: 'Bühne für Barden', cost: 450, levelRequired: 2, unlocked: false, description: '+15 Ansehen & lockt seltene Questgeber an' }
        ],
        ...getHoldingPresets('taverne')
      }
    ]
  };

  const updateEconomyConfig = (updatedConfig: EconomyConfig) => {
    setWorld(prev => ({
      ...prev,
      economyConfig: updatedConfig
    }));
  };

  const handleFieldChange = <K extends keyof EconomyConfig>(field: K, value: EconomyConfig[K]) => {
    updateEconomyConfig({
      ...economy,
      [field]: value
    });
  };

  const handleAddHolding = (typePreset?: EconomyHolding['type']) => {
    const preset = HOLDING_TYPES.find(t => t.type === typePreset) || HOLDING_TYPES[0];
    const assets = getHoldingPresets(preset.type);
    const holdingId = `holding-${Date.now()}`;
    const loreId = `lore-${holdingId}`;
    
    const newHolding: EconomyHolding = {
      id: holdingId,
      loreEntryId: loreId,
      name: `Neues ${preset.label.split('/')[0].trim()}`,
      type: preset.type,
      icon: preset.icon,
      description: preset.description,
      level: 1,
      ownerType: 'user',
      incomePerInterval: preset.defaultIncome,
      upkeepPerInterval: preset.defaultUpkeep,
      staffCount: 5,
      reputation: 50,
      status: 'active',
      locationName: '',
      budget: preset.defaultIncome * 2,
      storageCapacity: 150,
      upgrades: [
        { id: `upg-${Date.now()}-1`, name: 'Hauptausbau Stufe 2', cost: preset.defaultIncome * 2, levelRequired: 1, unlocked: false, description: 'Erhöht die Einnahmen um 50%' }
      ],
      resources: assets.resources.map(r => ({ ...r, id: `res-${Math.random().toString(36).substring(2, 11)}` })),
      tasks: assets.tasks.map(t => ({ ...t, id: `tsk-${Math.random().toString(36).substring(2, 11)}` })),
      duties: assets.duties.map(d => ({ ...d, id: `dty-${Math.random().toString(36).substring(2, 11)}` })),
      roles: assets.roles.map(r => ({ ...r, id: `role-${Math.random().toString(36).substring(2, 11)}` })),
      staffGroups: assets.staffGroups.map(s => ({ ...s, id: `sg-${Math.random().toString(36).substring(2, 11)}` })),
      orders: assets.orders.map(o => ({ ...o, id: `ord-${Math.random().toString(36).substring(2, 11)}` })),
      decisions: assets.decisions.map(d => ({ ...d, id: `dec-${Math.random().toString(36).substring(2, 11)}` })),
      activityLogs: assets.activityLogs.map(l => ({ ...l, id: `log-${Math.random().toString(36).substring(2, 11)}` })),
      
      // Default physical properties
      physicalCondition: 'Gut',
      physicalSize: 'Mittel',
      physicalCapacity: 'Standard-Kapazität',
      physicalUsage: 'Gewerbe & Betrieb',
      
      // Active modules
      useResourcesModule: true,
      useStaffModule: true,
      useFinanceModule: true,
      useManagementModule: true,
      useOrdersModule: true,
      useDecisionsModule: true,
      useLogsModule: true
    };

    updateEconomyConfig({
      ...economy,
      holdings: [...economy.holdings, newHolding]
    });
    setEditingHoldingId(newHolding.id);
    setMainTab('holdings');
    setActiveSubTab('details');
  };

  const handleUpdateHolding = (id: string, updates: Partial<EconomyHolding>) => {
    const updated = economy.holdings.map(h => h.id === id ? { ...h, ...updates } : h);
    updateEconomyConfig({
      ...economy,
      holdings: updated
    });
  };

  const handleRemoveHolding = (id: string) => {
    const updated = economy.holdings.filter(h => h.id !== id);
    updateEconomyConfig({
      ...economy,
      holdings: updated
    });
    if (editingHoldingId === id) setEditingHoldingId(null);
  };

  const handleSyncWithWorld = () => {
    setIsSyncing(true);
    const { updatedEconomy, changed } = syncEconomyWithWorld(economy, loreDatabase, world.territories || [], filterCodexOnly);
    if (changed) {
      updateEconomyConfig(updatedEconomy);
    }
    setSyncMessage(changed ? 'Wirtschaftssystem erfolgreich mit Codex synchronisiert!' : 'Codex & Wirtschaftsdaten sind bereits vollkommen synchron.');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage(null);
    }, 2500);
  };

  const handleDeleteAllOrteEntries = () => {
    setIsSyncing(true);
    const orteEntries = loreDatabase.filter(l => l.category === 'Orte' || l.id?.startsWith('lore-holding-'));
    const count = orteEntries.length || 12;

    // Unlink loreEntryId from holdings
    const updatedHoldings = economy.holdings.map(h => ({ ...h, loreEntryId: undefined }));
    updateEconomyConfig({
      ...economy,
      holdings: updatedHoldings
    });

    if (onDeleteOrteEntries) {
      onDeleteOrteEntries();
    } else {
      setWorld(prev => ({
        ...prev,
        loreDatabase: (prev.loreDatabase || []).filter(l => l.category !== 'Orte' && !l.id?.startsWith('lore-holding-'))
      }));
    }

    setSyncMessage(`Alle Orte-Einträge (${count}) wurden erfolgreich aus dem Codex gelöscht.`);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage(null);
    }, 3000);
  };

  const handleRegisterAllInCodex = () => {
    setIsSyncing(true);
    const { updatedLoreDatabase, updatedEconomy, newCount } = registerAllHoldingsInCodex(economy, loreDatabase);
    updateEconomyConfig(updatedEconomy);
    
    if (onAddCodexEntry) {
      const existingIds = new Set(loreDatabase.map(l => l.id));
      updatedLoreDatabase.forEach(entry => {
        if (!existingIds.has(entry.id)) {
          onAddCodexEntry(entry);
        }
      });
    } else {
      setWorld(prev => ({
        ...prev,
        loreDatabase: updatedLoreDatabase
      }));
    }

    setSyncMessage(newCount > 0 
      ? `${newCount} Betrieb(e) wurden erfolgreich neu im Codex (Orte) registriert!` 
      : 'Alle Betriebe sind bereits im Codex verknüpft.'
    );
    setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage(null);
    }, 3000);
  };

  const handleRegisterSingleInCodex = (holding: EconomyHolding) => {
    const newLore = createLoreEntryFromHolding(holding);
    if (onAddCodexEntry) {
      onAddCodexEntry(newLore);
    } else {
      setWorld(prev => ({
        ...prev,
        loreDatabase: [...(prev.loreDatabase || []), newLore]
      }));
    }
    handleUpdateHolding(holding.id, { loreEntryId: newLore.id });
    setSyncMessage(`"${holding.name}" wurde im Codex unter Orte registriert.`);
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // Auto-Sync on mount if needed
  useEffect(() => {
    const { updatedEconomy, changed } = syncEconomyWithWorld(economy, loreDatabase, world.territories || []);
    if (changed) {
      updateEconomyConfig(updatedEconomy);
    }
  }, []);

  // Smart Fill AI action for the active holding
  const handleSmartFillActiveHolding = async (holding: EconomyHolding) => {
    setIsSmartFilling(true);
    try {
      const filled = await smartFillEconomyHolding(
        world, 
        holding, 
        loreDatabase, 
        isSupplementMode,
        smartFillPrompt
      );
      handleUpdateHolding(holding.id, filled);
    } catch (err) {
      console.error('Smart Fill failed:', err);
    } finally {
      setIsSmartFilling(false);
    }
  };

  const isHoldingInCodex = (h: EconomyHolding): boolean => {
    return loreDatabase.some(l => 
      l.id === h.loreEntryId || 
      (l.category === 'Orte' && l.title.trim().toLowerCase() === (h.name || '').trim().toLowerCase())
    ) || (world.territories || []).some(t => 
      t.id === h.territoryId || 
      t.name.trim().toLowerCase() === (h.name || '').trim().toLowerCase()
    );
  };

  const filteredHoldings = economy.holdings.filter(h => {
    if (filterOwner !== 'all' && h.ownerType !== filterOwner) return false;

    if (filterCodexOnly) {
      if (!isHoldingInCodex(h)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (h.name || '').toLowerCase().includes(q);
      const locMatch = (h.locationName || '').toLowerCase().includes(q);
      const descMatch = (h.description || '').toLowerCase().includes(q);
      const typeMatch = (h.type || '').toLowerCase().includes(q);
      return nameMatch || locMatch || descMatch || typeMatch;
    }
    return true;
  });

  const totalIncome = economy.holdings.reduce((sum, h) => sum + (h.incomePerInterval || 0), 0);
  const totalUpkeep = economy.holdings.reduce((sum, h) => sum + (h.upkeepPerInterval || 0), 0);
  const netProfit = totalIncome - totalUpkeep;
  const totalStaff = economy.holdings.reduce((sum, h) => {
    const rolesCount = h.roles?.length || 0;
    const groupsCount = (h.staffGroups || []).reduce((acc, g) => acc + (g.count || 0), 0);
    return sum + (rolesCount + groupsCount || h.staffCount || 0);
  }, 0);
  const totalResourceTypes = economy.holdings.reduce((sum, h) => sum + (h.resources?.length || 0), 0);

  // Selected holding for Master/Detail
  const activeHolding = editingHoldingId 
    ? economy.holdings.find(h => h.id === editingHoldingId) || filteredHoldings[0] || null
    : filteredHoldings[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-lg font-bold">
              <i className="fa-solid fa-coins"></i>
            </span>
            <h3 className="text-xl font-bold text-slate-100">Wirtschafts- & Managementsystem</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verwalte Betriebe, Anwesen, Tavernen, Minen, Schiffe und Gilden. Organisiere Belegschaft, Warenlager, Aufträge, Befugnisse und Hintergrund-Logs.
          </p>
        </div>

        {onGenerateEconomy && (
          <button
            onClick={onGenerateEconomy}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i> KI generiert Wirtschaft...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i> KI Wirtschafts-Presets generieren
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Economy Navigation Bar */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1.5 overflow-x-auto hide-scrollbar shadow-lg">
        {[
          { id: 'overview', label: 'Übersicht', icon: 'fa-chart-pie' },
          { id: 'holdings', label: `Betriebe & Anwesen (${economy.holdings.length})`, icon: 'fa-building' },
          { id: 'resources', label: `Handel & Ressourcen (${totalResourceTypes})`, icon: 'fa-boxes-stacked' },
          { id: 'finances', label: 'Finanzen & Bilanzen', icon: 'fa-scale-balanced' },
          { id: 'tactical', label: 'Taktik & Militär', icon: 'fa-shield-halved' },
          { id: 'management', label: 'Verwaltung & Regeln', icon: 'fa-sliders' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === tab.id
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-[11px]`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Notification Toast */}
      {syncMessage && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-2">
            <LucideIcons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-400/60 hover:text-emerald-300 text-xs">
            <LucideIcons.X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Codex Sync Control Bar */}
      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <LucideIcons.BookOpen className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>Codex-Synchronisation & Inventar</span>
              <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                {economy.holdings.filter(h => isHoldingInCodex(h)).length} / {economy.holdings.length} im Codex
              </span>
            </h4>
            <p className="text-[10.5px] text-slate-400">
              Synchronisiert Wirtschaftsbetriebe strikt mit den Orten im Codex.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFilterCodexOnly(!filterCodexOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterCodexOnly
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LucideIcons.Filter className="w-3.5 h-3.5" />
            <span>{filterCodexOnly ? 'Nur Codex-Einträge (Aktiv)' : 'Nur Codex-Betriebe auflisten'}</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteAllOrteEntries}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Löscht alle 'Orte'-Einträge aus dem Codex"
          >
            <LucideIcons.Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Orte aus Codex löschen ({loreDatabase.filter(l => l.category === 'Orte' || l.id?.startsWith('lore-holding-')).length})</span>
          </button>

          <button
            type="button"
            onClick={handleSyncWithWorld}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 hover:bg-indigo-600/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LucideIcons.RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Mit Codex synchronisieren</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
         TAB 1: ÜBERSICHT & DASHBOARD
         ========================================================================= */}
      {mainTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Management Dashboard Stats */}
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LucideIcons.BarChart3 className="w-5 h-5 text-amber-500" /> Management Dashboard
            </h3>
            <button 
              onClick={handleSyncWithWorld}
              disabled={isSyncing}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                isSyncing 
                ? 'bg-slate-800 border-slate-700 text-slate-500' 
                : 'bg-amber-600/10 border-amber-600/30 text-amber-500 hover:bg-amber-600/20'
              }`}
            >
              <LucideIcons.RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisiere...' : 'Welt-Daten synchronisieren'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <LucideIcons.TrendingUp className="w-12 h-12 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gesamtumsatz</span>
                  <div className="text-xl font-bold text-slate-100">{totalIncome}</div>
                  <div className="text-[10px] text-slate-400">Brutto-Einnahmen</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <LucideIcons.TrendingDown className="w-12 h-12 text-red-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Betriebskosten</span>
                  <div className="text-xl font-bold text-slate-100">{totalUpkeep}</div>
                  <div className="text-[10px] text-slate-400">Laufende Kosten</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <LucideIcons.Flag className="w-12 h-12 text-rose-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fraktions-Anwesen</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400">
                   {economy.holdings.filter(h => h.ownerType === 'faction' || h.controlledByFactionId).length}
                </span>
                <span className="text-xs text-slate-400 font-bold">Stützpunkte</span>
              </div>
              <p className="text-[10px] text-slate-500">Verknüpfte Faktionen & Militär</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <LucideIcons.Users className="w-12 h-12 text-indigo-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Personalstärke</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalStaff}</span>
                <span className="text-xs text-slate-400 font-bold">Mitarbeiter</span>
              </div>
              <p className="text-[10px] text-slate-500">Über {economy.holdings.length} aktive Betriebe</p>
            </div>
          </div>

          {/* Quick Holdings Grid */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <LucideIcons.LayoutDashboard className="w-4 h-4 text-amber-500" /> Betriebsübersicht
              </h4>
              <button
                onClick={() => setMainTab('holdings')}
                className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-1.5"
              >
                Alle verwalten <LucideIcons.ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {economy.holdings.length === 0 ? (
              <div className="p-12 text-center bg-slate-950/40 border border-slate-800 border-dashed rounded-3xl space-y-4">
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                  <LucideIcons.Building2 className="w-8 h-8 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-300">Keine aktiven Betriebe</p>
                  <p className="text-xs text-slate-500">Beginne damit, deinen ersten Betrieb anzulegen.</p>
                </div>
                <button
                  onClick={() => handleAddHolding('taverne')}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-900/20"
                >
                  Ersten Betrieb anlegen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {economy.holdings.map(holding => {
                  const net = (holding.incomePerInterval || 0) - (holding.upkeepPerInterval || 0);
                  const staffCnt = (holding.roles?.length || 0) + (holding.staffGroups || []).reduce((acc, g) => acc + (g.count || 0), 0);

                  return (
                    <div
                      key={holding.id}
                      onClick={() => {
                        setEditingHoldingId(holding.id);
                        setMainTab('holdings');
                        setActiveSubTab('details');
                      }}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl shrink-0 overflow-hidden">
                            <HoldingIcon icon={holding.icon || 'Building2'} className="w-5 h-5 text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                              {holding.name}
                            </h5>
                            <span className="text-[10px] text-slate-400 block truncate">
                              Stufe {holding.level || 1} • {holding.locationName || 'Kein Standort'}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 font-mono ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {net >= 0 ? '+' : ''}{net}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 pt-3 border-t border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <LucideIcons.User className="w-3 h-3 text-slate-600" />
                          <span className="truncate max-w-[80px]">{holding.ownerType === 'user' ? 'Spieler' : holding.assignedCharacterName || 'NPC'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LucideIcons.Users className="w-3 h-3 text-slate-600" />
                          <span>{staffCnt} Köpfe</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 2: BETRIEBE (HORIZONTAL SELECTOR & FULL-WIDTH DETAIL)
         ========================================================================= */}
      {mainTab === 'holdings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* TOP SELECTION & FILTER BAR */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <LucideIcons.Building2 className="w-4 h-4 text-amber-500" /> Betriebe & Anwesen ({filteredHoldings.length})
                </span>
                <button
                  onClick={() => handleAddHolding('taverne')}
                  className="text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LucideIcons.Plus className="w-3.5 h-3.5" /> Betrieb
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <LucideIcons.Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Betrieb oder Ort suchen..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="w-full sm:w-52">
                  <select
                    value={filterOwner}
                    onChange={e => setFilterOwner(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Alle Eigentümer ({economy.holdings.length})</option>
                    <option value="user">Spieler & Crew ({economy.holdings.filter(h => h.ownerType === 'user').length})</option>
                    <option value="character">NSCs ({economy.holdings.filter(h => h.ownerType === 'character').length})</option>
                    <option value="faction">Fraktionen ({economy.holdings.filter(h => h.ownerType === 'faction').length})</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Horizontal Grid / List of Business Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredHoldings.length === 0 ? (
                <div className="col-span-full p-6 text-center text-xs text-slate-500 italic">
                  Keine Betriebe entsprechen den Kriterien.
                </div>
              ) : (
                filteredHoldings.map(holding => {
                  const isActive = activeHolding?.id === holding.id;
                  const net = (holding.incomePerInterval || 0) - (holding.upkeepPerInterval || 0);

                  return (
                    <button
                      key={holding.id}
                      type="button"
                      onClick={() => setEditingHoldingId(holding.id)}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 relative cursor-pointer group ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/20'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl shrink-0 overflow-hidden">
                          <HoldingIcon icon={holding.icon || 'Building2'} className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs truncate group-hover:text-amber-400 transition-colors">{holding.name}</h5>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            Stufe {holding.level || 1} • {holding.locationName || 'Kein Standort'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-extrabold block font-mono ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {net >= 0 ? '+' : ''}{net} {economy.currencyIcon}
                        </span>
                        <span className="text-[9px] text-slate-500 capitalize block truncate max-w-[65px]">
                          {holding.ownerType === 'user' ? 'Spieler' : holding.assignedCharacterName || 'NPC'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* FULL-WIDTH DETAIL PANEL */}
          <div className="w-full bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-amber-500"></div>

            {!activeHolding ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <LucideIcons.Building2 className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
                <p className="text-xs">Wähle oben einen Betrieb aus oder erstelle einen neuen.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl shadow-inner shrink-0 overflow-hidden">
                      <HoldingIcon icon={activeHolding.icon || 'Building2'} className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-lg text-slate-100">{activeHolding.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Stufe {activeHolding.level || 1}
                        </span>
                        {isHoldingInCodex(activeHolding) ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <LucideIcons.BookMarked className="w-3 h-3 text-emerald-400" /> Im Codex registriert
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRegisterSingleInCodex(activeHolding)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 hover:bg-amber-900/80 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <LucideIcons.BookPlus className="w-3 h-3 text-amber-400" /> In Codex eintragen
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="capitalize font-semibold text-amber-400/90">
                          {(HOLDING_TYPES.find(t => t.type === activeHolding.type)?.label || activeHolding.type).split('/')[0]}
                        </span>
                        {activeHolding.locationName && <span>• Standort: {activeHolding.locationName}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleRemoveHolding(activeHolding.id)}
                      className="p-2 px-3 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      title="Betrieb löschen"
                    >
                      <i className="fa-solid fa-trash mr-1"></i> Löschen
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">KI Smart-Fill Konfiguration</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleSmartFillActiveHolding(activeHolding)}
                      disabled={isSmartFilling}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 active:scale-95"
                    >
                      {isSmartFilling ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i> Generiere...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-bolt"></i> Smart-Fill Starten
                        </>
                      )}
                    </button>
                  </div>

                  <AutoExpandingTextarea
                    value={smartFillPrompt}
                    onChange={e => setSmartFillPrompt(e.target.value)}
                    placeholder="Zusätzliche Anweisungen für die KI (z.B. 'Mache es düsterer', 'Füge mehr Personal hinzu', 'Spezialisiere auf Bergbau')..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
                  />

                  <div className="flex items-center gap-3 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={isSupplementMode}
                        onChange={e => setIsSupplementMode(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                      />
                      <span className="text-[11px] font-bold text-slate-300 group-hover:text-amber-300 transition-colors">
                        <span className="text-emerald-400">Ergänzungs-Modus:</span> Bestehende Daten behalten
                      </span>
                    </label>
                    <div className="h-3 w-px bg-slate-800 mx-1"></div>
                    <span className="text-[10px] text-slate-500 italic">
                      {isSupplementMode 
                        ? "KI füllt nur Lücken und erweitert Logisch." 
                        : "KI generiert den Betrieb basierend auf dem Typ komplett neu."}
                    </span>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex flex-wrap border-b border-slate-800 gap-1 pb-1">
                  {[
                    { id: 'details', label: 'Stammdaten & Gebäude', icon: 'fa-id-card' },
                    { id: 'position', label: 'Meine Position & Befugnisse', icon: 'fa-user-shield' },
                    { id: 'staff', label: `Jobs & Personal (${(activeHolding.roles?.length || 0) + (activeHolding.staffGroups?.reduce((a, g) => a + (g.count || 0), 0) || 0)})`, icon: 'fa-users' },
                    { id: 'resources', label: `Lager & Ressourcen (${activeHolding.resources?.length || 0})`, icon: 'fa-boxes-stacked' },
                    { id: 'tasks', label: `Aufgaben & Pflichten (${(activeHolding.tasks?.length || 0) + (activeHolding.duties?.length || 0)})`, icon: 'fa-list-check' },
                    { id: 'orders', label: `Aufträge & Weisungen (${activeHolding.orders?.length || 0})`, icon: 'fa-scroll' },
                    { id: 'decisions', label: `Entscheidungen (${activeHolding.decisions?.length || 0})`, icon: 'fa-gavel' },
                    { id: 'logs', label: `Ereignis-Log (${activeHolding.activityLogs?.length || 0})`, icon: 'fa-clock-rotate-left' },
                    { id: 'finances', label: 'Finanzen & Upgrades', icon: 'fa-coins' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeSubTab === tab.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* SUBTAB CONTENT */}
                {activeSubTab === 'details' && (
                  <HoldingDetailsTab
                    holding={activeHolding}
                    world={world}
                    loreDatabase={loreDatabase}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'position' && (
                  <HoldingPositionTab
                    holding={activeHolding}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'staff' && (
                  <HoldingStaffTab
                    holding={activeHolding}
                    world={world}
                    loreDatabase={loreDatabase}
                    npcs={npcs}
                    onUpdateHolding={handleUpdateHolding}
                    onAddCodexEntry={onAddCodexEntry}
                  />
                )}

                {activeSubTab === 'resources' && (
                  <HoldingResourcesTab
                    holding={activeHolding}
                    currencyIcon={economy.currencyIcon}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'tasks' && (
                  <HoldingTasksTab
                    holding={activeHolding}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'orders' && (
                  <HoldingOrdersTab
                    holding={activeHolding}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'decisions' && (
                  <HoldingDecisionsTab
                    holding={activeHolding}
                    currencyIcon={economy.currencyIcon}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'logs' && (
                  <HoldingLogsTab
                    holding={activeHolding}
                    world={world}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}

                {activeSubTab === 'finances' && (
                  <HoldingFinancesTab
                    holding={activeHolding}
                    currencyIcon={economy.currencyIcon}
                    onUpdateHolding={handleUpdateHolding}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 3: HANDEL & RESSOURCEN
         ========================================================================= */}
      {mainTab === 'resources' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-boxes-stacked text-amber-500"></i> Gesamte Lager- & Ressourcenübersicht
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Übersicht aller Rohstoffe, Waren und Güter über sämtliche Betriebe hinweg.
              </p>
            </div>

            {totalResourceTypes === 0 ? (
              <div className="p-12 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-500 space-y-3">
                <i className="fa-solid fa-box-open text-4xl opacity-30"></i>
                <p className="text-xs">Keine registrierten Ressourcen in deinen Betrieben vorhanden.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {economy.holdings.map(holding => {
                  const resources = holding.resources || [];
                  if (resources.length === 0) return null;

                  return (
                    <div key={holding.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
                          <span>{holding.icon || 'Building2'}</span>
                          <span>{holding.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-500">{resources.length} Sorten</span>
                      </div>

                      <div className="space-y-2">
                        {resources.map(res => {
                          const fill = Math.min(100, Math.max(0, (res.amount / (res.maxCapacity || 100)) * 100));

                          return (
                            <div key={`${holding.id}-${res.id}`} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-850 space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-200">{res.name}</span>
                                <span className="font-bold text-amber-400 font-mono">{res.pricePerUnit} {economy.currencyIcon} / {res.unit}</span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Vorrat: <strong className="text-white font-mono">{res.amount} / {res.maxCapacity} {res.unit}</strong></span>
                                <span>{Math.round(fill)}%</span>
                              </div>

                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${fill < 25 ? 'bg-red-500' : fill < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${fill}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 4: FINANZEN & BILANZEN
         ========================================================================= */}
      {mainTab === 'finances' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h4 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced text-amber-500"></i> Detaillierte Finanzbilanz pro Betrieb
            </h4>

            {economy.holdings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Keine Betriebe zur Bilanzierung vorhanden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Betrieb</th>
                      <th className="p-3">Eigentümer</th>
                      <th className="p-3 text-right">Einnahmen</th>
                      <th className="p-3 text-right">Unterhalt</th>
                      <th className="p-3 text-right">Netto-Saldo</th>
                      <th className="p-3 text-center">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {economy.holdings.map(h => {
                      const net = (h.incomePerInterval || 0) - (h.upkeepPerInterval || 0);

                      return (
                        <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                            <div className="w-10 h-10 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl group-hover:scale-110 transition-transform shadow-inner overflow-hidden">
                              <HoldingIcon icon={h.icon || 'Building2'} className="w-5 h-5 text-amber-500" />
                            </div>
                            <span>{h.name}</span>
                          </td>
                          <td className="p-3 text-slate-400 capitalize">
                            {h.ownerType === 'user' ? 'Spieler' : h.assignedCharacterName || 'NPC'}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-400 font-mono">
                            +{h.incomePerInterval || 0} {economy.currencyIcon}
                          </td>
                          <td className="p-3 text-right font-bold text-red-400 font-mono">
                            -{h.upkeepPerInterval || 0} {economy.currencyIcon}
                          </td>
                          <td className={`p-3 text-right font-extrabold font-mono ${net >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                            {net >= 0 ? '+' : ''}{net} {economy.currencyIcon}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setEditingHoldingId(h.id);
                                setMainTab('holdings');
                                setActiveSubTab('finances');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-600/20 hover:text-amber-300 text-slate-300 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                            >
                              Anpassen
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-950 font-bold border-t border-slate-800 text-xs">
                    <tr>
                      <td colSpan={2} className="p-3 text-slate-200">Gesamtsumme aller Betriebe</td>
                      <td className="p-3 text-right text-emerald-400 font-mono">+{totalIncome} {economy.currencyIcon}</td>
                      <td className="p-3 text-right text-red-400 font-mono">-{totalUpkeep} {economy.currencyIcon}</td>
                      <td className={`p-3 text-right font-mono ${netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                        {netProfit >= 0 ? '+' : ''}{netProfit} {economy.currencyIcon}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Currency Rules & Payout settings */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <i className="fa-solid fa-coins text-amber-500"></i> Währungs- & Auszahlungseinstellungen
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Währungsname</label>
                <input
                  type="text"
                  value={economy.currencyName}
                  onChange={e => handleFieldChange('currencyName', e.target.value)}
                  placeholder="z.B. Goldmünzen, Kronen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Symbol / Icon</label>
                <input
                  type="text"
                  value={economy.currencyIcon}
                  onChange={e => handleFieldChange('currencyIcon', e.target.value)}
                  placeholder="z.B. Gold"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-bold text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Auszahlungsintervall</label>
                <select
                  value={economy.payoutInterval}
                  onChange={e => handleFieldChange('payoutInterval', e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-semibold cursor-pointer"
                >
                  <option value="daily">Täglich (Pro Ingame-Tag)</option>
                  <option value="weekly">Wöchentlich (7 Ingame-Tage)</option>
                  <option value="after_adventure">Nach jedem Hauptauftrag</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         TAB 5: VERWALTUNG & REGELN
         ========================================================================= */}
      {mainTab === 'tactical' && (
        <TacticalManagementTab 
          world={world}
          loreDatabase={loreDatabase}
          holdings={economy.holdings}
          combatState={combatState}
          onUpdateCombatState={onUpdateCombatState || (() => {})}
        />
      )}

      {mainTab === 'management' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border border-amber-500/30 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-indigo-500"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Schnellvorlagen für neue Betriebe & Anwesen
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Klicke auf eine Vorlage, um sofort einen vorkonfigurierten Betrieb mit Personal, Waren und Aufträgen anzulegen.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
              {HOLDING_TYPES.map(preset => (
                <button
                  key={preset.type}
                  onClick={() => handleAddHolding(preset.type)}
                  className="flex flex-col items-center justify-center p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all group text-center cursor-pointer"
                  title={preset.description}
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl group-hover:scale-110 transition-transform shadow-inner mb-1.5 overflow-hidden">
                    <HoldingIcon icon={preset.icon} className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-amber-400 truncate w-full">
                    {preset.label.split('/')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* System Toggles */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <i className="fa-solid fa-gears text-amber-500"></i> Globale Schalter & Ereignis-Regeln
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={economy.allowPassiveIncome}
                  onChange={e => handleFieldChange('allowPassiveIncome', e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Passives Einkommen & Erträge</span>
                  <span className="text-[10px] text-slate-400 block">Betriebe erwirtschaften im Spielverlauf automatisch Erträge</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={economy.enableRandomEvents}
                  onChange={e => handleFieldChange('enableRandomEvents', e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Zufällige Wirtschafts-Ereignisse</span>
                  <span className="text-[10px] text-slate-400 block">Handelsbooms, Seeräuber-Überfälle, Inspektionsbesuche</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EconomyManager;
