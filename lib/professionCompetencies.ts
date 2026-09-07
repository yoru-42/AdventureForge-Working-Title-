import { ProfessionCompetency } from '../types';

export interface ProfessionCompetencyDefinition {
  id: string;
  professionId: string;
  name: string;
  category: ProfessionCompetency['category'];
  description: string;
  relatedCompetencyIds?: string[];
}

export interface ProfessionFieldDefinition {
  id: string;
  name: string;
  description: string;
}

export interface ProfessionCatalogEntry {
  professionId: string;
  professionName: string;
  fieldId: string;
  fieldName: string;
  aliases: string[];
  specializations: string[];
  possibleRanks: string[];
  competencies: ProfessionCompetencyDefinition[];
}

/**
 * The 19 core professional fields defined in AdventureForge Berufssystem V2.
 * Expandable and not hardcoded into UI lists.
 */
export const PROFESSION_FIELDS: ProfessionFieldDefinition[] = [
  { id: 'bau_handwerk', name: 'Bau & Handwerk', description: 'Holz-, Stein-, Metall- und Werkstoffbearbeitung sowie Hoch- und Tiefbau' },
  { id: 'lebensmittel_ernaehrung', name: 'Lebensmittel & Ernährung', description: 'Herstellung, Veredelung und Zubereitung von Speisen, Backwaren und Getränken' },
  { id: 'natur_landwirtschaft', name: 'Natur & Landwirtschaft', description: 'Feldbau, Forstwirtschaft, Jagd, Fischerei und Hege natürlicher Ressourcen' },
  { id: 'tierhaltung', name: 'Tierhaltung', description: 'Zucht, Hütung, Ausbildung und Pflege von Nutztieren und Arbeitstieren' },
  { id: 'wissenschaft_forschung', name: 'Wissenschaft & Forschung', description: 'Naturforschung, Mathematik, Astronomie, Gelehrsamkeit und Ingenieurwesen' },
  { id: 'medizin_heilkunde', name: 'Medizin & Heilkunde', description: 'Wundarznei, Diagnostik, Chirurgie, Kräuterheilkunde und Krankenpflege' },
  { id: 'handel_wirtschaft', name: 'Handel & Wirtschaft', description: 'Kaufmannswesen, Markthandel, Warentransport, Banken und Kontore' },
  { id: 'verwaltung_recht', name: 'Verwaltung & Recht', description: 'Rechtspflege, städtische Ämter, Kanzleiwesen, Steuern und Stadtordnung' },
  { id: 'militaer_sicherheit', name: 'Militär & Sicherheit', description: 'Stadtwache, Garnisonsdienst, Wehrwesen, Taktik und Befestigung' },
  { id: 'seefahrt', name: 'Seefahrt', description: 'Nautik, Takelage, Schiffsführung, Küsten- und Hochseefahrt' },
  { id: 'transport_logistik', name: 'Transport & Logistik', description: 'Fuhrmannswesen, Karawanenführung, Speicherverwaltung und Botendienste' },
  { id: 'kunst_kultur', name: 'Kunst & Kultur', description: 'Bildende Künste, Bildhauerei, Malerei, Dichtkunst und Theater' },
  { id: 'unterhaltung', name: 'Unterhaltung', description: 'Gaukelei, Bardenkunst, Musik, Spielmannswesen und Artistik' },
  { id: 'religion_klerus', name: 'Religion & Klerus', description: 'Gottesdienst, Liturgie, Riten, Seelsorge und theologische Lehre' },
  { id: 'magie_arkana', name: 'Magie & Arkane Künste', description: 'Arkanes Studium, Runenzeichnen, Spruchwirken und Ritualmagie' },
  { id: 'alchemie', name: 'Alchemie', description: 'Destillation, Reagenzienkunde, Transmutation und Trankbrauerei' },
  { id: 'bergbau_rohstoffe', name: 'Bergbau & Rohstoffe', description: 'Stollenbau, Erzgewinnung, Schurftechnik und Gesteinsprüfung' },
  { id: 'schrift_bildung', name: 'Schrift & Bildung', description: 'Kalligraphie, Schriftführung, Buchbinderei, Lehramt und Urkundenlehre' },
  { id: 'dienstleistungen', name: 'Dienstleistungen', description: 'Gastgewerbe, Herbergen, persönliche Dienste und Versorgungsaufgaben' },
  { id: 'adel_herrschaft', name: 'Adel & Herrschaft', description: 'Regenten, Adelsgeschlechter, Hofämter und dynastische Nachkommen' },
  { id: 'abenteuer_sondergewerbe', name: 'Abenteuer & Sondergewerbe', description: 'Erkundung, Reliktjagd, Späher und verdeckte Sondergewerbe' }
];

export const PROFESSION_COMPETENCY_CATALOG: ProfessionCatalogEntry[] = [
  // ---------------------------------------------------------------------------
  // 1. SCHMIED (Bau & Handwerk)
  // ---------------------------------------------------------------------------
  {
    professionId: 'schmied',
    professionName: 'Schmied',
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    aliases: ['schmied', 'waffenschmied', 'rüstschmied', 'grobschmied', 'hufschmied', 'blacksmith'],
    specializations: ['Waffenschmied', 'Rüstschmied', 'Grobschmied', 'Hufschmied', 'Klingenschmied', 'Gesenkschmied'],
    possibleRanks: ['Lehrling', 'Geselle', 'Altgeselle', 'Meister', 'Zunftmeister'],
    competencies: [
      { id: 'schmied_feuer', professionId: 'schmied', name: 'Schmiedefeuer entzünden', category: 'Grundlage', description: 'Sicheres Entfachen und Regulieren des Feuers mit Blasebalg und Zugluft.', relatedCompetencyIds: ['schmied_temperatur', 'schmied_brennstoff'] },
      { id: 'schmied_brennstoff', professionId: 'schmied', name: 'Brennstoff vorbereiten', category: 'Grundlage', description: 'Auswahl und Zerkleinerung von Kohle, Koks und Holzkohle für die optimale Hitze.', relatedCompetencyIds: ['schmied_feuer'] },
      { id: 'schmied_temperatur', professionId: 'schmied', name: 'Schmiedetemperatur beurteilen', category: 'Grundlage', description: 'Exakte Beurteilung der Werkstücktemperatur anhand von Glühfarben von Kirschrot bis Weißglut.', relatedCompetencyIds: ['schmied_feuer', 'schmied_eisen', 'schmied_stahl'] },
      { id: 'schmied_amboss', professionId: 'schmied', name: 'Amboss sicher benutzen', category: 'Grundlage', description: 'Nutzung von Bahn, Horn, Voramboss und Gesenklöchern für kontrolliertes Umformen.', relatedCompetencyIds: ['schmied_hammer', 'schmied_halten'] },
      { id: 'schmied_hammer', professionId: 'schmied', name: 'Hammerführung', category: 'Grundlage', description: 'Rhythmische, kraftsparende und präzise Schlagtechnik mit verschiedenen Schmiedehämmern.', relatedCompetencyIds: ['schmied_amboss', 'schmied_halten'] },
      { id: 'schmied_halten', professionId: 'schmied', name: 'Werkstück richtig halten', category: 'Grundlage', description: 'Sicherer Halt des glühenden Metalls mit passenden Schmiedezangen ohne Verrutschen.', relatedCompetencyIds: ['schmied_hammer', 'schmied_amboss'] },
      { id: 'schmied_bronze', professionId: 'schmied', name: 'Bronze bearbeiten', category: 'Fortgeschritten', description: 'Schmieden, Warmumformen und Glühen von Kupfer- und Bronzelegierungen.', relatedCompetencyIds: ['schmied_kupfer', 'schmied_eisen'] },
      { id: 'schmied_kupfer', professionId: 'schmied', name: 'Kupfer bearbeiten', category: 'Fortgeschritten', description: 'Kaltverformung, Treiben und Weichglühen von Kupferblechen und Werkstücken.', relatedCompetencyIds: ['schmied_bronze'] },
      { id: 'schmied_eisen', professionId: 'schmied', name: 'Eisen bearbeiten', category: 'Fortgeschritten', description: 'Umformen, Recken, Stauchen und Spalten von Schmiedeeisen.', relatedCompetencyIds: ['schmied_temperatur', 'schmied_stahl'] },
      { id: 'schmied_stahl', professionId: 'schmied', name: 'Stahl bearbeiten', category: 'Fortgeschritten', description: 'Präzises Schmieden kohlenstoffhaltiger Stähle unter Vermeidung von Entkohlung und Verbrennung.', relatedCompetencyIds: ['schmied_eisen', 'schmied_haerten'] },
      { id: 'schmied_haerten', professionId: 'schmied', name: 'Härten & Anlassen', category: 'Fortgeschritten', description: 'Abschrecken in Öl oder Wasser und gezieltes Anlassen zur Einstellung von Zähigkeit und Härte.', relatedCompetencyIds: ['schmied_stahl', 'schmied_dolche', 'schmied_katana'] },
      { id: 'schmied_dolche', professionId: 'schmied', name: 'Dolche schmieden', category: 'Spezialisierung', description: 'Fertigung führiger Klingen mit ausgeprägter Angel und stabiler Spitze.', relatedCompetencyIds: ['schmied_stahl', 'schmied_haerten', 'schmied_schwerter'] },
      { id: 'schmied_schwerter', professionId: 'schmied', name: 'Langschwerter schmieden', category: 'Spezialisierung', description: 'Ausgewogene Gewichtsverteilung, Hohlkehlenschlag und elastische Klingengeometrie.', relatedCompetencyIds: ['schmied_dolche', 'schmied_katana'] },
      { id: 'schmied_aexte', professionId: 'schmied', name: 'Äxte & Beile schmieden', category: 'Spezialisierung', description: 'Dornen des Hausauges und Einfeuern harter Schneidstähle in zähe Eisenkörper.', relatedCompetencyIds: ['schmied_eisen', 'schmied_stahl'] },
      { id: 'schmied_huf', professionId: 'schmied', name: 'Hufeisen anpassen & beschlagen', category: 'Spezialisierung', description: 'Passgenaues Formen und Heißaufpassen von Hufeisen auf den Hufstrahl.', relatedCompetencyIds: ['schmied_eisen', 'schmied_feuer'] },
      { id: 'schmied_ruestung', professionId: 'schmied', name: 'Rüstung schmieden', category: 'Meisterschaft', description: 'Treiben anatomisch angepasster Plattenharnische mit abgleitenden Schlagflächen.', relatedCompetencyIds: ['schmied_stahl', 'schmied_haerten'] },
      { id: 'schmied_damast', professionId: 'schmied', name: 'Damaszenerstahl falten', category: 'Meisterschaft', description: 'Feuerverschweißen härtbarer und zäher Stahlschichten zu hochfesten Verbundklingen.', relatedCompetencyIds: ['schmied_stahl', 'schmied_katana'] },
      { id: 'schmied_katana', professionId: 'schmied', name: 'Katana schmieden', category: 'Meisterschaft', description: 'Traditionelle Klingenfertigung mit selektiver Lehmmantelhärtung und feiner Krümmung.', relatedCompetencyIds: ['schmied_damast', 'schmied_haerten'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 2. GERBER (Bau & Handwerk – Exakte V2-Kompetenzen nach Abschnitt 7)
  // ---------------------------------------------------------------------------
  {
    professionId: 'gerber',
    professionName: 'Gerber',
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    aliases: ['gerber', 'ledergerber', 'weißgerber', 'rotgerber', 'lohgerber', 'tanner'],
    specializations: ['Lohgerber (Pflanzlich)', 'Weißgerber (Alaun & Mineral)', 'Sämischgerber (Fett & Wildleder)', 'Rüstleder-Spezialist'],
    possibleRanks: ['Lehrling', 'Geselle', 'Meister', 'Zunftmeister'],
    competencies: [
      // Grundlagen
      { id: 'gerber_reinigen', professionId: 'gerber', name: 'Häute reinigen', category: 'Grundlage', description: 'Gründliches Auswaschen von Blut, Schmutz und Konservierungssalzen in fließendem Wasser.', relatedCompetencyIds: ['gerber_entfleischen', 'gerber_spannen'] },
      { id: 'gerber_entfleischen', professionId: 'gerber', name: 'Häute entfleischen', category: 'Grundlage', description: 'Sorgfältiges Abschaben von Fleisch-, Fett- und Unterhautgewebe mit dem Scherdeckenmesser.', relatedCompetencyIds: ['gerber_reinigen', 'gerber_spannen'] },
      { id: 'gerber_spannen', professionId: 'gerber', name: 'Häute spannen', category: 'Grundlage', description: 'Gleichmäßiges Aufspannen auf Rahmen zur Vermeidung von Faltenbildung und Verzug.', relatedCompetencyIds: ['gerber_reinigen', 'gerber_trocknen'] },
      { id: 'gerber_trocknen', professionId: 'gerber', name: 'Häute trocknen', category: 'Grundlage', description: 'Kontrolliertes Lufttrocknen im Schatten zur Vermeidung von Fäulnis oder Leimbrüchigkeit.', relatedCompetencyIds: ['gerber_spannen'] },

      // Gerbung
      { id: 'gerber_pflanzlich', professionId: 'gerber', name: 'Pflanzlich gerben', category: 'Fortgeschritten', description: 'Klassische Lohgerbung mit Eichen-, Fichten- oder Kastanienrinde in tiefen Gerbgruben.', relatedCompetencyIds: ['gerber_gerbstoffe', 'gerber_ruestleder'] },
      { id: 'gerber_mineralisch', professionId: 'gerber', name: 'Mineralisch gerben', category: 'Fortgeschritten', description: 'Weißgerbung mit Alaun und Kochsalz für besonders geschmeidige, helle Leder.', relatedCompetencyIds: ['gerber_weichleder', 'gerber_ziegenhaut'] },
      { id: 'gerber_fettgerbung', professionId: 'gerber', name: 'Fettgerbung durchführen', category: 'Fortgeschritten', description: 'Sämischgerbung mit Tran und tierischen Fetten für samtiges, wasserabweisendes Wildleder.', relatedCompetencyIds: ['gerber_wildleder'] },
      { id: 'gerber_gerbstoffe', professionId: 'gerber', name: 'Gerbstoffe ansetzen', category: 'Fortgeschritten', description: 'Herstellung und Dosierung von Gerbbrühen unterschiedlicher Konzentration.', relatedCompetencyIds: ['gerber_pflanzlich'] },

      // Materialien
      { id: 'gerber_rinderhaut', professionId: 'gerber', name: 'Rinderhaut bearbeiten', category: 'Spezialisierung', description: 'Schwere, widerstandsfähige Rohhäute für Sohlen, Gurte und Rüstungen zurichten.', relatedCompetencyIds: ['gerber_ruestleder', 'gerber_schuhleder'] },
      { id: 'gerber_ziegenhaut', professionId: 'gerber', name: 'Ziegenhaut bearbeiten', category: 'Spezialisierung', description: 'Feinnarbiges Leder für Handschuhe, Bucheinbände und feines Schuhwerk gerben.', relatedCompetencyIds: ['gerber_mineralisch', 'gerber_weichleder'] },
      { id: 'gerber_schweinehaut', professionId: 'gerber', name: 'Schweinehaut bearbeiten', category: 'Spezialisierung', description: 'Poriges, reißfestes Leder fachgerecht enthaaren und geschmeidig machen.', relatedCompetencyIds: ['gerber_reinigen'] },
      { id: 'gerber_wildleder', professionId: 'gerber', name: 'Wildleder herstellen', category: 'Spezialisierung', description: 'Verarbeitung von Hirsch- und Rehdecken zu weichem, atmungsaktivem Bekleidungsleder.', relatedCompetencyIds: ['gerber_fettgerbung'] },
      { id: 'gerber_exotisch', professionId: 'gerber', name: 'Exotische Häute bearbeiten', category: 'Meisterschaft', description: 'Fachgerechtes Gerben seltener Reptilien-, Schlangen-, Rochen- oder Monsterhäute.', relatedCompetencyIds: ['gerber_hochwertig'] },

      // Produkte
      { id: 'gerber_ruestleder', professionId: 'gerber', name: 'Rüstleder herstellen', category: 'Spezialisierung', description: 'Gehärtetes, gewachstes Leder (Cuir Bouilli) mit hoher Stich- und Schnittfestigkeit.', relatedCompetencyIds: ['gerber_rinderhaut', 'gerber_pflanzlich'] },
      { id: 'gerber_schuhleder', professionId: 'gerber', name: 'Schuhleder herstellen', category: 'Spezialisierung', description: 'Widerstandsfähiges Oberleder und dicke Sohlenschichten für strapazierfähiges Schuhwerk.', relatedCompetencyIds: ['gerber_rinderhaut'] },
      { id: 'gerber_weichleder', professionId: 'gerber', name: 'Weiches Leder herstellen', category: 'Spezialisierung', description: 'Geschmeidiges Zurichten durch Walken, Falzen und Fetten für Beutel und Kleidung.', relatedCompetencyIds: ['gerber_ziegenhaut', 'gerber_mineralisch'] },
      { id: 'gerber_hochwertig', professionId: 'gerber', name: 'Hochwertiges Leder herstellen', category: 'Meisterschaft', description: 'Makellose Färbung, Glanzstoßen und Narbenprägung für königliche und edle Luxuswaren.', relatedCompetencyIds: ['gerber_exotisch', 'gerber_weichleder'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 3. KOCH (Lebensmittel & Ernährung)
  // ---------------------------------------------------------------------------
  {
    professionId: 'koch',
    professionName: 'Koch',
    fieldId: 'lebensmittel_ernaehrung',
    fieldName: 'Lebensmittel & Ernährung',
    aliases: ['koch', 'köchin', 'hofkoch', 'speisenmeister', 'cook', 'chef'],
    specializations: ['Fleischküche', 'Fischküche', 'Hof- & Festmahlküche', 'Feld- & Reiseküche', 'Pasteten & Teigwaren'],
    possibleRanks: ['Küchenjunge', 'Beikoch', 'Koch', 'Chefkoch', 'Hofküchenmeister'],
    competencies: [
      { id: 'koch_messer', professionId: 'koch', name: 'Messer sicher benutzen', category: 'Grundlage', description: 'Präzise und sichere Schnitttechniken mit Hack-, Ausbein- und Gemüsemessern.', relatedCompetencyIds: ['koch_fleisch_schneiden', 'koch_gemuese'] },
      { id: 'koch_zutaten', professionId: 'koch', name: 'Zutaten vorbereiten & putzen', category: 'Grundlage', description: 'Waschen, Schälen, Zerkleinern und Entkernen von Gemüse, Kräutern und Pilzen.', relatedCompetencyIds: ['koch_messer', 'koch_hygiene'] },
      { id: 'koch_hygiene', professionId: 'koch', name: 'Küchenhygiene & Lagerung', category: 'Grundlage', description: 'Kühle Vorratshaltung, Verderbschutz und Sauberkeit an Schneidebrettern und Töpfen.', relatedCompetencyIds: ['koch_zutaten'] },
      { id: 'koch_hitze', professionId: 'koch', name: 'Herdhitze regulieren', category: 'Grundlage', description: 'Beherrschung von Holzfeuer, Glutzonen und Kesselabstand beim Kochen.', relatedCompetencyIds: ['koch_suppen', 'koch_braten'] },
      { id: 'koch_wuerzen', professionId: 'koch', name: 'Würzen & Abschmecken', category: 'Fortgeschritten', description: 'Harmonischer Einsatz von Salz, Kräutern, Essig, Honig und seltenen Gewürzen.', relatedCompetencyIds: ['koch_suppen', 'koch_saucen'] },
      { id: 'koch_suppen', professionId: 'koch', name: 'Suppen & Eintöpfe kochen', category: 'Fortgeschritten', description: 'Kräftige Knochenbrühen ansetzen und nahrhafte Eintöpfe langsam sieden lassen.', relatedCompetencyIds: ['koch_wuerzen', 'koch_hitze'] },
      { id: 'koch_fleisch_schneiden', professionId: 'koch', name: 'Fleisch zerlegen & parieren', category: 'Fortgeschritten', description: 'Gekonntes Auslösen von Sehnen, Fettdeckeln und Zuschneiden von Bratenstücken.', relatedCompetencyIds: ['koch_messer', 'koch_braten'] },
      { id: 'koch_braten', professionId: 'koch', name: 'Fleisch braten & schmoren', category: 'Fortgeschritten', description: 'Scharfes Anbraten am offenen Spieß und butterzartes Schmoren im gusseisernen Bräter.', relatedCompetencyIds: ['koch_fleisch_schneiden', 'koch_hitze'] },
      { id: 'koch_fisch', professionId: 'koch', name: 'Fisch zubereiten', category: 'Spezialisierung', description: 'Entschuppen, Ausnehmen, Filetieren und schonendes Dünsten empfindlicher Fische.', relatedCompetencyIds: ['koch_messer', 'koch_wuerzen'] },
      { id: 'koch_pasteten', professionId: 'koch', name: 'Pasteten & Terrinen backen', category: 'Spezialisierung', description: 'Würzige Farcen in knusprigen Schmalzteigmantel einbacken und mit Gelee füllen.', relatedCompetencyIds: ['koch_fleisch_schneiden', 'koch_wuerzen'] },
      { id: 'koch_saucen', professionId: 'koch', name: 'Feine Saucen montieren', category: 'Spezialisierung', description: 'Eindicken von Fondreduktionen mit kalter Butter, Wein und feinsten Kräutern.', relatedCompetencyIds: ['koch_wuerzen'] },
      { id: 'koch_konservieren', professionId: 'koch', name: 'Pökeln, Räuchern & Einlegen', category: 'Spezialisierung', description: 'Haltbarmachen von Vorräten in Salz, Essigsud, Schmalz oder im Rauchfang.', relatedCompetencyIds: ['koch_hygiene'] },
      { id: 'koch_bankett', professionId: 'koch', name: 'Festmähler & Bankette leiten', category: 'Meisterschaft', description: 'Koordinierte Zubereitung mehrgängiger Menüs für Dutzende Adelige und Gäste.', relatedCompetencyIds: ['koch_bankett_praesentation'] },
      { id: 'koch_bankett_praesentation', professionId: 'koch', name: 'Schaugerichte gestalten', category: 'Meisterschaft', description: 'Täuschend echte Schaustücke aus Zucker, Marzipan, Trüffeln und gebratenem Wild.', relatedCompetencyIds: ['koch_bankett'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 4. BÄCKER (Lebensmittel & Ernährung)
  // ---------------------------------------------------------------------------
  {
    professionId: 'baecker',
    professionName: 'Bäcker',
    fieldId: 'lebensmittel_ernaehrung',
    fieldName: 'Lebensmittel & Ernährung',
    aliases: ['bäcker', 'bäckerin', 'feinbäcker', 'konditor', 'baker'],
    specializations: ['Brotbäckerei', 'Feingebäck & Süßwaren', 'Feld- & Marschbäckerei', 'Sauerteig-Spezialist'],
    possibleRanks: ['Lehrling', 'Geselle', 'Bäckermeister', 'Zunftobermeister'],
    competencies: [
      { id: 'baecker_mehl', professionId: 'baecker', name: 'Mehl & Getreide beurteilen', category: 'Grundlage', description: 'Prüfen von Mahlgrad, Feuchte und Klebergehalt von Roggen-, Weizen- und Gerstenmehl.', relatedCompetencyIds: ['baecker_teig_kneten'] },
      { id: 'baecker_teig_kneten', professionId: 'baecker', name: 'Teig kneten & wirken', category: 'Grundlage', description: 'Gleichmäßiges Auskneten von Hand und formgebendes Rund- und Langwirken der Teiglinge.', relatedCompetencyIds: ['baecker_mehl', 'baecker_sauerteig'] },
      { id: 'baecker_ofen', professionId: 'baecker', name: 'Backofen anheizen & temperieren', category: 'Grundlage', description: 'Befeuern des Steinbackofens mit Buchenholz und Einstellen der optimalen Speicherwärme.', relatedCompetencyIds: ['baecker_brot_backen'] },
      { id: 'baecker_sauerteig', professionId: 'baecker', name: 'Sauerteigansatz pflegen', category: 'Grundlage', description: 'Führen und Füttern lebendiger Sauerteigkulturen für Reife, Aroma und Triebkraft.', relatedCompetencyIds: ['baecker_roggen'] },
      { id: 'baecker_roggen', professionId: 'baecker', name: 'Roggenteig führen', category: 'Fortgeschritten', description: 'Mehrstufige Teigführung für schwere, aromatische und langanhaltend saftige Roggenbrote.', relatedCompetencyIds: ['baecker_sauerteig', 'baecker_brot_backen'] },
      { id: 'baecker_weizen', professionId: 'baecker', name: 'Weizenteig verarbeiten', category: 'Fortgeschritten', description: 'Schonende Dehn- und Falttechniken für luftige Krume und knusprige Kruste.', relatedCompetencyIds: ['baecker_teig_kneten', 'baecker_kleingebaeck'] },
      { id: 'baecker_hefe', professionId: 'baecker', name: 'Hefegebäck herstellen', category: 'Fortgeschritten', description: 'Reiche Teige mit Butter, Honig und Eiern zu Zöpfen und Stollen verarbeiten.', relatedCompetencyIds: ['baecker_weizen'] },
      { id: 'baecker_brot_backen', professionId: 'baecker', name: 'Bauernbrote backen', category: 'Fortgeschritten', description: 'Einschießen mit dem Holzschieber, Dampfschwaden erzeugen und Klopfprobe ausführen.', relatedCompetencyIds: ['baecker_ofen', 'baecker_roggen'] },
      { id: 'baecker_kleingebaeck', professionId: 'baecker', name: 'Kleingebäck & Brötchen formen', category: 'Spezialisierung', description: 'Rasch getaktetes Formen von Semmeln, Brezeln, Wecken und Hörnchen.', relatedCompetencyIds: ['baecker_weizen'] },
      { id: 'baecker_fladen', professionId: 'baecker', name: 'Fladenbrote backen', category: 'Spezialisierung', description: 'Dünnes Ausrollen und schnelles Ausbacken auf heißer Ofenplatte.', relatedCompetencyIds: ['baecker_ofen'] },
      { id: 'baecker_marschbrot', professionId: 'baecker', name: 'Haltbares Marschbrot fertigen', category: 'Spezialisierung', description: 'Doppelt gebackener Zwieback und Hartbrot für Seefahrer, Karawanen und Soldaten.', relatedCompetencyIds: ['baecker_brot_backen'] },
      { id: 'baecker_festtag', professionId: 'baecker', name: 'Festtagsgebäcke verzieren', category: 'Meisterschaft', description: 'Prachtvolle Schaubrote mit geflochtenen Mustern, Teigblättern und Honigglasur.', relatedCompetencyIds: ['baecker_hefe'] },
      { id: 'baecker_langzeit', professionId: 'baecker', name: 'Langzeitführung meistern', category: 'Meisterschaft', description: 'Perfekte Fermentation über Tage bei kühler Temperatur für unvergleichliches Aroma.', relatedCompetencyIds: ['baecker_sauerteig'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 5. METZGER / FLEISCHER (Lebensmittel & Ernährung)
  // ---------------------------------------------------------------------------
  {
    professionId: 'metzger',
    professionName: 'Metzger / Fleischer',
    fieldId: 'lebensmittel_ernaehrung',
    fieldName: 'Lebensmittel & Ernährung',
    aliases: ['metzger', 'fleischer', 'schlachter', 'butcher'],
    specializations: ['Schlachtwesen', 'Wurstherstellung', 'Räucherei & Pökelei', 'Wildbretverarbeitung'],
    possibleRanks: ['Lehrling', 'Geselle', 'Metzgermeister', 'Obermeister'],
    competencies: [
      { id: 'metzger_messer', professionId: 'metzger', name: 'Fleischmesser & Beile führen', category: 'Grundlage', description: 'Sicherer Umgang mit Abhäutemessern, Spaltern, Sägen und Wetzstählen.', relatedCompetencyIds: ['metzger_zerlegen'] },
      { id: 'metzger_frische', professionId: 'metzger', name: 'Fleischfrische beurteilen', category: 'Grundlage', description: 'Erkennen von Geruch, Marmorierung, Festigkeit und Reifegrad verschiedener Fleischarten.', relatedCompetencyIds: ['metzger_hygiene'] },
      { id: 'metzger_hygiene', professionId: 'metzger', name: 'Hygiene & Kühlung wahren', category: 'Grundlage', description: 'Sauberkeit an Zerlegetischen, Pökelbottichen und Kühlkellern zur Keimvermeidung.', relatedCompetencyIds: ['metzger_frische'] },
      { id: 'metzger_zerlegen', professionId: 'metzger', name: 'Zerlegen & Ausbeinen', category: 'Grundlage', description: 'Fachgerechtes Trennen entlang der Sehnen und Auslösen der Knochen ohne Fleischverlust.', relatedCompetencyIds: ['metzger_messer'] },
      { id: 'metzger_poekeln', professionId: 'metzger', name: 'Pökeln & Salzen', category: 'Fortgeschritten', description: 'Trocken- und Nasspökeln mit Salz, Salpeter und Gewürzen zur dauerhaften Konservierung.', relatedCompetencyIds: ['metzger_raeuchern'] },
      { id: 'metzger_raeuchern', professionId: 'metzger', name: 'Räucherkammer regulieren', category: 'Fortgeschritten', description: 'Kalt- und Heißräuchern mit Sägemehl von Harthölzern für Haltbarkeit und Raucharoma.', relatedCompetencyIds: ['metzger_poekeln'] },
      { id: 'metzger_wurst', professionId: 'metzger', name: 'Wurstbrät herstellen', category: 'Fortgeschritten', description: 'Fein zerkleinern von Fleisch und Speck, Würzen und Abfüllen in Naturdärme.', relatedCompetencyIds: ['metzger_zerlegen'] },
      { id: 'metzger_trockenfleisch', professionId: 'metzger', name: 'Trockenfleisch herstellen', category: 'Fortgeschritten', description: 'Hauchdünnes Aufschneiden und Lufttrocknen von Rind- und Wildfleisch zu Pemmikan.', relatedCompetencyIds: ['metzger_poekeln'] },
      { id: 'metzger_schinken', professionId: 'metzger', name: 'Schinken reifen', category: 'Spezialisierung', description: 'Monatelanges Reifen von Knochenschinken in zugigen Bergluftkammern.', relatedCompetencyIds: ['metzger_poekeln', 'metzger_raeuchern'] },
      { id: 'metzger_wildbret', professionId: 'metzger', name: 'Wildbret versorgen', category: 'Spezialisierung', description: 'Aufbrechen, Enthäuten und küchenfertiges Vorbereiten von erlegtem Hirsch, Reh und Wildschwein.', relatedCompetencyIds: ['metzger_zerlegen'] },
      { id: 'metzger_ganztier', professionId: 'metzger', name: 'Ganzheitliche Tierverwertung', category: 'Meisterschaft', description: 'Vollständige Nutzung von Därmen, Borsten, Sehnen, Knochenmark und Talg ohne Ausschuss.', relatedCompetencyIds: ['metzger_wurst'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 6. SCHREINER / TISCHLER (Bau & Handwerk)
  // ---------------------------------------------------------------------------
  {
    professionId: 'schreiner',
    professionName: 'Schreiner / Tischler',
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    aliases: ['schreiner', 'tischler', 'möbelschreiner', 'carpenter', 'woodworker'],
    specializations: ['Möbelbau', 'Bauschreinerei', 'Drechslerei', 'Intarsien & Schnitzkunst', 'Sargtischler'],
    possibleRanks: ['Lehrling', 'Geselle', 'Schreinermeister', 'Zunftmeister'],
    competencies: [
      { id: 'schreiner_saege', professionId: 'schreiner', name: 'Handsägen präzise führen', category: 'Grundlage', description: 'Rissgenaues Sägen von Längs- und Querschnitten mit Fuchsschwanz und Feinsäge.', relatedCompetencyIds: ['schreiner_hobel'] },
      { id: 'schreiner_hobel', professionId: 'schreiner', name: 'Holz abrichten & hobeln', category: 'Grundlage', description: 'Winkliges Fügen und Glätten von sägerauen Holzbohlen mit dem Schrupp- und Raubankhobel.', relatedCompetencyIds: ['schreiner_saege', 'schreiner_holzarten'] },
      { id: 'schreiner_holzarten', professionId: 'schreiner', name: 'Holzarten beurteilen', category: 'Grundlage', description: 'Erkennen von Maserung, Faserverlauf, Härte und Schwindverhalten von Eiche, Kiefer, Nussbaum.', relatedCompetencyIds: ['schreiner_hobel'] },
      { id: 'schreiner_verbindung', professionId: 'schreiner', name: 'Zapfen & Zinken schneiden', category: 'Fortgeschritten', description: 'Herstellung formschlüssiger Holzverbindungen wie Schwalbenschwanzzinken und Schlitz-Zapfen.', relatedCompetencyIds: ['schreiner_leim'] },
      { id: 'schreiner_leim', professionId: 'schreiner', name: 'Knochen- & Hautleim sieden', category: 'Fortgeschritten', description: 'Heißleim zubereiten, verleimen und mit Schraubzwingen und Holzkeilen verpressen.', relatedCompetencyIds: ['schreiner_verbindung'] },
      { id: 'schreiner_schleifen', professionId: 'schreiner', name: 'Oberflächen glätten & ölen', category: 'Fortgeschritten', description: 'Feinschliff mit Ziehklinge und Schachtelhalm sowie Versiegelung mit Leinöl und Bienenwachs.', relatedCompetencyIds: ['schreiner_hobel'] },
      { id: 'schreiner_moebel', professionId: 'schreiner', name: 'Massivholzmöbel bauen', category: 'Spezialisierung', description: 'Konstruktion von Truhen, Tischen, Stühlen und Schränken mit Scharnieren und Schlössern.', relatedCompetencyIds: ['schreiner_verbindung'] },
      { id: 'schreiner_drechseln', professionId: 'schreiner', name: 'Drechselbank bedienen', category: 'Spezialisierung', description: 'Rotationssymmetrisches Drechseln von Treppensprossen, Tischbeinen, Schalen und Tellern.', relatedCompetencyIds: ['schreiner_hobel'] },
      { id: 'schreiner_schnitzen', professionId: 'schreiner', name: 'Reliefschnitzerei anbringen', category: 'Spezialisierung', description: 'Ziselieren kunstvoller Ornamente, Wappen und Tierfiguren in Eichen- und Lindenholz.', relatedCompetencyIds: ['schreiner_moebel'] },
      { id: 'schreiner_intarsien', professionId: 'schreiner', name: 'Intarsien & Furniere legen', category: 'Meisterschaft', description: 'Einlegearbeiten aus Edelhölzern, Perlmutt, Knochen und Messing zu meisterhaften Bildern.', relatedCompetencyIds: ['schreiner_moebel'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 7. MAURER / STEINMETZ (Bau & Handwerk)
  // ---------------------------------------------------------------------------
  {
    professionId: 'maurer',
    professionName: 'Maurer / Steinmetz',
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    aliases: ['maurer', 'steinmetz', 'werksteinmetz', 'bauhandwerker', 'mason', 'stonemason'],
    specializations: ['Bruchsteinmauerwerk', 'Werksteinmetz', 'Gewölbe- & Bogenbau', 'Befestigungs- & Festungsbau'],
    possibleRanks: ['Lehrling', 'Geselle', 'Steinmetzmeister', 'Dombaumeister'],
    competencies: [
      { id: 'maurer_moertel', professionId: 'maurer', name: 'Mörtel anrühren & abstimmen', category: 'Grundlage', description: 'Mischen von Sand, gelöschtem Kalk, Puzzolan und Wasser im exakten Bindeverhältnis.', relatedCompetencyIds: ['maurer_steine_setzen'] },
      { id: 'maurer_lot', professionId: 'maurer', name: 'Lot & Richtschnur führen', category: 'Grundlage', description: 'Fluchtgerechtes und lotrechtes Ausrichten von Mauerzügen und Gebäudeecken.', relatedCompetencyIds: ['maurer_steine_setzen'] },
      { id: 'maurer_steine_setzen', professionId: 'maurer', name: 'Ziegel & Bruchsteine setzen', category: 'Grundlage', description: 'Fugengerechtes Aufsetzen mit Kelle, Klopfen und vollfugigem Mörtelbett.', relatedCompetencyIds: ['maurer_moertel', 'maurer_lot'] },
      { id: 'maurer_spalten', professionId: 'maurer', name: 'Steinspalten mit Keilen', category: 'Grundlage', description: 'Spalten massiver Felsbrocken entlang der natürlichen Lagerung mit Schlägel und Eisenkeilen.', relatedCompetencyIds: ['maurer_behauen'] },
      { id: 'maurer_rundbogen', professionId: 'maurer', name: 'Rundbögen wölben', category: 'Fortgeschritten', description: 'Abstützen auf Holzlehrgerüst und passgenaues Setzen des Schlusssteins.', relatedCompetencyIds: ['maurer_steine_setzen', 'maurer_gewoelbe'] },
      { id: 'maurer_stuetzmauer', professionId: 'maurer', name: 'Stützmauern errichten', category: 'Fortgeschritten', description: 'Bauen standfester Trocken- und Mörtelmauern zur Hangsicherung mit Entwässerungsöffnungen.', relatedCompetencyIds: ['maurer_fundament'] },
      { id: 'maurer_fundament', professionId: 'maurer', name: 'Fundamente graben & verfüllen', category: 'Fortgeschritten', description: 'Ausheben frostfreier Fundamentgräben und Stampfen von Rollierungs- und Kalksteinschichten.', relatedCompetencyIds: ['maurer_stuetzmauer'] },
      { id: 'maurer_putz', professionId: 'maurer', name: 'Kalkputz auftragen', category: 'Fortgeschritten', description: 'Mehrlagiges Verputzen von Wänden mit Unter- und feinem Glättputz.', relatedCompetencyIds: ['maurer_moertel'] },
      { id: 'maurer_behauen', professionId: 'maurer', name: 'Quadersteine behauen', category: 'Spezialisierung', description: 'Exaktes Scharrieren, Spitzen und Stocken von Sandstein- und Granitblöcken.', relatedCompetencyIds: ['maurer_spalten'] },
      { id: 'maurer_gewoelbe', professionId: 'maurer', name: 'Kreuzrippengewölbe schließen', category: 'Meisterschaft', description: 'Freitragende Wölbung hoher Hallen und Kathedralen mit Rippensteinen und Schlussstein.', relatedCompetencyIds: ['maurer_rundbogen', 'maurer_behauen'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 8. ZIMMERMANN (Bau & Handwerk)
  // ---------------------------------------------------------------------------
  {
    professionId: 'zimmermann',
    professionName: 'Zimmermann',
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    aliases: ['zimmermann', 'zimmerin', 'zimmerer', 'carpenter'],
    specializations: ['Dachstuhlbau', 'Fachwerkbau', 'Brückenbau & Befestigung', 'Blockbau'],
    possibleRanks: ['Zimmererlehrling', 'Wandergeselle', 'Zimmermeister', 'Altmeister'],
    competencies: [
      { id: 'zimmer_beil', professionId: 'zimmermann', name: 'Zimmererbeil & Säge führen', category: 'Grundlage', description: 'Schälen, Behauen und Kappen schwerer Baumstämme auf dem Abbundplatz.', relatedCompetencyIds: ['zimmer_balken'] },
      { id: 'zimmer_balken', professionId: 'zimmermann', name: 'Balken behauen & ablängen', category: 'Grundlage', description: 'Vierkantiges Behauen von Rundhölzern mit dem Breitbeil nach Richtschnur.', relatedCompetencyIds: ['zimmer_beil'] },
      { id: 'zimmer_feuchte', professionId: 'zimmermann', name: 'Holzfeuchte beurteilen', category: 'Grundlage', description: 'Einschätzen von Saftzeit, Schwindung und Rissbildung bei Bauhölzern.', relatedCompetencyIds: ['zimmer_balken'] },
      { id: 'zimmer_dachstuhl', professionId: 'zimmermann', name: 'Dachstühle abbinden & aufrichten', category: 'Fortgeschritten', description: 'Aufreißen des Dachprofils, Zuschnitt von Sparren, Pfetten und Kehlbalken.', relatedCompetencyIds: ['zimmer_verzapfen'] },
      { id: 'zimmer_verzapfen', professionId: 'zimmermann', name: 'Fachwerk verzapfen', category: 'Fortgeschritten', description: 'Herstellung stabiler Zapfen-, Schwellen- und Strebenverbindungen für Holzhäuser.', relatedCompetencyIds: ['zimmer_holznaegel'] },
      { id: 'zimmer_holznaegel', professionId: 'zimmermann', name: 'Holznägel schlagen & sichern', category: 'Fortgeschritten', description: 'Schnitzen und Einschlagen trockener Eichennägel in vorgebohrte Zuglöcher.', relatedCompetencyIds: ['zimmer_verzapfen'] },
      { id: 'zimmer_geruest', professionId: 'zimmermann', name: 'Baugerüste errichten', category: 'Fortgeschritten', description: 'Sichere Stangengerüste mit Hanfseilen und Holzstreben an hohen Bauwerken bauen.', relatedCompetencyIds: ['zimmer_dachstuhl'] },
      { id: 'zimmer_bruecken', professionId: 'zimmermann', name: 'Brücken- & Wehrbau', category: 'Spezialisierung', description: 'Konstruktion tragfähiger Holzbrücken mit Pfahljochen über Flüsse und Gräben.', relatedCompetencyIds: ['zimmer_balken', 'zimmer_dachstuhl'] },
      { id: 'zimmer_halle', professionId: 'zimmermann', name: 'Freitragende Hallendächer konstruieren', category: 'Meisterschaft', description: 'Meisterhafte Spreng- und Hängewerke für gewaltige Rathaushallen und Wehrbauten.', relatedCompetencyIds: ['zimmer_dachstuhl', 'zimmer_bruecken'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 9. SCHNEIDER (Bau & Handwerk)
  // ---------------------------------------------------------------------------
  {
    professionId: 'schneider',
    professionName: 'Schneider',
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    aliases: ['schneider', 'schneiderin', 'gewandmeister', 'kürschner', 'tailor'],
    specializations: ['Trachten- & Alltagskleidung', 'Hof- & Festgewänder', 'Rüstwämser & Gambesons', 'Pelzverarbeitung'],
    possibleRanks: ['Lehrling', 'Geselle', 'Schneidermeister', 'Hofschneidermeister'],
    competencies: [
      { id: 'schneider_nadel', professionId: 'schneider', name: 'Handnaht & Nadeltechnik', category: 'Grundlage', description: 'Gleichmäßige Vorstiche, Rückstiche, Hohlsaum und Blindstiche von Hand.', relatedCompetencyIds: ['schneider_stoff'] },
      { id: 'schneider_stoff', professionId: 'schneider', name: 'Stoffe & Webarten beurteilen', category: 'Grundlage', description: 'Erkennen von Leinen, Wolle, Seide, Baumwolle und deren Fadenlauf.', relatedCompetencyIds: ['schneider_nadel', 'schneider_mass'] },
      { id: 'schneider_mass', professionId: 'schneider', name: 'Körpermaß nehmen', category: 'Grundlage', description: 'Exaktes Vermessen von Schulter, Brust, Taille, Schrittlänge und Ärmellänge.', relatedCompetencyIds: ['schneider_schnitt'] },
      { id: 'schneider_schnitt', professionId: 'schneider', name: 'Schnittmuster zeichnen & anpassen', category: 'Fortgeschritten', description: 'Zeichnen von Schnittteilen auf Kreidegrund unter sparsamer Stoffausnutzung.', relatedCompetencyIds: ['schneider_mass', 'schneider_heften'] },
      { id: 'schneider_heften', professionId: 'schneider', name: 'Zuschneiden & Heften', category: 'Fortgeschritten', description: 'Präziser Zuschnitt mit der Schneiderschere und provisorisches Heften zur Anprobe.', relatedCompetencyIds: ['schneider_schnitt', 'schneider_nadel'] },
      { id: 'schneider_saeumen', professionId: 'schneider', name: 'Säumen & Kanten versäubern', category: 'Fortgeschritten', description: 'Doppelt eingeschlagene Säume gegen Ausfransen bei schwerer Beanspruchung.', relatedCompetencyIds: ['schneider_nadel'] },
      { id: 'schneider_gambeson', professionId: 'schneider', name: 'Gambesons & Rüstwämser polstern', category: 'Spezialisierung', description: 'Mehrlagiges Steppen von Leinen mit Rosshaar oder Rohwolle als Klingenschutz.', relatedCompetencyIds: ['schneider_nadel', 'schneider_stoff'] },
      { id: 'schneider_knoepfe', professionId: 'schneider', name: 'Knöpfe, Nesteln & Ösen fertigen', category: 'Spezialisierung', description: 'Knopflöcher sauber einfassen, Nestellöcher mit Messinghülsen beschlagen.', relatedCompetencyIds: ['schneider_nadel'] },
      { id: 'schneider_stickerei', professionId: 'schneider', name: 'Gold- & Seidenstickerei', category: 'Meisterschaft', description: 'Filigrane Wappen und florale Muster mit Seiden- und feinsten Goldfäden sticken.', relatedCompetencyIds: ['schneider_hofgewand'] },
      { id: 'schneider_hofgewand', professionId: 'schneider', name: 'Königliche Hofgewänder fertigen', category: 'Meisterschaft', description: 'Samt- und Brokatroben mit Hermelinfutter und kunstvollen Schleppen.', relatedCompetencyIds: ['schneider_stickerei', 'schneider_mass'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 10. SEEMANN / NAVIGATOR (Seefahrt)
  // ---------------------------------------------------------------------------
  {
    professionId: 'seemann',
    professionName: 'Seemann / Navigator',
    fieldId: 'seefahrt',
    fieldName: 'Seefahrt',
    aliases: ['seemann', 'matrose', 'navigator', 'steuermann', 'sailor'],
    specializations: ['Takelage & Seemannschaft', 'Küsten- & Flussnavigation', 'Astronavigation', 'Bootsmannswesen'],
    possibleRanks: ['Schiffsjunge', 'Matrose', 'Vollmatrose', 'Bootsmann', 'Steuermann'],
    competencies: [
      { id: 'seemann_knoten', professionId: 'seemann', name: 'Knoten & Spleißen', category: 'Grundlage', description: 'Beherrschung von Palstek, Webeleinstek, Kreuzknoten und Augspleißen.', relatedCompetencyIds: ['seemann_takelage'] },
      { id: 'seemann_takelage', professionId: 'seemann', name: 'Takelage bedienen', category: 'Grundlage', description: 'Fieren und Dichtholen von Fallen, Schoten, Brassen und Halsen.', relatedCompetencyIds: ['seemann_knoten', 'seemann_segel'] },
      { id: 'seemann_ruder', professionId: 'seemann', name: 'Ruder gehen', category: 'Grundlage', description: 'Geradeauskurs am Steuerrad oder an der Ruderpinne gegen Seegang halten.', relatedCompetencyIds: ['seemann_kompass'] },
      { id: 'seemann_peilung', professionId: 'seemann', name: 'Handlot & Ausguck', category: 'Grundlage', description: 'Lotung der Wassertiefe und Erkennen von Riffen, Untiefen und Landmarken.', relatedCompetencyIds: ['seemann_kompass'] },
      { id: 'seemann_segel', professionId: 'seemann', name: 'Segel setzen & reffen', category: 'Fortgeschritten', description: 'Aufentern in die Masten und schnelles Reffen bei aufziehenden Sturmböen.', relatedCompetencyIds: ['seemann_takelage'] },
      { id: 'seemann_kompass', professionId: 'seemann', name: 'Kompass & Karte lesen', category: 'Fortgeschritten', description: 'Absetzen von Kursen auf Seekarten unter Berücksichtigung von Strömung und Drift.', relatedCompetencyIds: ['seemann_peilung', 'seemann_ruder'] },
      { id: 'seemann_leck', professionId: 'seemann', name: 'Leckabwehr & Pumpen', category: 'Fortgeschritten', description: 'Notdürftiges Kalfatern von Planken und Bedienen der Bilgenpumpen nach Grundberührung.', relatedCompetencyIds: ['seemann_takelage'] },
      { id: 'seemann_astronav', professionId: 'seemann', name: 'Astronavigation nach Sternen', category: 'Spezialisierung', description: 'Bestimmung des Breitengrades mit Jakobsstab oder Astrolabium über dem Horizont.', relatedCompetencyIds: ['seemann_kompass'] },
      { id: 'seemann_sturm', professionId: 'seemann', name: 'Schwere See abreiten', category: 'Meisterschaft', description: 'Beiliegen im Orkan ohne Kenterung bei gebrochenen Wogen.', relatedCompetencyIds: ['seemann_segel', 'seemann_ruder'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 11. KAPITÄN / SCHIFFSFÜHRER (Seefahrt)
  // ---------------------------------------------------------------------------
  {
    professionId: 'kapitaen',
    professionName: 'Kapitän / Schiffsführer',
    fieldId: 'seefahrt',
    fieldName: 'Seefahrt',
    aliases: ['kapitän', 'kapitaen', 'schiffskapitän', 'kommandant', 'schiffsherr', 'captain'],
    specializations: ['Kriegsmarine & Enterkampf', 'Handelsschifffahrt & Fracht', 'Küstenschifffahrt & Lotsenwesen', 'Expedition & Entdeckung'],
    possibleRanks: ['Stellvertretender Kommandant', 'Kapitän', 'Flottillenkapitän', 'Kommodore', 'Admiral'],
    competencies: [
      { id: 'kapitaen_befehl', professionId: 'kapitaen', name: 'Schiffskommandos erteilen', category: 'Grundlage', description: 'Klare, durchsetzungsstarke Kommandos für Segel-, Wende- und Ankermanöver.', relatedCompetencyIds: ['kapitaen_besatzung'] },
      { id: 'kapitaen_wetter', professionId: 'kapitaen', name: 'Wetter & Seegang beurteilen', category: 'Grundlage', description: 'Lesen von Wolkenformationen, Barometerstand und Dünung zur Sturmvorhersage.', relatedCompetencyIds: ['kapitaen_sturm'] },
      { id: 'kapitaen_sicherheit', professionId: 'kapitaen', name: 'Schiffssicherheit prüfen', category: 'Grundlage', description: 'Überwachung von Ladungstrimmung, Tiefgang, Bilgenwasser und Takelagerumpf.', relatedCompetencyIds: ['kapitaen_befehl'] },
      { id: 'kapitaen_hafen', professionId: 'kapitaen', name: 'Hafen- & Anlegemanöver leiten', category: 'Fortgeschritten', description: 'Präzises Einlaufen in fremde Häfen unter Segel oder mit Schleppbooten.', relatedCompetencyIds: ['kapitaen_befehl'] },
      { id: 'kapitaen_navigation', professionId: 'kapitaen', name: 'Nautische Routen planen', category: 'Fortgeschritten', description: 'Berechnen von Reisedauer, Trinkwasservorräten und windgünstigen Routen.', relatedCompetencyIds: ['kapitaen_wetter'] },
      { id: 'kapitaen_besatzung', professionId: 'kapitaen', name: 'Besatzungsdisziplin wahren', category: 'Fortgeschritten', description: 'Schlichten von Streitigkeiten, Einteilung von Wachen und Verhindern von Meutereien.', relatedCompetencyIds: ['kapitaen_befehl'] },
      { id: 'kapitaen_sturm', professionId: 'kapitaen', name: 'Sturmmanöver führen', category: 'Spezialisierung', description: 'Rettung des Schiffes in schweren Orkanen durch Ausbringen von Treibankern.', relatedCompetencyIds: ['kapitaen_wetter'] },
      { id: 'kapitaen_seekampf', professionId: 'kapitaen', name: 'Seekampf & Breitseiten leiten', category: 'Spezialisierung', description: 'Taktisches Manövrieren in Luv, Eröffnen von Breitseiten und Enterabwehr.', relatedCompetencyIds: ['kapitaen_befehl'] },
      { id: 'kapitaen_ozean', professionId: 'kapitaen', name: 'Unbekannte Gewässer erkunden', category: 'Meisterschaft', description: 'Kartierung unbekannter Küsten, Riffe und Strömungen auf fernen Ozeanen.', relatedCompetencyIds: ['kapitaen_navigation'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 12. SOLDAT / WÄCHTER (Militär & Sicherheit)
  // ---------------------------------------------------------------------------
  {
    professionId: 'soldat',
    professionName: 'Soldat / Wächter',
    fieldId: 'militaer_sicherheit',
    fieldName: 'Militär & Sicherheit',
    aliases: ['soldat', 'wächter', 'stadtwache', 'gardist', 'krieger', 'söldner', 'guard', 'soldier'],
    specializations: ['Stadtwache & Torsicherung', 'Schwere Infanterie & Schildwall', 'Garnisons- & Festungsdienst', 'Aufklärung & Vorhut'],
    possibleRanks: ['Rekrut', 'Gefreiter', 'Korporal', 'Feldwebel / Wachtmeister', 'Hauptmann'],
    competencies: [
      { id: 'soldat_haltung', professionId: 'soldat', name: 'Wehrdisziplin & Haltung', category: 'Grundlage', description: 'Strikte Befolgung von militärischen Rangordnungen, Stillstehen und Wachregeln.', relatedCompetencyIds: ['soldat_patrouille'] },
      { id: 'soldat_patrouille', professionId: 'soldat', name: 'Wachgang & Patrouille', category: 'Grundlage', description: 'Aufmerksames Ablaufen von Wachrouten auf Stadtmauern und in Gassen.', relatedCompetencyIds: ['soldat_haltung', 'soldat_alarm'] },
      { id: 'soldat_alarm', professionId: 'soldat', name: 'Alarmierung & Signalgebung', category: 'Grundlage', description: 'Rechtzeitiges Blasen des Signalhorns, Schlagen der Alarmglocke oder Entzünden von Signalfeuern.', relatedCompetencyIds: ['soldat_patrouille'] },
      { id: 'soldat_ruestungspflege', professionId: 'soldat', name: 'Waffen- & Rüstungspflege', category: 'Grundlage', description: 'Entrosten, Ölen von Kettenhemden und Abziehen von Klingen und Speerspitzen.', relatedCompetencyIds: ['soldat_haltung'] },
      { id: 'soldat_formation', professionId: 'soldat', name: 'Schildwall & Formation halten', category: 'Fortgeschritten', description: 'Schulter an Schulter stehen, Schildüberdeckung sichern und Druck standhalten.', relatedCompetencyIds: ['soldat_stangenwaffen'] },
      { id: 'soldat_stangenwaffen', professionId: 'soldat', name: 'Nahkampf mit Stangenwaffen', category: 'Fortgeschritten', description: 'Gezieltes Stoßen und Führen von Hellebarden, Piken und Speeren.', relatedCompetencyIds: ['soldat_formation'] },
      { id: 'soldat_festnahme', professionId: 'soldat', name: 'Festnahme & Fesseln', category: 'Fortgeschritten', description: 'Gewaltfreies oder entschlossenes Überwältigen und Fesseln renitenter Delinquenten.', relatedCompetencyIds: ['soldat_patrouille'] },
      { id: 'soldat_torkontrolle', professionId: 'soldat', name: 'Torkontrollen durchführen', category: 'Spezialisierung', description: 'Systematische Durchsuchung von Fuhrwerken auf Schmuggelgut und Waffen.', relatedCompetencyIds: ['soldat_festnahme'] },
      { id: 'soldat_truppfuehrung', professionId: 'soldat', name: 'Wachmannschaft koordinieren', category: 'Meisterschaft', description: 'Führung einer Wachsektion im Alarmfall, Besetzen von Wehrgängen und Toren.', relatedCompetencyIds: ['soldat_formation'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 13. HÄNDLER / KAUFMANN (Handel & Wirtschaft)
  // ---------------------------------------------------------------------------
  {
    professionId: 'haendler',
    professionName: 'Händler / Kaufmann',
    fieldId: 'handel_wirtschaft',
    fieldName: 'Handel & Wirtschaft',
    aliases: ['händler', 'kaufmann', 'krämer', 'handelsherr', 'merchant', 'trader'],
    specializations: ['Markthandel & Lokales Gewerbe', 'Fernhandel & Karawanen', 'Großhandel & Kontor', 'Geldwechsel & Bankwesen'],
    possibleRanks: ['Handelsgehilfe', 'Kaufgeselle', 'Kaufmann', 'Handelsherr', 'Patrizier'],
    competencies: [
      { id: 'haendler_wiegen', professionId: 'haendler', name: 'Waren wiegen & messen', category: 'Grundlage', description: 'Sicherer Umgang mit Balkenwaagen, Eichgewichten, Ellenmaßen und Scheffeln.', relatedCompetencyIds: ['haendler_muenzen'] },
      { id: 'haendler_muenzen', professionId: 'haendler', name: 'Münzen & Währungen prüfen', category: 'Grundlage', description: 'Erkennen gefälschter Prägungen, Beschneidungen und Feingehalt von Silber- und Goldmünzen.', relatedCompetencyIds: ['haendler_wiegen', 'haendler_buch'] },
      { id: 'haendler_buch', professionId: 'haendler', name: 'Buchführung & Kassenbuch', category: 'Grundlage', description: 'Saubere Erfassung von Einnahmen, Ausgaben, Außenständen und Schuldscheinen.', relatedCompetencyIds: ['haendler_muenzen'] },
      { id: 'haendler_feilschen', professionId: 'haendler', name: 'Feilschen & Preisbildung', category: 'Fortgeschritten', description: 'Einschätzen der Zahlungsbereitschaft, geschicktes Verhandeln und Margensicherung.', relatedCompetencyIds: ['haendler_warenkunde'] },
      { id: 'haendler_warenkunde', professionId: 'haendler', name: 'Warenkunde & Güteprüfung', category: 'Fortgeschritten', description: 'Beurteilung von Stoffen, Gewürzen, Erzen und Wein nach Herkunft und Frische.', relatedCompetencyIds: ['haendler_feilschen'] },
      { id: 'haendler_vertraege', professionId: 'haendler', name: 'Handelsverträge schließen', category: 'Fortgeschritten', description: 'Aufsetzen rechtssicherer Liefer- und Abnahmevereinbarungen mit Siegelzeugen.', relatedCompetencyIds: ['haendler_buch'] },
      { id: 'haendler_fernhandel', professionId: 'haendler', name: 'Fernhandel organisieren', category: 'Spezialisierung', description: 'Ausrüstung bewachter Karawanen oder Frachtsegler über weite Handelsrouten.', relatedCompetencyIds: ['haendler_vertraege'] },
      { id: 'haendler_kontor', professionId: 'haendler', name: 'Handelsimperium & Kontore leiten', category: 'Meisterschaft', description: 'Strategische Marktbeeinflussung und Führung überregionaler Niederlassungen.', relatedCompetencyIds: ['haendler_fernhandel'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 14. SCHREIBER / GELEHRTER (Schrift & Bildung)
  // ---------------------------------------------------------------------------
  {
    professionId: 'gelehrter',
    professionName: 'Schreiber / Gelehrter',
    fieldId: 'schrift_bildung',
    fieldName: 'Schrift & Bildung',
    aliases: ['gelehrter', 'schreiber', 'chronist', 'kanzlist', 'bibliothekar', 'scholar', 'scribe'],
    specializations: ['Urkunden & Kanzlei', 'Chronistik & Geschichte', 'Bibliothek & Archivwesen', 'Altsprachen & Übersetzung'],
    possibleRanks: ['Schreibschüler', 'Kopist', 'Kanzleischreiber', 'Magister', 'Oberbibliothekar'],
    competencies: [
      { id: 'gelehrter_tinte', professionId: 'gelehrter', name: 'Tinte ansetzen & Federn schneiden', category: 'Grundlage', description: 'Zubereitung von Eisengallustinte und exakter Schnitt von Gänsekielen für feine Züge.', relatedCompetencyIds: ['gelehrter_kalligraphie'] },
      { id: 'gelehrter_kalligraphie', professionId: 'gelehrter', name: 'Kalligraphie & Reinschrift', category: 'Grundlage', description: 'Gleichmäßiges Schreiben in gotischer Minuskel, Fraktur oder Kanzleischrift.', relatedCompetencyIds: ['gelehrter_tinte', 'gelehrter_pergament'] },
      { id: 'gelehrter_pergament', professionId: 'gelehrter', name: 'Pergament & Papier vorbereiten', category: 'Grundlage', description: 'Bimssteinglätten, Linieren mit Blindstift und Wachstafelaufzeichnungen.', relatedCompetencyIds: ['gelehrter_kalligraphie'] },
      { id: 'gelehrter_urkunden', professionId: 'gelehrter', name: 'Urkunden prüfen & siegeln', category: 'Fortgeschritten', description: 'Echtheitsprüfung von Siegelabdrücken, Wachsrezepturen und Rechtsformeln.', relatedCompetencyIds: ['gelehrter_kalligraphie'] },
      { id: 'gelehrter_sprachen', professionId: 'gelehrter', name: 'Altsprachen übersetzen', category: 'Fortgeschritten', description: 'Flüssiges Lesen und Übersetzen alter Dialekte, klassischer Gelehrtensprachen und Runen.', relatedCompetencyIds: ['gelehrter_chronik'] },
      { id: 'gelehrter_chronik', professionId: 'gelehrter', name: 'Chroniken & Annalen führen', category: 'Fortgeschritten', description: 'Wahrheitsgetreues, chronologisches Dokumentieren von Herrscherzeiten und Ereignissen.', relatedCompetencyIds: ['gelehrter_sprachen'] },
      { id: 'gelehrter_chiffren', professionId: 'gelehrter', name: 'Geheimschriften entschlüsseln', category: 'Spezialisierung', description: 'Aufdecken von Buchstabensubstitutionen, Gitterschriften und verborgener Tinte.', relatedCompetencyIds: ['gelehrter_sprachen'] },
      { id: 'gelehrter_buchbinden', professionId: 'gelehrter', name: 'Kodizes binden & illuminieren', category: 'Meisterschaft', description: 'Binden von Lederfolianten mit Holzdeckeln, Metallbeschlägen und Blattgoldinitialen.', relatedCompetencyIds: ['gelehrter_kalligraphie'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 15. ALCHEMIST / APOTHEKER (Alchemie)
  // ---------------------------------------------------------------------------
  {
    professionId: 'alchemist',
    professionName: 'Alchemist / Apotheker',
    fieldId: 'alchemie',
    fieldName: 'Alchemie',
    aliases: ['alchemist', 'alchemistin', 'apotheker', 'trankbrauer', 'alchemist'],
    specializations: ['Trankbrauerei & Elixiere', 'Reagenzien & Gifte', 'Metallurgie & Transmutation', 'Flüchtige Pulver & Sprengmittel'],
    possibleRanks: ['Laborant', 'Adept', 'Alchemist', 'Meisteralchemist', 'Großalchemist'],
    competencies: [
      { id: 'alchemie_glas', professionId: 'alchemist', name: 'Retorten & Kolben reinigen', category: 'Grundlage', description: 'Rückstandsfreies Ausspülen und Vorbereiten empfindlicher Glas- und Tongefäße.', relatedCompetencyIds: ['alchemie_brenner'] },
      { id: 'alchemie_brenner', professionId: 'alchemist', name: 'Alchemiestove & Sandbad regulieren', category: 'Grundlage', description: 'Gleichmäßige Erwärmung empfindlicher Substanzen ohne Überhitzung.', relatedCompetencyIds: ['alchemie_glas', 'alchemie_destillieren'] },
      { id: 'alchemie_reagenz', professionId: 'alchemist', name: 'Kräuter & Mineralien mörsern', category: 'Grundlage', description: 'Feines Verreiben von Schwefel, Salzen, Wurzeln und getrocknetem Giftgeziefer.', relatedCompetencyIds: ['alchemie_destillieren'] },
      { id: 'alchemie_destillieren', professionId: 'alchemist', name: 'Destillieren & Kondensieren', category: 'Fortgeschritten', description: 'Abtrennen hochreiner Geister, Essenzen und ätherischer Öle im Alembik.', relatedCompetencyIds: ['alchemie_brenner'] },
      { id: 'alchemie_traenke', professionId: 'alchemist', name: 'Heil- & Stärkungstränke brauen', category: 'Fortgeschritten', description: 'Stabile Absude zur Schmerzlinderung, Blutstillung und Kräftigung.', relatedCompetencyIds: ['alchemie_destillieren'] },
      { id: 'alchemie_gifte', professionId: 'alchemist', name: 'Gegengifte ansetzen', category: 'Fortgeschritten', description: 'Neutralisieren tierischer, pflanzlicher und mineralischer Toxine durch Antidote.', relatedCompetencyIds: ['alchemie_reagenz'] },
      { id: 'alchemie_feuer', professionId: 'alchemist', name: 'Alchemistische Feuer & Säuren', category: 'Spezialisierung', description: 'Flüssigkeiten, die auf Wasser brennen, und ätzende Scheidewässer für Metalle.', relatedCompetencyIds: ['alchemie_destillieren'] },
      { id: 'alchemie_transmutation', professionId: 'alchemist', name: 'Transmutationszyklen vollenden', category: 'Meisterschaft', description: 'Nigredo, Albedo und Rubedo zur Synthese sagenumwobener Katalysatoren durchführen.', relatedCompetencyIds: ['alchemie_destillieren'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 16. ARZT / HEILER (Medizin & Heilkunde)
  // ---------------------------------------------------------------------------
  {
    professionId: 'arzt',
    professionName: 'Arzt / Heiler',
    fieldId: 'medizin_heilkunde',
    fieldName: 'Medizin & Heilkunde',
    aliases: ['arzt', 'ärztin', 'heiler', 'heilerin', 'feldscher', 'wundarzt', 'physicus', 'doctor', 'healer'],
    specializations: ['Chirurgie & Wundarznei', 'Kräuterheilkunde & Arznei', 'Seuchen- & Fieberbekämpfung', 'Geburtshilfe'],
    possibleRanks: ['Famulus', 'Bader / Feldscher', 'Medicus', 'Stadtarzt', 'Leibarzt'],
    competencies: [
      { id: 'arzt_wundreinigung', professionId: 'arzt', name: 'Wunden säubern & verbinden', category: 'Grundlage', description: 'Auswaschen mit Wein oder Essigsud und Anlegen keimfreier Leinenverbände.', relatedCompetencyIds: ['arzt_blutstillung'] },
      { id: 'arzt_blutstillung', professionId: 'arzt', name: 'Blutungen stillen', category: 'Grundlage', description: 'Druckverbände, Abbinden von Gliedmaßen und vorsichtiges Kauterisieren.', relatedCompetencyIds: ['arzt_wundreinigung'] },
      { id: 'arzt_kraeuter', professionId: 'arzt', name: 'Heilkräuter erkennen & dosieren', category: 'Grundlage', description: 'Kenntnis von Weidenrinde, Kamille, Schierling, Fingerhut und Beinwell.', relatedCompetencyIds: ['arzt_salben'] },
      { id: 'arzt_knochen', professionId: 'arzt', name: 'Knochenbrüche schienen & einrichten', category: 'Fortgeschritten', description: 'Einrenken ausgerenkter Gelenke und Ruhigstellen von Brüchen mit Holzschienen.', relatedCompetencyIds: ['arzt_wundreinigung'] },
      { id: 'arzt_salben', professionId: 'arzt', name: 'Wundsalben anrühren', category: 'Fortgeschritten', description: 'Herstellung lindernder Salben aus Bienenwachs, Schmalz, Ringelblume und Zink.', relatedCompetencyIds: ['arzt_kraeuter'] },
      { id: 'arzt_chirurgie', professionId: 'arzt', name: 'Pfeile & Geschosse herausoperieren', category: 'Spezialisierung', description: 'Sondieren und vorsichtiges Herausziehen von Widerhaken ohne Gefäßzerreißung.', relatedCompetencyIds: ['arzt_blutstillung'] },
      { id: 'arzt_amputation', professionId: 'arzt', name: 'Notamputationen durchführen', category: 'Spezialisierung', description: 'Schnelle Gliedmaßenabnahme bei Wundbrand mit Knochensäge und Lappenbildung.', relatedCompetencyIds: ['arzt_chirurgie'] },
      { id: 'arzt_seuche', professionId: 'arzt', name: 'Schwere Seuchen eindämmen', category: 'Meisterschaft', description: 'Organisation von Quarantäne, Rauchreinigungen und Behandlung von Pestilenz.', relatedCompetencyIds: ['arzt_kraeuter'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 17. MAGIER / ARKANIST (Magie & Arkane Künste)
  // ---------------------------------------------------------------------------
  {
    professionId: 'magier',
    professionName: 'Magier / Arkanist',
    fieldId: 'magie_arkana',
    fieldName: 'Magie & Arkane Künste',
    aliases: ['magier', 'arkanist', 'zauberer', 'magus', 'elementarist', 'mage', 'wizard'],
    specializations: ['Elementarmagie', 'Bann- & Schutzkreise', 'Arkanforschung & Schriftrollen', 'Illusionsmagie'],
    possibleRanks: ['Novize', 'Adept', 'Arkanist', 'Erzmagier', 'Großmagus'],
    competencies: [
      { id: 'magie_fokus', professionId: 'magier', name: 'Arkane Fokussierung & Meditation', category: 'Grundlage', description: 'Bündelung des eigenen Geistes zur Aufnahme und Formung des arkanen Manastroms.', relatedCompetencyIds: ['magie_runen'] },
      { id: 'magie_runen', professionId: 'magier', name: 'Runen zeichnen & stabilisieren', category: 'Grundlage', description: 'Exaktes Auftragen arkaner Kraftsymbole auf Kreide, Stein, Papier oder Metall.', relatedCompetencyIds: ['magie_fokus', 'magie_komponenten'] },
      { id: 'magie_auren', professionId: 'magier', name: 'Magische Auren wahrnehmen', category: 'Grundlage', description: 'Erschauung arkaner Schwingungen und Verzauberungen an Gegenständen und Wesen.', relatedCompetencyIds: ['magie_fokus'] },
      { id: 'magie_komponenten', professionId: 'magier', name: 'Spruchkomponenten dosieren', category: 'Grundlage', description: 'Richtiger Einsatz von Kristallen, Federn, Pulvern und gesprochenen Formeln.', relatedCompetencyIds: ['magie_elementar'] },
      { id: 'magie_elementar', professionId: 'magier', name: 'Elementare Manifestation', category: 'Fortgeschritten', description: 'Kontrolliertes Erzeugen von Flammen, Frost, Windstößen oder Lichtkugeln.', relatedCompetencyIds: ['magie_komponenten'] },
      { id: 'magie_schutzkreis', professionId: 'magier', name: 'Schutzkreise bannen', category: 'Fortgeschritten', description: 'Schutzbarrieren gegen feindliche Magie, Geisterwesen und körperliche Angriffe.', relatedCompetencyIds: ['magie_runen'] },
      { id: 'magie_schriftrollen', professionId: 'magier', name: 'Schriftrollen wirken & binden', category: 'Spezialisierung', description: 'Dauerhaftes Verankern mächtiger Zauberformeln in präpariertem Pergament.', relatedCompetencyIds: ['magie_runen'] },
      { id: 'magie_ritual', professionId: 'magier', name: 'Ritualmagie leiten', category: 'Meisterschaft', description: 'Leiten komplexer Zirkelrituale zur Manipulation von Wetter, Raum oder Schutzkreisen.', relatedCompetencyIds: ['magie_schutzkreis'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 18. PRIESTER / KLERIKER (Religion & Klerus)
  // ---------------------------------------------------------------------------
  {
    professionId: 'priester',
    professionName: 'Priester / Kleriker',
    fieldId: 'religion_klerus',
    fieldName: 'Religion & Klerus',
    aliases: ['priester', 'kleriker', 'geistlicher', 'ordensbruder', 'kaplan', 'priest', 'cleric'],
    specializations: ['Seelsorge & Predigt', 'Kultriten & Weihen', 'Ordensdisziplin & Klosterschriften', 'Tempelwirtschaft'],
    possibleRanks: ['Akolyth', 'Diakon', 'Priester', 'Dekan', 'Hohepriester'],
    competencies: [
      { id: 'priester_liturgie', professionId: 'priester', name: 'Liturgische Gesänge & Gebete', category: 'Grundlage', description: 'Exakte Rezitation heiliger Hymnen, Gebete und sakraler Formeln.', relatedCompetencyIds: ['priester_schriften'] },
      { id: 'priester_schriften', professionId: 'priester', name: 'Heilige Schriften rezitieren', category: 'Grundlage', description: 'Auslegung und Rezitation der heiligen Glaubenslehren vor der Gemeinde.', relatedCompetencyIds: ['priester_liturgie'] },
      { id: 'priester_geraete', professionId: 'priester', name: 'Kultgeräte & Altar weihen', category: 'Grundlage', description: 'Reinigung von Kelchen, Weihrauchfässern und Altarsteinen nach Tempelritus.', relatedCompetencyIds: ['priester_liturgie'] },
      { id: 'priester_seelsorge', professionId: 'priester', name: 'Seelsorge & Beichte abnehmen', category: 'Fortgeschritten', description: 'Zuhören, geistlicher Trost, Vergebung von Sünden und seelische Stärkung.', relatedCompetencyIds: ['priester_schriften'] },
      { id: 'priester_bestattung', professionId: 'priester', name: 'Bestattungsriten vollziehen', category: 'Fortgeschritten', description: 'Feierliche Geleitgebete, Weihung des Grabes und Trost der Hinterbliebenen.', relatedCompetencyIds: ['priester_liturgie'] },
      { id: 'priester_segnung', professionId: 'priester', name: 'Segnungen sprechen', category: 'Fortgeschritten', description: 'Segnung von Feldern, Gebäuden, Kriegern und Bündnissen im Namen der Gottheit.', relatedCompetencyIds: ['priester_seelsorge'] },
      { id: 'priester_disput', professionId: 'priester', name: 'Theologische Disputationen führen', category: 'Spezialisierung', description: 'Verteidigung der reinen Lehre gegen Häresien und abweichende Kulte.', relatedCompetencyIds: ['priester_schriften'] },
      { id: 'priester_weihe', professionId: 'priester', name: 'Tempelweihen spenden', category: 'Meisterschaft', description: 'Feierliche Einsetzung von Gotteshäusern, Priestern und heiligen Reliquien.', relatedCompetencyIds: ['priester_disput'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 19. BAUER / LANDWIRT (Natur & Landwirtschaft)
  // ---------------------------------------------------------------------------
  {
    professionId: 'bauer',
    professionName: 'Bauer / Landwirt',
    fieldId: 'natur_landwirtschaft',
    fieldName: 'Natur & Landwirtschaft',
    aliases: ['bauer', 'landwirt', 'ackerbauer', 'knecht', 'farmer'],
    specializations: ['Getreidebau', 'Gemüse- & Gartenbau', 'Viehwirtschaft', 'Weinbau'],
    possibleRanks: ['Tagelöhner', 'Hofknecht', 'Freibauer', 'Gutshofverwalter'],
    competencies: [
      { id: 'bauer_boden', professionId: 'bauer', name: 'Bodenbeschaffenheit prüfen', category: 'Grundlage', description: 'Beurteilung von Feuchte, Lehmgehalt und Nährstoffzustand des Ackerbodens.', relatedCompetencyIds: ['bauer_pflug'] },
      { id: 'bauer_pflug', professionId: 'bauer', name: 'Pflug führen', category: 'Grundlage', description: 'Gerades Ziehen tiefer Furchen mit Zugochsen oder Kaltblütern.', relatedCompetencyIds: ['bauer_boden', 'bauer_saat'] },
      { id: 'bauer_saat', professionId: 'bauer', name: 'Aussaat ausbringen', category: 'Grundlage', description: 'Gleichmäßiges Streuen von Saatgut nach Wind- und Witterungsverhältnissen.', relatedCompetencyIds: ['bauer_pflug'] },
      { id: 'bauer_ernte', professionId: 'bauer', name: 'Getreide mit der Sense ernten', category: 'Fortgeschritten', description: 'Kraftsparender, rhythmischer Schwung der Sense und schonendes Schwadlegen.', relatedCompetencyIds: ['bauer_dreschen'] },
      { id: 'bauer_dreschen', professionId: 'bauer', name: 'Dreschen & Worfeln', category: 'Fortgeschritten', description: 'Ausschlagen der Körner mit dem Dreschflegel und Trennen von der Spreu.', relatedCompetencyIds: ['bauer_ernte'] },
      { id: 'bauer_fruchtfolge', professionId: 'bauer', name: 'Dreifelderwirtschaft planen', category: 'Spezialisierung', description: 'Wechsel von Wintergetreide, Sommergetreide und Brache zur Bodenschonung.', relatedCompetencyIds: ['bauer_boden'] },
      { id: 'bauer_grossgut', professionId: 'bauer', name: 'Gutshof wirtschaftlich leiten', category: 'Meisterschaft', description: 'Verwaltung von Speichern, Gesinde, Tieren und Abgaben ganzer Dörfer.', relatedCompetencyIds: ['bauer_fruchtfolge'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 20. FISCHER (Natur & Landwirtschaft)
  // ---------------------------------------------------------------------------
  {
    professionId: 'fischer',
    professionName: 'Fischer',
    fieldId: 'natur_landwirtschaft',
    fieldName: 'Natur & Landwirtschaft',
    aliases: ['fischer', 'fischerin', 'seeangler', 'reusenfischer', 'fisherman'],
    specializations: ['Fluss- & Seenfischerei', 'Küsten- & Schleppnetzfischerei', 'Reusen- & Stellnetzfischerei', 'Fischzucht'],
    possibleRanks: ['Fischerjunge', 'Fischergeselle', 'Fischermeister', 'Zunftoberfischer'],
    competencies: [
      { id: 'fischer_netz_flicken', professionId: 'fischer', name: 'Netze flicken & knüpfen', category: 'Grundlage', description: 'Instandhalten von Maschen und Tauen mit der Knüpfnadel.', relatedCompetencyIds: ['fischer_werfen'] },
      { id: 'fischer_werfen', professionId: 'fischer', name: 'Wurfnetze auswerfen', category: 'Grundlage', description: 'Kreisrundes Ausbreiten des Netzes auf flachem Gewässergrund.', relatedCompetencyIds: ['fischer_netz_flicken'] },
      { id: 'fischer_wasser', professionId: 'fischer', name: 'Gewässerströmung & Standplätze lesen', category: 'Grundlage', description: 'Auffinden von Fischzügen anhand von Wasserwirbeln und Uferbewuchs.', relatedCompetencyIds: ['fischer_werfen'] },
      { id: 'fischer_reusen', professionId: 'fischer', name: 'Reusen & Stellnetze setzen', category: 'Fortgeschritten', description: 'Ausbringen verankerter Reusen in Flusskrümmungen bei Dämmerung.', relatedCompetencyIds: ['fischer_wasser'] },
      { id: 'fischer_versorgen', professionId: 'fischer', name: 'Fangfrischen Fisch versorgen', category: 'Fortgeschritten', description: 'Schonendes Töten, Ausnehmen und Einlegen in Salzlake oder Eis.', relatedCompetencyIds: ['fischer_werfen'] },
      { id: 'fischer_kahn', professionId: 'fischer', name: 'Fischerkahn steuern', category: 'Fortgeschritten', description: 'Sicheres Staken und Rudern auch bei dichtem Seenebel.', relatedCompetencyIds: ['fischer_wasser'] },
      { id: 'fischer_hochsee', professionId: 'fischer', name: 'Hochseenetze einholen', category: 'Spezialisierung', description: 'Koordinierte Schleppnetzfischerei auf offener See bei rauem Wellengang.', relatedCompetencyIds: ['fischer_kahn'] },
      { id: 'fischer_teichbau', professionId: 'fischer', name: 'Fischteichanlagen anlegen', category: 'Meisterschaft', description: 'Bau kaskadierter Zuchtteiche mit regulierbaren Mönchen und Gräben.', relatedCompetencyIds: ['fischer_wasser'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 21. JÄGER / FÄHRTENLESER (Natur & Landwirtschaft)
  // ---------------------------------------------------------------------------
  {
    professionId: 'jaeger',
    professionName: 'Jäger / Fährtenleser',
    fieldId: 'natur_landwirtschaft',
    fieldName: 'Natur & Landwirtschaft',
    aliases: ['jäger', 'jaeger', 'fährtenleser', 'förster', 'waldläufer', 'hunter', 'ranger'],
    specializations: ['Bogenjagd & Pirsch', 'Fährtenlesen & Spurenkunde', 'Fallenstellerei', 'Hege & Forstschutz'],
    possibleRanks: ['Jagdgehilfe', 'Jäger', 'Revierjäger', 'Hofjägermeister'],
    competencies: [
      { id: 'jaeger_schleichen', professionId: 'jaeger', name: 'Lautloses Pirschen', category: 'Grundlage', description: 'Schleichen über trockenes Geäst und Laub ohne Geräuschentwicklung im Windschatten.', relatedCompetencyIds: ['jaeger_spuren'] },
      { id: 'jaeger_spuren', professionId: 'jaeger', name: 'Trittsiegel & Fährten lesen', category: 'Grundlage', description: 'Altersbestimmung und Gangart von Tieren an Pfotenabdrücken und Losung.', relatedCompetencyIds: ['jaeger_schleichen'] },
      { id: 'jaeger_wind', professionId: 'jaeger', name: 'Windrichtung & Witterung beachten', category: 'Grundlage', description: 'Ständiges Anpassen der Pirschroute an wechselnde Fallwinde im Unterholz.', relatedCompetencyIds: ['jaeger_schleichen'] },
      { id: 'jaeger_bogen', professionId: 'jaeger', name: 'Jagdbogenschuss aus dem Hinterhalt', category: 'Fortgeschritten', description: 'Tödlicher Schuss auf die Kammer auf Entfernungen bis zu fünfzig Schritt.', relatedCompetencyIds: ['jaeger_wind'] },
      { id: 'jaeger_fallen', professionId: 'jaeger', name: 'Schlingen & Fallen stellen', category: 'Fortgeschritten', description: 'Tarnung und Auslösemechanik von Tritt- und Schlagfallen für Kleinwild.', relatedCompetencyIds: ['jaeger_spuren'] },
      { id: 'jaeger_aufbrechen', professionId: 'jaeger', name: 'Wild aufbrechen & zerwirken', category: 'Fortgeschritten', description: 'Sauberes Entweiden direkt am Erlegungsort ohne Verunreinigung des Fleisches.', relatedCompetencyIds: ['jaeger_bogen'] },
      { id: 'jaeger_grosswild', professionId: 'jaeger', name: 'Großwild & Bären stellen', category: 'Spezialisierung', description: 'Gefahrvolle Hetzjagd auf gefährliche Raubtiere mit Saufeder und Hunden.', relatedCompetencyIds: ['jaeger_bogen'] },
      { id: 'jaeger_waldgeist', professionId: 'jaeger', name: 'Verschollenes im Dickicht aufspüren', category: 'Meisterschaft', description: 'Fährtenverfolgung über nackten Fels und durch reißende Bäche über Tage hinweg.', relatedCompetencyIds: ['jaeger_spuren'] }
    ]
  },

  // ---------------------------------------------------------------------------
  // 22. BERGARBEITER / BERGMANN (Bergbau & Rohstoffe)
  // ---------------------------------------------------------------------------
  {
    professionId: 'bergmann',
    professionName: 'Bergarbeiter / Bergmann',
    fieldId: 'bergbau_rohstoffe',
    fieldName: 'Bergbau & Rohstoffe',
    aliases: ['bergmann', 'bergarbeiter', 'hauer', 'knappe', 'schürfer', 'miner'],
    specializations: ['Stollenvortrieb & Hauer', 'Grubenbewetterung & Sicherheit', 'Erzschürfen & Mineralprüfung', 'Grubenausbau'],
    possibleRanks: ['Schlepper', 'Jungknappe', 'Hauer', 'Steiger', 'Oberbergmeister'],
    competencies: [
      { id: 'bergmann_gezaeh', professionId: 'bergmann', name: 'Gezähe (Schlägel & Eisen) führen', category: 'Grundlage', description: 'Präziser Schlag auf Meißel und Pickel im engen Stollenquerschnitt.', relatedCompetencyIds: ['bergmann_stollen'] },
      { id: 'bergmann_ausbau', professionId: 'bergmann', name: 'Grubenholz setzen & verkeilen', category: 'Grundlage', description: 'Setzen tragender Holzstempel und Kappen zum Schutz vor Firstenbrüchen.', relatedCompetencyIds: ['bergmann_gezaeh'] },
      { id: 'bergmann_wetter', professionId: 'bergmann', name: 'Grubenwetter & Grubengase prüfen', category: 'Grundlage', description: 'Beobachten der Grubenlampe auf matte oder schlagende Wetter.', relatedCompetencyIds: ['bergmann_ausbau'] },
      { id: 'bergmann_erze', professionId: 'bergmann', name: 'Erzadern erkennen & freilegen', category: 'Fortgeschritten', description: 'Verfolgen mineralisierter Klüfte von Kupfer, Zinn, Eisen und Silber im Ganggestein.', relatedCompetencyIds: ['bergmann_gezaeh'] },
      { id: 'bergmann_stollen', professionId: 'bergmann', name: 'Stollenvortrieb im Fels', category: 'Fortgeschritten', description: 'Vorantreiben des Stollens mit Schlägel, Keilen und kontrolliertem Feuersetzen.', relatedCompetencyIds: ['bergmann_erze'] },
      { id: 'bergmann_wasser', professionId: 'bergmann', name: 'Wasserhaltung & Entwässerung', category: 'Spezialisierung', description: 'Anlegen von Erb- und Saugstollen sowie Betreiben von Eimerkunstanlagen.', relatedCompetencyIds: ['bergmann_stollen'] },
      { id: 'bergmann_revier', professionId: 'bergmann', name: 'Tiefbaugruben & Reviere leiten', category: 'Meisterschaft', description: 'Gesamtplanung von Hauptschächten, Fördersystemen und Grubenrettung.', relatedCompetencyIds: ['bergmann_stollen', 'bergmann_ausbau'] }
    ]
  }
];

/**
 * Normalizes a string for loose matching against profession identifiers.
 */
export function normalizeProfessionKey(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-zäöüß0-9]/g, '');
}

/**
 * Returns all defined profession fields.
 */
export function getAllProfessionFields(): ProfessionFieldDefinition[] {
  return PROFESSION_FIELDS;
}

/**
 * Finds all catalog professions associated with a field id.
 */
export function getProfessionsForField(fieldId: string): ProfessionCatalogEntry[] {
  if (!fieldId || fieldId === 'all') return PROFESSION_COMPETENCY_CATALOG;
  return PROFESSION_COMPETENCY_CATALOG.filter(entry => entry.fieldId === fieldId);
}

/**
 * Finds the matching catalog entry for a given profession title/name.
 */
export function findProfessionCatalogEntry(professionName: string): ProfessionCatalogEntry | undefined {
  if (!professionName || !professionName.trim()) return undefined;
  const norm = normalizeProfessionKey(professionName);
  if (!norm) return undefined;

  return PROFESSION_COMPETENCY_CATALOG.find(entry => {
    if (normalizeProfessionKey(entry.professionId) === norm) return true;
    if (normalizeProfessionKey(entry.professionName) === norm) return true;
    return entry.aliases.some(alias => {
      const normAlias = normalizeProfessionKey(alias);
      if (norm === normAlias) return true;
      if (norm.length >= 4 && normAlias.length >= 4) {
        return norm.includes(normAlias) || normAlias.includes(norm);
      }
      return false;
    });
  });
}

/**
 * Retrieves possible specializations for a profession.
 */
export function getProfessionSpecializations(professionName: string): string[] {
  const entry = findProfessionCatalogEntry(professionName);
  return entry ? entry.specializations : [];
}

/**
 * Retrieves possible ranks for a profession (if world/craft knows them).
 */
export function getProfessionPossibleRanks(professionName: string): string[] {
  const entry = findProfessionCatalogEntry(professionName);
  return entry ? entry.possibleRanks : ['Lehrling', 'Geselle', 'Meister'];
}

/**
 * Generates dynamic fallback competency definitions if a profession is custom or uncataloged.
 */
export function generateGenericCompetencyDefinitions(professionName: string): ProfessionCompetencyDefinition[] {
  const pName = professionName.trim() || 'Beruf';
  const prefix = normalizeProfessionKey(pName) || 'custom';

  return [
    {
      id: `${prefix}_grundlagen`,
      professionId: prefix,
      name: `Grundlagen von: ${pName}`,
      category: 'Grundlage',
      description: `Sicherer Umgang mit den grundlegenden Arbeitsgeräten und Fachaufgaben als ${pName}.`
    },
    {
      id: `${prefix}_material`,
      professionId: prefix,
      name: `Material- & Fachkunde: ${pName}`,
      category: 'Grundlage',
      description: `Erkennen, Beurteilen und Vorbereiten der nötigen Arbeitsmittel und Rohstoffe.`
    },
    {
      id: `${prefix}_standard`,
      professionId: prefix,
      name: `Standardaufgaben von: ${pName}`,
      category: 'Fortgeschritten',
      description: `Selbstständige Ausführung wiederkehrender beruflicher Kernaufgaben.`
    },
    {
      id: `${prefix}_spezialtechnik`,
      professionId: prefix,
      name: `Fachspezifische Technik: ${pName}`,
      category: 'Spezialisierung',
      description: `Anspruchsvolle, präzise Sonderarbeiten innerhalb des Berufsfeldes.`
    },
    {
      id: `${prefix}_meisterleistung`,
      professionId: prefix,
      name: `Meisterleistung & Perfektion: ${pName}`,
      category: 'Meisterschaft',
      description: `Höchste Beherrschung komplexer Großaufträge und Meisterwerke als ${pName}.`
    }
  ];
}

/**
 * Retrieves all catalog competencies for a profession (or generic ones if uncataloged).
 */
export function getCatalogCompetenciesForProfession(professionName: string): ProfessionCompetencyDefinition[] {
  const entry = findProfessionCatalogEntry(professionName);
  if (entry && entry.competencies.length > 0) {
    return entry.competencies;
  }
  return generateGenericCompetencyDefinitions(professionName);
}
