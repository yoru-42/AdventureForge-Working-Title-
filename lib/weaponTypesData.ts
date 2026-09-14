// -*- coding: utf-8 -*-
/**
 * Umfangreiche Datenbank aller Waffenarten, Kategorien, Führungsstile,
 * Schadensarten und Kampfmanöver für das System der Waffenbeherrschung.
 */

export interface WeaponTypeDefinition {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  damageTypes: string[]; // z.B. ['Schnitt', 'Stich', 'Wucht']
  wieldingStyles: string[]; // z.B. ['Einhand', 'Zweihand', 'Beidhändig']
  rangeCategory: 'Nahkampf' | 'Stangenreichweite' | 'Fernkampf' | 'Defensiv';
  description: string;
  maneuvers: string[];
}

export interface WeaponCategoryDefinition {
  id: string;
  name: string;
  description: string;
  defaultRange: 'Nahkampf' | 'Stangenreichweite' | 'Fernkampf' | 'Defensiv';
  defaultWieldingStyle: string;
  weaponCount?: number;
}

export const WEAPON_CATEGORIES: WeaponCategoryDefinition[] = [
  {
    id: 'schwerter_einhaendig',
    name: 'Schwerter & Klingen (Einhändig)',
    description: 'Vielseitige Klingenwaffen für Hieb, Stich, Paraden und flexible Führungsstile mit Schild oder freier Hand.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Einhand'
  },
  {
    id: 'schwerter_zweihanendig',
    name: 'Schwerter & Großklingen (Zweihändig)',
    description: 'Massive Klingenwaffen mit hoher Reichweite, vernichtender Wucht und raumgreifenden Schwüngen.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Zweihand'
  },
  {
    id: 'dolche_messer',
    name: 'Dolche, Messer & Kurzklingen',
    description: 'Kompakte Waffen für den Nahkampf auf engstem Raum, Hinterhalte, Panzerlücken und präzise Stiche.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Einhand'
  },
  {
    id: 'aexte_beile',
    name: 'Äxte, Beile & Kriegshacken',
    description: 'Wuchtige Klingenwaffen zum Spalten von Schilden, Durchschlagen von Rüstungen und Einhaken.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Einhand'
  },
  {
    id: 'haemmer_keulen',
    name: 'Hämmer, Keulen & Wuchtwaffen',
    description: 'Reine Erschütterungs- und Stoßwaffen zur Zertrümmerung schwerster Plattenpanzer und Schilde.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Einhand'
  },
  {
    id: 'stangenwaffen_speere',
    name: 'Stangenwaffen, Speere & Lanzen',
    description: 'Distanz-Nahkampfwaffen für Stöße außerhalb der gegnerischen Klingenreichweite und Formationskämpfe.',
    defaultRange: 'Stangenreichweite',
    defaultWieldingStyle: 'Zweihand'
  },
  {
    id: 'boegen_sehnenwaffen',
    name: 'Bögen & Sehnenwaffen',
    description: 'Traditionelle Sehnen-Fernwaffen für hohe Schussfrequenz, gezielte Pfeilschüsse und Reichweitenvorteile.',
    defaultRange: 'Fernkampf',
    defaultWieldingStyle: 'Fernkampf / Schießhaltung'
  },
  {
    id: 'armbrueste',
    name: 'Armbrüste & Mechanische Fernwaffen',
    description: 'Mechanisch gespannte Fernwaffen mit extremer Durchschlagskraft, Bolzenfeuer und Zielpräzision.',
    defaultRange: 'Fernkampf',
    defaultWieldingStyle: 'Fernkampf / Schießhaltung'
  },
  {
    id: 'wurfwaffen_schleudern',
    name: 'Wurfwaffen & Schleudern',
    description: 'Leichte, geschossbasierte Wurfwaffen für bewegliche Scharmützel, Jagd und überraschende Angriffe.',
    defaultRange: 'Fernkampf',
    defaultWieldingStyle: 'Wurfkampf'
  },
  {
    id: 'faust_exotisch',
    name: 'Faust-, Ketten- & Exotische Waffen',
    description: 'Unkonventionelle Nahkampfwaffen, Ketten, Schlagringe, Klauen und fernöstliche Kampfkünste.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Einhand'
  },
  {
    id: 'schilde',
    name: 'Schilde & Defensivbeherrschung',
    description: 'Aktiver und passiver Schutz, Schildstöße, Abprallwinkel und Schutzwälle gegen Projektile.',
    defaultRange: 'Defensiv',
    defaultWieldingStyle: 'Waffe & Schild'
  },
  {
    id: 'schwarzpulver',
    name: 'Schwarzpulverwaffen & Frühe Schusswaffen',
    description: 'Verheerende Pulverladungen, Bleikugeln, Luntenschlösser und Donnerbüchsen mit hohem Schockwert.',
    defaultRange: 'Fernkampf',
    defaultWieldingStyle: 'Fernkampf / Schießhaltung'
  },
  {
    id: 'magisch_fokus',
    name: 'Magische Waffen & Arkane Fokusse',
    description: 'Geweihte Stäbe, Ritualklingen und Fokuskristalle, die physischen Kampf mit Zauberkraft verbinden.',
    defaultRange: 'Nahkampf',
    defaultWieldingStyle: 'Einhand'
  }
];

export const ALL_WEAPONS: WeaponTypeDefinition[] = [
  // =========================================================================
  // 1. SCHWERTER & KLINGEN (EINHÄNDIG)
  // =========================================================================
  {
    id: 'kurzschwert',
    name: 'Kurzschwert',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Schnitt', 'Stich'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Kompakte, handliche Klinge für enge Räume, rasche Ausfallschritte und flinke Schnittkombinationen.',
    maneuvers: ['Schneller Ausfallstich', 'Unterhand-Schnitt', 'Entwaffnungshebel', 'Klingenwirbel']
  },
  {
    id: 'langschwert',
    name: 'Langschwert',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Hieb', 'Stich', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Zweihand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Der vielseitige Maßstab europäischer Fechtkunst: Ausgewogenes Gleichgewicht für kraftvolle Hiebe und präzise Stöße.',
    maneuvers: ['Zornhau & Versatz', 'Parierstoß', 'Halbschwertführung', 'Mordschlag', 'Kreuzhieb']
  },
  {
    id: 'breitschwert',
    name: 'Breitschwert',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Hieb', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Breite, einschneidige oder zweischneidige Klinge mit Schwerpunkt nach vorn für durchschlagende Hiebe.',
    maneuvers: ['Schädelspalter', 'Schildknacker', 'Schwunghieb', 'Wuchtige Parade']
  },
  {
    id: 'krummsaebel',
    name: 'Krummsäbel / Scimitar',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Schnitt'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)', 'Freie Hand / Duellhaltung'],
    rangeCategory: 'Nahkampf',
    description: 'Stark geschwungene Klinge, die beim Durchziehen tiefe Schnittwunden reißt, ideal für Reiter und agile Kämpfer.',
    maneuvers: ['Ziehender Flankenschnitt', 'Wirbeldrehung', 'Reiterhieb', 'Schneller Täuschungshieb']
  },
  {
    id: 'rapier',
    name: 'Rapier',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Stich', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Freie Hand / Duellhaltung', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Schlanke, lange Klinge mit kunstvollem Korbgefäß für höchste Reichweite, Finten und tödliche Punktstiche.',
    maneuvers: ['Passe-Avant & Stoß', 'Ausfallschritt', 'Klingenbindung (Engagement)', 'Riposte', 'Parierdolch-Kombination']
  },
  {
    id: 'fechtdegen',
    name: 'Fechtdegen',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Stich'],
    wieldingStyles: ['Einhand', 'Freie Hand / Duellhaltung'],
    rangeCategory: 'Nahkampf',
    description: 'Leichte, federnde Stoßwaffe für rasante Duellaktionen, bei denen Geschwindigkeit und Reflexe entscheiden.',
    maneuvers: ['Flic & Finte', 'Rückzugstoß', 'Handtreffer', 'Gegenstoß in die Angriffsbewegung']
  },
  {
    id: 'saebel',
    name: 'Säbel / Kavalleriesäbel',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Hieb', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Waffe & Schild', 'Freie Hand / Duellhaltung'],
    rangeCategory: 'Nahkampf',
    description: 'Leicht gekrümmte Klinge mit festem Handschutz, gebaut für verheerende Hiebe aus vollem Galopp oder im Vorwärtssturm.',
    maneuvers: ['Kavallerie-Abwärtshieb', 'Querschnitt', 'Korbstoß', 'Ausweichriposte']
  },
  {
    id: 'katana',
    name: 'Katana (Uchigatana)',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Schnitt', 'Stich'],
    wieldingStyles: ['Zweihand', 'Einhand', 'Freie Hand / Duellhaltung'],
    rangeCategory: 'Nahkampf',
    description: 'Meisterhaft gefaltete, leicht gekrümmte japanische Klinge mit rasiermesserscharfer Schneide für schnelle Ziehtechniken.',
    maneuvers: ['Iaidō (Schnellzieh-Schnitt)', 'Kesa-Giri (Diagonalschnitt)', 'Tsuki (Herzstoß)', 'Klingenparade & Konter']
  },
  {
    id: 'wakizashi',
    name: 'Wakizashi',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Schnitt', 'Stich'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Traditionelles Begleitschwert des Samurai für beengte Räume und beidhändige Schwertkombinationen (Niten Ichi-ryū).',
    maneuvers: ['Zweitklingen-Parade', 'Nahdistanz-Kehlenschnitt', 'Konter nach Schildstoß']
  },
  {
    id: 'falchion',
    name: 'Falchion / Malchus',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Hieb', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Einschneidige Klinge mit beilartiger Wölbung, vereint die Schnelligkeit eines Schwertes mit der Zerstörungskraft einer Axt.',
    maneuvers: ['Hackhieb', 'Spaltungsschlag', 'Knochenbrecher', 'Schwere Schilddeckung brechen']
  },
  {
    id: 'gladius',
    name: 'Gladius',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Stich', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Breites römisches Kurzschwert, optimiert für den Formationskampf hinter einem großen Schild mit tödlichen Unterleibsstößen.',
    maneuvers: ['Schilddeckung & Tiefstoß', 'Schneller Leberstich', 'Knieschnitt', 'Formationsvorstoß']
  },
  {
    id: 'seitenschwert',
    name: 'Seitenschwert (Spada da Lato)',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Hieb', 'Stich'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Renaissance-Militärschwert mit Schutzkreuz und Ringen, ideal für den Wechsel zwischen Hiebfechten und Punktstößen.',
    maneuvers: ['Mandritto & Roversa', 'Stoccata (Gerader Stoß)', 'Kreuzblock', 'Finte & Handtreffer']
  },
  {
    id: 'khopesh',
    name: 'Khopesh (Sichelschwert)',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Schnitt', 'Hieb'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Altes sichelförmiges Bronzeschwert, dessen Hakenform hervorragend geeignet ist, um Schilde und Waffen wegzureißen.',
    maneuvers: ['Schildhaken', 'Reißhieb', 'Entwaffnungswinkel', 'Halszug']
  },
  {
    id: 'katzbalger',
    name: 'Katzbalger',
    categoryId: 'schwerter_einhaendig',
    categoryName: 'Schwerter & Klingen (Einhändig)',
    damageTypes: ['Hieb', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Kurzes, breites Landsknechtsschwert mit charakteristischer 8-förmiger Parierstange für engstes Handgemenge.',
    maneuvers: ['Nahgemenge-Wirbel', 'Stumpfer Knaufschlag', 'Verdrängungshieb', 'Enger Klingenblock']
  },

  // =========================================================================
  // 2. SCHWERTER & KLINGEN (ZWEIHÄNDIG)
  // =========================================================================
  {
    id: 'anderthalbhaender',
    name: 'Anderthalbhänder (Bastardschwert)',
    categoryId: 'schwerter_zweihanendig',
    categoryName: 'Schwerter & Großklingen (Zweihändig)',
    damageTypes: ['Hieb', 'Stich', 'Wucht'],
    wieldingStyles: ['Zweihand', 'Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Verlängerter Griff für flexible Zweihand- oder Einhandführung, bietet enorme Hebelwirkung bei Paraden und Stößen.',
    maneuvers: ['Windung & Durchwechseln', 'Ochsenhaltung-Stoß', 'Pflug-Abwehr', 'Knaufhebel', 'Halbschwert-Panzerstich']
  },
  {
    id: 'zweihaender',
    name: 'Zweihänder (Großschwert / Schlachtschwert)',
    categoryId: 'schwerter_zweihanendig',
    categoryName: 'Schwerter & Großklingen (Zweihändig)',
    damageTypes: ['Hieb', 'Wucht', 'Schnitt'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Bis zu zwei Meter langes Schlachtschwert der Landsknechte mit Parierhaken, fähig Pikenformationen zu zerbrechen.',
    maneuvers: ['Pikenbrecher-Schwung', 'Endlose Acht (Mühlenhieb)', 'Bodenramme', 'Raumgreifender Rundumhieb']
  },
  {
    id: 'claymore',
    name: 'Claymore',
    categoryId: 'schwerter_zweihanendig',
    categoryName: 'Schwerter & Großklingen (Zweihändig)',
    damageTypes: ['Hieb', 'Schnitt', 'Stich'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Schottisches Zweihandschwert mit nach vorn geneigter Kreuzparierstange und mächtigem Schwungmoment.',
    maneuvers: ['Hochland-Sturmhieb', 'Abwärtsspaltung', 'Breitseitiger Block', 'Gegensturz']
  },
  {
    id: 'flamberge',
    name: 'Flamberge (Flammenschwert)',
    categoryId: 'schwerter_zweihanendig',
    categoryName: 'Schwerter & Großklingen (Zweihändig)',
    damageTypes: ['Hieb', 'Schnitt', 'Wucht'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Wellenförmig geschmiedete Klinge, die gegnerische Klingen vibrieren lässt, Bindungen erschwert und schwere Fleischwunden reißt.',
    maneuvers: ['Klingenzitter-Parade', 'Wellenschnitt', 'Erschütternder Block', 'Wundaufreißender Rückzug']
  },
  {
    id: 'nodachi',
    name: 'Nodachi / Odachi',
    categoryId: 'schwerter_zweihanendig',
    categoryName: 'Schwerter & Großklingen (Zweihändig)',
    damageTypes: ['Schnitt', 'Hieb'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Monumentales japanisches Feldzugschwert gegen berittene Krieger mit extremer Hebelkraft und schneidender Reichweite.',
    maneuvers: ['Reitersturz-Hieb', 'Weitwinkelschnitt', 'Sturmschritt-Schlag', 'Abfangstreich']
  },
  {
    id: 'kriegssense',
    name: 'Kriegssense',
    categoryId: 'schwerter_zweihanendig',
    categoryName: 'Schwerter & Großklingen (Zweihändig)',
    damageTypes: ['Schnitt', 'Hieb'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'In Schaftrichtung aufgerichtetes Sensenblatt, vereint die Reichweite einer Stangenwaffe mit brutalen Schnitten.',
    maneuvers: ['Kornmahd-Rundumschlag', 'Hakenkappung', 'Überkopfschnitt', 'Fallenziehen']
  },

  // =========================================================================
  // 3. DOLCHE, MESSER & KURZKLINGEN
  // =========================================================================
  {
    id: 'kampfdolch',
    name: 'Kampfdolch',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Stich', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Doppelschneidige Klinge mit spitzer Ausrichtung, schnell im Griffwechsel (Vorhand/Rückhand).',
    maneuvers: ['Rückhandstich', 'Kehlenschnitt aus Deckung', 'Gelenkhebel & Stich', 'Unterarm-Riposte']
  },
  {
    id: 'parierdolch',
    name: 'Parierdolch (Linkhanddolch)',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Stich', 'Defensiv'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Mit breiter Parierstange und Klingenbrecher-Rillen ausgestattet, um Schwerthiebe der Nebenhand zu neutralisieren.',
    maneuvers: ['Klingenfang & Bruch', 'Kreuzparade mit Rapier', 'Stoßkonter unter der Klinge']
  },
  {
    id: 'stilett',
    name: 'Stilett (Panzerbrecher)',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Stich'],
    wieldingStyles: ['Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Dreikantige, nadelscharfe Klinge ohne Schneide, konstruiert um Kettenringe zu sprengen und Rüstungsfugen zu finden.',
    maneuvers: ['Visierstoß', 'Achselstich', 'Kettenring-Sprengung', 'Lautloser Nackenstoß']
  },
  {
    id: 'kukri',
    name: 'Kukri',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Hieb', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Nach innen gekrümmtes Haumesser der Ghurkhas, entfaltet die Wucht eines kleinen Beils beim Schneiden.',
    maneuvers: ['Abwärtskappung', 'Sehnenschnitt', 'Wirbelschlag', 'Wuchtiger Block']
  },
  {
    id: 'karambit',
    name: 'Karambit',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Schnitt'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Klauenförmiges Messer mit Fingerring, ideal für unberechenbare Wirbelschnitte, Fesselungen und Nahkontrolle.',
    maneuvers: ['Klauenriss', 'Ringwirbel-Griffwechsel', 'Hebel-Entwaffnung', 'Sehnenriss']
  },
  {
    id: 'tanto',
    name: 'Tantō',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Stich', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Japanischer Dolch mit charakteristischer Kantenverstärkung an der Spitze für kraftvolle Durchstiche.',
    maneuvers: ['Nahdistanz-Panzerstoß', 'Gegenangriff aus dem Ärmel', 'Rippenstich']
  },
  {
    id: 'rondelldolch',
    name: 'Rondelldolch',
    categoryId: 'dolche_messer',
    categoryName: 'Dolche, Messer & Kurzklingen',
    damageTypes: ['Stich'],
    wieldingStyles: ['Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Ritterlicher Stoßdolch mit runden Scheiben am Griff, gestattet vollen Körpereinsatz beim Hebelstich in Rüstungsspalten.',
    maneuvers: ['Harnischstich', 'Ringkampfhebel & Stoß', 'Brustplatten-Fugenstoß']
  },

  // =========================================================================
  // 4. ÄXTE, BEILE & KRIEGSHACKEN
  // =========================================================================
  {
    id: 'streitaxt_einhand',
    name: 'Streitaxt (Einhand)',
    categoryId: 'aexte_beile',
    categoryName: 'Äxte, Beile & Kriegshacken',
    damageTypes: ['Hieb', 'Spaltung'],
    wieldingStyles: ['Einhand', 'Waffe & Schild', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Kompakte Axt mit schmalem Blatt für konzentrierte Schlagenergie, die Knochen bricht und Schilde spaltet.',
    maneuvers: ['Schildrand-Spaltung', 'Überkopfhieb', 'Knöchelhacke', 'Seitlicher Einbruchschlag']
  },
  {
    id: 'kriegsaxt_zweihand',
    name: 'Kriegsaxt / Bartaxt (Zweihändig)',
    categoryId: 'aexte_beile',
    categoryName: 'Äxte, Beile & Kriegshacken',
    damageTypes: ['Hieb', 'Spaltung', 'Wucht'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Lange Axt mit herabgezogenem Bart zum Einhaken von Schildrändern und verheerenden Zweihandschlägen.',
    maneuvers: ['Schildweghaken', 'Bartaxt-Riss', 'Berserker-Doppelhieb', 'Stielblock']
  },
  {
    id: 'daenenaxt',
    name: 'Dänenaxt (Langstielaxt)',
    categoryId: 'aexte_beile',
    categoryName: 'Äxte, Beile & Kriegshacken',
    damageTypes: ['Hieb', 'Spaltung'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Leichte, breite Klinge auf langem Schaft, gefürchtet bei den Wikingern und Huscarls für ihre Reichweite.',
    maneuvers: ['Huscarl-Schwunghieb', 'Pferdefußkappung', 'Helmspalter', 'Distanz-Sichelschlag']
  },
  {
    id: 'franziska',
    name: 'Franziska (Wurfaxt / Handbeil)',
    categoryId: 'aexte_beile',
    categoryName: 'Äxte, Beile & Kriegshacken',
    damageTypes: ['Hieb', 'Wurf'],
    wieldingStyles: ['Einhand', 'Wurfkampf', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Geschwungenes germanisches Wurfbeil, das im Flug unberechenbar rotiert und auch im Nahkampf zuschlägt.',
    maneuvers: ['Rotationswurf', 'Nahkampfhacke', 'Schildzertrümmerer', 'Doppelbeil-Sturm']
  },
  {
    id: 'doppelaxt',
    name: 'Doppelaxt (Labrys)',
    categoryId: 'aexte_beile',
    categoryName: 'Äxte, Beile & Kriegshacken',
    damageTypes: ['Hieb', 'Spaltung'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Zweischneidige Kriegsaxt mit perfekter Balance für unterbrechungslose Vor- und Rückhandschwünge.',
    maneuvers: ['Klingenwechsel-Hieb', 'Zwei-Phasen-Schwung', 'Verwüstungswirbel']
  },

  // =========================================================================
  // 5. HÄMMER, KEULEN & WUCHTWAFFEN
  // =========================================================================
  {
    id: 'kriegshammer',
    name: 'Kriegshammer',
    categoryId: 'haemmer_keulen',
    categoryName: 'Hämmer, Keulen & Wuchtwaffen',
    damageTypes: ['Wucht', 'Stich'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Kompakter Hammerkopf auf einer Seite und panzerbrechender Rabenschnabel auf der anderen.',
    maneuvers: ['Helmbeulung', 'Schnabeldorn-Durchschlag', 'Kniezertrümmerer', 'Knaufhebel']
  },
  {
    id: 'streitkolben',
    name: 'Streitkolben (Mace / Morgenstern)',
    categoryId: 'haemmer_keulen',
    categoryName: 'Hämmer, Keulen & Wuchtwaffen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Schwere Metallflanschen oder Dornen an solidem Stahlgriff, zertrümmert Rüstungen unabhängig vom Trefferwinkel.',
    maneuvers: ['Rüstungsdelle', 'Schädelerschütterung', 'Gelenkzertrümmerung', 'Betäubungshieb']
  },
  {
    id: 'kriegsflegel',
    name: 'Kriegsflegel (Kettenmorgenstern)',
    categoryId: 'haemmer_keulen',
    categoryName: 'Hämmer, Keulen & Wuchtwaffen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Einhand', 'Waffe & Schild'],
    rangeCategory: 'Nahkampf',
    description: 'Eisenkugel an Kettengliedern, überwindet gegnerische Schilde und Paraden durch Umgreifen der Deckung.',
    maneuvers: ['Schildübergriff', 'Kettenwickel-Entwaffnung', 'Unerbittlicher Schwung', 'Kopfschlag von oben']
  },
  {
    id: 'zweihaendiger_schlaegel',
    name: 'Zweihand-Kriegsvorschlaghammer',
    categoryId: 'haemmer_keulen',
    categoryName: 'Hämmer, Keulen & Wuchtwaffen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Massives Zweihand-Wuchtinstrument, erzeugt Erdstoß-Erschütterungen und bricht schwerste Bollwerke.',
    maneuvers: ['Bodenstampfer', 'Rundum-Trümmerschwung', 'Schildwall-Zerschlagung', 'Verheerender Niederstrecker']
  },
  {
    id: 'tetsubo',
    name: 'Tetsubo / Kanabō (Eisenkeule)',
    categoryId: 'haemmer_keulen',
    categoryName: 'Hämmer, Keulen & Wuchtwaffen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Japanische eiserne oder eisenbeschlagene Kriegskeule der Oni und Samurai, berüchtigt für brachiale Gewalt.',
    maneuvers: ['Oni-Schlag', 'Knochenbrecherschwung', 'Aufwärtstrümmerer', 'Schwerer Niederwurf']
  },

  // =========================================================================
  // 6. STANGENWAFFEN, SPEERE & LANZEN
  // =========================================================================
  {
    id: 'speer',
    name: 'Speer (Kurzspeer / Jagdspeer)',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Stich'],
    wieldingStyles: ['Einhand', 'Zweihand', 'Waffe & Schild', 'Wurfkampf'],
    rangeCategory: 'Stangenreichweite',
    description: 'Die älteste und effizienteste Waffe der Menschheit: Hält Gegner auf Distanz und stößt blitzschnell vor.',
    maneuvers: ['Distanzstoß', 'Beinfeger mit Schaft', 'Schneller Rückstoß', 'Speerwurf']
  },
  {
    id: 'kriegslanze',
    name: 'Kriegslanze / Stoßlanze',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Stich', 'Wucht'],
    wieldingStyles: ['Einhand', 'Zweihand'],
    rangeCategory: 'Stangenreichweite',
    description: 'Schwere Reiter- oder Infanterielanze, bündelt die Wucht des Ansturms in einer massiven Blattspitze.',
    maneuvers: ['Reiter-Couchstich', 'Ansturm-Abfang', 'Lanzenramme', 'Stoßfächer']
  },
  {
    id: 'hellebarde',
    name: 'Hellebarde',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Hieb', 'Stich', 'Reißhaken'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Stangenreichweite',
    description: 'Schweizer Armeewaffe mit Axtblatt, Stoßdorn und Reißhaken: Köpfen, Durchstechen und Entsatteln in einem.',
    maneuvers: ['Reiter-Entsattelung', 'Abwärtshieb mit Axtblatt', 'Stich aus zweiter Reihe', 'Hakensperre']
  },
  {
    id: 'pike',
    name: 'Pike (Schlachtfeldspieß)',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Stich'],
    wieldingStyles: ['Zweihand', 'Stangenhaltung / Formationsgriff'],
    rangeCategory: 'Stangenreichweite',
    description: 'Vier bis sechs Meter lange Stangenwaffe, bildet in geschlossener Formation einen undurchdringlichen Igelwald.',
    maneuvers: ['Igelstellung', 'Phalanx-Vorstoß', 'Kavalleriebrecher', 'Gegengestemmter Stoß']
  },
  {
    id: 'glefe',
    name: 'Glefe / Glaive',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Schnitt', 'Hieb', 'Stich'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Stangenreichweite',
    description: 'Große Klinge auf Holzschaft, ermöglicht weite Schnittbögen und Hiebe bei gleichzeitiger Sticheffizienz.',
    maneuvers: ['Kreishieb', 'Aufwärtsschnitt', 'Schaftblock & Klingenstoß', 'Fegeschlag']
  },
  {
    id: 'naginata',
    name: 'Naginata',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Schnitt', 'Stich'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Stangenreichweite',
    description: 'Elegante japanische Klingenstange, geschätzt für wirbelnde Hiebe, Fußangriffe und Abwehr von Reitern.',
    maneuvers: ['Tombo-Giri (Fluglibellenschnitt)', 'Sehnenschnitt im Wirbel', 'Schaftparade', 'Ausfallspieß']
  },
  {
    id: 'dreizack',
    name: 'Dreizack (Trident)',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Stich'],
    wieldingStyles: ['Zweihand', 'Einhand', 'Waffe & Schild'],
    rangeCategory: 'Stangenreichweite',
    description: 'Drei parallele Spitzen fangen gegnerische Waffen und Schilde ein und durchbohren mit mehrfachem Schaden.',
    maneuvers: ['Klingenfang & Drehung', 'Dreifach-Pfählung', 'Wurfangriff', 'Schildverhakung']
  },
  {
    id: 'bo_stab',
    name: 'Kampfstab / Bo-Stab (Quarterstaff)',
    categoryId: 'stangenwaffen_speere',
    categoryName: 'Stangenwaffen, Speere & Lanzen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Stangenreichweite',
    description: 'Hartholzstab für schnelle Rotationsparaden, Schläge mit beiden Enden und überraschende Reichweitenwechsel.',
    maneuvers: ['Doppelenden-Wirbel', 'Stoß aus der Mitte', 'Beinfeger', 'Kreuzblock']
  },

  // =========================================================================
  // 7. BÖGEN & SEHNENWAFFEN
  // =========================================================================
  {
    id: 'langbogen',
    name: 'Langbogen (Englischer Eibenbogen)',
    categoryId: 'boegen_sehnenwaffen',
    categoryName: 'Bögen & Sehnenwaffen',
    damageTypes: ['Durchbohrend'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Mächtiger Holzbogen mit extrem hohem Zuggewicht, fähig Rüstungen auf hunderte Meter zu durchschlagen.',
    maneuvers: ['Weitschuss-Volley', 'Bodkin-Panzerpfeil', 'Pfeilhagel', 'Schnellschuss auf kurze Distanz']
  },
  {
    id: 'kurzbogen',
    name: 'Kurzbogen / Reiterbogen',
    categoryId: 'boegen_sehnenwaffen',
    categoryName: 'Bögen & Sehnenwaffen',
    damageTypes: ['Durchbohrend'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Leichter, wendiger Bogen für die Jagd und berittenes Bogenschießen bei voller Bewegung.',
    maneuvers: ['Partischer Schuss (im Rückzug)', 'Doppelpfeilschuss', 'Laufschuss', 'Fächerfeuer']
  },
  {
    id: 'recurvebogen',
    name: 'Recurvebogen / Kompositbogen',
    categoryId: 'boegen_sehnenwaffen',
    categoryName: 'Bögen & Sehnenwaffen',
    damageTypes: ['Durchbohrend'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Mehrschichtige Wurfarme speichern höchste Energie bei kompakter Bauweise für extrem schnelle Pfeilflüge.',
    maneuvers: ['Präzisionsvisierung', 'Durchschlagender Sehnenschneller', 'Fokus-Schuss', 'Flankenpfeil']
  },

  // =========================================================================
  // 8. ARMBRÜSTE & MECHANISCHE FERNWAFFEN
  // =========================================================================
  {
    id: 'schwere_armbrust',
    name: 'Schwere Kriegsarmbrust (Windenarmbrust)',
    categoryId: 'armbrueste',
    categoryName: 'Armbrüste & Mechanische Fernwaffen',
    damageTypes: ['Durchbohrend', 'Wucht'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Stahlbogen mit Flaschenzug oder Zahnstange, feuert schwere Bolzen mit vernichtender kinetischer Energie ab.',
    maneuvers: ['Schildbrecher-Bolzen', 'Lauernder Schuss aus Pavese', 'Kritischer Herzbolzen', 'Scharfschützenvisier']
  },
  {
    id: 'handarmbrust',
    name: 'Handarmbrust (Pistolenarmbrust)',
    categoryId: 'armbrueste',
    categoryName: 'Armbrüste & Mechanische Fernwaffen',
    damageTypes: ['Durchbohrend'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Fernkampf',
    description: 'Kompakte Einhand-Armbrust für Meuchelmörder und Duellanten, leicht im Ärmel oder unter dem Mantel verborgen.',
    maneuvers: ['Überraschungsbolzen aus Nahdistanz', 'Giftbolzen', 'Beidhändiges Bolzenfeuer']
  },
  {
    id: 'repetierarmbrust',
    name: 'Repetierarmbrust (Chu-Ko-Nu)',
    categoryId: 'armbrueste',
    categoryName: 'Armbrüste & Mechanische Fernwaffen',
    damageTypes: ['Durchbohrend'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Magazingestützte Schnellfeuerarmbrust, verschießt mehrere Bolzen in Sekundenfolge.',
    maneuvers: ['Bolzen-Salvenfeuer', 'Niederhaltungsfeuer', 'Fächerbolzen', 'Dauerfeuer']
  },

  // =========================================================================
  // 9. WURFWAFFEN & SCHLEUDERN
  // =========================================================================
  {
    id: 'wurfmesser',
    name: 'Wurfmesser / Kunai',
    categoryId: 'wurfwaffen_schleudern',
    categoryName: 'Wurfwaffen & Schleudern',
    damageTypes: ['Stich', 'Wurf'],
    wieldingStyles: ['Wurfkampf', 'Einhand'],
    rangeCategory: 'Fernkampf',
    description: 'Gewichtsausbalancierte Klingen für blitzschnelle Würfe ohne Vorwarnung.',
    maneuvers: ['Dreifachwurf', 'Verdeckter Ärmelwurf', 'Ablenkungswurf', 'Präziser Halswurf']
  },
  {
    id: 'schleuder',
    name: 'Schleuder (Hirten- & Kriegsschleuder)',
    categoryId: 'wurfwaffen_schleudern',
    categoryName: 'Wurfwaffen & Schleudern',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Wurfkampf'],
    rangeCategory: 'Fernkampf',
    description: 'Einfache Riemenschleuder, die faustgroße Kiesel oder Bleigeschosse mit Schädelspalter-Wucht schleudert.',
    maneuvers: ['Wirbelschleuder-Wurf', 'Bleigeschoss-Präzision', 'Betäubungstreffer auf Helm']
  },
  {
    id: 'pilum',
    name: 'Wurfspeer / Pilum',
    categoryId: 'wurfwaffen_schleudern',
    categoryName: 'Wurfwaffen & Schleudern',
    damageTypes: ['Durchbohrend', 'Wurf'],
    wieldingStyles: ['Wurfkampf', 'Einhand'],
    rangeCategory: 'Fernkampf',
    description: 'Schwerer Wurfspeer, dessen Eisenspitze sich im gegnerischen Schild festbeißt und verbiegt, um ihn unbrauchbar zu machen.',
    maneuvers: ['Schildunbrauchbarmacher-Wurf', 'Vorstoß-Salve', 'Niederschlagender Speerwurf']
  },
  {
    id: 'shuriken',
    name: 'Shuriken / Chakram',
    categoryId: 'wurfwaffen_schleudern',
    categoryName: 'Wurfwaffen & Schleudern',
    damageTypes: ['Schnitt', 'Wurf'],
    wieldingStyles: ['Wurfkampf'],
    rangeCategory: 'Fernkampf',
    description: 'Wurfsterne und geschliffene Metallscheiben, die sich im Flug schnell drehen und Gegner überraschen.',
    maneuvers: ['Bumerang-Kurvenwurf', 'Mehrfach-Sternwurf', 'Blendwurf', 'Sehnenschnitt im Flug']
  },

  // =========================================================================
  // 10. FAUST-, KETTEN- & EXOTISCHE WAFFEN
  // =========================================================================
  {
    id: 'schlagring',
    name: 'Schlagring / Cestus',
    categoryId: 'faust_exotisch',
    categoryName: 'Faust-, Ketten- & Exotische Waffen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Eisenverstärkte Faustwaffe für vernichtende Nahkampf-Haken und Uppercuts.',
    maneuvers: ['Kinnladenbrecher', 'Leberhaken', 'Doppelter Schlaghagel', 'Parade mit Armpanzer']
  },
  {
    id: 'katar',
    name: 'Katar (Indischer Stoßdolch)',
    categoryId: 'faust_exotisch',
    categoryName: 'Faust-, Ketten- & Exotische Waffen',
    damageTypes: ['Stich', 'Schnitt'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Breite Stoßklinge mit H-förmigem Quergriff, überträgt das gesamte Körpergewicht in jeden Vorstoß.',
    maneuvers: ['Stoßwelle mit voller Kraft', 'Klingenaufklappung', 'Schilddurchbruchstoß']
  },
  {
    id: 'nunchaku',
    name: 'Nunchaku',
    categoryId: 'faust_exotisch',
    categoryName: 'Faust-, Ketten- & Exotische Waffen',
    damageTypes: ['Wucht'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Nahkampf',
    description: 'Zwei Harthölzer mit Kettenglied verbunden für extrem schnelle, unvorhersehbare Schlagwirbel.',
    maneuvers: ['Achter-Wirbel', 'Kettenfessel-Entwaffnung', 'Schläfenschlag', 'Brustbein-Doppelhieb']
  },
  {
    id: 'kusarigama',
    name: 'Kusarigama (Kettensichel)',
    categoryId: 'faust_exotisch',
    categoryName: 'Faust-, Ketten- & Exotische Waffen',
    damageTypes: ['Schnitt', 'Wucht'],
    wieldingStyles: ['Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'Kombination aus Nahkampfsichel und langer Eisenkette mit Eisengewicht für variable Angriffsdistanzen.',
    maneuvers: ['Ketten-Fesselung', 'Sichel-Todesstoß', 'Gewichtswirbel', 'Entwaffnung aus der Distanz']
  },
  {
    id: 'tonfa',
    name: 'Tonfa / Schlagstock',
    categoryId: 'faust_exotisch',
    categoryName: 'Faust-, Ketten- & Exotische Waffen',
    damageTypes: ['Wucht', 'Defensiv'],
    wieldingStyles: ['Beidhändig (Zwei Waffen)', 'Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Quergriff-Holzkeule entlang des Unterarms, ideal für kompromisslose Blocks und rotierende Konterschläge.',
    maneuvers: ['Rotationsschlag', 'Unterarm-Klingenblock', 'Kehlkopfstoß mit Griff', 'Doppeldreh-Konter']
  },
  {
    id: 'kriegspeitsche',
    name: 'Kriegspeitsche / Kettenpeitsche',
    categoryId: 'faust_exotisch',
    categoryName: 'Faust-, Ketten- & Exotische Waffen',
    damageTypes: ['Schnitt', 'Wucht'],
    wieldingStyles: ['Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Lederne oder dornenbesetzte Kettenschnur, umschlingt Gliedmaßen, reißt Waffen aus der Hand und blendet.',
    maneuvers: ['Waffenentzug durch Umschlingung', 'Beinumriss', 'Peitschenknall-Schock', 'Augenblender']
  },

  // =========================================================================
  // 11. SCHILDE & DEFENSIVBEHERRSCHUNG
  // =========================================================================
  {
    id: 'buckler',
    name: 'Faustschild / Buckler',
    categoryId: 'schilde',
    categoryName: 'Schilde & Defensivbeherrschung',
    damageTypes: ['Defensiv', 'Wucht'],
    wieldingStyles: ['Waffe & Schild', 'Freie Hand / Duellhaltung'],
    rangeCategory: 'Defensiv',
    description: 'Kleiner runder Handfaustschild, wird aktiv nach vorn geführt, um gegnerische Klingen im Ansatz abzufangen.',
    maneuvers: ['Aktive Klingenabweisung', 'Faustschild-Nasenstoß', 'Sichtdeckung & Stoßriposte']
  },
  {
    id: 'rundschild',
    name: 'Rundschild (Wikinger- / Keltenschild)',
    categoryId: 'schilde',
    categoryName: 'Schilde & Defensivbeherrschung',
    damageTypes: ['Defensiv', 'Wucht'],
    wieldingStyles: ['Waffe & Schild'],
    rangeCategory: 'Defensiv',
    description: 'Robuster Holzschild mit eisernem Schildbuckel, perfekt zum Bilden einer Schildburg und für Schildkanten-Hiebe.',
    maneuvers: ['Schildburg-Verriegelung', 'Schildkanten-Kinnladenstoß', 'Pfeilabwehr', 'Buckel-Stoß']
  },
  {
    id: 'heaterschild',
    name: 'Dreiecksschild / Heaterschild',
    categoryId: 'schilde',
    categoryName: 'Schilde & Defensivbeherrschung',
    damageTypes: ['Defensiv'],
    wieldingStyles: ['Waffe & Schild'],
    rangeCategory: 'Defensiv',
    description: 'Der klassische Ritterschild mit flacher Oberkante und spitzem Unterteil für maximale Körperdeckung bei guter Sicht.',
    maneuvers: ['Glanzen-Ablenkung', 'Schulterramme', 'Klingenfang an der Schildspitze']
  },
  {
    id: 'turmschild',
    name: 'Turmschild / Scutum',
    categoryId: 'schilde',
    categoryName: 'Schilde & Defensivbeherrschung',
    damageTypes: ['Defensiv', 'Wucht'],
    wieldingStyles: ['Waffe & Schild'],
    rangeCategory: 'Defensiv',
    description: 'Körperhoher, gekrümmter Schild, schützt den Träger vollständig gegen Geschosse und formiert die Testudo (Schildkröte).',
    maneuvers: ['Testudo-Formation', 'Unüberwindlicher Bollwerk-Stand', 'Schwerer Schildsturz']
  },
  {
    id: 'pavese',
    name: 'Pavese (Setzschild)',
    categoryId: 'schilde',
    categoryName: 'Schilde & Defensivbeherrschung',
    damageTypes: ['Defensiv'],
    wieldingStyles: ['Waffe & Schild'],
    rangeCategory: 'Defensiv',
    description: 'Großer Stand-Schild mit Stützstab, wird im Boden verankert, um Schützen beim Nachladen volle Deckung zu bieten.',
    maneuvers: ['Bodenverankerung', 'Schützenbarrikade', 'Felddeckung']
  },

  // =========================================================================
  // 12. SCHWARZPULVERWAFFEN & FRÜHE SCHUSSWAFFEN
  // =========================================================================
  {
    id: 'steinschlosspistole',
    name: 'Steinschlosspistole / Radschlosspistole',
    categoryId: 'schwarzpulver',
    categoryName: 'Schwarzpulverwaffen & Frühe Schusswaffen',
    damageTypes: ['Durchbohrend', 'Feuer'],
    wieldingStyles: ['Einhand', 'Beidhändig (Zwei Waffen)'],
    rangeCategory: 'Fernkampf',
    description: 'Handfeuerwaffe mit Feuerstein-Mechanismus für einen verheerenden Nahdistanz-Schuss, bevor auf die Klinge gewechselt wird.',
    maneuvers: ['Point-Blank-Schuss', 'Pistolenkolben-Schlag', 'Doppel-Pistolensalve']
  },
  {
    id: 'muskete',
    name: 'Muskete / Arkebuse',
    categoryId: 'schwarzpulver',
    categoryName: 'Schwarzpulverwaffen & Frühe Schusswaffen',
    damageTypes: ['Durchbohrend', 'Wucht', 'Feuer'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Schwere Vorderladerwaffe mit Lunte oder Steinschloss, schlägt durch jede bekannte Ritterrüstung.',
    maneuvers: ['Gegliederter Schützenvorstoß', 'Bajonett-Stoß', 'Konzentriertes Linienfeuer']
  },
  {
    id: 'donnerbuechse',
    name: 'Donnerbüchse (Blunderbuss)',
    categoryId: 'schwarzpulver',
    categoryName: 'Schwarzpulverwaffen & Frühe Schusswaffen',
    damageTypes: ['Schnitt', 'Wucht', 'Feuer'],
    wieldingStyles: ['Fernkampf / Schießhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Trichterförmiger Lauf verschießt Schrot, gehacktes Eisen oder Kiesel mit breiter Streuung für verheerenden Flächenschaden.',
    maneuvers: ['Schrotstreuung im Nahbereich', 'Trichter-Druckwelle', 'Deckungsreinigung']
  },

  // =========================================================================
  // 13. MAGISCHE WAFFEN & ARKANE FOKUSSE
  // =========================================================================
  {
    id: 'magierstab',
    name: 'Magierstab / Ritueller Kristallstab',
    categoryId: 'magisch_fokus',
    categoryName: 'Magische Waffen & Arkane Fokusse',
    damageTypes: ['Arkan', 'Wucht'],
    wieldingStyles: ['Zweihand', 'Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Aus Hartholz oder Mithril mit gefasstem Manastein: Bündelt elementare Zauber und dient als Schlagwaffe.',
    maneuvers: ['Arkane Druckwelle', 'Stabstoß mit Mana-Entladung', 'Elementarbarriere mit Schaft']
  },
  {
    id: 'zauberstab',
    name: 'Zauberstab (Wand)',
    categoryId: 'magisch_fokus',
    categoryName: 'Magische Waffen & Arkane Fokusse',
    damageTypes: ['Arkan'],
    wieldingStyles: ['Einhand', 'Freie Hand / Duellhaltung'],
    rangeCategory: 'Fernkampf',
    description: 'Schlanker Holzkern für präzise Gesten und rasche Spruchfokussierung ohne physischen Kraftaufwand.',
    maneuvers: ['Schnellzauber-Geste', 'Zielsuch-Strahl', 'Magische Deflektion']
  },
  {
    id: 'runenschwert',
    name: 'Runenklinge / Seelenschwert',
    categoryId: 'magisch_fokus',
    categoryName: 'Magische Waffen & Arkane Fokusse',
    damageTypes: ['Schnitt', 'Arkan', 'Elementar'],
    wieldingStyles: ['Einhand', 'Zweihand'],
    rangeCategory: 'Nahkampf',
    description: 'In der Klinge eingravierte Glyphen leuchten bei Berührung auf und umhüllen den Stahl mit Flammen, Frost oder Blitzen.',
    maneuvers: ['Klingenelementar-Entladung', 'Glyphenstoß', 'Manazehrungs-Schnitt', 'Runenbarriere']
  },
  {
    id: 'ritualdolch',
    name: 'Ritualdolch / Athame',
    categoryId: 'magisch_fokus',
    categoryName: 'Magische Waffen & Arkane Fokusse',
    damageTypes: ['Stich', 'Arkan'],
    wieldingStyles: ['Einhand'],
    rangeCategory: 'Nahkampf',
    description: 'Geweihte Klinge zum Schneiden von Zauberkreisen, Opfern und Bannen dämonischer Mächte.',
    maneuvers: ['Bannkreis-Schnitt', 'Blutopfer-Verstärkung', 'Austreibungsstich']
  }
];

export const WEAPON_MASTERY_RANKS = [
  {
    tier: 'Rang 1',
    title: 'Rang 1: Novize / Grundausbildung',
    label: 'Grundausbildung (Rang 1)',
    description: 'Grundlegende Handhabung, Haltung, einfache Paraden und Vermeidung von Eigenverletzung.'
  },
  {
    tier: 'Rang 2',
    title: 'Rang 2: Geselle / Geübt',
    label: 'Geübt / Geselle (Rang 2)',
    description: 'Sichere Klingenführung, flüssige Angriffskombinationen und gezielte Manöver im Gefecht.'
  },
  {
    tier: 'Rang 3',
    title: 'Rang 3: Experte / Waffenmeister',
    label: 'Waffenmeister / Experte (Rang 3)',
    description: 'Hervorragende Reflexe, Ausnutzen gegnerischer Schwächen, Finten und tödliche Konter.'
  },
  {
    tier: 'Rang 4',
    title: 'Rang 4: Großmeister / Klingenlegende',
    label: 'Großmeister / Legende (Rang 4)',
    description: 'Perfekte Einheit mit der Waffe, legendäre Techniken und Beherrschung des gesamten Waffenfeldes.'
  }
];

export const WIELDING_STYLES = [
  'Einhand',
  'Zweihand',
  'Beidhändig (Zwei Waffen)',
  'Waffe & Schild',
  'Fernkampf / Schießhaltung',
  'Wurfkampf',
  'Freie Hand / Duellhaltung',
  'Stangenhaltung / Formationsgriff'
];

/**
 * Helfer: Waffe anhand der ID finden
 */
export function getWeaponById(weaponId: string): WeaponTypeDefinition | undefined {
  return ALL_WEAPONS.find(w => w.id === weaponId);
}

/**
 * Helfer: Waffe anhand des Namens (fuzzy) finden
 */
export function findWeaponByName(name: string): WeaponTypeDefinition | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return ALL_WEAPONS.find(w => 
    w.name.toLowerCase() === clean || 
    w.name.toLowerCase().includes(clean) ||
    clean.includes(w.name.toLowerCase())
  );
}

/**
 * Helfer: Alle Waffen einer Kategorie abrufen
 */
export function getWeaponsByCategory(categoryId: string): WeaponTypeDefinition[] {
  return ALL_WEAPONS.filter(w => w.categoryId === categoryId);
}

export interface WeaponRankNodeData {
  id: string;
  rankOrder: number; // 0: Rang 1, 1: Rang 2, 2: Rang 3, 3: Rang 4
  rankTierLabel: string;
  rankTitle: string;
  name: string;
  description: string;
  suggestedCompetencies: string[];
  suggestedManeuvers: string[];
  nextRankName?: string;
}

/**
 * Liefert maßgeschneiderte Fachkompetenzen für eine Waffe und deren Meisterschaftsstufe (0-3).
 */
export function getWeaponTierCompetencies(weaponOrName: WeaponTypeDefinition | string, tierRank: number): string[] {
  const name = typeof weaponOrName === 'string' ? weaponOrName.toLowerCase() : weaponOrName.name.toLowerCase();
  const cat = typeof weaponOrName === 'string' ? '' : (weaponOrName.categoryId || '').toLowerCase();

  // 1. Dolche / Messer
  if (name.includes('dolch') || name.includes('messer') || cat.includes('dolch')) {
    if (tierRank === 0) {
      return ['Waffengewicht & Griffhaltung', 'Schneller Unterhandschnitt', 'Beengter Nahkampf', 'Dolchpflege & Abziehen'];
    } else if (tierRank === 1) {
      return ['Kehlenschnitt aus Deckung', 'Rückhandstich & Riposte', 'Gelenkhebel & Stich', 'Klingenabwehr auf Kurzdistanz'];
    } else if (tierRank === 2) {
      return ['Schwachstellen-Perforation', 'Parierdolch-Verzahnung', 'Lautloser Überfall', 'Doppelklingen-Wirbel'];
    } else {
      return ['Tödlicher Schattenstoß', 'Rüstungsfugen-Meisterschaft', 'Klingenreflex der Perfektion', 'Tödliche Präzisionsdoktrin'];
    }
  }

  // 2. Bögen & Sehnenwaffen
  if (name.includes('bogen') || cat.includes('bogen') || name.includes('sehne')) {
    if (tierRank === 0) {
      return ['Bogensehne & Standhaltung', 'Pfeilauflegen & Auszug', 'Einfacher Zielschuss', 'Sehnenpflege & Wachsen'];
    } else if (tierRank === 1) {
      return ['Schnellschuss-Abfolge', 'Weitschuss mit Windausgleich', 'Präzisionsschuss auf Lücken', 'Laufendes Zielen'];
    } else if (tierRank === 2) {
      return ['Durchdringender Jagdschuss', 'Flankierender Bogenwirbel', 'Pfeilspitzen-Manipulation', 'Meisterlicher Sehnenfokus'];
    } else {
      return ['Treffsicherheit der Falken', 'Legendärer Weitschuss', 'Unfehlbarer Scharfschuss', 'Sturmpfeil-Meisterschaft'];
    }
  }

  // 3. Armbrüste
  if (name.includes('armbrust') || cat.includes('armbrust')) {
    if (tierRank === 0) {
      return ['Spannmechanik & Hebelbedienung', 'Bolzenführung & Anschlag', 'Zielerfassung über Kimme', 'Nuss- & Sehnenpflege'];
    } else if (tierRank === 1) {
      return ['Schnellspann-Technik', 'Panzerbrechender Flachschuss', 'Deckungsschuss aus der Hocke', 'Zielkorrektur'];
    } else if (tierRank === 2) {
      return ['Durchschlagender Bolzenhagel', 'Mehrfachbolzen-Bedienung', 'Präziser Sehnenbruch-Schuss', 'Scharfschützenblick'];
    } else {
      return ['Belagerungs-Präzision', 'Mechanische Perfektion', 'Legendärer Rüstungsspalter', 'Meisterliches Schussfeld'];
    }
  }

  // 4. Stangenwaffen, Speere & Lanzen
  if (name.includes('speer') || name.includes('lanze') || name.includes('stange') || name.includes('hellebarde') || cat.includes('stange')) {
    if (tierRank === 0) {
      return ['Schaftgriff & Distanzgefühl', 'Gerader Stoß', 'Schaftparade', 'Ausfallschritt'];
    } else if (tierRank === 1) {
      return ['Distanzkontrolle & Klingenabwehr', 'Schaftschlag an die Schläfe', 'Hakenhieb hinter Schilde', 'Formationsspieß'];
    } else if (tierRank === 2) {
      return ['Wirbelnder Schaftstoß', 'Hechtstoß gegen Reiter', 'Rundum-Zonierung', 'Panzerbrechender Stoß'];
    } else {
      return ['Unantastbare Distanzhoheit', 'Legendärer Speertanz', 'Drachentöter-Stoß', 'Meisterhafte Formationsführung'];
    }
  }

  // 5. Äxte & Beile
  if (name.includes('axt') || name.includes('beil') || name.includes('hacke') || cat.includes('aext')) {
    if (tierRank === 0) {
      return ['Schwungführung & Schwerpunkt', 'Spaltungshieb', 'Wuchtblock', 'Axtstiel-Einsatz'];
    } else if (tierRank === 1) {
      return ['Schildhaken & Entblößung', 'Knochenbrecher-Hieb', 'Wirbelschlag', 'Panzereinbuchtung'];
    } else if (tierRank === 2) {
      return ['Schädelspalter-Wucht', 'Schildzertrümmerung', 'Erschütternder Bodenhieb', 'Brecherkombination'];
    } else {
      return ['Verheerende Urgewalt', 'Titanischer Schlag', 'Festungsbrecher', 'Unaufhaltsame Hiebdoktrin'];
    }
  }

  // 6. Hämmer, Keulen & Wuchtwaffen
  if (name.includes('hammer') || name.includes('keule') || name.includes('streitkolben') || name.includes('morgenstern') || cat.includes('haemmer')) {
    if (tierRank === 0) {
      return ['Gewichtsverlagerung & Schwunghieb', 'Wuchtiger Abwärtsschlag', 'Kollisionsstoß', 'Waffenerhalt'];
    } else if (tierRank === 1) {
      return ['Panzerzertrümmerung', 'Gelenkquetsch-Schlag', 'Schwungparade', 'Schädelerschütterung'];
    } else if (tierRank === 2) {
      return ['Kollossaler Niederwurf', 'Boden-Schockwelle', 'Kettenwirbel-Kontrolle', 'Erschütternde Brechkraft'];
    } else {
      return ['Erdrückende Gewalt', 'Zertrümmerungslegende', 'Titanische Schockwelle', 'Unbeugsamer Kolossalschlag'];
    }
  }

  // 7. Schilde
  if (name.includes('schild') || cat.includes('schild')) {
    if (tierRank === 0) {
      return ['Schildhaltung & Sichtlinie', 'Pfeilabwehr im Stehen', 'Körperdeckung', 'Riemenjustierung'];
    } else if (tierRank === 1) {
      return ['Schildkantenschlag', 'Abprallwinkel-Lenkung', 'Vorstoß unter Deckung', 'Schildkröten-Haltung'];
    } else if (tierRank === 2) {
      return ['Erschütternder Schildstoß', 'Klingenfang mit Buckel', 'Formationswall-Führung', 'Defensiver Konter'];
    } else {
      return ['Unbrechbare Festung', 'Eiserne Schutzlegende', 'Vollständige Schockabsorption', 'Meisterlicher Schildwall'];
    }
  }

  // 8. Faust, Ketten & Kampfkünste
  if (name.includes('faust') || name.includes('klaue') || name.includes('schlagring') || name.includes('nunchaku') || cat.includes('faust')) {
    if (tierRank === 0) {
      return ['Grundstellung & Deckung', 'Gerader Fauststoß', 'Schrittarbeit & Meidbewegung', 'Körperspannung'];
    } else if (tierRank === 1) {
      return ['Kombinationsschläge', 'Hüftwurf & Hebel', 'Körperabhärtung', 'Feger & Beinsteller'];
    } else if (tierRank === 2) {
      return ['Nervendruckpunkt-Schlag', 'Schockwellen-Faust', 'Fließende Konterkunst', 'Vitalpunkt-Lähmung'];
    } else {
      return ['Eiserne Faust der Legende', 'Meister der inneren Kraft', 'Unaufhaltsamer Kampffluss', 'Perfekte Schlagkunst'];
    }
  }

  // 9. Schwarzpulverwaffen
  if (name.includes('pistole') || name.includes('muskete') || name.includes('donner') || cat.includes('schwarzpulver')) {
    if (tierRank === 0) {
      return ['Pulverladung & Pfannenzündung', 'Sicherer Stand & Mündungsdisziplin', 'Vorderlader-Routine', 'Kugelgießen'];
    } else if (tierRank === 1) {
      return ['Schnelles Nachladen im Gefecht', 'Point-Blank-Schuss', 'Pistolenkolben-Hieb', 'Deckungsfeuer'];
    } else if (tierRank === 2) {
      return ['Präzisions-Kugelschuss', 'Doppelpistolen-Koordination', 'Bajonett-Angriff', 'Pulverrauch-Taktik'];
    } else {
      return ['Meisterschütze der Pulverkunst', 'Luntenschnelligkeit', 'Tödliche Salve', 'Donnernde Kugelmeisterei'];
    }
  }

  // 10. Magische Waffen & Arkane Fokusse
  if (name.includes('stab') || name.includes('magi') || name.includes('rune') || name.includes('ritual') || cat.includes('magisch')) {
    if (tierRank === 0) {
      return ['Fokus-Kopplung & Haltung', 'Grundlegender Schaftstoß', 'Manafluss in die Waffe', 'Stab- & Kristallpflege'];
    } else if (tierRank === 1) {
      return ['Elementare Klingenaufladung', 'Arkane Druckwelle mit Schaft', 'Klingenparade mit Manaschild', 'Zauberentladung'];
    } else if (tierRank === 2) {
      return ['Glyphenstoß & Schockwelle', 'Manazehrungs-Schnitt', 'Spruchverstärkung im Schwung', 'Runenbarriere'];
    } else {
      return ['Arkane Klingenlegende', 'Vollkommene Resonanz von Geist & Stahl', 'Ewige Zauberklinge', 'Meisterhafte Arkandoktrin'];
    }
  }

  // 11. Schwerter & Klingen (Standard)
  if (tierRank === 0) {
    return ['Schwertführung & Grundhaltung', 'Einfache Hiebe & Stiche', 'Flache Klingenparade', 'Schwertpflege & Scheidenauszug'];
  } else if (tierRank === 1) {
    return ['Zornhau & Versatz', 'Parierstoß & Nachdrängen', 'Halbschwertführung', 'Klingenbindung'];
  } else if (tierRank === 2) {
    return ['Mordschlag gegen Panzer', 'Kreuzhieb-Kombination', 'Unterarm-Entwaffnung', 'Windende Riposte'];
  } else {
    return ['Meisterliche Fechtkunst', 'Klingenlegende-Fluss', 'Unüberwindliche Haltung', 'Tödliche Klingenharmonie'];
  }
}

/**
 * Liefert maßgeschneiderte Talente & Begabungen für eine Waffenart.
 */
export function getWeaponTalents(weaponOrName: WeaponTypeDefinition | string): { name: string; score: number }[] {
  const name = typeof weaponOrName === 'string' ? weaponOrName.toLowerCase() : weaponOrName.name.toLowerCase();
  const cat = typeof weaponOrName === 'string' ? '' : (weaponOrName.categoryId || '').toLowerCase();

  if (name.includes('dolch') || name.includes('messer') || cat.includes('dolch')) {
    return [
      { name: 'Fingerspitzengefühl & Flinkheit', score: 5 },
      { name: 'Schwachstellen-Blick & Präzision', score: 4 },
      { name: 'Lautlose Handbewegung', score: 4 }
    ];
  }

  if (name.includes('bogen') || name.includes('sehne') || name.includes('armbrust') || cat.includes('bogen') || cat.includes('armbrust') || cat.includes('wurf')) {
    return [
      { name: 'Adlerauge & Zielsicherheit', score: 5 },
      { name: 'Ruhige Hand & Sehnenspannung', score: 4 },
      { name: 'Wind- und Distanzgefühl', score: 4 }
    ];
  }

  if (name.includes('speer') || name.includes('lanze') || name.includes('stange') || name.includes('hellebarde') || cat.includes('stange')) {
    return [
      { name: 'Distanzbeurteilung & Raumgefühl', score: 5 },
      { name: 'Schaftrotation & Hebelkraft', score: 4 },
      { name: 'Standsicherheit & Ausfallschritt', score: 4 }
    ];
  }

  if (name.includes('axt') || name.includes('hammer') || name.includes('keule') || name.includes('streitkolben') || cat.includes('aext') || cat.includes('haemmer')) {
    return [
      { name: 'Schlagkraft & Schwunghebel', score: 5 },
      { name: 'Wuchtgefühl & Treffsicherheit', score: 4 },
      { name: 'Zähigkeit & Standfestigkeit', score: 4 }
    ];
  }

  if (name.includes('schild') || cat.includes('schild')) {
    return [
      { name: 'Reaktionsschnelligkeit bei Schlägen', score: 5 },
      { name: 'Winkelgefühl für Abpraller', score: 5 },
      { name: 'Standfestigkeit gegen Wucht', score: 4 }
    ];
  }

  if (name.includes('faust') || name.includes('klaue') || name.includes('schlagring') || cat.includes('faust')) {
    return [
      { name: 'Körperbeherrschung & Balance', score: 5 },
      { name: 'Reflexe & Reaktionszeit', score: 5 },
      { name: 'Schlaghärte & Abhärtung', score: 4 }
    ];
  }

  if (name.includes('pistole') || name.includes('muskete') || cat.includes('schwarzpulver')) {
    return [
      { name: 'Ruhiger Abzugsfinger & Zielblick', score: 5 },
      { name: 'Rauch- & Gefechtsüberblick', score: 4 },
      { name: 'Schnelle Handgriffe beim Laden', score: 4 }
    ];
  }

  if (name.includes('stab') || name.includes('magi') || name.includes('rune') || cat.includes('magisch')) {
    return [
      { name: 'Mana-Resonanz zur Waffe', score: 5 },
      { name: 'Klingen-Zauber-Harmonie', score: 4 },
      { name: 'Fokus-Konzentration im Gefecht', score: 4 }
    ];
  }

  // Schwerter & Klingen (Standard)
  return [
    { name: 'Klingengefühl & Balance', score: 5 },
    { name: 'Reflexe & Pariertiming', score: 4 },
    { name: 'Präzision & Schnittwinkel', score: 4 }
  ];
}

/**
 * Erzeugt die 4 Meisterschaftsstufen als Talentbaum-Knoten für eine gewählte Waffenart.
 */
export function getWeaponTreeNodeRanks(weaponDef: WeaponTypeDefinition): WeaponRankNodeData[] {
  const wName = weaponDef.name;
  const maneuvers = weaponDef.maneuvers || [];

  return [
    {
      id: `${weaponDef.id}_rank_1`,
      rankOrder: 0,
      rankTierLabel: 'Rang 1: Novize',
      rankTitle: `${wName}: Grundausbildung (Rang 1)`,
      name: `${wName} (Grundausbildung)`,
      description: `Fundamente der Handhabung für ${wName}: Korrekte Grundhaltung, Griffsicherheit, einfache Hiebe, Stöße und Basisparaden.`,
      suggestedCompetencies: getWeaponTierCompetencies(weaponDef, 0),
      suggestedManeuvers: maneuvers.slice(0, 2),
      nextRankName: `${wName} (Geübt)`
    },
    {
      id: `${weaponDef.id}_rank_2`,
      rankOrder: 1,
      rankTierLabel: 'Rang 2: Geübt / Geselle',
      rankTitle: `${wName}: Geübt (Rang 2)`,
      name: `${wName} (Geübt)`,
      description: `Sichere Gefechtsführung mit ${wName}: Flüssige Angriffskombinationen, Klingenbindung, gezielte Paraden und situative Manöver.`,
      suggestedCompetencies: getWeaponTierCompetencies(weaponDef, 1),
      suggestedManeuvers: maneuvers.slice(0, 3),
      nextRankName: `${wName} (Waffenmeister)`
    },
    {
      id: `${weaponDef.id}_rank_3`,
      rankOrder: 2,
      rankTierLabel: 'Rang 3: Experte / Waffenmeister',
      rankTitle: `${wName}: Waffenmeister (Rang 3)`,
      name: `${wName} (Waffenmeister)`,
      description: `Gehobene Meistertechniken mit ${wName}: Ausnutzen von Panzerlücken, Finten, tödliche Konter und totale Klingenbeherrschung.`,
      suggestedCompetencies: getWeaponTierCompetencies(weaponDef, 2),
      suggestedManeuvers: maneuvers.slice(0, 4),
      nextRankName: `${wName} (Klingenlegende)`
    },
    {
      id: `${weaponDef.id}_rank_4`,
      rankOrder: 3,
      rankTierLabel: 'Rang 4: Großmeister / Legende',
      rankTitle: `${wName}: Großmeister (Rang 4)`,
      name: `${wName} (Großmeister)`,
      description: `Vollendete Perfektion mit ${wName}: Legendäre Kampftechniken, unüberwindliche Haltung und Meisterboni im Gefecht.`,
      suggestedCompetencies: getWeaponTierCompetencies(weaponDef, 3),
      suggestedManeuvers: maneuvers
    }
  ];
}

