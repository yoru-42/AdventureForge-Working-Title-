import React, { useState, useMemo } from 'react';
import { Adventure } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
  onSetInputText?: (text: string) => void;
}

type TradeTab = 'buy' | 'sell' | 'negotiate' | 'contract';

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onSendChatMessage,
  onSetInputText
}) => {
  const [activeTab, setActiveTab] = useState<TradeTab>('buy');

  // Buy state
  const [buyQuery, setBuyQuery] = useState('');

  // Sell state
  const [customSellItem, setCustomSellItem] = useState('');

  // Negotiate state
  const [negotiateOffer, setNegotiateOffer] = useState('');

  // Contract state
  const [contractType, setContractType] = useState('Handelsabkommen');
  const [contractPartner, setContractPartner] = useState('');
  const [contractTerms, setContractTerms] = useState('');

  const structuredInv = useMemo(() => {
    return adventure.structuredInventory || {
      armor: {},
      accessories: {},
      weapons: [],
      generalItems: [],
      money: 0,
      currencyLabel: 'Goldstücke'
    };
  }, [adventure.structuredInventory]);

  const money = structuredInv.money ?? 0;
  const currencyLabel = structuredInv.currencyLabel || 'Goldstücke';

  // Gather inventory items that can be sold
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

  // NPCs available for contracts or trade
  const npcs = useMemo(() => {
    return adventure.npcs || [];
  }, [adventure.npcs]);

  if (!isOpen) return null;

  const triggerAction = (actionText: string) => {
    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  // Actions for Tab: Buy
  const handleInquireWares = () => {
    triggerAction('*sieht sich das Warenangebot des Händlers an und erkundigt sich nach den verfügbaren Artikeln, Qualitäten und Preisen*');
  };

  const handleBuySpecific = () => {
    if (!buyQuery.trim()) return;
    triggerAction(`*fragt den Händler gezielt nach "${buyQuery.trim()}" und verhandelt über Verfügbarkeit und Kaufpreis*`);
  };

  const handleFinalizePurchase = () => {
    triggerAction('*stimmt dem genannten Kaufpreis zu, übergibt die geforderten Münzen und nimmt die Ware entgegen*');
  };

  // Actions for Tab: Sell
  const handleOfferItem = (itemName: string) => {
    triggerAction(`*bietet "${itemName}" zum Verkauf an und bittet den Händler um eine faire Schätzung und ein Preisgebot*`);
  };

  const handleOfferCustomItem = () => {
    if (!customSellItem.trim()) return;
    triggerAction(`*bietet "${customSellItem.trim()}" zum Verkauf an und erkundigt sich nach dem Kaufinteresse des Händlers*`);
  };

  // Actions for Tab: Negotiate
  const handleHaggle = () => {
    triggerAction('*versucht geschickt zu feilschen, verweist auf Mängel oder Marktpreise und bittet um einen spürbaren Preisnachlass*');
  };

  const handleCustomCounterOffer = () => {
    if (!negotiateOffer.trim()) return;
    triggerAction(`*unterbreitet folgendes Gegenangebot bei den Preisverhandlungen: "${negotiateOffer.trim()}"*`);
  };

  const handleBulkDiscount = () => {
    triggerAction('*schlägt einen Mengenrabatt für die Abnahme mehrerer Warenkontingente vor*');
  };

  const handleBarterTrade = () => {
    triggerAction('*schlägt ein direktes Tauschgeschäft Ware gegen Ware ohne bare Münzen vor und fragt nach Tauschmöglichkeiten*');
  };

  // Actions for Tab: Contract
  const handleProposeContract = () => {
    const partner = contractPartner.trim() || 'den Verhandlungspartner';
    const terms = contractTerms.trim() || 'standardmäßige Konditionen für Liefermenge, Zahlungsfristen und Vertragsstrafen';
    triggerAction(`*legt ${partner} einen Entwurf für ein ${contractType} vor mit folgenden vereinbarten Klauseln: "${terms}" und bittet um Verhandlung und Besiegelung*`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <i className="fa-solid fa-handshake text-lg"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Handel & Verträge
              </h2>
              <p className="text-xs text-slate-400">
                Einkauf, Verkauf, Preisverhandlungen und rechtskräftige Handelsvereinbarungen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Schließen"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Currency & Financial Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Eigenes Vermögen:
            </span>
            <div className="px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2">
              <i className="fa-solid fa-coins text-amber-400"></i>
              <span>{money.toLocaleString('de-DE')} {currencyLabel}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Handelsaktionen werden situationsgerecht in der Spielwelt ausgewertet.
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'buy'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            Einkaufen
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
            <i className="fa-solid fa-sack-dollar"></i>
            Verkaufen
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
            <i className="fa-solid fa-scale-balanced"></i>
            Feilschen & Verhandeln
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contract'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <i className="fa-solid fa-file-contract"></i>
            Verträge & Abkommen
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: BUY */}
          {activeTab === 'buy' && (
            <div className="space-y-5">
              
              {/* General Inquire */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fa-solid fa-store text-emerald-400"></i>
                      Warenangebot des Händlers einsehen
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Fordert den Händler oder Marktleiter auf, seine aktuelle Auslage, seltene Spezialwaren und Preisvorstellungen darzulegen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInquireWares}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-350 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-eye"></i>
                    Warenliste erfragen
                  </button>
                </div>
              </div>

              {/* Specific Buy Request */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-magnifying-glass text-emerald-400"></i>
                  Gezielt nach einer Ware oder Ausrüstung fragen
                </h3>
                <p className="text-xs text-slate-400">
                  Erkundige dich nach einem speziellen Gegenstand (z. B. Heiltrank, Verpflegung, Reittier, Rüstzeug, Werkzeug oder Reagenzien).
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <AutoExpandingTextarea
                    value={buyQuery}
                    onChange={e => setBuyQuery(e.target.value)}
                    placeholder="Beispiel: 3 Portionen Reiseverpflegung und eine geschmiedete Dolchklinge..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500 min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={handleBuySpecific}
                    disabled={!buyQuery.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <i className="fa-solid fa-tag"></i>
                    Ware anfragen
                  </button>
                </div>
              </div>

              {/* Finalize Purchase */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    Kauf abschließen & bezahlen
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Besiegelt den Kauf zu den vereinbarten Bedingungen und zahlt den geforderten Betrag.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFinalizePurchase}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-money-bill-wave"></i>
                  Kauf besiegeln
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: SELL */}
          {activeTab === 'sell' && (
            <div className="space-y-5">
              
              {/* Inventory List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-box-open text-slate-500"></i>
                    Mitgeführte Gegenstände & Ausrüstung ({sellableItems.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Klicke auf einen Gegenstand, um ein Verkaufsangebot zu unterbreiten
                  </span>
                </div>

                {sellableItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-500 text-xs">
                    Keine Gegenstände im Inventar verzeichnet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {sellableItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-200 whitespace-normal break-words">
                            {item.name}
                            {item.count && item.count > 1 && (
                              <span className="ml-1 text-[10px] text-emerald-400 font-mono">({item.count}x)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.type}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOfferItem(item.name)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-350 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                          title="Diesen Gegenstand dem Händler zum Kauf anbieten"
                        >
                          <i className="fa-solid fa-hand-holding-dollar"></i>
                          Anbieten
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Item Offer */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-pen text-emerald-400"></i>
                  Weiteren Gegenstand oder Fundstück anbieten
                </h3>
                <p className="text-xs text-slate-400">
                  Gib einen beliebigen Besitz, Beutegut oder eine Dienstleistung ein, die du verkaufen möchtest.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <AutoExpandingTextarea
                    value={customSellItem}
                    onChange={e => setCustomSellItem(e.target.value)}
                    placeholder="Beispiel: 2 Wolfsfelle von guter Qualität..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500 min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={handleOfferCustomItem}
                    disabled={!customSellItem.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <i className="fa-solid fa-hand-holding-dollar"></i>
                    Verkauf anbieten
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: NEGOTIATE / HAGGLE */}
          {activeTab === 'negotiate' && (
            <div className="space-y-5">
              
              {/* Quick Negotiation Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Haggle */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-scale-unbalanced-flip text-amber-400"></i>
                      Um Rabatt feilschen
                    </div>
                    <p className="text-xs text-slate-400">
                      Nutzt Verhandlungsgeschick, Charme oder Argumente, um den geforderten Preis zu senken.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleHaggle}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-trend-down"></i>
                    Rabatt aushandeln
                  </button>
                </div>

                {/* Bulk Discount */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-boxes-stacked text-indigo-400"></i>
                      Mengenrabatt
                    </div>
                    <p className="text-xs text-slate-400">
                      Schlägt eine größere Abnahmemenge oder Paketabnahme gegen vergünstigten Stückpreis vor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkDiscount}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-percent"></i>
                    Mengenrabatt anfragen
                  </button>
                </div>

                {/* Barter */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-repeat text-teal-400"></i>
                      Tauschgeschäft
                    </div>
                    <p className="text-xs text-slate-400">
                      Schlägt vor, Waren oder Dienstleistungen direkt ohne den Einsatz von Münzgeld zu tauschen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBarterTrade}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-right-left"></i>
                    Tausch vorschlagen
                  </button>
                </div>

              </div>

              {/* Custom Counter Offer */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-comments-dollar text-emerald-400"></i>
                  Konkretes Gegenangebot formulieren
                </h3>
                <p className="text-xs text-slate-400">
                  Nenne deinen eigenen Preisvorschlag oder eine alternative Bedingung.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <AutoExpandingTextarea
                    value={negotiateOffer}
                    onChange={e => setNegotiateOffer(e.target.value)}
                    placeholder="Beispiel: Ich zahle 40 Goldstücke sofort und gebe ein altes Silbermesser obendrauf..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500 min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={handleCustomCounterOffer}
                    disabled={!negotiateOffer.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <i className="fa-solid fa-handshake-simple"></i>
                    Gegenangebot senden
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CONTRACTS & AGREEMENTS */}
          {activeTab === 'contract' && (
            <div className="space-y-5">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-file-contract text-emerald-400"></i>
                    Handelsvertrag oder Vereinbarung aufsetzen
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Formuliere ein Abkommen für Lieferungen, Dienstleistungen, Zunftrechte oder Handelsrouten.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Contract Type */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                      Vertragstyp
                    </label>
                    <select
                      value={contractType}
                      onChange={e => setContractType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="Handelsabkommen">Handelsabkommen (Warenverkehr & Konditionen)</option>
                      <option value="Liefervertrag">Liefervertrag (Feste Mengen & Liefertermine)</option>
                      <option value="Exklusivvertrag">Exklusivvertrag (Alleinvertriebsrechte)</option>
                      <option value="Gildenvertrag">Gilden- / Zunftvertrag (Rechte & Pflichten)</option>
                      <option value="Schutzbündnis">Schutz- & Geleitschutzabkommen</option>
                      <option value="Kreditvereinbarung">Darlehen / Kreditvereinbarung</option>
                      <option value="Werkvertrag">Werkvertrag (Herstellung & Fertigstellung)</option>
                    </select>
                  </div>

                  {/* Contract Partner */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                      Vertragspartner / Organisation
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={contractPartner}
                        onChange={e => setContractPartner(e.target.value)}
                        placeholder="Name des Partners oder Gilde..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-emerald-500"
                      />
                      {npcs.length > 0 && (
                        <select
                          onChange={e => {
                            if (e.target.value) setContractPartner(e.target.value);
                          }}
                          value=""
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2 text-xs text-slate-300 outline-none focus:border-emerald-500 max-w-[120px]"
                          title="Anwesenden NPC auswählen"
                        >
                          <option value="">NPC wählen</option>
                          {npcs.map(npc => (
                            <option key={npc.id} value={npc.name || npc.nickname || 'NPC'}>
                              {npc.name || npc.nickname}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                </div>

                {/* Terms and Clauses */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                    Vertragsinhalte & Klauseln
                  </label>
                  <AutoExpandingTextarea
                    value={contractTerms}
                    onChange={e => setContractTerms(e.target.value)}
                    placeholder="Beschreibe die Bedingungen: Liefermengen, Zahlungsmodalitäten, Fristen, Gewinnbeteiligung oder Konventionalstrafen bei Nichterfüllung..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none focus:border-emerald-500 min-h-[80px]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProposeContract}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <i className="fa-solid fa-file-signature"></i>
                    Vertragsentwurf vorlegen
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Handelsverhandlungen fließen unmittelbar in den Spielverlauf ein.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
