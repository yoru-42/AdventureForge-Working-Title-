import { Territory } from '../types';
import { generateOrganicShape } from './mapUtils';

interface CanonIsland {
  id: string;
  name: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  desc: string;
  type: string;
}

const CANON_ISLANDS: CanonIsland[] = [
  // --- EAST BLUE ---
  { id: 'op-canon-dawn', name: 'Dawn Island', cx: 85, cy: 25, r: 2.2, color: '#22c55e', desc: 'Heimatinsel von Ruffy mit dem Windmühlendorf Foosha, Berg Corvo und dem Goa-Königreich.', type: 'Stadt' },
  { id: 'op-canon-goat', name: 'Goat Island', cx: 81, cy: 19, r: 1.1, color: '#10b981', desc: 'Einstige Basis von Alvida, wo Ruffy und Corby aufeinandertrafen.', type: 'Insel' },
  { id: 'op-canon-shells', name: 'G-153 Shells Town', cx: 80, cy: 15, r: 1.5, color: '#94a3b8', desc: 'Sitz der Marinebasis G-153 im Yotsuba-Archipel.', type: 'Hafen' },
  { id: 'op-canon-yotsuba', name: 'Yotsuba-Inseln', cx: 80, cy: 15, r: 2.6, color: '#16a34a', desc: 'Die grüne Insel-Region im Nordosten des East Blue.', type: 'Insel' },
  { id: 'op-canon-orange', name: 'Orange Town', cx: 74, cy: 19, r: 1.6, color: '#b45309', desc: 'Die von Buggy besetzte Geisterstadt auf Organ Island.', type: 'Dorf' },
  { id: 'op-canon-rare-animals', name: 'Insel der seltenen Tiere', cx: 72, cy: 24, r: 1.3, color: '#84cc16', desc: 'Eine abgelegene, dichte Waldinsel voller seltsamer Mischtiere und Heimat von Gaimon.', type: 'Wald' },
  { id: 'op-canon-syrup', name: 'Gecko-Inseln (Syrup)', cx: 70, cy: 22, r: 1.8, color: '#15803d', desc: 'Heimat von Lysop, Kaya und dem friedlichen Dorf Syrup.', type: 'Dorf' },
  { id: 'op-canon-baratie', name: 'Baratie (Sambas)', cx: 68, cy: 30, r: 1.2, color: '#0ea5e9', desc: 'Das legendäre schwimmende Restaurant von Chefkoch Rotfuß-Jeff und Sanji.', type: 'Hafen' },
  { id: 'op-canon-conomi', name: 'Conomi-Inseln', cx: 62, cy: 18, r: 2.0, color: '#16a34a', desc: 'Standort des Kokoyas-Dorfes, Gosa und des Arlong Parks.', type: 'Dorf' },
  { id: 'op-canon-loguetown', name: 'Loguetown', cx: 60, cy: 30, r: 2.0, color: '#64748b', desc: 'Die Polestar-Insel-Stadt des Anfangs und des Endes, Geburts- und Hinrichtungsort von Gol D. Roger.', type: 'Hafen' },
  { id: 'op-canon-shimotsuki', name: 'Dorf Shimotsuki', cx: 88, cy: 30, r: 1.6, color: '#16a34a', desc: 'Ein friedliches Dorf im Osten, in dem Zorro das Schwertfechten im Dojo lernte.', type: 'Dorf' },
  { id: 'op-canon-tequila-wolf', name: 'Tequila Wolf', cx: 79, cy: 9, r: 1.8, color: '#475569', desc: 'Die gigantische Brücke im eisigen Norden des East Blue, erbaut von Sklaven seit 700 Jahren.', type: 'Stadt' },
  { id: 'op-canon-cozia', name: 'Cozia Island', cx: 63, cy: 17, r: 1.4, color: '#94a3b8', desc: 'Heimatland der Marine-Soldaten und Kriegsschiffe.', type: 'Insel' },
  { id: 'op-canon-frauce', name: 'Frauce-Königreich', cx: 61, cy: 14, r: 1.6, color: '#059669', desc: 'Ein wohlhabendes, befestigtes Königreich im Norden des East Blue.', type: 'Stadt' },
  { id: 'op-canon-oykot', name: 'Oykot-Königreich', cx: 64, cy: 35, r: 1.7, color: '#7c3aed', desc: 'Ein vom Krieg zerrüttetes Reich im Süden, Herkunftsort von Nami und Nojiko.', type: 'Stadt' },
  { id: 'op-canon-sixis', name: 'Sixis-Insel', cx: 76, cy: 34, r: 1.1, color: '#ca8a04', desc: 'Eine unbewohnte, karge Insel nahe dem Calm Belt, auf der Ace gestrandet war und die Feuer-Frucht fand.', type: 'Insel' },
  { id: 'op-canon-kumate', name: 'Kumate-Insel', cx: 73, cy: 28, r: 1.2, color: '#b45309', desc: 'Insel des wilden Kumate-Stammes, auf der Buggys Bande Abenteuer erlebte.', type: 'Insel' },
  { id: 'op-canon-g77', name: 'Marinebasis G-77', cx: 76, cy: 17, r: 0.9, color: '#475569', desc: 'Ein befestigter Marinestützpunkt im Norden des East Blue.', type: 'Burg' },
  { id: 'op-canon-g16', name: 'Marinebasis G-16', cx: 65, cy: 24, r: 0.9, color: '#475569', desc: 'Ein vorgelagerter Marineposten nahe den Gecko-Inseln.', type: 'Burg' },
  { id: 'op-canon-nagagutsu', name: 'Nagagutsu-Königreich', cx: 78, cy: 13, r: 1.3, color: '#15803d', desc: 'Ein stolzes, traditionsreiches Königreich des East Blue.', type: 'Stadt' },
  { id: 'op-canon-satsuruzu', name: 'Satsuruzu-Königreich', cx: 83, cy: 16, r: 1.4, color: '#0ea5e9', desc: 'Ein elegantes, hoch entwickeltes Inselreich nahe Shellstown.', type: 'Stadt' },
  { id: 'op-canon-nazawaka', name: 'Nazawaka City', cx: 86, cy: 13, r: 1.1, color: '#0f766e', desc: 'Eine pulsierende, moderne Handelsstadt im Nordosten des East Blue.', type: 'Stadt' },

  // --- NORTH BLUE ---
  { id: 'op-canon-flevance', name: 'Flevance (Die weiße Stadt)', cx: 18, cy: 15, r: 2.3, color: '#f8fafc', desc: 'Einst prachtvolles, schneeweißes Königreich, vernichtet durch die Blei-Bernstein-Krankheit.', type: 'Stadt' },
  { id: 'op-canon-spider-miles', name: 'Spider Miles', cx: 15, cy: 23, r: 1.8, color: '#475569', desc: 'Ehemaliger Unterschlupf der Donquixote-Familie in einer Müll-Hafenstadt.', type: 'Hafen' },
  { id: 'op-canon-minion', name: 'Minion Insel', cx: 22, cy: 21, r: 1.7, color: '#cbd5e1', desc: 'Verschneite Insel, auf der Corazon für Trafalgar Law sein Leben opferte.', type: 'Insel' },
  { id: 'op-canon-swallow', name: 'Swallow Insel', cx: 25, cy: 25, r: 1.6, color: '#16a34a', desc: 'Hier gründete Law die Heart-Piratenbande.', type: 'Dorf' },
  { id: 'op-canon-vodka', name: 'Vodka-Königreich', cx: 26, cy: 8, r: 1.5, color: '#94a3b8', desc: 'Heimat des jungen Kaido, ein militärisches Königreich im North Blue.', type: 'Stadt' },
  { id: 'op-canon-whiteland', name: 'Whiteland-Königreich', cx: 35, cy: 7, r: 1.6, color: '#f8fafc', desc: 'Ein verschneites Königreich im Norden.', type: 'Stadt' },
  { id: 'op-canon-roshwan', name: 'Roshwan-Königreich', cx: 28, cy: 13, r: 1.4, color: '#f59e0b', desc: 'Ein Mitgliedstaat der Weltregierung aus dem North Blue.', type: 'Stadt' },
  { id: 'op-canon-beef', name: 'Beef-Königreich', cx: 34, cy: 14, r: 1.4, color: '#16a34a', desc: 'Ein kleines Königreich auf einer fruchtbaren Insel.', type: 'Stadt' },
  { id: 'op-canon-micqueot', name: 'Micqueot', cx: 36, cy: 13, r: 1.2, color: '#15803d', desc: 'Eine abgelegene Insel im North Blue.', type: 'Insel' },
  { id: 'op-canon-germa', name: 'Germa-Königreich', cx: 39, cy: 14, r: 1.2, color: '#334155', desc: 'Ein seefahrendes Königreich ohne eigenes Land, Heimat der Germa 66.', type: 'Stadt' },
  { id: 'op-canon-kuen', name: 'Kuen-Dorf', cx: 15, cy: 12, r: 1.0, color: '#84cc16', desc: 'Ein kleines Dorf im North Blue.', type: 'Dorf' },
  { id: 'op-canon-rubeck', name: 'Rubeck-Insel', cx: 13, cy: 15, r: 1.4, color: '#10b981', desc: 'Basis des Marinehauptquartiers, von wo aus X Drake agierte.', type: 'Burg' },
  { id: 'op-canon-rakesh', name: 'Rakesh', cx: 13, cy: 26, r: 1.1, color: '#f59e0b', desc: 'Eine Wüsteninsel im North Blue.', type: 'Insel' },
  { id: 'op-canon-czacho', name: 'Czacho-Königreich', cx: 26, cy: 20, r: 1.4, color: '#8b5cf6', desc: 'Ein wohlhabendes Land.', type: 'Stadt' },
  { id: 'op-canon-downs', name: 'Downs-Insel', cx: 25, cy: 28, r: 1.2, color: '#ca8a04', desc: 'Eine Insel nahe der Swallow-Insel.', type: 'Insel' },
  { id: 'op-canon-notice', name: 'Notice-Dorf', cx: 26, cy: 32, r: 1.1, color: '#f43f5e', desc: 'Eine kleine Siedlung im südlichen North Blue.', type: 'Dorf' },
  { id: 'op-canon-lvneel', name: 'Lvneel-Königreich', cx: 34, cy: 24, r: 2.1, color: '#1d4ed8', desc: 'Heimat von Mont Blanc Noland.', type: 'Stadt' },
  { id: 'op-canon-deul', name: 'Deul-Königreich', cx: 35, cy: 25, r: 1.5, color: '#84cc16', desc: 'Ein benachbartes Königreich von Lvneel.', type: 'Stadt' },
  { id: 'op-canon-gingaball', name: 'Gingaball-Königreich', cx: 36, cy: 31, r: 1.6, color: '#eab308', desc: 'Königreich im Süden des North Blue.', type: 'Stadt' },
  { id: 'op-canon-sankan', name: 'Sankan-Königreich', cx: 9, cy: 31, r: 1.7, color: '#0ea5e9', desc: 'Ein Königreich weit im Südwesten des North Blue.', type: 'Stadt' },
  { id: 'op-canon-rokumitsu', name: 'Rokumitsu', cx: 18, cy: 39, r: 1.2, color: '#475569', desc: 'Insel am Rande des Calm Belt.', type: 'Insel' },
  { id: 'op-canon-kinko-nb', name: 'Kinko', cx: 22, cy: 39, r: 1.1, color: '#d97706', desc: 'Eine winzige Insel nah am Calm Belt.', type: 'Insel' },
  { id: 'op-canon-100-island-nb', name: '100% Island', cx: 26, cy: 39, r: 1.3, color: '#2563eb', desc: 'Ebenfalls nahe des Calm Belt.', type: 'Insel' },

  // --- WEST BLUE ---
  { id: 'op-canon-ohara', name: 'Ohara', cx: 23, cy: 70, r: 2.1, color: '#15803d', desc: 'Archäologen-Zentrum der Welt mit dem Baum des Wissens. Durch den Buster Call vernichtet.', type: 'Ruine' },
  { id: 'op-canon-kano', name: 'Kano Land', cx: 35, cy: 80, r: 2.4, color: '#047857', desc: 'Heimat der Happo Marine von Don Chinjao.', type: 'Stadt' },
  { id: 'op-canon-godvalley', name: 'God Valley', cx: 28, cy: 78, r: 1.9, color: '#451a03', desc: 'Legendäre, von der Weltkarte getilgte Insel des historischen Vorfalls.', type: 'Ruine' },
  { id: 'op-canon-yukiryu', name: 'Yukiryu-Insel', cx: 15, cy: 59, r: 1.2, color: '#e2e8f0', desc: 'Eine winterliche Insel nahe dem Calm Belt.', type: 'Insel' },
  { id: 'op-canon-baltigo', name: 'Baltigo', cx: 25, cy: 59, r: 1.5, color: '#fcd34d', desc: 'Die Insel der weißen Erde, geheimes Hauptquartier der Revolutionsarmee.', type: 'Insel' },
  { id: 'op-canon-jambalaya', name: 'Jambalaya-Königreich', cx: 12, cy: 64, r: 1.4, color: '#b45309', desc: 'Ein kingdom im West Blue.', type: 'Stadt' },
  { id: 'op-canon-ilisia', name: 'Ilisia-Königreich', cx: 10, cy: 75, r: 2.2, color: '#15803d', desc: 'Ein einflussreiches Königreich im West Blue, Heimat von König Thalassa Lucas.', type: 'Stadt' },
  { id: 'op-canon-ballywood', name: 'Ballywood-Königreich', cx: 14, cy: 82, r: 1.6, color: '#ca8a04', desc: 'Ein Königreich im West Blue, Heimat von König Ham Burger.', type: 'Stadt' },
  { id: 'op-canon-g80', name: 'Marinebasis G-80', cx: 18, cy: 75, r: 1.0, color: '#475569', desc: 'Ein Marinestützpunkt im West Blue.', type: 'Burg' },
  { id: 'op-canon-land-of-ice', name: 'The Land of Ice', cx: 6, cy: 90, r: 1.8, color: '#f8fafc', desc: 'Ein eisiger Kontinent im fernen Südwesten.', type: 'Insel' },
  { id: 'op-canon-las-camp', name: 'Las Camp-Region', cx: 12, cy: 92, r: 1.4, color: '#94a3b8', desc: 'Eine Region im südlichen West Blue.', type: 'Region' },
  { id: 'op-canon-toroa', name: 'Toroa-Insel', cx: 24, cy: 85, r: 1.2, color: '#0ea5e9', desc: 'Eine Insel im West Blue, wo Byron herstammt.', type: 'Insel' },
  { id: 'op-canon-shishano', name: 'Shishano-Königreich', cx: 30, cy: 68, r: 1.5, color: '#16a34a', desc: 'Ein Königreich, bekannt für seine Wälder.', type: 'Stadt' },
  { id: 'op-canon-soja', name: 'Soja-Insel', cx: 33, cy: 72, r: 1.1, color: '#eab308', desc: 'Eine Insel im östlichen West Blue.', type: 'Insel' },
  { id: 'op-canon-cameron', name: 'Cameron-Königreich', cx: 32, cy: 86, r: 1.4, color: '#f59e0b', desc: 'Ein kleines Königreich nahe Kano.', type: 'Stadt' },
  { id: 'op-canon-bestland', name: 'Bestland-Königreich', cx: 38, cy: 92, r: 1.3, color: '#84cc16', desc: 'Ein südliches Königreich im West Blue.', type: 'Stadt' },
  { id: 'op-canon-rum-wolf', name: 'Rum Wolf', cx: 28, cy: 95, r: 1.5, color: '#475569', desc: 'Eine markante Brücke oder Insel im Süden des West Blue.', type: 'Insel' },

  // --- SOUTH BLUE ---
  { id: 'op-canon-baterilla', name: 'Baterilla', cx: 58, cy: 85, r: 1.8, color: '#eab308', desc: 'Insel, auf der Portgas D. Ace heimlich geboren wurde.', type: 'Dorf' },
  { id: 'op-canon-torino', name: 'Torino-Königreich', cx: 75, cy: 65, r: 2.0, color: '#15803d', desc: 'Die "Insel der Schätze" mit riesigen Vögeln und fortschrittlicher Pharmazie.', type: 'Stadt' },
  { id: 'op-canon-sorbet', name: 'Sorbet-Königreich', cx: 91, cy: 77, r: 2.3, color: '#22c55e', desc: 'Heimat von Bartholomew Kuma und Jewelry Bonney.', type: 'Stadt' },
  { id: 'op-canon-briss', name: 'Briss-Königreich', cx: 61, cy: 68, r: 2.2, color: '#b45309', desc: 'Ein großes, bergiges Königreich im Westen des South Blue.', type: 'Stadt' },
  { id: 'op-canon-samba', name: 'Samba-Königreich', cx: 65, cy: 65, r: 1.3, color: '#a1a1aa', desc: 'Ein befestigtes Königreich auf einer nördlichen Halbinsel.', type: 'Stadt' },
  { id: 'op-canon-taya', name: 'Taya-Königreich', cx: 62, cy: 76, r: 1.4, color: '#ca8a04', desc: 'Ein Königreich an der geschützten Ostbucht der Hauptinsel.', type: 'Stadt' },
  { id: 'op-canon-southfire', name: 'South Fire-Königreich', cx: 60, cy: 89, r: 1.2, color: '#ef4444', desc: 'Ein feuriges, kleines Reich im fernen Südwesten.', type: 'Stadt' },
  { id: 'op-canon-burbon', name: 'Burbon Wolf', cx: 62, cy: 91, r: 1.5, color: '#475569', desc: 'Eine gigantische, im Bau befindliche Brücke ähnlich wie Tequila Wolf.', type: 'Insel' },
  { id: 'op-canon-kutsukku', name: 'Kutsukku-Insel', cx: 68, cy: 69, r: 1.6, color: '#16a34a', desc: 'Eine üppig bewachsene, vogelartige Insel im Norden.', type: 'Insel' },
  { id: 'op-canon-judo', name: 'Judo-Insel', cx: 69, cy: 79, r: 1.3, color: '#10b981', desc: 'Eine tropische Doppelinsel, bekannt für ihre Kampfsport-Dojos.', type: 'Insel' },
  { id: 'op-canon-sb-roshwan', name: 'Roshwan-Königreich (SB)', cx: 78, cy: 73, r: 1.7, color: '#059669', desc: 'Ein wohlhabendes, zentral gelegenens Königreich.', type: 'Stadt' },
  { id: 'op-canon-vespa', name: 'Vespa-Königreich', cx: 76, cy: 78, r: 1.2, color: '#84cc16', desc: 'Ein kleines Inselreich südlich von Roshwan.', type: 'Stadt' },
  { id: 'op-canon-centaurea', name: 'Centaurea-Königreich', cx: 79, cy: 77, r: 1.3, color: '#06b6d4', desc: 'Ein malerisches Inselkönigreich mit vielen Kanälen.', type: 'Stadt' },
  { id: 'op-canon-tajine', name: 'Tajine-Königreich', cx: 76, cy: 87, r: 1.3, color: '#f59e0b', desc: 'Ein sonniges Inselkönigreich im Süden.', type: 'Stadt' },
  { id: 'op-canon-ringo-sb', name: 'Ringo-Königreich', cx: 83, cy: 87, r: 1.2, color: '#ca8a04', desc: 'Ein traditionsreiches Land im südöstlichen South Blue.', type: 'Stadt' },
  { id: 'op-canon-evilblackdrum', name: 'Evil Black Drum Kingdom', cx: 86, cy: 78, r: 1.6, color: '#334155', desc: 'Das finstere Königreich, gegründet von Wapol nach seiner Flucht aus Drumm.', type: 'Stadt' },
  { id: 'op-canon-tumi', name: 'Tumi', cx: 89, cy: 67, r: 1.0, color: '#eab308', desc: 'Eine kleine, friedliche Insel im Norden.', type: 'Insel' },
  { id: 'op-canon-elderlyvillage', name: 'Elderly Village', cx: 90, cy: 76, r: 0.9, color: '#78716c', desc: 'Das Dorf der älteren Bewohner auf der Sorbet-Insel.', type: 'Dorf' },
  { id: 'op-canon-castletown', name: 'Castle Town', cx: 92, cy: 75, r: 1.1, color: '#475569', desc: 'Die befestigte Hauptstadt des Sorbet-Königreichs.', type: 'Stadt' },
  { id: 'op-canon-church', name: 'Church', cx: 92, cy: 77, r: 1.0, color: '#3b82f6', desc: 'Die historische Kirche, in der Kuma als Pastor wirkte.', type: 'Burg' },
  { id: 'op-canon-karate', name: 'Karate-Insel', cx: 93, cy: 64, r: 1.5, color: '#15803d', desc: 'Heimat des weltberühmten Karate-Dojos im fernen Nordosten des South Blue.', type: 'Insel' },

  // --- CALM BELT ---
  { id: 'op-canon-amazon-lily', name: 'Amazon Lily', cx: 88.5, cy: 58.0, r: 2.0, color: '#047857', desc: 'Das geheime Dschungelreich der Kuja-Amazonen unter Herrschaft von Boa Hancock.', type: 'Stadt' },
  { id: 'op-canon-impel-down', name: 'Impel Down', cx: 91.0, cy: 57.0, r: 1.5, color: '#334155', desc: 'Das unbezwingbare Unterwasser-Gefängnis der Weltregierung.', type: 'Burg' },

  // --- GRAND LINE: PARADISE ---
  { id: 'op-canon-twinscape', name: 'Twins Cape', cx: 52.0, cy: 50.0, r: 1.1, color: '#475569', desc: 'Der Leuchtturm am Kap der Zwillinge, bewacht von Krokus und der Riesenwal Laboon.', type: 'Hafen' },
  { id: 'op-canon-whisky-peak', name: 'Cactus Island (Whisky Peak)', cx: 55.0, cy: 44.0, r: 1.5, color: '#ca8a04', desc: 'Erster Halt auf der Grand Line. Scheinbar gastfreundlich, in Wahrheit voller Kopfgeldjäger der Baroque-Firma.', type: 'Stadt' },
  { id: 'op-canon-little-garden', name: 'Little Garden', cx: 58.0, cy: 45.0, r: 1.7, color: '#15803d', desc: 'Prähistorische Insel, bewohnt von Dinosauriern und den Riesen Boogey und Woogey.', type: 'Wald' },
  { id: 'op-canon-kyuka', name: 'Kyuka-Insel', cx: 57.0, cy: 47.5, r: 1.3, color: '#10b981', desc: 'Eine Urlaubsinsel der Baroque-Agenten im Sektor nahe Alabasta.', type: 'Insel' },
  { id: 'op-canon-drum', name: 'Drum Island (Sakura)', cx: 61.5, cy: 45.0, r: 1.8, color: '#f1f5f9', desc: 'Verschneite Berginsel mit der legendären Kirschblütenmedizin, Heimat von Chopper.', type: 'Stadt' },
  { id: 'op-canon-renaisse', name: 'Renaisse', cx: 59.0, cy: 50.0, r: 1.2, color: '#eab308', desc: 'Eine malerische Handelsinsel im Paradise-Sektor.', type: 'Insel' },
  { id: 'op-canon-skullisland', name: 'Skull Island', cx: 56.0, cy: 53.0, r: 1.4, color: '#78716c', desc: 'Eine düstere Insel mit Felsen in Form von Totenschädeln.', type: 'Insel' },
  { id: 'op-canon-boin', name: 'Boin-Archipel', cx: 54.0, cy: 57.0, r: 1.6, color: '#84cc16', desc: 'Riesige fleischfressende Riesenblüten-Inseln (Stomach Baron), auf denen Lysop trainierte.', type: 'Wald' },
  { id: 'op-canon-bourgeois', name: 'Bourgeois-Königreich', cx: 55.5, cy: 55.0, r: 1.5, color: '#a1a1aa', desc: 'Ein reiches, befestigtes Königreich, aus dem Cavendish vertrieben wurde.', type: 'Stadt' },
  { id: 'op-canon-momoiro', name: 'Momoiro-Insel', cx: 58.5, cy: 55.5, r: 1.7, color: '#ec4899', desc: 'Das rosafarbene Königreich Kamabakka, Heimat der Okamas und Trainingsort von Sanji.', type: 'Stadt' },
  { id: 'op-canon-alabasta', name: 'Alabasta (Sandy Island)', cx: 67.5, cy: 42.0, r: 2.8, color: '#ca8a04', desc: 'Gewaltiges Wüstenkönigreich unter Familie Nefeltari. Standort der Hauptstadt Alubarna.', type: 'Stadt' },
  { id: 'op-canon-rainbase', name: 'Rainbase', cx: 66.0, cy: 42.5, r: 0.8, color: '#ca8a04', desc: 'Die Oasenstadt Alabastas, bekannt für das Kasino Rain Dinners.', type: 'Dorf' },
  { id: 'op-canon-alubarna', name: 'Alubarna', cx: 68.2, cy: 42.0, r: 1.1, color: '#ca8a04', desc: 'Die gigantische Palaststadt und Hauptstadt des Alabasta-Königreichs.', type: 'Stadt' },
  { id: 'op-canon-elumalu', name: 'Elumalu', cx: 65.2, cy: 44.2, r: 0.8, color: '#94a3b8', desc: 'Die grüne Stadt von Alabasta, die nach der Dürrekatastrophe verlassen wurde.', type: 'Dorf' },
  { id: 'op-canon-nanohana', name: 'Nanohana', cx: 68.0, cy: 44.2, r: 0.9, color: '#3b82f6', desc: 'Die belebte Hafenstadt Alabastas im Süden der Wüsteninsel.', type: 'Hafen' },
  { id: 'op-canon-tamarisk', name: 'Tamarisk', cx: 69.0, cy: 42.6, r: 0.8, color: '#0ea5e9', desc: 'Eine weitere wichtige Hafenstadt an der Ostküste von Sandy Island.', type: 'Hafen' },
  { id: 'op-canon-nanimonai', name: 'Nanimonai-Insel', cx: 66.0, cy: 47.0, r: 1.3, color: '#16a34a', desc: 'Eine unscheinbare Insel ("Nichts-Insel"), auf der Ruffy und seine Bande rasteten.', type: 'Insel' },
  { id: 'op-canon-weatheria', name: 'Weatheria', cx: 66.5, cy: 51.5, r: 1.1, color: '#38bdf8', desc: 'Die schwebende Himmelsinsel der Wetterforscher, auf der Nami ihr Wetterwissen vertiefte.', type: 'Insel' },
  { id: 'op-canon-foolshout', name: 'Foolshout-Insel', cx: 62.0, cy: 53.5, r: 1.4, color: '#15803d', desc: 'Heimatinsel von Koala und Herkunftsort wichtiger Revolutionäre.', type: 'Insel' },
  { id: 'op-canon-vodka-gl', name: 'Vodka-Königreich', cx: 61.5, cy: 56.5, r: 1.5, color: '#94a3b8', desc: 'Ein unbedeutendes Himmelskönigreich oder Vasallenstaat.', type: 'Stadt' },
  { id: 'op-canon-shadeport', name: 'Shade Port', cx: 66.0, cy: 56.5, r: 1.2, color: '#475569', desc: 'Ein geschützter, im Schatten liegender Schwarzmarkt-Hafen.', type: 'Hafen' },
  { id: 'op-canon-jaya', name: 'Jaya', cx: 71.0, cy: 46.5, r: 1.8, color: '#16a34a', desc: 'Eine wilde, bewaldete Insel. Einst Heimat des Shandia-Stammes und der goldenen Stadt Shandora.', type: 'Insel' },
  { id: 'op-canon-mocktown', name: 'Mock Town', cx: 69.5, cy: 46.0, r: 1.1, color: '#cbd5e1', desc: 'Die gesetzlose, lebhafte Hafenstadt auf Jaya, in der Piraten ungestört feiern.', type: 'Hafen' },
  { id: 'op-canon-skypiea', name: 'Skypiea', cx: 72.5, cy: 43.5, r: 2.2, color: '#e2e8f0', desc: 'Die legendäre Himmelsinsel auf den weißen Wolken des Himmelsmeeres.', type: 'Stadt' },
  { id: 'op-canon-upperyard', name: 'Upper Yard', cx: 73.0, cy: 44.0, r: 1.4, color: '#15803d', desc: 'Das heilige Land von Skypiea, das ein emporgeschleudertes Stück von Jaya ist.', type: 'Wald' },
  { id: 'op-canon-angelisland', name: 'Angel Island', cx: 72.0, cy: 45.2, r: 1.2, color: '#fef08a', desc: 'Die malerische Himmelsstadt, Heimat von Conis und Pagaya.', type: 'Dorf' },
  { id: 'op-canon-birka', name: 'Birka', cx: 72.0, cy: 37.5, r: 1.3, color: '#94a3b8', desc: 'Die einstige Himmelsinsel südlich von Skypiea, von Enel komplett vernichtet.', type: 'Ruine' },
  { id: 'op-canon-ukkari', name: 'Ukkari-Insel', cx: 70.0, cy: 41.5, r: 1.1, color: '#ca8a04', desc: 'Eine kleine, recht unbedeutende tropische Insel.', type: 'Insel' },
  { id: 'op-canon-eigis', name: 'Eigis-Königreich', cx: 76.5, cy: 41.5, r: 1.6, color: '#a1a1aa', desc: 'Ein reiches, glänzendes Königreich auf der Grand Line.', type: 'Stadt' },
  { id: 'op-canon-g8', name: 'Marinebasis G-8 (Navarone)', cx: 75.0, cy: 44.5, r: 1.5, color: '#475569', desc: 'Die uneinnehmbare Festung Navarone unter Vizeadmiral Jonathan.', type: 'Burg' },
  { id: 'op-canon-longring', name: 'Long Ring Long Land', cx: 76.0, cy: 51.0, r: 2.0, color: '#22c55e', desc: 'Ein Archipel, bei dem alles extrem langgezogen ist, Heimat der Davy Back Fights.', type: 'Insel' },
  { id: 'op-canon-aoi', name: 'Aoi-Königreich', cx: 68.5, cy: 54.5, r: 1.4, color: '#2563eb', desc: 'Ein wohlhabendes, tiefblaues Königreich.', type: 'Stadt' },
  { id: 'op-canon-kenzan', name: 'Kenzan-Insel', cx: 72.0, cy: 56.5, r: 1.5, color: '#d97706', desc: 'Die Heimat des Langarm-Stammes, bekannt für seine scharfkantigen Felsklippen.', type: 'Insel' },
  { id: 'op-canon-namakura', name: 'Namakura-Insel', cx: 77.0, cy: 55.0, r: 1.3, color: '#7c3aed', desc: 'Die finstere Armutsinsel mit dem düsteren Kult, der Brook beschwor.', type: 'Dorf' },
  { id: 'op-canon-harahetania', name: 'Harahetania', cx: 77.5, cy: 53.5, r: 1.1, color: '#cbd5e1', desc: 'Das hungernde Dorf im Land des Teufels auf der Namakura-Insel.', type: 'Dorf' },
  { id: 'op-canon-karakuri', name: 'Karakuri-Insel (Baldimore)', cx: 78.5, cy: 44.5, r: 1.7, color: '#f8fafc', desc: 'Die hochtechnologische, verschneite Zukunftsheimat von Dr. Vegapunk, wo Franky trainierte.', type: 'Stadt' },
  { id: 'op-canon-pucci', name: 'Pucci-Insel', cx: 80.5, cy: 48.0, r: 1.4, color: '#0ea5e9', desc: 'Eine blühende Gourmet-Stadt der Feinschmecker im San-Faldo-Archipel.', type: 'Stadt' },
  { id: 'op-canon-shiftstation', name: 'Shift Station', cx: 82.5, cy: 51.0, r: 1.0, color: '#475569', desc: 'Der Seezug-Bahnhof von Oma Cocolo und Chimney nahe Water Seven.', type: 'Hafen' },
  { id: 'op-canon-sanfaldo', name: 'San Faldo', cx: 81.5, cy: 54.0, r: 1.5, color: '#ca8a04', desc: 'Eine große Handelsstadt auf der Seezug-Route.', type: 'Stadt' },
  { id: 'op-canon-stpoplar', name: 'St. Poplar', cx: 84.5, cy: 53.0, r: 1.6, color: '#10b981', desc: 'Die Frühlingskönigin-Hafenstadt, berühmt für ihre riesigen Pappeln und medizinischen Kliniken.', type: 'Hafen' },
  { id: 'op-canon-scrapisland', name: 'Scrap Island', cx: 82.0, cy: 45.5, r: 1.2, color: '#64748b', desc: 'Die Schrottinsel nahe Water Seven, wo Schiffbauer Reste sammeln.', type: 'Insel' },
  { id: 'op-canon-water7', name: 'Water Seven', cx: 83.0, cy: 48.5, r: 2.2, color: '#0ea5e9', desc: 'Prachtvolle Metropole des Wassers und der legendären Schiffbauer-Gilden, erbaut wie ein riesiger Springbrunnen.', type: 'Hafen' },
  { id: 'op-canon-g3', name: 'Marinebasis G-3', cx: 79.5, cy: 38.0, r: 1.1, color: '#475569', desc: 'Ein wichtiger Außenposten der Marine nahe dem Calm Belt.', type: 'Burg' },
  { id: 'op-canon-rommel', name: 'Rommel-Königreich', cx: 83.5, cy: 41.5, r: 1.7, color: '#7c3aed', desc: 'Eine schattige viktorianische Metropole, bekannt für das Mysterium des schlitzenden Hakuba.', type: 'Stadt' },
  { id: 'op-canon-banaro', name: 'Banaro-Insel', cx: 85.5, cy: 44.0, r: 1.6, color: '#d97706', desc: 'Eine raue Westernstadt-Insel, Schauplatz des Duells zwischen Ace und Blackbeard.', type: 'Stadt' },
  { id: 'op-canon-florian', name: 'Florian-Dreieck', cx: 87.5, cy: 45.0, r: 2.3, color: '#334155', desc: 'Das neblige, unheilvolle Seegebiet voller Geisterschiffe und monströser Schatten.', type: 'Region' },
  { id: 'op-canon-thrillerbark', name: 'Thriller Bark', cx: 88.0, cy: 46.5, r: 1.4, color: '#1e293b', desc: 'Das gigantische Geisterschiff-Inselreich von Gecko Moria, das im dichten Nebel des Florian-Dreiecks kreuzt.', type: 'Burg' },
  { id: 'op-canon-enieslobby', name: 'Enies Lobby', cx: 88.5, cy: 52.0, r: 1.6, color: '#94a3b8', desc: 'Die uneinnehmbare Justizinsel der Weltregierung mit dem Abgrund ohne Boden.', type: 'Burg' },
  { id: 'op-canon-guanhao', name: 'Guanhao', cx: 87.5, cy: 53.5, r: 1.2, color: '#475569', desc: 'Eine befestigte kleine Insel südlich von Enies Lobby.', type: 'Insel' },
  { id: 'op-canon-flyingfish', name: 'Flying Fish Riders Base', cx: 92.0, cy: 45.0, r: 1.1, color: '#334155', desc: 'Das schwimmende Versteck der fliegenden Fischreiter unter Führung von Duval.', type: 'Hafen' },
  { id: 'op-canon-sabaody', name: 'Sabaody Archipel', cx: 93.5, cy: 50.0, r: 1.8, color: '#0284c7', desc: 'Gigantische Mangrovenbäume mit Seifenblasen-Technologie, Pforte zur Neuen Welt.', type: 'Hafen' },
  { id: 'op-canon-lulusia', name: 'Lulusia-Königreich', cx: 92.5, cy: 43.5, r: 1.9, color: '#ef4444', desc: 'Königreich unter Herrschaft von König Seki, berüchtigt durch seine tragische Tilgung von der Weltkarte.', type: 'Stadt' },
  { id: 'op-canon-kuraigana', name: 'Kuraigana-Insel', cx: 89.0, cy: 39.5, r: 1.7, color: '#475569', desc: 'Düstere, verlassene Burgruinenlandschaft, Wohnsitz von Dracule Mihawk und Perona.', type: 'Ruine' },
  { id: 'op-canon-g2', name: 'Marinebasis G-2', cx: 94.5, cy: 41.5, r: 1.0, color: '#475569', desc: 'Eine befestigte Marinebasis im östlichen Sektor von Paradise.', type: 'Burg' },
  { id: 'op-canon-redport', name: 'Red Port', cx: 95.5, cy: 51.0, r: 1.2, color: '#ef4444', desc: 'Der majestätische Hafen am Fuße der Red Line zum Aufstieg nach Mary Joa.', type: 'Hafen' },
  { id: 'op-canon-marineford', name: 'Marineford', cx: 93.5, cy: 53.5, r: 1.8, color: '#334155', desc: 'Die gigantische sichelförmige Marinefestung und ehemaliges Hauptquartier der Gerechtigkeit.', type: 'Burg' },
  { id: 'op-canon-rusukaina', name: 'Rusukaina', cx: 87.5, cy: 56.5, r: 1.5, color: '#15803d', desc: 'Die wilde Insel der 48 Jahreszeiten voller mächtiger Bestien, auf der Ruffy Haki trainierte.', type: 'Wald' },
  { id: 'op-canon-fishman', name: 'Fish-Man Island', cx: 96.5, cy: 49.0, r: 1.8, color: '#38bdf8', desc: 'Das wunderschöne Untersee-Königreich unter der Red Line in 10.000 Metern Tiefe.', type: 'Stadt' },

  // --- GRAND LINE: NEW WORLD ---
  { id: 'op-canon-marygeoise', name: 'Mary Geoise', cx: 0.5, cy: 50.0, r: 1.5, color: '#f59e0b', desc: 'Das Heilige Land auf der Red Line, herrschaftlicher Sitz der Weltregierung und der Weltaristokraten.', type: 'Stadt' },
  { id: 'op-canon-newmarineford', name: 'New Marineford (G-1)', cx: 2.2, cy: 48.0, r: 1.6, color: '#334155', desc: 'Das neue Hauptquartier der Marine unter Großadmiral Sakazuki nahe der Red Line.', type: 'Burg' },
  { id: 'op-canon-g5', name: 'Marinebasis G-5', cx: 2.2, cy: 54.0, r: 1.4, color: '#475569', desc: 'Die berüchtigte und brutale Marinebasis im gefährlichen Sektor des New World.', type: 'Burg' },
  { id: 'op-canon-mystoria', name: 'Mystoria-Insel', cx: 4.8, cy: 47.5, r: 1.2, color: '#10b981', desc: 'Eine geheimnisvolle Insel am Anfang der Neuen Welt mit drei sich kreuzenden Magnetnadeln.', type: 'Insel' },
  { id: 'op-canon-coastal-ruins', name: 'Coastal Ruins', cx: 5.8, cy: 46.5, r: 1.3, color: '#78716c', desc: 'Historische Küstenruinen einer uralten Zivilisation der Neuen Welt.', type: 'Ruine' },
  { id: 'op-canon-risky-red', name: 'Risky Red Island', cx: 5.5, cy: 50.5, r: 1.5, color: '#ef4444', desc: 'Eine der ersten drei ansteuerbaren Inseln der Neuen Welt, rot glühend und unheilvoll.', type: 'Insel' },
  { id: 'op-canon-raijin', name: 'Raijin-Insel', cx: 4.8, cy: 54.0, r: 1.6, color: '#7c3aed', desc: 'Die Gewitterinsel am Anfang der Neuen Welt, auf der es ununterbrochen Blitze regnet.', type: 'Insel' },
  { id: 'op-canon-punkhazard', name: 'Punk Hazard', cx: 6.8, cy: 54.5, r: 2.1, color: '#a21caf', desc: 'Verschlossenes Labor-Inselreich, nach dem Duell der Admiräle hälftig in Flammen und Eis geteilt.', type: 'Ruine' },
  { id: 'op-canon-majiatsuka', name: 'Majiatsuka-Königreich', cx: 7.2, cy: 57.0, r: 1.3, color: '#ca8a04', desc: 'Ein reiches Inselkönigreich mit vielen Häfen im Südwesten der Neuen Welt.', type: 'Stadt' },
  { id: 'op-canon-porco', name: 'Porco-Königreich', cx: 8.2, cy: 45.5, r: 1.4, color: '#059669', desc: 'Ein prachtvolles, grünes Königreich mit befestigten Mauern und stolzen Mauertürmen.', type: 'Stadt' },
  { id: 'op-canon-standing', name: 'Standing-Königreich', cx: 11.2, cy: 44.5, r: 1.5, color: '#b45309', desc: 'Ein altehrwürdiges Königreich der Neuen Welt, geschützt durch dichte Wälder.', type: 'Stadt' },
  { id: 'op-canon-gartel', name: 'Gartel-Insel', cx: 12.8, cy: 45.5, r: 1.3, color: '#16a34a', desc: 'Eine kleine, friedliche Handelsinsel mit dichten Pinienwäldern.', type: 'Insel' },
  { id: 'op-canon-mogaro', name: 'Mogaro-Königreich', cx: 10.8, cy: 47.5, r: 1.4, color: '#ca8a04', desc: 'Heimat der kriegerischen Mogaro-Geschwister und Söldnerbünde.', type: 'Stadt' },
  { id: 'op-canon-port-chibaralta', name: 'Port Chibaralta', cx: 11.0, cy: 51.5, r: 1.3, color: '#0ea5e9', desc: 'Ein bedeutender Hafenstützpunkt und neutrales Handelszentrum.', type: 'Hafen' },
  { id: 'op-canon-prodence', name: 'Prodence-Königreich', cx: 13.5, cy: 55.5, r: 1.5, color: '#eab308', desc: 'Ein verbündetes Königreich von Dressrosa, regiert von König Elizabello II. und seiner Königselite.', type: 'Stadt' },
  { id: 'op-canon-yukiryu-nw', name: 'Yukiryu-Insel', cx: 16.5, cy: 57.5, r: 1.2, color: '#cbd5e1', desc: 'Eine eiskalte, schneebedeckte Vulkaninsel in den südlichen Meeresstraßen.', type: 'Insel' },
  { id: 'op-canon-broccoli', name: 'Broc Coli Island', cx: 15.5, cy: 43.5, r: 1.6, color: '#15803d', desc: 'Eine brokoli-artig gewachsene, fruchtbare Insel, Schauplatz eines Bürgerkriegs, den Germa 66 beendete.', type: 'Insel' },
  { id: 'op-canon-applenine', name: 'Applenine Island', cx: 16.2, cy: 47.5, r: 1.3, color: '#ea580c', desc: 'Eine malerische, apfelförmige Vulkaninsel mit heißen Thermalquellen.', type: 'Insel' },

  // --- DRESSROSA SECTOR ---
  { id: 'op-canon-dressrosa', name: 'Dressrosa-Königreich', cx: 17.5, cy: 51.0, r: 2.6, color: '#e11d48', desc: 'Königreich der Leidenschaft, lebendigen Spielzeuge und Gladiatorenkämpfe im Kolosseum.', type: 'Stadt' },
  { id: 'op-canon-greenbit', name: 'Green Bit', cx: 16.5, cy: 49.5, r: 1.1, color: '#16a34a', desc: 'Dschungelinsel voller Riesenpflanzen nördlich von Dressrosa, Heimat der flinken Tontatta-Zwerge.', type: 'Wald' },
  { id: 'op-canon-flowerhill', name: 'Blumenhügel', cx: 15.8, cy: 52.0, r: 0.8, color: '#ec4899', desc: 'Der wunderschöne Hügel voller Sonnenblumen, Schauplatz des tragischen Rebellensturms.', type: 'Dorf' },
  { id: 'op-canon-royalpalace', name: 'Königspalast', cx: 17.0, cy: 52.2, r: 0.9, color: '#ca8a04', desc: 'Die herrschaftliche Residenz der Donquixote-Familie auf dem Gipfel des Plateaus.', type: 'Burg' },
  { id: 'op-canon-corridacolosseum', name: 'Corrida-Kolosseum', cx: 17.0, cy: 53.5, r: 1.0, color: '#334155', desc: 'Das gigantische Kampfforum, in dem Gladiatoren um Leben und Teufelsfrüchte kämpfen.', type: 'Burg' },
  { id: 'op-canon-acacia', name: 'Acacia', cx: 15.2, cy: 53.5, r: 0.8, color: '#475569', desc: 'Die geschäftige, südliche Hafenstadt des glänzenden Dressrosa.', type: 'Hafen' },

  // --- TOTTO LAND / WHOLE CAKE ARCHIPELAGO ---
  { id: 'op-canon-wholecake', name: 'Whole Cake Island', cx: 26.0, cy: 49.0, r: 2.4, color: '#db2777', desc: 'Das süße Hauptquartier von Big Mom, umschlossen von Totto Lands Leckereien.', type: 'Stadt' },
  { id: 'op-canon-totto-candy', name: 'Candy Island', cx: 27.8, cy: 47.3, r: 0.65, color: '#f472b6', desc: 'Süßigkeiten-Insel, verwaltet von Minister Charlotte Perospero.', type: 'Insel' },
  { id: 'op-canon-totto-biscuits', name: 'Biscuits Island', cx: 26.0, cy: 50.5, r: 0.65, color: '#b45309', desc: 'Biscuits Island, bewacht von Minister Charlotte Cracker.', type: 'Insel' },
  { id: 'op-canon-totto-nuts', name: 'Nuts Island', cx: 28.0, cy: 49.5, r: 0.6, color: '#15803d', desc: 'Nuts Island, Heimat von Minister Charlotte Amande.', type: 'Insel' },
  { id: 'op-canon-totto-jam', name: 'Jam Island', cx: 29.5, cy: 51.0, r: 0.6, color: '#b91c1c', desc: 'Marmeladen-Insel, verwaltet von Minister Charlotte Cornpo.', type: 'Insel' },
  { id: 'op-canon-totto-cheese', name: 'Cheese Island', cx: 27.5, cy: 51.0, r: 0.65, color: '#f59e0b', desc: 'Cheese Island, verwaltet von Minister Charlotte Mont-d\'Or.', type: 'Insel' },
  { id: 'op-canon-totto-milk', name: 'Milk Island', cx: 32.5, cy: 47.8, r: 0.6, color: '#f8fafc', desc: 'Milch-Insel, die Quelle exquisiter Milch von Totto Land.', type: 'Insel' },
  { id: 'op-canon-totto-cacao', name: 'Cacao Island', cx: 28.3, cy: 51.2, r: 0.65, color: '#7c2d12', desc: 'Cacao Island mit Chocolat Town, Heimat von Charlotte Pudding.', type: 'Insel' },
  { id: 'op-canon-totto-margarine', name: 'Margarine Island', cx: 26.5, cy: 46.0, r: 0.6, color: '#fef08a', desc: 'Margarine Island, Heimat von Charlotte Broyé.', type: 'Insel' },
  { id: 'op-canon-totto-liqueur', name: 'Liqueur Island', cx: 31.8, cy: 49.8, r: 0.65, color: '#a21caf', desc: 'Liqueur Island, verwaltet von Minister Charlotte Joss.', type: 'Insel' },
  { id: 'op-canon-totto-jelly', name: 'Jelly Island', cx: 31.0, cy: 48.5, r: 0.6, color: '#ec4899', desc: 'Jelly Island, Heimat von Charlotte Myukuru.', type: 'Insel' },
  { id: 'op-canon-totto-fruits', name: 'Fruits Island', cx: 28.5, cy: 44.5, r: 0.7, color: '#22c55e', desc: 'Früchte-Insel, verwaltet von Minister Charlotte Compote.', type: 'Insel' },
  { id: 'op-canon-totto-komugi', name: 'Komugi Island', cx: 23.5, cy: 47.8, r: 0.7, color: '#fbbf24', desc: 'Mehl-Insel Komugi, Heimat von Generalkommandant Charlotte Katakuri.', type: 'Insel' },
  { id: 'op-canon-totto-yakyogashi', name: 'Yakyogashi Island', cx: 24.5, cy: 46.2, r: 0.6, color: '#f97316', desc: 'Backwaren-Insel Yakyogashi, Heimat von Charlotte Opera.', type: 'Insel' },
  { id: 'op-canon-totto-rokumitsu', name: 'Rokumitsu Island', cx: 25.0, cy: 44.5, r: 0.6, color: '#eab308', desc: 'Honig-Insel Rokumitsu, Heimat der Charlotte-Zehnlinge.', type: 'Insel' },
  { id: 'op-canon-totto-sanshoku', name: 'Sanshoku Island', cx: 23.5, cy: 45.4, r: 0.65, color: '#34d399', desc: 'Dango-Insel Sanshoku, Heimat von Charlotte Noisette.', type: 'Insel' },
  { id: 'op-canon-totto-funwari', name: 'Funwari Island', cx: 32.5, cy: 49.8, r: 0.65, color: '#cbd5e1', desc: 'Chiffon-Insel Funwari, Heimat von Charlotte Chiffon.', type: 'Insel' },
  { id: 'op-canon-totto-kimi', name: 'Kimi Island', cx: 25.5, cy: 52.0, r: 0.6, color: '#fef08a', desc: 'Eigelb-Insel Kimi, verwaltet von Charlotte High-Fat.', type: 'Insel' },
  { id: 'op-canon-totto-kinko', name: 'Kinko Island', cx: 27.5, cy: 43.5, r: 0.6, color: '#10b981', desc: 'Tresor-Insel Kinko, bewacht von Minister Charlotte Wafers.', type: 'Insel' },
  { id: 'op-canon-totto-milenge', name: 'Milenge Island', cx: 30.5, cy: 44.5, r: 0.6, color: '#cbd5e1', desc: 'Baiser-Insel Milenge, bewacht von Charlotte Saint-Marc.', type: 'Insel' },
  { id: 'op-canon-totto-futoru', name: 'Futoru Island', cx: 23.0, cy: 49.2, r: 0.6, color: '#f59e0b', desc: 'Eine weitere, zuckersüße Dessert-Insel in Totto Land.', type: 'Insel' },
  { id: 'op-canon-totto-tanega', name: 'Tanega Island', cx: 22.8, cy: 50.4, r: 0.6, color: '#ea580c', desc: 'Samen-Insel Tanega, bekannt für ihre nahrhaften Pflanzen.', type: 'Insel' },
  { id: 'op-canon-totto-piepie', name: 'Piepie Island', cx: 22.5, cy: 51.5, r: 0.6, color: '#eab308', desc: 'Kuchenkrusten-Insel Piepie im Westen Totto Lands.', type: 'Insel' },
  { id: 'op-canon-totto-unique', name: 'Unique Island', cx: 23.5, cy: 52.5, r: 0.6, color: '#a21caf', desc: 'Einzigartigkeits-Insel, voller unvollendeter Kreationen der Familie Charlotte.', type: 'Insel' },
  { id: 'op-canon-totto-topping', name: 'Topping Island', cx: 23.2, cy: 53.6, r: 0.6, color: '#f43f5e', desc: 'Topping-Insel, berühmt für bunte Streusel und Toppings.', type: 'Insel' },
  { id: 'op-canon-totto-package', name: 'Package Island', cx: 24.5, cy: 54.4, r: 0.6, color: '#475569', desc: 'Verpackungs-Insel, wo die Schokoladenschachteln produziert werden.', type: 'Insel' },
  { id: 'op-canon-totto-noko', name: 'Noko Island', cx: 25.8, cy: 45.4, r: 0.6, color: '#84cc16', desc: 'Pilz-Insel Noko mit köstlichen Riesenpilzen.', type: 'Insel' },
  { id: 'op-canon-totto-poripori', name: 'Poripori Island', cx: 26.2, cy: 47.8, r: 0.6, color: '#fbbf24', desc: 'Knusper-Insel Poripori mit keksartigen Bergketten.', type: 'Insel' },
  { id: 'op-canon-totto-black', name: 'Black Island', cx: 25.8, cy: 49.8, r: 0.6, color: '#334155', desc: 'Lakritz-Insel, bekannt für ihren bittersüßen schwarzen See.', type: 'Insel' },
  { id: 'op-canon-totto-flavor', name: 'Flavor Island', cx: 26.2, cy: 54.0, r: 0.6, color: '#a855f7', desc: 'Aroma-Insel Flavor, reich an duftenden Essenzen.', type: 'Insel' },
  { id: 'op-canon-totto-cutlery', name: 'Cutlery Island', cx: 28.0, cy: 45.4, r: 0.6, color: '#94a3b8', desc: 'Besteck-Insel, auf der das feinste Tafelbesteck geschmiedet wird.', type: 'Insel' },
  { id: 'op-canon-totto-100-island', name: '100% Island', cx: 29.5, cy: 43.6, r: 0.6, color: '#3b82f6', desc: 'Reine Saft-Insel mit riesigen, fruchtigen Sirupquellen.', type: 'Insel' },
  { id: 'op-canon-totto-potato', name: 'Potato Island', cx: 31.2, cy: 45.2, r: 0.6, color: '#b45309', desc: 'Kartoffel-Insel Potato, Heimat der deftigsten Knollengerichte.', type: 'Insel' },
  { id: 'op-canon-totto-ice', name: 'Ice Island', cx: 30.0, cy: 46.5, r: 0.6, color: '#38bdf8', desc: 'Eiscreme-Insel, permanent gekühlt für die Erhaltung der Torten.', type: 'Insel' },
  { id: 'op-canon-totto-kibo', name: 'Kibo Island', cx: 29.5, cy: 47.5, r: 0.6, color: '#d97706', desc: 'Hoffnungs-Insel Kibo, bekannt für Glücksbringer aus Lebkuchen.', type: 'Insel' },
  { id: 'op-canon-totto-loving', name: 'Loving Island', cx: 29.2, cy: 54.2, r: 0.6, color: '#ec4899', desc: 'Herz-Insel Loving, geschmückt mit Liebesäpfeln.', type: 'Insel' },

  // --- MIDDLE & SOUTH OF NEW WORLD ---
  { id: 'op-canon-addzou', name: 'Zou (Zunesha)', cx: 31.0, cy: 55.0, r: 1.9, color: '#3f5e31', desc: 'Phantom-Insel auf dem Rücken des 1000 Jahre alten Riesenelefanten Zunesha, Heimat der Minks.', type: 'Dorf' },
  { id: 'op-canon-pepe', name: 'Pepe-Königreich', cx: 27.5, cy: 56.5, r: 1.4, color: '#78716c', desc: 'Ein verlassenes und zerfallenes Königreich in den südlichen Gewässern.', type: 'Stadt' },
  { id: 'op-canon-baltigo-nw', name: 'Baltigo', cx: 26.0, cy: 58.0, r: 1.5, color: '#fcd34d', desc: 'Das windige Exil der weißen Erde, einstiges Geheimversteck der Revolutionsarmee.', type: 'Insel' },

  // --- WANO SECTOR ---
  { id: 'op-canon-wano', name: 'Wano Kuni', cx: 32.5, cy: 48.5, r: 2.6, color: '#047857', desc: 'Abgeschlossenes Samurai-Königreich auf einem extremen Hochplateau, umgeben von unwegsamen Strömungen.', type: 'Stadt' },
  { id: 'op-canon-onigashima', name: 'Onigashima', cx: 34.0, cy: 49.2, r: 1.1, color: '#1e293b', desc: 'Die unheilvolle Teufels-Insel vor der Küste von Wano mit Kaidos gewaltigem Totenkopf-Palast.', type: 'Burg' },
  { id: 'op-canon-flower-capital', name: 'Blumenhauptstadt', cx: 31.8, cy: 48.0, r: 0.9, color: '#ec4899', desc: 'Die blühende, prachtvolle Hauptstadt des Samurai-Landes.', type: 'Stadt' },
  { id: 'op-canon-kuri', name: 'Kuri-Region', cx: 31.0, cy: 47.5, r: 0.8, color: '#15803d', desc: 'Die wilde, dichte Waldregion, einst reformiert durch Lord Kozuki Oden.', type: 'Region' },
  { id: 'op-canon-udon', name: 'Udon-Region', cx: 32.2, cy: 49.5, r: 0.8, color: '#78716c', desc: 'Die karge Region voller Bergwerke und Waffenfabriken der Bestien-Piraten.', type: 'Region' },
  { id: 'op-canon-kibi', name: 'Kibi-Region', cx: 32.5, cy: 47.0, r: 0.7, color: '#eab308', desc: 'Das Ödland von Kibi, bekannt für traditionelle Töpferei und Ruinen.', type: 'Region' },
  { id: 'op-canon-ringo', name: 'Ringo-Region', cx: 33.5, cy: 47.2, r: 0.8, color: '#cbd5e1', desc: 'Die verschneite Region im Norden Wanos mit dem heiligen Friedhof.', type: 'Region' },
  { id: 'op-canon-hakumai', name: 'Hakumai-Hafen', cx: 33.2, cy: 48.5, r: 0.8, color: '#0ea5e9', desc: 'Die einzige legale Hafenregion von Wano Kuni, kontrolliert von treuen Daimyos.', type: 'Hafen' },

  // --- OTHER NW LOCATIONS ---
  { id: 'op-canon-ballon', name: 'Ballon-Terminal', cx: 34.0, cy: 45.0, r: 1.2, color: '#f1f5f9', desc: 'Die schwebende Trümmer-Wolkeninsel über Wano, Startplatz des gefallenen Kaido.', type: 'Insel' },
  { id: 'op-canon-karaibari', name: 'Karai Bari Island', cx: 34.5, cy: 55.5, r: 1.6, color: '#e11d48', desc: 'Buggy Town, die bunte Zirkusstadt-Insel und das Hauptquartier von Buggys Allianz.', type: 'Stadt' },
  { id: 'op-canon-foodvalten', name: 'Foodvalten Island', cx: 33.0, cy: 53.0, r: 1.4, color: '#b45309', desc: 'Ein ehemals von Whitebeard beschütztes, geschäftiges Inselkönigreich.', type: 'Stadt' },
  { id: 'op-canon-g14', name: 'Marinebasis G-14', cx: 35.5, cy: 53.5, r: 1.5, color: '#475569', desc: 'Der vorgelagerte Marinestützpunkt der Neuen Welt nahe Egghead, Heimat der SWORD-Mitglieder.', type: 'Burg' },
  { id: 'op-canon-egghead', name: 'Egghead', cx: 35.5, cy: 50.0, r: 2.1, color: '#06b6d4', desc: 'Die Zukunftsinsel von Dr. Vegapunk, schwebend voller Hologramme, Riesen-Roboter und Laboratorien.', type: 'Stadt' },
  { id: 'op-canon-marine-gs', name: 'Marine GS General Hospital', cx: 34.5, cy: 57.0, r: 1.3, color: '#334155', desc: 'Das zentrale Großhospital der Marine zur Versorgung verletzter Offiziere.', type: 'Hafen' },
  { id: 'op-canon-mtkintoki', name: 'Mt. Kintoki', cx: 34.8, cy: 58.5, r: 1.1, color: '#475569', desc: 'Ein imposanter Gebirgspfad, berühmt für militärische Posten.', type: 'Insel' },
  { id: 'op-canon-sphinx', name: 'Sphinx Island', cx: 36.8, cy: 55.5, r: 1.5, color: '#15803d', desc: 'Die arme, friedliche Heimatinsel von Edward Newgate (Whitebeard), bewacht von Marco.', type: 'Dorf' },
  { id: 'op-canon-hachinosu', name: 'Hachinosu (Pirate Island)', cx: 36.5, cy: 54.5, r: 1.8, color: '#1e293b', desc: 'Die Pirateninsel Hachinosu, Geburtsort der Rocks-Bande und aktuelles Hauptquartier von Blackbeard.', type: 'Stadt' },
  { id: 'op-canon-winner', name: 'Winner Island', cx: 36.0, cy: 44.5, r: 1.4, color: '#d97706', desc: 'Die schroffe Felseninsel, auf der Blackbeard Laws Heart-Piraten überfiel.', type: 'Insel' },
  { id: 'op-canon-doerena', name: 'Doerena-Königreich', cx: 37.5, cy: 58.5, r: 1.3, color: '#ef4444', desc: 'Ein befestigtes Königreich, das im Bündnis mit Unterwelt-Fürsten steht.', type: 'Stadt' },
  { id: 'op-canon-vira', name: 'Vira', cx: 36.5, cy: 56.5, r: 1.4, color: '#7c3aed', desc: 'Ein kleines Inselreich, das einst eine Revolution erlebte.', type: 'Stadt' },
  { id: 'op-canon-loadestar', name: 'Loadestar-Insel', cx: 38.5, cy: 51.5, r: 1.8, color: '#64748b', desc: 'Die vorletzte Insel der Grand Line, wo alle Magnetströme zusammenlaufen.', type: 'Insel' },

  // --- ELBAPH SECTOR ---
  { id: 'op-canon-elbaph', name: 'Elbaph (Warland)', cx: 36.0, cy: 49.0, r: 2.5, color: '#16a34a', desc: 'Das legendäre Krieger-Königreich der stolzen Riesen der Welt, überragt von Yggdrasil.', type: 'Stadt' },
  { id: 'op-canon-heaven-world', name: 'Heaven World', cx: 39.5, cy: 46.5, r: 0.8, color: '#cbd5e1', desc: 'Der majestätische Himmelspalast hoch in den Zweigen von Yggdrasil.', type: 'Burg' },
  { id: 'op-canon-sun-world', name: 'Sun World', cx: 39.0, cy: 47.8, r: 0.9, color: '#fbbf24', desc: 'Die fruchtbare, sonnenverwöhnte Hochebene von Elbaph.', type: 'Region' },
  { id: 'op-canon-underworld', name: 'Underworld', cx: 38.2, cy: 49.5, r: 0.8, color: '#1e293b', desc: 'Das geheimnisvolle Tiefenreich im Wurzelbereich der Weltenesche.', type: 'Region' }
];

export function getOnePieceTerritories(worldTitle?: string): Territory[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('onepiece_world_template');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Update the root world node name if worldTitle is custom
          const root = parsed.find(t => t.parentId === null);
          if (root && worldTitle) {
            root.name = worldTitle;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load onepiece_world_template from localStorage", e);
    }
  }

  const territories: Territory[] = [];
  const rootId = 'op-welt-root';

  // 1. Root World
  territories.push({
    id: rootId,
    name: worldTitle || 'One Piece Welt',
    type: 'welt',
    description: 'Die legendäre Welt von One Piece, dominiert von der mächtigen Red Line und der tückischen Grand Line, die die vier großen Meere trennen.',
    parentId: null,
    x: 500,
    y: 500,
    width: 1000,
    height: 1000,
    shapeType: 'rectangle',
    color: '#0a1128'
  });

  // 2. Red Line Sections (represented as rectangles)
  territories.push({
    id: 'op-redline-center',
    name: 'Red Line (Zentrum)',
    type: 'kontinent',
    parentId: rootId,
    x: 500,
    y: 500,
    width: 30,
    height: 1000,
    shapeType: 'rectangle',
    color: '#991b1b',
    description: 'Gigantische rote Kontinentalwand im Zentrum der Welt. Sie erstreckt sich vertikal vom Nordpol bis zum Südpol und wird bei Reverse Mountain gekreuzt.'
  });

  territories.push({
    id: 'op-redline-east',
    name: 'Red Line (Ost / Mariejoa)',
    type: 'kontinent',
    parentId: rootId,
    x: 985,
    y: 500,
    width: 30,
    height: 1000,
    shapeType: 'rectangle',
    color: '#7f1d1d',
    description: 'Die zweite Kreuzung der Red Line auf der östlichen Kante der Weltkarte. Standort des Heiligen Landes Mariejoa und der Fischmenschen-Insel.'
  });

  // 3. Oceans / Blues
  const oceans = [
    { id: 'op-northblue', name: 'North Blue', x: 242.5, y: 190, w: 485, h: 380, color: '#0ea5e9', desc: 'Der nördliche Ozean im Nordwesten der Welt, Heimat der Vinsmokes und hochentwickelter Technologie.' },
    { id: 'op-eastblue', name: 'East Blue', x: 742.5, y: 190, w: 455, h: 380, color: '#0284c7', desc: 'Der östliche Ozean im Nordosten der Welt. Er gilt als das friedlichste der vier Meere, brachte aber legendäre Piraten hervor.' },
    { id: 'op-westblue', name: 'West Blue', x: 242.5, y: 810, w: 485, h: 380, color: '#0ea5e9', desc: 'Der westliche Ozean im Südwesten der Welt, bekannt für seine Archäologie, Mafia-Clans und Ohara.' },
    { id: 'op-southblue', name: 'South Blue', x: 742.5, y: 810, w: 455, h: 380, color: '#0369a1', desc: 'Der südlicher Ozean im Südosten der Welt, Heimat fortschrittlicher Pharmazie und mächtiger Reiche.' }
  ];

  oceans.forEach(oc => {
    territories.push({
      id: oc.id,
      name: oc.name,
      type: 'meer',
      parentId: rootId,
      x: oc.x,
      y: oc.y,
      width: oc.w,
      height: oc.h,
      shapeType: 'rectangle',
      color: oc.color,
      description: oc.desc
    });
  });

  // 4. Calm Belts (surrounding Grand Line horizontally)
  const calmBelts = [
    { id: 'op-calmbelt-nw', name: 'Calm Belt Nord-West', x: 242.5, y: 400, w: 485, h: 40, desc: 'Windstille Meereszone nördlich der Neuen Welt und südlich des North Blue, voller gigantischer Seekönige.' },
    { id: 'op-calmbelt-ne', name: 'Calm Belt Nord-Ost', x: 742.5, y: 400, w: 455, h: 40, desc: 'Windstille Meereszone nördlich von Paradise und südlich des East Blue, voller gigantischer Seekönige.' },
    { id: 'op-calmbelt-sw', name: 'Calm Belt Süd-West', x: 242.5, y: 600, w: 485, h: 40, desc: 'Windstille Meereszone südlich der Neuen Welt und nördlich des West Blue, voller gigantischer Seekönige.' },
    { id: 'op-calmbelt-se', name: 'Calm Belt Süd-Ost', x: 742.5, y: 600, w: 455, h: 40, desc: 'Windstille Meereszone südlich von Paradise und nördlich des South Blue, voller gigantischer Seekönige.' }
  ];

  calmBelts.forEach(cb => {
    territories.push({
      id: cb.id,
      name: cb.name,
      type: 'meer',
      parentId: rootId,
      x: cb.x,
      y: cb.y,
      width: cb.w,
      height: cb.h,
      shapeType: 'rectangle',
      color: '#0891b2',
      description: cb.desc
    });
  });

  // 5. Grand Line Sections
  territories.push({
    id: 'op-grandline-paradise',
    name: 'Paradise (Grand Line 1)',
    type: 'meer',
    parentId: rootId,
    x: 742.5,
    y: 500,
    width: 455,
    height: 160,
    shapeType: 'rectangle',
    color: '#2563eb',
    description: 'Die erste Hälfte der Grand Line zwischen Reverse Mountain (Zentrum) und Mariejoa (Ost).'
  });

  territories.push({
    id: 'op-grandline-newworld',
    name: 'Neue Welt (Grand Line 2)',
    type: 'meer',
    parentId: rootId,
    x: 242.5,
    y: 500,
    width: 485,
    height: 160,
    shapeType: 'rectangle',
    color: '#1d4ed8',
    description: 'Die zweite, extrem gefährliche Hälfte der Grand Line westlich der zentralen Red Line.'
  });

  // 6. Island Parent / Child nesting maps
  const islandToParentMap: Record<string, string> = {
    // Alabasta sub-locations
    'op-canon-rainbase': 'op-canon-alabasta',
    'op-canon-alubarna': 'op-canon-alabasta',
    'op-canon-elumalu': 'op-canon-alabasta',
    'op-canon-nanohana': 'op-canon-alabasta',
    'op-canon-tamarisk': 'op-canon-alabasta',
    
    // Jaya sub-locations
    'op-canon-mocktown': 'op-canon-jaya',
    
    // Skypiea sub-locations
    'op-canon-upperyard': 'op-canon-skypiea',
    'op-canon-angelisland': 'op-canon-skypiea',
    
    // Water Seven sub-locations
    'op-canon-shiftstation': 'op-canon-water7',
    'op-canon-scrapisland': 'op-canon-water7',
    
    // Dressrosa sub-locations
    'op-canon-greenbit': 'op-canon-dressrosa',
    'op-canon-flowerhill': 'op-canon-dressrosa',
    'op-canon-royalpalace': 'op-canon-dressrosa',
    'op-canon-corridacolosseum': 'op-canon-dressrosa',
    'op-canon-acacia': 'op-canon-dressrosa',
    
    // Wano sub-locations
    'op-canon-onigashima': 'op-canon-wano',
    'op-canon-flower-capital': 'op-canon-wano',
    'op-canon-kuri': 'op-canon-wano',
    'op-canon-udon': 'op-canon-wano',
    'op-canon-kibi': 'op-canon-wano',
    'op-canon-ringo': 'op-canon-wano',
    'op-canon-hakumai': 'op-canon-wano',
    
    // Elbaph sub-locations
    'op-canon-heaven-world': 'op-canon-elbaph',
    'op-canon-sun-world': 'op-canon-elbaph',
    'op-canon-underworld': 'op-canon-elbaph',
  };

  const mapType = (t: string): 'welt' | 'meer' | 'kontinent' | 'insel' | 'region' | 'zone' | 'ort' | 'stadt' | 'gebäude' | 'dorf' | 'hafen' | 'festung' => {
    switch (t.toLowerCase()) {
      case 'stadt': return 'stadt';
      case 'dorf': return 'dorf';
      case 'hafen': return 'hafen';
      case 'burg': return 'festung';
      case 'festung': return 'festung';
      case 'ruine': return 'ort';
      case 'wald': return 'zone';
      case 'region': return 'region';
      case 'insel': default: return 'insel';
    }
  };

  // 7. Process canon islands
  CANON_ISLANDS.forEach(isl => {
    let parentId = rootId;

    // Direct mappings
    if (islandToParentMap[isl.id]) {
      parentId = islandToParentMap[isl.id];
    } else if (isl.id.startsWith('op-canon-totto-')) {
      parentId = 'op-canon-wholecake';
    } else if (isl.name === 'Reverse Mountain') {
      parentId = rootId; // Sits at the center of the world
    } else if (isl.name === 'Heiliges Land Mariejoa' || isl.name === 'Fischmenschen-Insel' || isl.name === 'Mary Geoise') {
      parentId = 'op-redline-east';
    } else {
      // Coordinate-based quadrant classification
      const cx = isl.cx;
      const cy = isl.cy;

      if (cy >= 45 && cy <= 55) {
        if (cx <= 48.5) {
          parentId = 'op-grandline-newworld';
        } else if (cx >= 51.5) {
          parentId = 'op-grandline-paradise';
        }
      } else if (cy >= 41 && cy <= 45) {
        if (cx <= 48.5) {
          parentId = 'op-calmbelt-nw';
        } else if (cx >= 51.5) {
          parentId = 'op-calmbelt-ne';
        }
      } else if (cy >= 55 && cy <= 59) {
        if (cx <= 48.5) {
          parentId = 'op-calmbelt-sw';
        } else if (cx >= 51.5) {
          parentId = 'op-calmbelt-se';
        }
      } else if (cy < 41) {
        if (cx <= 48.5) {
          parentId = 'op-northblue';
        } else if (cx >= 51.5) {
          parentId = 'op-eastblue';
        }
      } else if (cy > 59) {
        if (cx <= 48.5) {
          parentId = 'op-westblue';
        } else if (cx >= 51.5) {
          parentId = 'op-southblue';
        }
      }
    }

    const tType = mapType(isl.type);
    const radius = Math.max(6, isl.r * 10);

    // Coordinate translation: cx, cy are % (0..100). We translate to (0..1000)
    // For Wano, Alabasta, etc., if nested inside their parent island, offset coordinates slightly 
    // or just keep absolute positions so they render correctly on the large 1000x1000 canvas.
    const x = isl.cx * 10;
    const y = isl.cy * 10;

    const points = generateOrganicShape(tType, undefined, isl.name);

    territories.push({
      id: isl.id,
      name: isl.name,
      type: tType,
      description: isl.desc,
      parentId: parentId,
      x: x,
      y: y,
      radius: radius,
      shapeType: 'polygon',
      points: points,
      color: isl.color
    });
  });

  const seen = new Set<string>();
  const uniqueTerritories: Territory[] = [];
  for (const item of territories) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      uniqueTerritories.push(item);
    }
  }
  return uniqueTerritories;
}
