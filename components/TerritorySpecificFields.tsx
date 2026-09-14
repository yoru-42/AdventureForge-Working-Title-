import React from 'react';
import { Territory } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

export interface TerritorySpecificFieldsProps {
  territory: Partial<Territory>;
  updateTerritory: (changes: Partial<Territory>) => void;
  className?: string;
}

interface FieldDef {
  key: keyof Territory;
  label: string;
  placeholder: string;
}

interface FieldGroup {
  groupTitle: string;
  fields: FieldDef[];
}

export const TerritorySpecificFields: React.FC<TerritorySpecificFieldsProps> = ({
  territory,
  updateTerritory,
  className = ''
}) => {
  const renderField = (key: keyof Territory, label: string, placeholder: string) => {
    const value = (territory[key] as string) || '';
    return (
      <div key={key} className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
        <AutoExpandingTextarea
          rows={1}
          value={value}
          onChange={(e) => updateTerritory({ [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-sky-500 outline-none transition-colors min-h-[36px]"
        />
      </div>
    );
  };

  const typeKey = (territory.type || 'stadt').toLowerCase().trim();

  let groups: FieldGroup[] = [];

  switch (typeKey) {
    case 'dorf':
      groups = [
        {
          groupTitle: 'Herrschaft & Hierarchie',
          fields: [
            { key: 'ruler', label: 'Dorfvorsteher / Leitung', placeholder: 'Name des Dorfältesten, Schulzen oder Verwalters' },
            { key: 'rulingTitle', label: 'Titel / Rang', placeholder: 'Dorfschulze, Ältester, Freibauer' },
            { key: 'overlord', label: 'Übergeordnete Herrschaft (Lehnsherr)', placeholder: 'Name und Titel der übergeordneten Herrschaft (z.B. Baron von Weißstein)' },
            { key: 'feudalRank', label: 'Feudale Rangstufe', placeholder: 'Dorf unter Lehnsherrschaft der Baronie / des Herzogtums' },
            { key: 'lawEnforcement', label: 'Gesetzeshüter & Ordnung', placeholder: 'Dorf-Büttel, Nachtwächter, Ältestenrat' }
          ]
        },
        {
          groupTitle: 'Verteidigung, Wehrkraft & Schutz',
          fields: [
            { key: 'population', label: 'Gesamtbevölkerung', placeholder: 'Einwohnerzahl (z.B. 200 Einwohner)' },
            { key: 'combatReadyPopulation', label: 'Kampffähige Bürger', placeholder: 'Anzahl kampffähiger Bewohner (z.B. 50 können kämpfen)' },
            { key: 'standingArmy', label: 'Stehende Wache / Garnison', placeholder: 'Keine stehende Truppe oder feste Wachleute' },
            { key: 'militiaAndConscripts', label: 'Dorfmiliz & Bauernwehr', placeholder: 'Dorfbewohner mit Heugabeln, Äxten, Jagdbögen' },
            { key: 'defenseStructures', label: 'Schutzanlagen & Befestigung', placeholder: 'Holzpalisade, Erdwall, verstärktes Wehrtor' },
            { key: 'armamentAndSupply', label: 'Bewaffnung & Zeughaus', placeholder: 'Einfache Waffen, Jagdbögen, Knüppel, kein schweres Gerät' },
            { key: 'dangerLevel', label: 'Gefahren & Risiken', placeholder: 'Wilde Tiere im Wald, Wegelagerer, Raubüberfälle' }
          ]
        },
        {
          groupTitle: 'Wirtschaft, Handel & Tägliche Aufgaben',
          fields: [
            { key: 'dailyJobs', label: 'Berufe & Alltagsarbeiten der Bewohner', placeholder: '60% Ackerbau, 20% Viehzucht/Waldarbeit, 10% Handwerk, 10% Schank & Tagelöhner' },
            { key: 'localTasks', label: 'Tägliche Aufgaben & Verantwortung', placeholder: 'Feldbestellung, Holzschlag für den Winter, Wehrmauerdienst, Jagd' },
            { key: 'tradeGoods', label: 'Lokale Handelswaren / Überschüsse', placeholder: 'Waren für Händler: Getreide, Wolle, Honig, Schnittholz, Felle' },
            { key: 'tradeDemands', label: 'Gesuchte Güter (Nachfrage)', placeholder: 'Benötigte Waren: Salz, Eisenwerkzeuge, Arznei, feine Stoffe' },
            { key: 'merchantsAndFairs', label: 'Händler & Marktzyklen', placeholder: 'Wöchentlicher Markttag, reisende Händlerkarawanen' },
            { key: 'tradeContracts', label: 'Verträge & Abgaben', placeholder: 'Zehnt an die Baronie, Wegegeld-Regelungen' }
          ]
        },
        {
          groupTitle: 'Zuwege & Landmarken',
          fields: [
            { key: 'accessRoutes', label: 'Zuwege & Pfade', placeholder: 'Befestigte Landstraße, Trampelpfad durch den Forst' },
            { key: 'travelDangers', label: 'Reiserisiken', placeholder: 'Wolfsrudel am Pass, morastige Abschnitte' },
            { key: 'landmarks', label: 'Wichtige Bauwerke & Orte', placeholder: 'Dorfplatz, Ziehbrunnen, Dorfschmiede, Schrein' }
          ]
        }
      ];
      break;

    case 'stadt':
    case 'hafen':
    case 'festung':
      groups = [
        {
          groupTitle: 'Herrschaft & Feudale Ordnung',
          fields: [
            { key: 'ruler', label: 'Herrscher / Stadtoberhaupt', placeholder: 'Bürgermeister, Stadtvogt, Kommandant oder Regent' },
            { key: 'rulingTitle', label: 'Titel / Rang', placeholder: 'Baron, Graf, Fürst, Ratsmeister, Statthalter' },
            { key: 'overlord', label: 'Übergeordnete Herrschaft (Souverän)', placeholder: 'Dem Herzogtum Falkenwacht / der Krone direkt unterstellt' },
            { key: 'feudalRank', label: 'Feudale Rangstufe', placeholder: 'Freie Reichsstadt, Herzogssitz oder befestigte Provinzhauptstadt' },
            { key: 'government', label: 'Regierungs- & Verwaltungsform', placeholder: 'Patrizier-Stadtrat, Gildenrat, Feudal-Garnison' },
            { key: 'lawEnforcement', label: 'Gesetzeshüter & Gerichtsbarkeit', placeholder: 'Stadtgarde, Büttelkompanie, Bannrichter' }
          ]
        },
        {
          groupTitle: 'Militär, Verteidigung & Wehrkraft',
          fields: [
            { key: 'population', label: 'Gesamtbevölkerung', placeholder: 'Einwohnerzahl (z.B. 12.000 Einwohner)' },
            { key: 'combatReadyPopulation', label: 'Wehrfähige Personen', placeholder: 'Anzahl wehrfähiger Bürger (z.B. 3.000 Bürgerwehr)' },
            { key: 'standingArmy', label: 'Stehendes Militär / Garnison', placeholder: '250 bezahlte Stadtwachen, 100 Schützen' },
            { key: 'militiaAndConscripts', label: 'Bürgerwehr & Hilfstruppen', placeholder: 'Zunftmilizen der Handwerker mit Piken und Armbrüsten' },
            { key: 'defenseStructures', label: 'Schutzanlagen & Befestigung', placeholder: 'Doppelter Mauerring, Wehrtürme, Zugbrücke, Wassergraben' },
            { key: 'armamentAndSupply', label: 'Zeughaus & Ausrüstung', placeholder: 'Arsenal mit Kettenhemden, Ballisten, Piken, Vorratskammern' },
            { key: 'dangerLevel', label: 'Gefahren & Sicherheitsrisiken', placeholder: 'Schmuggel in Gassen, Grenzfeindseligkeiten' }
          ]
        },
        {
          groupTitle: 'Wirtschaft, Handel & Aufgaben',
          fields: [
            { key: 'dailyJobs', label: 'Berufe & Erwerbszweige', placeholder: 'Schmiede, Gerber, Kaufleute, Schiffsleute, Wachpersonal, Gelehrte' },
            { key: 'localTasks', label: 'Tägliche Aufgaben & Pflichten', placeholder: 'Torzoll-Erhebung, Wachwechsel, Marktüberwachung, Hafenverladung' },
            { key: 'tradeGoods', label: 'Lokale Handelswaren / Exporte', placeholder: 'Waffen, Rüstungen, Tuchwaren, verarbeitete Erze, Schiffe' },
            { key: 'tradeDemands', label: 'Gesuchte Güter (Importe)', placeholder: 'Getreide aus Umländern, Bauholz, Roherz, Gewürze' },
            { key: 'merchantsAndFairs', label: 'Händler & Märkte', placeholder: 'Täglicher Marktplatz, überregionale Herbstmesse, Kontore' },
            { key: 'tradeContracts', label: 'Handelsverträge & Zölle', placeholder: 'Freihandelsabkommen mit der Flussgilde, 5% Einfuhrzoll' },
            { key: 'currency', label: 'Währung', placeholder: 'Kaiserliche Silbermünzen, Kronengold' }
          ]
        },
        {
          groupTitle: 'Zuwege & Landmarken',
          fields: [
            { key: 'accessRoutes', label: 'Handelsstraßen & Wasserwege', placeholder: 'Große Königsstraße, Schifffahrtskanal, Hafenbecken' },
            { key: 'travelDangers', label: 'Reiserisiken im Umland', placeholder: 'Zollkontrollen, berüchtigte Schluchten im Vorfeld' },
            { key: 'landmarks', label: 'Wichtige Bauwerke', placeholder: 'Rathaus, Großkathedrale, Festungsturm, Zeughaus' },
            { key: 'pointsOfInterest', label: 'Besondere Orte', placeholder: 'Gildenviertel, Versteckter Markt, Hafenmole' }
          ]
        }
      ];
      break;

    case 'region':
    case 'koenigreich':
    case 'land':
    case 'unabhaengiges_gebiet':
    case 'unbekanntes_land':
    case 'geografische_flaeche':
    case 'kontinent':
      groups = [
        {
          groupTitle: 'Herrschaft & Politische Struktur',
          fields: [
            { key: 'ruler', label: 'Landesherr / Monarch', placeholder: 'König, Herzog, Fürst oder Großrat' },
            { key: 'rulingTitle', label: 'Titel / Rang', placeholder: 'Herzog, Großfürst, Hoher König' },
            { key: 'overlord', label: 'Übergeordnete Herrschaft', placeholder: 'Kaiserreich, Staatenbund oder souveränes Reich' },
            { key: 'feudalRank', label: 'Feudale Ordnung', placeholder: 'Königreich mit 4 Herzogtümern und 18 Grafschaften' },
            { key: 'government', label: 'Herrschaftsform', placeholder: 'Erbmonarchie, Feudalrat, Ständevertretung' }
          ]
        },
        {
          groupTitle: 'Streitkräfte & Landesverteidigung',
          fields: [
            { key: 'population', label: 'Gesamtbevölkerung', placeholder: 'Geschätzte Bewohnerzahl der Region' },
            { key: 'combatReadyPopulation', label: 'Wehrfähige Streitkräfte', placeholder: 'Gesamtzahl mobilisierbarer Truppen' },
            { key: 'standingArmy', label: 'Stehende Heere & Regimenter', placeholder: 'Königliche Garde, Grenzregimenter, Ritterorden' },
            { key: 'militiaAndConscripts', label: 'Aufgebote & Milizen', placeholder: 'Lehnsaufgebote der Barone und Freibauern' },
            { key: 'defenseStructures', label: 'Grenzfesten & Bollwerke', placeholder: 'Grenzburgen, befestigte Pässe, Wachttürme' },
            { key: 'dangerLevel', label: 'Regionale Gefahren', placeholder: 'Grenzkonflikte, Rebellengruppen, wilde Bestien' }
          ]
        },
        {
          groupTitle: 'Wirtschaft & Regionale Ressourcen',
          fields: [
            { key: 'dailyJobs', label: 'Hauptberufe der Bevölkerung', placeholder: 'Land- und Forstwirtschaft, Bergbau, Handwerk, Handel' },
            { key: 'localTasks', label: 'Zentrale Aufgaben & Erfordernisse', placeholder: 'Grenzsicherung, Wegebau, Zehnteinzug, Ernteabsicherung' },
            { key: 'tradeGoods', label: 'Wichtigste Exportgüter', placeholder: 'Eisen, Korn, Rinder, Bauholz' },
            { key: 'tradeDemands', label: 'Bedarf & Importgüter', placeholder: 'Salz, Edeltuche, Wein, Waffen' },
            { key: 'tradeContracts', label: 'Bündnisse & Verträge', placeholder: 'Zollabkommen mit Nachbarreichen' },
            { key: 'resources', label: 'Rohstoffe & Vorkommen', placeholder: 'Erzkammern, dichte Wälder, fruchtbare Auen' }
          ]
        },
        {
          groupTitle: 'Geografie & Reiserouten',
          fields: [
            { key: 'terrain', label: 'Landschaft', placeholder: 'Hügelland, ausgedehnte Wälder, Flussläufe' },
            { key: 'biome', label: 'Biom', placeholder: 'Gemäßigte Mischwälder, Steppe, Taiga' },
            { key: 'climate', label: 'Klimaverlauf', placeholder: 'Milde Sommer, harte schneereiche Winter' },
            { key: 'accessRoutes', label: 'Hauptverkehrswege', placeholder: 'Reichsstraßen, schiffbare Ströme' },
            { key: 'travelDangers', label: 'Gefahrenzonen', placeholder: 'Räuberbanden in Bergwäldern' }
          ]
        }
      ];
      break;

    case 'meer':
    case 'ozean':
    case 'bucht':
    case 'see':
    case 'fluss':
    case 'wasser':
      groups = [
        {
          groupTitle: 'Gewässer & Naturkräfte',
          fields: [
            { key: 'size', label: 'Ausdehnung', placeholder: 'Flächengröße oder Flusslänge' },
            { key: 'climate', label: 'Klima & Strömungen', placeholder: 'Windverhältnisse, Gezeiten, Stürme' },
            { key: 'dangerLevel', label: 'Gefahren auf See', placeholder: 'Riffe, Untiefen, Seemonster, Piraterie' },
            { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Inselketten, Schiffswracks, Strudel' }
          ]
        },
        {
          groupTitle: 'Nutzung, Handel & Ressourcen',
          fields: [
            { key: 'resources', label: 'Meeresressourcen', placeholder: 'Fischgründe, Perlenbänke, seltene Algen' },
            { key: 'tradeGoods', label: 'Fischerei- & Meereserzeugnisse', placeholder: 'Pökelfisch, Tran, Muscheln' },
            { key: 'accessRoutes', label: 'Handelsrouten & Passagen', placeholder: 'Wichtige Seewege und Durchfahrten' },
            { key: 'lawEnforcement', label: 'Überwachung & Piratenjagd', placeholder: 'Küstenschutzgeschwader, Freibeuterpatrouillen' }
          ]
        }
      ];
      break;

    case 'insel':
      groups = [
        {
          groupTitle: 'Herrschaft & Bevölkerung',
          fields: [
            { key: 'ruler', label: 'Herrscher / Inseloberhaupt', placeholder: 'Inselhäuptling, Gouverneur, Kapitän' },
            { key: 'overlord', label: 'Übergeordnete Macht', placeholder: 'Kolonialreich, Seebund oder unabhängig' },
            { key: 'population', label: 'Einwohnerzahl', placeholder: 'Gesamtzahl der Bewohner' },
            { key: 'combatReadyPopulation', label: 'Kampffähige Inselbewohner', placeholder: 'Wehrhafte Küstenwächter, Krieger' },
            { key: 'lawEnforcement', label: 'Ordnungshüter', placeholder: 'Hafenmeisterei, Stammeswache' }
          ]
        },
        {
          groupTitle: 'Wirtschaft & Natur',
          fields: [
            { key: 'dailyJobs', label: 'Arbeiten der Inselbewohner', placeholder: 'Fischerei, Bootsbau, Kokosernte, Perlentauchen' },
            { key: 'tradeGoods', label: 'Waren für Schiffe', placeholder: 'Frischwasser, Früchte, Edelhölzer' },
            { key: 'tradeDemands', label: 'Benötigte Waren von Handelsschiffen', placeholder: 'Eisenwerkzeuge, Schießpulver, Stoffe' },
            { key: 'resources', label: 'Ressourcen', placeholder: 'Trinkwasserquellen, Hartholz, Minen' },
            { key: 'dangerLevel', label: 'Gefahren', placeholder: 'Tropenkrankheiten, Riffhaie, Piratenbuchten' }
          ]
        },
        {
          groupTitle: 'Geografie & Zugang',
          fields: [
            { key: 'terrain', label: 'Gelände', placeholder: 'Vulkanischer Kegel, Sandstrände, Mangroven' },
            { key: 'accessRoutes', label: 'Ankerplätze & Zuwege', placeholder: 'Geschützte Bucht, Klippenlandung' }
          ]
        }
      ];
      break;

    case 'ort':
    case 'gebaeude':
    case 'gebäude':
      groups = [
        {
          groupTitle: 'Besitz & Leitung',
          fields: [
            { key: 'ruler', label: 'Besitzer / Verwalter', placeholder: 'Eigentümer, Pächter, Wirt oder Gildenmeister' },
            { key: 'overlord', label: 'Übergeordneter Dienstherr', placeholder: 'Grundherr, Fürst oder Orden' },
            { key: 'population', label: 'Personal & Bewohner', placeholder: 'Anzahl des Personals, der Gehilfen oder Gäste' },
            { key: 'combatReadyPopulation', label: 'Wehrhafte Personen vor Ort', placeholder: 'Bewaffnete Wachleute, Türsteher, Gesellen' },
            { key: 'lawEnforcement', label: 'Sicherheit & Hausrecht', placeholder: 'Wachdienst, Haussperre, Alarmanlage' }
          ]
        },
        {
          groupTitle: 'Betrieb, Handel & Aufgaben',
          fields: [
            { key: 'trade', label: 'Funktion & Bestimmung', placeholder: 'Gasthaus, Schmiede, Poststation, Wachturm' },
            { key: 'dailyJobs', label: 'Tätigkeiten des Personals', placeholder: 'Ausschank, Vorratsbeschaffung, Ofendienst' },
            { key: 'localTasks', label: 'Laufende Aufgaben & Pflichten', placeholder: 'Feuerholz hacken, Vorräte prüfen, Gäste bewirten' },
            { key: 'tradeGoods', label: 'Angebotene Waren / Dienste', placeholder: 'Warme Mahlzeiten, Betten, Reparaturdienste' },
            { key: 'tradeDemands', label: 'Bedarf & Vorräte', placeholder: 'Mehl, Schinken, Bierfässer, Kerzen' },
            { key: 'resources', label: 'Ausstattung & Werkzeuge', placeholder: 'Braukessel, Esse, Amboss, Vorratskammer' }
          ]
        },
        {
          groupTitle: 'Schutz, Zuwege & Besonderheiten',
          fields: [
            { key: 'defenseStructures', label: 'Schutz & Verriegelung', placeholder: 'Verstärkte Türen, Riegel, Fallgitter' },
            { key: 'accessRoutes', label: 'Zugangswege', placeholder: 'Straße am Ortseingang, Hintereingang' },
            { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Geheimer Keller, Aussichtsterrasse' }
          ]
        }
      ];
      break;

    case 'dungeon':
      groups = [
        {
          groupTitle: 'Aufbau & Bedrohung',
          fields: [
            { key: 'dangerLevel', label: 'Gefahrenstufe', placeholder: 'Tödliche Fallen, uralte Flüche, hohe Bedrohung' },
            { key: 'population', label: 'Bewohner & Monster', placeholder: 'Goblins, Untote Wächter, Riesenspinnen' },
            { key: 'combatReadyPopulation', label: 'Kampffähige Feinde', placeholder: 'Anzahl kampfbereiter Feinde im Gewölbe' },
            { key: 'dungeons', label: 'Aufbau & Etagen', placeholder: '3 Tiefenebenen: Katakomben, Gruft, Ritualsaal' }
          ]
        },
        {
          groupTitle: 'Schutzbauten, Schätze & Zuwege',
          fields: [
            { key: 'defenseStructures', label: 'Fallen & Sperren', placeholder: 'Druckplatten, Fallgatter, Giftpfeile' },
            { key: 'resources', label: 'Schätze & Erze', placeholder: 'Truhen mit Gold, seltene Kristalle' },
            { key: 'accessRoutes', label: 'Eingang & Zugänge', placeholder: 'Verborgener Höhlenspalt hinter dem Wasserfall' },
            { key: 'pointsOfInterest', label: 'Besondere Kammern', placeholder: 'Altar des Erzvampirs, Runentor' }
          ]
        }
      ];
      break;

    default:
      groups = [
        {
          groupTitle: 'Herrschaft & Bevölkerung',
          fields: [
            { key: 'ruler', label: 'Herrscher / Anführer', placeholder: 'Name oder Titel der Führung' },
            { key: 'overlord', label: 'Übergeordnete Herrschaft', placeholder: 'Wer hierarchisch darüber steht' },
            { key: 'population', label: 'Bevölkerung', placeholder: 'Einwohnerzahl' },
            { key: 'combatReadyPopulation', label: 'Kampffähige Bewohner', placeholder: 'Anzahl kampffähiger Personen' }
          ]
        },
        {
          groupTitle: 'Verteidigung & Gefahren',
          fields: [
            { key: 'defenseStructures', label: 'Verteidigungsanlagen', placeholder: 'Palisade, Mauern, Graben' },
            { key: 'standingArmy', label: 'Wache / Truppen', placeholder: 'Wachpersonal oder Garnison' },
            { key: 'dangerLevel', label: 'Gefahrenstufe', placeholder: 'Sicherheitsrisiken vor Ort' }
          ]
        },
        {
          groupTitle: 'Wirtschaft & Aufgaben',
          fields: [
            { key: 'dailyJobs', label: 'Berufe der Bewohner', placeholder: 'Tätigkeiten und Erwerbszweige' },
            { key: 'localTasks', label: 'Tägliche Aufgaben', placeholder: 'Pflichten und Arbeiten' },
            { key: 'tradeGoods', label: 'Handelsgüter', placeholder: 'Vorhandene Waren' },
            { key: 'tradeDemands', label: 'Gesuchte Güter', placeholder: 'Benötigte Waren' }
          ]
        },
        {
          groupTitle: 'Geografie & Zuwege',
          fields: [
            { key: 'terrain', label: 'Gelände', placeholder: 'Topografie' },
            { key: 'climate', label: 'Klima', placeholder: 'Wetterbedingungen' },
            { key: 'accessRoutes', label: 'Zuwege', placeholder: 'Straßen und Pfade' },
            { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Wichtige Orte' }
          ]
        }
      ];
      break;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {groups.map((group, gIdx) => (
        <div key={`group-${gIdx}`} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
            {group.groupTitle}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {group.fields.map(({ key, label, placeholder }) => renderField(key, label, placeholder))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TerritorySpecificFields;

