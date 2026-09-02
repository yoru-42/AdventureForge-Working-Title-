import React from 'react';
import { Territory } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

export interface TerritorySpecificFieldsProps {
  territory: Partial<Territory>;
  updateTerritory: (changes: Partial<Territory>) => void;
  className?: string;
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

  let fields: Array<{ key: keyof Territory; label: string; placeholder: string }> = [];

  switch (typeKey) {
    case 'kontinent':
      fields = [
        { key: 'size', label: 'Größe', placeholder: 'Flächenausdehnung in km² oder Meilen' },
        { key: 'climate', label: 'Klima', placeholder: 'Klimazonen von Nord bis Süd' },
        { key: 'resources', label: 'Ressourcen', placeholder: 'Wichtige Rohstoffe, Erze, Wälder' },
        { key: 'culture', label: 'Kulturen / Völker', placeholder: 'Vorherrschende Völker und Kulturen' },
        { key: 'government', label: 'Politische Ordnung', placeholder: 'Reiche, Königreiche, Bündnisse' },
        { key: 'militaryStrength', label: 'Militärische Bedeutung', placeholder: 'Machtblöcke, Großmächte' }
      ];
      break;

    case 'meer':
    case 'ozean':
    case 'bucht':
    case 'see':
    case 'fluss':
    case 'wasser':
      fields = [
        { key: 'size', label: 'Ausdehnung', placeholder: 'Fläche oder Längenausdehnung' },
        { key: 'climate', label: 'Meeresklima', placeholder: 'Wetterbedingungen, Strömungen, Stürme' },
        { key: 'resources', label: 'Meeresressourcen', placeholder: 'Fischgründe, Perlen, seltene Algen' },
        { key: 'trade', label: 'Handelsrouten', placeholder: 'Wichtige Seewege und Passagen' },
        { key: 'dangerLevel', label: 'Gefahren', placeholder: 'Riffe, Untiefen, Ungeheuer, Piraten' },
        { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Inselketten, Schiffswracks, Strudel' }
      ];
      break;

    case 'insel':
      fields = [
        { key: 'size', label: 'Größe', placeholder: 'Fläche der Insel' },
        { key: 'terrain', label: 'Gelände', placeholder: 'Vulkanisch, flach, felsig' },
        { key: 'biome', label: 'Biom', placeholder: 'Tropisch, dicht bewaldet, öd' },
        { key: 'resources', label: 'Ressourcen', placeholder: 'Einheimische Pflanzengüter, Minen' },
        { key: 'population', label: 'Bevölkerung', placeholder: 'Einwohnerzahl und Stämme' },
        { key: 'dangerLevel', label: 'Gefahren', placeholder: 'Küstengefahren, wilde Tiere, Raubüberfälle' }
      ];
      break;

    case 'region':
    case 'koenigreich':
    case 'land':
    case 'unabhaengiges_gebiet':
    case 'unbekanntes_land':
    case 'geografische_flaeche':
      fields = [
        { key: 'terrain', label: 'Landschaft', placeholder: 'Hügelebenen, Waldgebiete, Flussläufe' },
        { key: 'biome', label: 'Biom', placeholder: 'Gemäßigter Wald, Steppe, Tundra' },
        { key: 'climate', label: 'Klima', placeholder: 'Jahreszeiten und Temperaturverlauf' },
        { key: 'resources', label: 'Ressourcen', placeholder: 'Holz, Eisen, Landwirtschaft' },
        { key: 'population', label: 'Bevölkerung', placeholder: 'Schätzung der Gesamtbevölkerung' },
        { key: 'trade', label: 'Wirtschaft / Handel', placeholder: 'Hauptwirtschaftszweige und Märkte' },
        { key: 'militaryStrength', label: 'Militär', placeholder: 'Regionale Truppen und Milizen' },
        { key: 'dangerLevel', label: 'Gefahren', placeholder: 'Wegelagerer, Raubtiere, Grenzkonflikte' }
      ];
      break;

    case 'zone':
      fields = [
        { key: 'terrain', label: 'Gelände', placeholder: 'Sumpf, Ruinenfeld, Ödland' },
        { key: 'biome', label: 'Biom', placeholder: 'Magisch verzerrt, feucht, toxisch' },
        { key: 'climate', label: 'Klima', placeholder: 'Lokale Wetteranomalien' },
        { key: 'resources', label: 'Ressourcen', placeholder: 'Seltene Kräuter, magische Artefakte' },
        { key: 'dangerLevel', label: 'Gefahrenstufe', placeholder: 'Sicherheits- oder Bedrohungsstufe' },
        { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Alte Tempel, Anomalien' }
      ];
      break;

    case 'stadt':
    case 'hafen':
    case 'festung':
      fields = [
        { key: 'population', label: 'Bevölkerung', placeholder: 'Einwohnerzahl' },
        { key: 'ruler', label: 'Herrscher / Leitung', placeholder: 'Name oder Titel der Führung' },
        { key: 'government', label: 'Regierungsform', placeholder: 'Stadtrat, Gildenrat, Monarchie' },
        { key: 'culture', label: 'Kultur / Völker', placeholder: 'Ethnische Zusammensetzung' },
        { key: 'trade', label: 'Wirtschaft / Handel', placeholder: 'Zentraler Marktplatz, Gilden' },
        { key: 'resources', label: 'Wichtige Ressourcen', placeholder: 'Verarbeitete Güter, Waffen' },
        { key: 'militaryStrength', label: 'Militär / Garnison', placeholder: 'Truppenstärke und Wache' },
        { key: 'defense', label: 'Verteidigung', placeholder: 'Stadtmauern, Türme, Burggraben' },
        { key: 'exports', label: 'Exporte', placeholder: 'Ausgehende Handelswaren' },
        { key: 'imports', label: 'Importe', placeholder: 'Benötigte Rohstoffe' },
        { key: 'landmarks', label: 'Wichtige Bauwerke', placeholder: 'Rathaus, Tempel, Palast' },
        { key: 'pointsOfInterest', label: 'Sehenswürdigkeiten', placeholder: 'Besondere Orte in der Stadt' }
      ];
      break;

    case 'dorf':
      fields = [
        { key: 'population', label: 'Bevölkerung', placeholder: 'Einwohnerzahl des Dorfes' },
        { key: 'ruler', label: 'Dorfvorsteher / Leitung', placeholder: 'Ältestenrat oder Schulze' },
        { key: 'culture', label: 'Kultur / Völker', placeholder: 'Dorfgemeinschaft und Bräuche' },
        { key: 'trade', label: 'Wirtschaft', placeholder: 'Landwirtschaft, Viehzucht, Handwerk' },
        { key: 'resources', label: 'Ressourcen', placeholder: 'Getreide, Holz, Vieh' },
        { key: 'defense', label: 'Verteidigung', placeholder: 'Palisaden, Graben, Dorfmiliz' },
        { key: 'dangerLevel', label: 'Gefahren', placeholder: 'Wildtiere, Überfälle' },
        { key: 'landmarks', label: 'Wichtige Orte', placeholder: 'Dorfplatz, Brunnen, Schmiede' }
      ];
      break;

    case 'ort':
      fields = [
        { key: 'ruler', label: 'Besitzer / Verantwortlicher', placeholder: 'Verwalter, Eigentümer, Gilde' },
        { key: 'population', label: 'Bewohner / Personal', placeholder: 'Anzahl des Personals oder der Gäste' },
        { key: 'trade', label: 'Funktion', placeholder: 'Gasthaus, Poststation, Aussichtspunkt' },
        { key: 'resources', label: 'Wichtige Güter', placeholder: 'Vorräte, Ausrüstung, Heilmittel' },
        { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Verstecke, Aussicht, Architektur' }
      ];
      break;

    case 'dungeon':
      fields = [
        { key: 'terrain', label: 'Umgebung', placeholder: 'Höhlensystem, Katakomben, Mine' },
        { key: 'dangerLevel', label: 'Gefahrenstufe', placeholder: 'Bedrohungsstufe und Fallen' },
        { key: 'population', label: 'Bewohner', placeholder: 'Monstertypen, Banditen, Wächter' },
        { key: 'resources', label: 'Ressourcen / Schätze', placeholder: 'Erzadern, Schatzkammern' },
        { key: 'dungeons', label: 'Aufbau / Ebenen', placeholder: 'Anzahl der Etagen oder Gewölbe' },
        { key: 'pointsOfInterest', label: 'Besondere Bereiche', placeholder: 'Bossraum, Altar, Falle' }
      ];
      break;

    case 'gebaeude':
    case 'gebäude':
      fields = [
        { key: 'ruler', label: 'Besitzer', placeholder: 'Eigentümer oder Pächter' },
        { key: 'population', label: 'Personal / Bewohner', placeholder: 'Anzahl der Anwesenden' },
        { key: 'trade', label: 'Funktion', placeholder: 'Nutzung des Gebäudes' },
        { key: 'resources', label: 'Ausstattung', placeholder: 'Werkzeuge, Inventar, Ausrüstung' },
        { key: 'defense', label: 'Sicherheit', placeholder: 'Schlösser, Geheimgänge, Wachen' },
        { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Architektonische Details' }
      ];
      break;

    default:
      fields = [
        { key: 'terrain', label: 'Landschaft / Gelände', placeholder: 'Topografie und Geländemerkmale' },
        { key: 'climate', label: 'Klima', placeholder: 'Wetterbedingungen' },
        { key: 'population', label: 'Bevölkerung', placeholder: 'Anzahl der Bewohner' },
        { key: 'resources', label: 'Ressourcen', placeholder: 'Vorhandene Güter' },
        { key: 'dangerLevel', label: 'Gefahren', placeholder: 'Sicherheitsrisiken' },
        { key: 'pointsOfInterest', label: 'Besonderheiten', placeholder: 'Besondere Merkmale' }
      ];
      break;
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
      {fields.map(({ key, label, placeholder }) => renderField(key, label, placeholder))}
    </div>
  );
};

export default TerritorySpecificFields;
