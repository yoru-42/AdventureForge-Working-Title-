import React, { useState, useMemo } from 'react';
import { 
  Adventure, 
  EconomyHolding, 
  TradeContract, 
  EconomyResource,
  NPC
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { 
  ShoppingBag, 
  Handshake, 
  FileText, 
  Coins, 
  Building2, 
  MapPin, 
  User, 
  Plus, 
  Send, 
  X, 
  Package,
  ArrowRightLeft,
  Scale,
  Store,
  CheckCircle2
} from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
  onSetInputText?: (text: string) => void;
}

type TradeTab = 'buy' | 'sell' | 'negotiate' | 'contracts';

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onUpdateAdventure,
  onSendChatMessage,
  onSetInputText
}) => {
  const [activeTab, setActiveTab] = useState<TradeTab>('buy');
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');

  // Buy State
  const [buyQuery, setBuyQuery] = useState('');
  const [selectedResourceToBuy, setSelectedResourceToBuy] = useState<EconomyResource | null>(null);
  const [buyAmount, setBuyAmount] = useState<number>(1);

  // Sell State
  const [customSellItem, setCustomSellItem] = useState('');
  const [sellPriceEstimate, setSellPriceEstimate] = useState<number>(10);

  // Negotiate State
  const [negotiateOffer, setNegotiateOffer] = useState('');

  // Contract State
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [contractType, setContractType] = useState('Liefervertrag');
  const [contractPartnerName, setContractPartnerName] = useState('');
  const [contractPartnerId, setContractPartnerId] = useState('');
  const [contractResourceName, setContractResourceName] = useState('');
  const [contractQuantity, setContractQuantity] = useState<number>(10);
  const [contractPrice, setContractPrice] = useState<number>(50);
  const [contractInterval, setContractInterval] = useState<'täglich' | 'wöchentlich' | 'monatlich' | 'einmalig'>('wöchentlich');
  const [contractTerms, setContractTerms] = useState('');

  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Holdings in current world state
  const holdings = useMemo<EconomyHolding[]>(() => {
    return adventure.world?.economyConfig?.holdings || [];
  }, [adventure.world?.economyConfig?.holdings]);

  // Current active holding for trade
  const activeHolding = useMemo<EconomyHolding | null>(() => {
    if (holdings.length === 0) return null;
    if (selectedHoldingId) {
      const found = holdings.find(h => h.id === selectedHoldingId);
      if (found) return found;
    }
    return holdings[0];
  }, [holdings, selectedHoldingId]);

  // Location details
  const currentLocationName = useMemo<string>(() => {
    if (activeHolding?.locationName) return activeHolding.locationName;
    return adventure.storyState?.currentLocationName || adventure.world?.startLocationName || 'Lokaler Markt';
  }, [activeHolding, adventure.storyState?.currentLocationName, adventure.world?.startLocationName]);

  // Player Money & Currency
  const structuredInv = useMemo(() => {
    return adventure.structuredInventory || {
      armor: {},
      accessories: {},
      weapons: [],
      generalItems: [],
      money: 100,
      currencyLabel: 'Goldmünzen'
    };
  }, [adventure.structuredInventory]);

  const money = structuredInv.money ?? 0;
  const currencyLabel = structuredInv.currencyLabel || 'Goldmünzen';

  // Live Sellable Items from Player Inventory
  const sellableItems = useMemo(() => {
    const list: { id: string; name: string; type: string; count?: number; desc?: string }[] = [];

    if (Array.isArray(structuredInv.generalItems)) {
      structuredInv.generalItems.forEach((item: any, idx: number) => {
        if (typeof item === 'string' && item.trim()) {
          list.push({ id: `gen-${idx}`, name: item.trim(), type: 'Gebrauchsgegenstand' });
        } else if (item && typeof item === 'object' && item.name) {
          list.push({
            id: `gen-${idx}`,
            name: item.name,
            type: item.type || 'Gegenstand',
            count: item.quantity || item.count,
            desc: item.description
          });
        }
      });
    }

    if (Array.isArray(structuredInv.weapons)) {
      structuredInv.weapons.forEach((w: any, idx: number) => {
        if (typeof w === 'string' && w.trim()) {
          list.push({ id: `wpn-${idx}`, name: w.trim(), type: 'Waffe' });
        } else if (w && typeof w === 'object' && w.name) {
          list.push({
            id: `wpn-${idx}`,
            name: w.name,
            type: w.type || 'Waffe',
            desc: w.description
          });
        }
      });
    }

    if (Array.isArray(adventure.inventory)) {
      adventure.inventory.forEach((invStr, idx) => {
        if (typeof invStr === 'string' && invStr.trim() && !list.some(l => l.name.toLowerCase() === invStr.toLowerCase())) {
          list.push({ id: `inv-${idx}`, name: invStr.trim(), type: 'Gegenstand' });
        }
      });
    }

    return list;
  }, [structuredInv, adventure.inventory]);

  // NPCs available for contracts
  const npcs = useMemo<NPC[]>(() => {
    return adventure.npcs || [];
  }, [adventure.npcs]);

  // Live Contracts from active holding or all holdings
  const activeContracts = useMemo<TradeContract[]>(() => {
    if (activeHolding?.contracts) return activeHolding.contracts;
    
    // Fallback: Aggregate all contracts in world
    const allContracts: TradeContract[] = [];
    holdings.forEach(h => {
      if (h.contracts) allContracts.push(...h.contracts);
    });
    return allContracts;
  }, [activeHolding, holdings]);

  if (!isOpen) return null;

  const triggerAction = (actionText: string) => {
    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  // Execute Live Buy
  const handleExecuteLiveBuy = (resource: EconomyResource) => {
    const totalCost = (resource.pricePerUnit || 10) * buyAmount;
    if (money < totalCost) {
      setStatusNotice(`Nicht genügend ${currencyLabel}! Benötigt: ${totalCost}, Vorhanden: ${money}`);
      return;
    }

    const updatedMoney = money - totalCost;
    const updatedGeneralItems = [...(structuredInv.generalItems || []), `${resource.name} (${buyAmount} ${resource.unit || 'Stk.'})` ];

    let updatedHoldings = holdings;
    if (activeHolding && activeHolding.resources) {
      const updatedRes = activeHolding.resources.map(r => {
        if (r.id === resource.id) {
          return { ...r, amount: Math.max(0, r.amount - buyAmount) };
        }
        return r;
      });
      updatedHoldings = holdings.map(h => h.id === activeHolding.id ? { ...h, resources: updatedRes } : h);
    }

    onUpdateAdventure({
      ...adventure,
      structuredInventory: {
        ...structuredInv,
        money: updatedMoney,
        generalItems: updatedGeneralItems
      },
      world: {
        ...adventure.world,
        economyConfig: {
          currencyName: adventure.world?.economyConfig?.currencyName || 'Goldmünzen',
          currencyIcon: adventure.world?.economyConfig?.currencyIcon || 'Münzen',
          payoutInterval: adventure.world?.economyConfig?.payoutInterval || 'weekly',
          allowPassiveIncome: adventure.world?.economyConfig?.allowPassiveIncome ?? true,
          enableRandomEvents: adventure.world?.economyConfig?.enableRandomEvents ?? true,
          holdings: updatedHoldings
        }
      }
    });

    triggerAction(`*kauft ${buyAmount}x ${resource.name} am Standort ${currentLocationName} für ${totalCost} ${currencyLabel} und verstaut die Ware im Gepäck*`);
  };

  // Execute Live Sell
  const handleExecuteLiveSell = (itemName: string) => {
    const earnings = sellPriceEstimate;
    const updatedMoney = money + earnings;
    const updatedGeneral = (structuredInv.generalItems || []).filter((i: any) => {
      if (typeof i === 'string') return i !== itemName;
      return i.name !== itemName;
    });

    onUpdateAdventure({
      ...adventure,
      structuredInventory: {
        ...structuredInv,
        money: updatedMoney,
        generalItems: updatedGeneral
      }
    });

    triggerAction(`*verkauft "${itemName}" am Standort ${currentLocationName} an den Händler und erhält ${earnings} ${currencyLabel}*`);
  };

  // Save Live Contract
  const handleSaveContract = () => {
    let partnerName = contractPartnerName.trim();
    if (contractPartnerId) {
      const foundNpc = npcs.find(n => n.id === contractPartnerId);
      if (foundNpc) partnerName = foundNpc.name;
    }
    if (!partnerName) partnerName = 'Handelspartner';

    const newContract: TradeContract = {
      id: `contract-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      holdingId: activeHolding?.id,
      holdingName: activeHolding?.name || currentLocationName,
      partnerName,
      partnerId: contractPartnerId || undefined,
      contractType,
      resourceName: contractResourceName.trim() || undefined,
      quantityPerInterval: contractQuantity,
      pricePerInterval: contractPrice,
      interval: contractInterval,
      status: 'aktiv',
      startDate: 'Sofort',
      terms: contractTerms.trim() || `Lieferung von ${contractQuantity}x ${contractResourceName || 'Waren'} im Turnus (${contractInterval}) gegen Zahlung von ${contractPrice} ${currencyLabel}.`
    };

    let updatedHoldings = holdings;
    if (activeHolding) {
      const currentContracts = activeHolding.contracts || [];
      updatedHoldings = holdings.map(h => 
        h.id === activeHolding.id 
          ? { ...h, contracts: [newContract, ...currentContracts] } 
          : h
      );
    }

    onUpdateAdventure({
      ...adventure,
      world: {
        ...adventure.world,
        economyConfig: {
          currencyName: adventure.world?.economyConfig?.currencyName || 'Goldmünzen',
          currencyIcon: adventure.world?.economyConfig?.currencyIcon || 'Münzen',
          payoutInterval: adventure.world?.economyConfig?.payoutInterval || 'weekly',
          allowPassiveIncome: adventure.world?.economyConfig?.allowPassiveIncome ?? true,
          enableRandomEvents: adventure.world?.economyConfig?.enableRandomEvents ?? true,
          holdings: updatedHoldings
        }
      }
    });

    setShowCreateContract(false);
    triggerAction(`*schließt einen rechtskräftigen ${contractType} mit ${partnerName} ab: "${newContract.terms}"*`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Handel & Verträge
              </h2>
              <p className="text-xs text-slate-400">
                Einkauf, Verkauf, Preisverhandlungen und rechtskräftige Handelsvereinbarungen im Weltzustand
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currency & Financial Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vermögen:</span>
              <div className="px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{money.toLocaleString('de-DE')} {currencyLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Standort & Betrieb:</span>
              <select
                value={activeHolding?.id || ''}
                onChange={e => setSelectedHoldingId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl text-xs px-3 py-1 focus:outline-none"
              >
                {holdings.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.locationName || currentLocationName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Marktplatz: <strong className="text-slate-200">{currentLocationName}</strong></span>
          </div>
        </div>

        {/* Status Notice */}
        {statusNotice && (
          <div className="px-6 py-2 bg-amber-950/40 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <span>{statusNotice}</span>
            <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'buy'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Einkaufen & Markt
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sell')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sell'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Verkaufen ({sellableItems.length} Gegenstände)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('negotiate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'negotiate'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            Feilschen & Verhandeln
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Verträge & Abkommen ({activeContracts.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB 1: BUY */}
          {activeTab === 'buy' && (
            <div className="space-y-5">
              
              {/* Live Holding Stocks */}
              {activeHolding && activeHolding.resources && activeHolding.resources.length > 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400" />
                    Verfügbares Warenangebot bei: {activeHolding.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHolding.resources.map(res => (
                      <div key={res.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-white text-xs">{res.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Bestand: {res.amount} {res.unit || 'Stk.'} • Preis: {res.pricePerUnit || 10} {currencyLabel}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteLiveBuy(res)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Kaufen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400" />
                        Warenangebot am Standort {currentLocationName} erkunden
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Fordert den Händler oder Marktleiter auf, seine Auslage und Preise darzulegen.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerAction(`*sieht sich das Warenangebot der Händler in ${currentLocationName} an und erkundigt sich nach verfügbaren Waren*`)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Warenliste im Chat erfragen
                    </button>
                  </div>
                </div>
              )}

              {/* Specific Item Search Request */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Gezielt nach einer bestimmten Ware fragen
                </h3>

                <input
                  type="text"
                  value={buyQuery}
                  onChange={e => setBuyQuery(e.target.value)}
                  placeholder="z.B. Zweihandschwert, Heiltrank, Eisenbarren, Seide..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!buyQuery.trim()) return;
                      triggerAction(`*fragt den Händler gezielt nach "${buyQuery.trim()}" und verhandelt über Preis und Qualität*`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Anfrage an Händler stellen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SELL */}
          {activeTab === 'sell' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                Inventarverkäufe ({sellableItems.length} Gegenstände im Gepäck)
              </h3>

              {sellableItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sellableItems.map(item => (
                    <div key={item.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.type}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExecuteLiveSell(item.name)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        Verkaufen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs">
                  Keine verkaufbaren Gegenstände im Inventar vorhanden.
                </div>
              )}

              {/* Custom Item Offer */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 pt-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Anderes Gut zum Verkauf anbieten</h4>
                <AutoExpandingTextarea
                  value={customSellItem}
                  onChange={e => setCustomSellItem(e.target.value)}
                  placeholder="Gegenstand oder Dienstleistung beschreiben..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                  minRows={2}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!customSellItem.trim()) return;
                      triggerAction(`*bietet dem Händler folgendes Gut zum Verkauf an: "${customSellItem.trim()}"*`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Angebot im Chat unterbreiten
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NEGOTIATE */}
          {activeTab === 'negotiate' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Preisverhandlung & Feilschen
                </h3>
                <p className="text-xs text-slate-400">
                  Nutzen Sie Ihr Verhandlungsgeschick, um Preisnachlässe zu erwirken oder Sonderkonditionen auszuhandeln.
                </p>

                <AutoExpandingTextarea
                  value={negotiateOffer}
                  onChange={e => setNegotiateOffer(e.target.value)}
                  placeholder="Ihr konkretes Gegenangebot oder Argumente für den Preisnachlass..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                  minRows={3}
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerAction('*versucht geschickt zu feilschen und bittet um einen angemessenen Preisnachlass*')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Allgemein Feilschen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!negotiateOffer.trim()) return;
                      triggerAction(`*unterbreitet bei den Preisverhandlungen folgendes konkretes Gegenangebot: "${negotiateOffer.trim()}"*`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gegenangebot Vorlegen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTRACTS */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Rechtskräftige Verträge & Abkommen ({activeContracts.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateContract(!showCreateContract)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Vertrag Aufsetzen
                </button>
              </div>

              {/* Contract Creation Form */}
              {showCreateContract && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Neuen Vertrag formulieren</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vertragstyp</label>
                      <select
                        value={contractType}
                        onChange={e => setContractType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="Liefervertrag">Liefervertrag (Rohstoffe/Waren)</option>
                        <option value="Handelsabkommen">Handelsabkommen (Gilde/Partner)</option>
                        <option value="Schutzvertrag">Schutzvertrag (Sicherheit/Garnison)</option>
                        <option value="Pachtvertrag">Pachtvertrag (Gebäude/Land)</option>
                        <option value="Dienstleistung">Dienstleistungsvertrag</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vertragspartner</label>
                      <select
                        value={contractPartnerId}
                        onChange={e => {
                          setContractPartnerId(e.target.value);
                          const npc = npcs.find(n => n.id === e.target.value);
                          if (npc) setContractPartnerName(npc.name);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="">Freier Verhandlungspartner (Manuell eintragen)</option>
                        {npcs.map(npc => (
                          <option key={npc.id} value={npc.id}>{npc.name} ({npc.profession || 'NPC'})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!contractPartnerId && (
                    <input
                      type="text"
                      value={contractPartnerName}
                      onChange={e => setContractPartnerName(e.target.value)}
                      placeholder="Name des Vertragspartners (z.B. Gilde der Schmiede, Händler Roderik)"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gegenstand / Ware</label>
                      <input
                        type="text"
                        value={contractResourceName}
                        onChange={e => setContractResourceName(e.target.value)}
                        placeholder="z.B. Eisenbarren, Getreide, Waffen"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preis pro Turnus ({currencyLabel})</label>
                      <input
                        type="number"
                        value={contractPrice}
                        onChange={e => setContractPrice(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Turnus / Intervall</label>
                      <select
                        value={contractInterval}
                        onChange={e => setContractInterval(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="wöchentlich">Wöchentlich</option>
                        <option value="täglich">Täglich</option>
                        <option value="monatlich">Monatlich</option>
                        <option value="einmalig">Einmalig</option>
                      </select>
                    </div>
                  </div>

                  <AutoExpandingTextarea
                    value={contractTerms}
                    onChange={e => setContractTerms(e.target.value)}
                    placeholder="Wichtige Vertragsklauseln, Fristen und Bedingungen..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                    minRows={3}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateContract(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveContract}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Vertrag Besiegeln
                    </button>
                  </div>
                </div>
              )}

              {/* Active Contracts List */}
              <div className="space-y-2.5">
                {activeContracts.length > 0 ? (
                  activeContracts.map(contract => (
                    <div key={contract.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{contract.contractType}</span>
                          <span className="text-xs text-slate-400">mit {contract.partnerName}</span>
                        </div>
                        {contract.terms && (
                          <p className="text-xs text-slate-300">{contract.terms}</p>
                        )}
                        {contract.pricePerInterval && (
                          <div className="text-[11px] text-amber-400 font-semibold pt-1">
                            Vereinbart: {contract.pricePerInterval} {currencyLabel} ({contract.interval || 'wöchentlich'})
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold uppercase shrink-0">
                        {contract.status || 'aktiv'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs">
                    Keine aktiven Verträge in der Spielwelt verzeichnet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
