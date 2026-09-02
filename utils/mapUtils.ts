import { WorldSetting } from '../types';

export function normalizeOnePieceWorldGeometry(world: WorldSetting): WorldSetting {
  if (!world) return world;

  const hasOnePieceMarkers = (world.regionMarkers || []).some(m => /red\s*line|calm\s*belt|north\s*blue|east\s*blue|grand\s*line/i.test(m.name || ''));
  if (!world.isOnePiece && !hasOnePieceMarkers) {
    return world;
  }

  const mW = world?.mapConfig?.mapWidth || 100;
  const mH = world?.mapConfig?.mapHeight || 100;

  let regionMarkers = [...(world.regionMarkers || [])];
  let civilizationMarkers = [...(world.civilizationMarkers || [])];
  let placeMarkers = [...(world.placeMarkers || [])];
  let terrains = [...(world.terrains || [])];

  const isRedLine = (item: any) => /red\s*line|rote\s*linie|redline/i.test(item.name || '');
  const isCalmBelt = (item: any) => /calm\s*belt|gürtel/i.test(item.name || '');
  const isBlue = (item: any) => /north\s*blue|east\s*blue|west\s*blue|south\s*blue/i.test(item.name || '');
  const isReverseMtn = (item: any) => /reverse\s*mountain/i.test(item.name || '');
  const isGrandLine = (item: any) => /grand\s*line|paradise|neue\s*welt|new\s*world/i.test(item.name || '');
  const isMariejoa = (item: any) => /mariejoa|fischmensch|fish\s*man|mary\s*geoise/i.test(item.name || '');

  const isStructural = (item: any) => 
    isRedLine(item) || isCalmBelt(item) || isBlue(item) || isReverseMtn(item) || isGrandLine(item) || isMariejoa(item);

  // 1. Remove old/duplicate structural elements so we can replace them with clean scaled geometry
  regionMarkers = regionMarkers.filter(m => !isStructural(m));
  terrains = terrains.filter(t => !isStructural(t));
  civilizationMarkers = civilizationMarkers.filter(c => !isStructural(c));
  placeMarkers = placeMarkers.filter(p => !isStructural(p));

  // Helper to scale coordinates from percentage (0..100) to current map canvas size (mW, mH)
  const scaleItem = (item: any) => {
    let x = item.x ?? (mW / 2);
    let y = item.y ?? (mH / 2);

    // If marker coordinates were recorded in 0..100 percentage scale on a larger canvas (e.g. mW = 300)
    if (mW > 120 && x <= 100) {
      x = (x / 100) * mW;
    }
    if (mH > 120 && y <= 100) {
      y = (y / 100) * mH;
    }

    let minX = item.minX;
    let maxX = item.maxX;
    let minY = item.minY;
    let maxY = item.maxY;

    if (minX !== undefined && mW > 120 && minX <= 100) minX = (minX / 100) * mW;
    if (maxX !== undefined && mW > 120 && maxX <= 100) maxX = (maxX / 100) * mW;
    if (minY !== undefined && mH > 120 && minY <= 100) minY = (minY / 100) * mH;
    if (maxY !== undefined && mH > 120 && maxY <= 100) maxY = (maxY / 100) * mH;

    return {
      ...item,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      minX: minX !== undefined ? Math.round(minX * 10) / 10 : Math.max(0, Math.round((x - mW * 0.05) * 10) / 10),
      maxX: maxX !== undefined ? Math.round(maxX * 10) / 10 : Math.min(mW, Math.round((x + mW * 0.05) * 10) / 10),
      minY: minY !== undefined ? Math.round(minY * 10) / 10 : Math.max(0, Math.round((y - mH * 0.05) * 10) / 10),
      maxY: maxY !== undefined ? Math.round(maxY * 10) / 10 : Math.min(mH, Math.round((y + mH * 0.05) * 10) / 10),
    };
  };

  regionMarkers = regionMarkers.map(scaleItem);
  civilizationMarkers = civilizationMarkers.map(scaleItem);
  placeMarkers = placeMarkers.map(scaleItem);
  terrains = terrains.map(scaleItem);

  // 2. Add TWO Red Lines (Center & Right border)
  // Red Line 1: Center Red Line (through Reverse Mountain in the middle)
  regionMarkers.push({
    type: 'Gebirgspass',
    name: 'Red Line (Zentrum)',
    description: 'Gigantische rote Kontinentalwand im Zentrum der Welt. Sie erstreckt sich vertikal vom Nordpol bis zum Südpol und wird bei Reverse Mountain gekreuzt.',
    x: Math.round(mW * 0.50),
    y: Math.round(mH * 0.50),
    minX: Math.round(mW * 0.485),
    maxX: Math.round(mW * 0.515),
    minY: 0,
    maxY: mH,
    color: '#991b1b',
    adjacentZones: 'Reverse Mountain, North Blue, East Blue, West Blue, South Blue, Calm Belt',
    hazardLevel: 'Mittel'
  });

  // Red Line 2: East/Right Red Line (Mariejoa & Fischmenschen-Insel at opposite side of globe)
  regionMarkers.push({
    type: 'Gebirgspass',
    name: 'Red Line (Ost / Mariejoa)',
    description: 'Die zweite Kreuzung der Red Line auf der östlichen Kante der Weltkarte. Standort des Heiligen Landes Mariejoa und der Fischmenschen-Insel.',
    x: Math.round(mW * 0.985),
    y: Math.round(mH * 0.50),
    minX: Math.round(mW * 0.97),
    maxX: Math.round(mW * 1.0),
    minY: 0,
    maxY: mH,
    color: '#7f1d1d',
    adjacentZones: 'Mariejoa, Fischmenschen-Insel, East Blue, South Blue, Paradise',
    hazardLevel: 'Hoch'
  });

  // 3. Add Horizontal Calm Belt Sections split for each of the 4 Blues
  regionMarkers.push({
    type: 'Gürtel',
    name: 'Calm Belt Nord-West (North Blue)',
    description: 'Windstille Meereszone nördlich der Neuen Welt und südlich des North Blue, voller gigantischer Seekönige.',
    x: Math.round(mW * 0.24),
    y: Math.round(mH * 0.43),
    minX: 0,
    maxX: Math.round(mW * 0.485),
    minY: Math.round(mH * 0.41),
    maxY: Math.round(mH * 0.45),
    color: '#0891b2',
    adjacentZones: 'North Blue, Neue Welt, Reverse Mountain',
    hazardLevel: 'Hoch'
  });

  regionMarkers.push({
    type: 'Gürtel',
    name: 'Calm Belt Nord-Ost (East Blue)',
    description: 'Windstille Meereszone nördlich von Paradise und südlich des East Blue, voller gigantischer Seekönige.',
    x: Math.round(mW * 0.742),
    y: Math.round(mH * 0.43),
    minX: Math.round(mW * 0.515),
    maxX: Math.round(mW * 0.97),
    minY: Math.round(mH * 0.41),
    maxY: Math.round(mH * 0.45),
    color: '#0891b2',
    adjacentZones: 'East Blue, Paradise, Mariejoa',
    hazardLevel: 'Hoch'
  });

  regionMarkers.push({
    type: 'Gürtel',
    name: 'Calm Belt Süd-West (West Blue)',
    description: 'Windstille Meereszone südlich der Neuen Welt und nördlich des West Blue, voller gigantischer Seekönige.',
    x: Math.round(mW * 0.24),
    y: Math.round(mH * 0.57),
    minX: 0,
    maxX: Math.round(mW * 0.485),
    minY: Math.round(mH * 0.55),
    maxY: Math.round(mH * 0.59),
    color: '#0891b2',
    adjacentZones: 'West Blue, Neue Welt, Reverse Mountain',
    hazardLevel: 'Hoch'
  });

  regionMarkers.push({
    type: 'Gürtel',
    name: 'Calm Belt Süd-Ost (South Blue)',
    description: 'Windstille Meereszone südlich von Paradise und nördlich des South Blue, voller gigantischer Seekönige.',
    x: Math.round(mW * 0.742),
    y: Math.round(mH * 0.57),
    minX: Math.round(mW * 0.515),
    maxX: Math.round(mW * 0.97),
    minY: Math.round(mH * 0.55),
    maxY: Math.round(mH * 0.59),
    color: '#0891b2',
    adjacentZones: 'South Blue, Paradise, Mariejoa',
    hazardLevel: 'Hoch'
  });

  // 4. Add Grand Line Sectors (Paradise & New World)
  regionMarkers.push({
    type: 'Ozean',
    name: 'Paradise (Grand Line 1)',
    description: 'Die erste Hälfte der Grand Line zwischen Reverse Mountain (Zentrum) und Mariejoa (Ost).',
    x: Math.round(mW * 0.742),
    y: Math.round(mH * 0.50),
    minX: Math.round(mW * 0.515),
    maxX: Math.round(mW * 0.97),
    minY: Math.round(mH * 0.45),
    maxY: Math.round(mH * 0.55),
    color: '#2563eb',
    adjacentZones: 'Reverse Mountain, Mariejoa, Calm Belt Nord, Calm Belt Süd',
    hazardLevel: 'Hoch'
  });

  regionMarkers.push({
    type: 'Ozean',
    name: 'Neue Welt (Grand Line 2)',
    description: 'Die zweite, extrem gefährliche Hälfte der Grand Line westlich der zentralen Red Line.',
    x: Math.round(mW * 0.24),
    y: Math.round(mH * 0.50),
    minX: 0,
    maxX: Math.round(mW * 0.485),
    minY: Math.round(mH * 0.45),
    maxY: Math.round(mH * 0.55),
    color: '#1d4ed8',
    adjacentZones: 'Red Line, Calm Belt Nord, Calm Belt Süd',
    hazardLevel: 'Extrem'
  });

  // 5. Add 4 Ocean Blues tiling the 4 quadrants of the map canvas (0..mW, 0..mH)
  regionMarkers.push({
    type: 'Ozean',
    name: 'North Blue',
    description: 'Nördlicher Ozean im Nordwesten der Welt.',
    x: Math.round(mW * 0.24),
    y: Math.round(mH * 0.20),
    minX: 0,
    maxX: Math.round(mW * 0.485),
    minY: 0,
    maxY: Math.round(mH * 0.41),
    color: '#0ea5e9',
    adjacentZones: 'Red Line (Zentrum), Calm Belt Nord',
    hazardLevel: 'Gering'
  });

  regionMarkers.push({
    type: 'Ozean',
    name: 'East Blue',
    description: 'Östlicher Ozean im Nordosten der Welt (zwischen Red Line Zentrum und Red Line Ost).',
    x: Math.round(mW * 0.742),
    y: Math.round(mH * 0.20),
    minX: Math.round(mW * 0.515),
    maxX: Math.round(mW * 0.97),
    minY: 0,
    maxY: Math.round(mH * 0.41),
    color: '#0284c7',
    adjacentZones: 'Red Line (Zentrum), Red Line (Ost), Calm Belt Nord',
    hazardLevel: 'Gering'
  });

  regionMarkers.push({
    type: 'Ozean',
    name: 'West Blue',
    description: 'Westlicher Ozean im Südwesten der Welt.',
    x: Math.round(mW * 0.235),
    y: Math.round(mH * 0.80),
    minX: 0,
    maxX: Math.round(mW * 0.47),
    minY: Math.round(mH * 0.59),
    maxY: mH,
    color: '#0ea5e9',
    adjacentZones: 'Red Line (Zentrum), Calm Belt Süd',
    hazardLevel: 'Gering'
  });

  regionMarkers.push({
    type: 'Ozean',
    name: 'South Blue',
    description: 'Südlicher Ozean im Südosten der Welt (zwischen Red Line Zentrum und Red Line Ost).',
    x: Math.round(mW * 0.725),
    y: Math.round(mH * 0.80),
    minX: Math.round(mW * 0.53),
    maxX: Math.round(mW * 0.92),
    minY: Math.round(mH * 0.59),
    maxY: mH,
    color: '#0369a1',
    adjacentZones: 'Red Line (Zentrum), Red Line (Ost), Calm Belt Süd',
    hazardLevel: 'Gering'
  });

  // 6. Iconic Landmarks
  placeMarkers.push({
    type: 'Insel',
    name: 'Reverse Mountain',
    description: 'Der winterliche Berg an der zentralen Kreuzung der Red Line, Eingang zur Grand Line.',
    x: Math.round(mW * 0.50),
    y: Math.round(mH * 0.50),
    minX: Math.round(mW * 0.47),
    maxX: Math.round(mW * 0.53),
    minY: Math.round(mH * 0.46),
    maxY: Math.round(mH * 0.54),
    color: '#cbd5e1',
    adjacentZones: 'Red Line, Paradise, Neue Welt'
  });

  placeMarkers.push({
    type: 'Stadt',
    name: 'Heiliges Land Mariejoa',
    description: 'Die majestätische Hauptstadt der Weltregierung. Sie liegt auf der Spitze der unpassierbaren Red Line (10.000 Meter über dem Meeresspiegel).',
    x: Math.round(mW * 0.95),
    y: Math.round(mH * 0.47),
    minX: Math.round(mW * 0.92),
    maxX: Math.round(mW * 0.98),
    minY: Math.round(mH * 0.44),
    maxY: Math.round(mH * 0.49),
    color: '#b91c1c',
    adjacentZones: 'Red Line (Ost), Paradise, Fischmenschen-Insel'
  });

  placeMarkers.push({
    type: 'Stadt',
    name: 'Fischmenschen-Insel',
    description: 'Die leuchtende Tiefsee-Metropole der Fischmenschen und Meerjungfrauen. Sie liegt in einer gigantischen Doppelblase genau 10.000 Meter tief direkt unter Mariejoa am Meeresboden.',
    x: Math.round(mW * 0.95),
    y: Math.round(mH * 0.53),
    minX: Math.round(mW * 0.92),
    maxX: Math.round(mW * 0.98),
    minY: Math.round(mH * 0.51),
    maxY: Math.round(mH * 0.56),
    color: '#06b6d4',
    adjacentZones: 'Red Line (Ost), Mariejoa, Neue Welt'
  });

  // 6b. Canon One Piece Island List & Dynamic Geometry Injection
  const canonIslands = [
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
    { id: 'op-canon-vodka', name: 'Vodka-Königreich (Vodk Wolf)', cx: 26, cy: 8, r: 1.5, color: '#94a3b8', desc: 'Heimat des jungen Kaido, ein militarisches Königreich im North Blue.', type: 'Stadt' },
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
    { id: 'op-canon-kinko', name: 'Kinko', cx: 22, cy: 39, r: 1.1, color: '#d97706', desc: 'Eine winzige Insel nah am Calm Belt.', type: 'Insel' },
    { id: 'op-canon-100-island', name: '100% Island', cx: 26, cy: 39, r: 1.3, color: '#2563eb', desc: 'Ebenfalls nahe des Calm Belt.', type: 'Insel' },

    // --- WEST BLUE ---
    { id: 'op-canon-ohara', name: 'Ohara', cx: 23, cy: 70, r: 2.1, color: '#15803d', desc: 'Archäologen-Zentrum der Welt mit dem Baum des Wissens. Durch den Buster Call vernichtet.', type: 'Ruine' },
    { id: 'op-canon-kano', name: 'Kano Land', cx: 35, cy: 80, r: 2.4, color: '#047857', desc: 'Heimat der Happo Marine von Don Chinjao.', type: 'Stadt' },
    { id: 'op-canon-godvalley', name: 'God Valley', cx: 28, cy: 78, r: 1.9, color: '#451a03', desc: 'Legendäre, von der Weltkarte getilgte Insel des historischen Vorfalls.', type: 'Ruine' },
    { id: 'op-canon-yukiryu', name: 'Yukiryu-Insel', cx: 15, cy: 59, r: 1.2, color: '#e2e8f0', desc: 'Eine winterliche Insel nahe dem Calm Belt.', type: 'Insel' },
    { id: 'op-canon-baltigo', name: 'Baltigo', cx: 25, cy: 59, r: 1.5, color: '#fcd34d', desc: 'Die Insel der weißen Erde, geheimes Hauptquartier der Revolutionsarmee.', type: 'Insel' },
    { id: 'op-canon-jambalaya', name: 'Jambalaya-Königreich', cx: 12, cy: 64, r: 1.4, color: '#b45309', desc: 'Ein Königreich im West Blue.', type: 'Stadt' },
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
    { id: 'op-canon-sb-roshwan', name: 'Roshwan-Königreich (SB)', cx: 78, cy: 73, r: 1.7, color: '#059669', desc: 'Ein wohlhabendes, zentral gelegenes Königreich.', type: 'Stadt' },
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

  // Pre-calculate existing positions for canon islands so they don't jump back when moved!
  const existingPlaceMap = new Map();
  (world.placeMarkers || []).forEach(p => {
    if (p.name) existingPlaceMap.set(p.name, p);
  });
  
  const existingBorderMap = new Map();
  (world.borders || []).forEach(b => {
    if (b.id) existingBorderMap.set(b.id, b);
  });

  // Filter previous canon landmarks and borders to prevent duplicates
  const canonNames = new Set(canonIslands.map(ci => ci.name));
  placeMarkers = placeMarkers.filter(p => !canonNames.has(p.name));
  let borders = [...(world.borders || [])].filter(b => !b.id?.startsWith('op-canon-'));

  const islandScale = world.mapConfig?.islandScale ?? 0.55;

  // Inject canon island list into physical borders AND directory placeMarkers
  canonIslands.forEach(isl => {
    const existingP = existingPlaceMap.get(isl.name);
    const existingB = existingBorderMap.get(isl.id);

    let scaleX = (isl.cx / 100) * mW;
    let scaleY = (isl.cy / 100) * mH;
    if (existingP && typeof existingP.x === 'number' && typeof existingP.y === 'number') {
      scaleX = existingP.x;
      scaleY = existingP.y;
    } else if (existingB && typeof existingB.cx === 'number' && typeof existingB.cy === 'number') {
      scaleX = existingB.cx;
      scaleY = existingB.cy;
    }
    
    const adjustedRadius = isl.r * islandScale;
    const scaleR = (adjustedRadius / 100) * Math.min(mW, mH);
    
    let finalBorder;
    if (existingB && existingB.points && existingB.points.length > 0) {
      const curCX = existingB.points.reduce((acc: number, p: any) => acc + (p.x || 0), 0) / existingB.points.length;
      const curCY = existingB.points.reduce((acc: number, p: any) => acc + (p.y || 0), 0) / existingB.points.length;
      const dx = scaleX - curCX;
      const dy = scaleY - curCY;

      const shiftedPoints = (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001)
        ? existingB.points.map((pt: any) => ({
            x: Math.round(((pt.x || 0) + dx) * 100) / 100,
            y: Math.round(((pt.y || 0) + dy) * 100) / 100
          }))
        : existingB.points;

      finalBorder = { ...existingB, points: shiftedPoints, cx: scaleX, cy: scaleY, radius: scaleR };
    } else {
      const shapePoints = generateOrganicShape(isl.type, undefined, isl.name, isl.id);
      const points = shapePoints.map(p => ({
        x: Math.round(Math.max(0, Math.min(mW, scaleX + p.x * scaleR)) * 100) / 100,
        y: Math.round(Math.max(0, Math.min(mH, scaleY + p.y * scaleR)) * 100) / 100
      }));
      finalBorder = {
        id: isl.id,
        name: isl.name,
        points: points,
        color: isl.color,
        isLandmass: true,
        cx: scaleX,
        cy: scaleY,
        radius: scaleR
      };
    }
    borders.push(finalBorder);

    let customShape = existingP?.customShape;
    if (customShape && Array.isArray(customShape) && customShape.length > 0) {
      const curCX = customShape.reduce((acc: number, p: any) => acc + (p.x || 0), 0) / customShape.length;
      const curCY = customShape.reduce((acc: number, p: any) => acc + (p.y || 0), 0) / customShape.length;
      const dx = scaleX - curCX;
      const dy = scaleY - curCY;
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        customShape = customShape.map((p: any) => ({
          x: Math.round(((p.x || 0) + dx) * 100) / 100,
          y: Math.round(((p.y || 0) + dy) * 100) / 100
        }));
      }
    } else {
      customShape = finalBorder.points;
    }

    placeMarkers.push({
      id: isl.id,
      type: isl.type,
      name: isl.name,
      description: existingP?.description || isl.desc,
      x: Math.round(scaleX * 10) / 10,
      y: Math.round(scaleY * 10) / 10,
      minX: Math.round((scaleX - scaleR) * 10) / 10,
      maxX: Math.round((scaleX + scaleR) * 10) / 10,
      minY: Math.round((scaleY - scaleR) * 10) / 10,
      maxY: Math.round((scaleY + scaleR) * 10) / 10,
      color: isl.color,
      customShape: customShape,
      adjacentZones: existingP?.adjacentZones || (isl.cx < 47 ? (isl.cy < 41 ? 'North Blue' : 'West Blue') : (isl.cy < 41 ? 'East Blue' : 'South Blue'))
    });
  });

  // 7. Filter improper diagonal connection beams between major structural sectors
  const connections = (world.connections || []).filter(c => {
    const from = c.fromPlace || c.fromId || '';
    const to = c.toPlace || c.toId || '';
    if (isStructural({ name: from }) && isStructural({ name: to })) return false;
    return true;
  });

  return {
    ...world,
    regionMarkers,
    civilizationMarkers,
    placeMarkers,
    terrains,
    borders,
    connections
  };
}

// Deterministic helper to generate rugged closed polygon points for beautiful landmasses
export function generateRuggedCirclePoints(cx: number, cy: number, r: number, numPoints: number = 14, seedStr: string = '', mW: number = 100, mH: number = 100): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const hash = seedStr ? seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 10000);
  
  // Scale percentages to absolute map coordinates
  const scaleCX = (cx / 100) * mW;
  const scaleCY = (cy / 100) * mH;
  const scaleR = (r / 100) * Math.min(mW, mH);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const noise = Math.sin(angle * 3 + hash) * 0.18 + Math.cos(angle * 5 - hash) * 0.09 + Math.sin(angle * 7) * 0.05;
    const currentR = Math.max(0.5, scaleR * (1 + noise));
    
    const px = Math.max(0, Math.min(mW, scaleCX + Math.cos(angle) * currentR));
    const py = Math.max(0, Math.min(mH, scaleCY + Math.sin(angle) * currentR));
    points.push({ x: Math.round(px * 100) / 100, y: Math.round(py * 100) / 100 });
  }
  return points;
}

export function generateContinentPolygonPoints(cx: number, cy: number, r: number, numPoints: number = 20, seedStr: string = '', mW: number = 100, mH: number = 100): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const hash = seedStr ? seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 10000);
  
  const scaleCX = (cx / 100) * mW;
  const scaleCY = (cy / 100) * mH;
  const scaleR = (r / 100) * Math.min(mW, mH);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const noise = Math.sin(angle * 2 + hash) * 0.28 + Math.cos(angle * 4 - hash) * 0.15 + Math.sin(angle * 6 + hash * 0.5) * 0.08;
    const currentR = Math.max(1, scaleR * (1 + noise));
    
    const px = Math.max(0, Math.min(mW, scaleCX + Math.cos(angle) * currentR));
    const py = Math.max(0, Math.min(mH, scaleCY + Math.sin(angle) * currentR));
    points.push({ x: Math.round(px * 100) / 100, y: Math.round(py * 100) / 100 });
  }
  return points;
}

export function generateOrganicFractalNoisePoints(points: { x: number; y: number }[], intensity: number = 0.15): { x: number; y: number }[] {
  if (!points || points.length === 0) return points;
  const cx = points.reduce((acc, p) => acc + p.x, 0) / points.length;
  const cy = points.reduce((acc, p) => acc + p.y, 0) / points.length;

  return points.map((p, i) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const angle = Math.atan2(dy, dx);
    const rndNoise = (Math.sin(i * 3.7 + Date.now() * 0.001) + Math.cos(i * 5.3 + (i % 3))) * 0.5;
    const newDist = Math.max(0.5, dist * (1 + rndNoise * intensity));
    return {
      x: Math.round((cx + Math.cos(angle) * newDist) * 100) / 100,
      y: Math.round((cy + Math.sin(angle) * newDist) * 100) / 100
    };
  });
}

export function subdividePolygonPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (!points || points.length < 2) return points;
  const newPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    newPoints.push(p1);
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    newPoints.push({ x: Math.round(mx * 100) / 100, y: Math.round(my * 100) / 100 });
  }
  return newPoints;
}

export function smoothPolygonPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (!points || points.length < 3) return points;
  return points.map((p, i) => {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    return {
      x: Math.round((prev.x * 0.25 + p.x * 0.5 + next.x * 0.25) * 100) / 100,
      y: Math.round((prev.y * 0.25 + p.y * 0.5 + next.y * 0.25) * 100) / 100
    };
  });
}

export function scalePolygonPoints(points: { x: number; y: number }[], scaleX: number, scaleY: number, originX?: number, originY?: number): { x: number; y: number }[] {
  if (!points || points.length === 0) return points;
  const cx = originX ?? (points.reduce((acc, p) => acc + p.x, 0) / points.length);
  const cy = originY ?? (points.reduce((acc, p) => acc + p.y, 0) / points.length);

  return points.map(p => ({
    x: Math.round((cx + (p.x - cx) * scaleX) * 100) / 100,
    y: Math.round((cy + (p.y - cy) * scaleY) * 100) / 100
  }));
}

// Organic template library with multiple unique organic templates (base forms) per category
const ORGANIC_TEMPLATES: Record<string, { x: number; y: number }[][]> = {
  insel: [
    // Island 1: Jagged Oval Island
    [
      { x: 0, y: -25 }, { x: 15, y: -22 }, { x: 26, y: -10 }, { x: 22, y: 12 },
      { x: 10, y: 26 }, { x: -8, y: 24 }, { x: -22, y: 12 }, { x: -25, y: -8 },
      { x: -15, y: -22 }
    ],
    // Island 2: Crescent / Lagoon Island
    [
      { x: -5, y: -28 }, { x: 14, y: -20 }, { x: 25, y: -2 }, { x: 20, y: 18 },
      { x: 4, y: 12 }, { x: -10, y: 6 }, { x: -20, y: -6 }, { x: -18, y: -22 }
    ],
    // Island 3: Irregular Clover / Three-lobed Island
    [
      { x: 0, y: -26 }, { x: 12, y: -12 }, { x: 26, y: -22 }, { x: 20, y: 4 },
      { x: 28, y: 20 }, { x: 8, y: 16 }, { x: -4, y: 28 }, { x: -12, y: 12 },
      { x: -28, y: 8 }, { x: -16, y: -12 }
    ],
    // Island 4: Ring Atoll with Caldera Bay
    [
      { x: 0, y: -28 }, { x: 20, y: -20 }, { x: 28, y: 0 }, { x: 22, y: 20 },
      { x: 5, y: 26 }, { x: -8, y: 12 }, { x: 0, y: 2 }, { x: -12, y: -5 },
      { x: -24, y: 14 }, { x: -28, y: -6 }, { x: -18, y: -24 }
    ],
    // Island 5: Twin Cape / Archipelago bridge
    [
      { x: -22, y: -24 }, { x: -6, y: -14 }, { x: 18, y: -26 }, { x: 28, y: -10 },
      { x: 18, y: 6 }, { x: 4, y: -2 }, { x: 8, y: 22 }, { x: -14, y: 24 },
      { x: -26, y: 6 }
    ],
    // Island 6: Fjord / Sinuous Coastal Island
    [
      { x: -12, y: -30 }, { x: 10, y: -24 }, { x: 6, y: -10 }, { x: 26, y: -4 },
      { x: 14, y: 14 }, { x: 22, y: 28 }, { x: -4, y: 22 }, { x: -18, y: 28 },
      { x: -24, y: 8 }, { x: -12, y: 0 }, { x: -28, y: -14 }
    ]
  ],
  kontinent: [
    // Continent 1: Massive rugged shape with gulfs & peninsulas
    [
      { x: -10, y: -35 }, { x: 20, y: -32 }, { x: 36, y: -12 }, { x: 24, y: 4 },
      { x: 40, y: 24 }, { x: 12, y: 36 }, { x: -12, y: 28 }, { x: -24, y: 40 },
      { x: -36, y: 8 }, { x: -24, y: -20 }
    ],
    // Continent 2: Elongated continent
    [
      { x: -28, y: -20 }, { x: 0, y: -28 }, { x: 28, y: -20 }, { x: 36, y: 0 },
      { x: 24, y: 20 }, { x: 0, y: 28 }, { x: -28, y: 20 }, { x: -36, y: 0 }
    ],
    // Continent 3: C-shaped major landmass with inland sea
    [
      { x: 0, y: -32 }, { x: 24, y: -24 }, { x: 32, y: 0 }, { x: 16, y: 20 },
      { x: -8, y: 8 }, { x: 8, y: -8 }, { x: -16, y: -12 }, { x: -28, y: 12 },
      { x: -36, y: -8 }, { x: -24, y: -28 }
    ],
    // Continent 4: Sprawling sub-continent with multiple sound capes
    [
      { x: -18, y: -32 }, { x: 6, y: -34 }, { x: 28, y: -22 }, { x: 34, y: 4 },
      { x: 18, y: 14 }, { x: 32, y: 32 }, { x: 4, y: 36 }, { x: -16, y: 18 },
      { x: -34, y: 26 }, { x: -32, y: -6 }, { x: -16, y: -14 }
    ]
  ],
  meer: [
    // Sea Basin 1: Circular natural sea
    [
      { x: 0, y: -32 }, { x: 22, y: -22 }, { x: 30, y: 0 }, { x: 22, y: 22 },
      { x: 0, y: 32 }, { x: -22, y: 22 }, { x: -30, y: 0 }, { x: -22, y: -22 }
    ],
    // Sea Basin 2: Long strait/channel
    [
      { x: -36, y: -12 }, { x: 36, y: -8 }, { x: 32, y: 12 }, { x: -36, y: 8 }
    ],
    // Sea Basin 3: Amorphous bay
    [
      { x: -15, y: -30 }, { x: 20, y: -25 }, { x: 30, y: 0 }, { x: 15, y: 25 },
      { x: -20, y: 20 }, { x: -30, y: -5 }
    ]
  ],
  region: [
    // Region 1: Irregular political territory
    [
      { x: -5, y: -28 }, { x: 28, y: -24 }, { x: 24, y: 8 }, { x: 32, y: 28 },
      { x: 4, y: 32 }, { x: -28, y: 16 }, { x: -20, y: -16 }
    ],
    // Region 2: Hexagonal-like rugged province
    [
      { x: 0, y: -28 }, { x: 24, y: -14 }, { x: 24, y: 14 }, { x: 0, y: 28 },
      { x: -24, y: 14 }, { x: -24, y: -14 }
    ],
    // Region 3: Coastal bay and curved natural province
    [
      { x: -10, y: -28 }, { x: 18, y: -22 }, { x: 26, y: -4 }, { x: 28, y: 18 },
      { x: 12, y: 28 }, { x: -16, y: 26 }, { x: -28, y: 6 }, { x: -24, y: -16 }
    ],
    // Region 4: River basin boundary
    [
      { x: -22, y: -24 }, { x: 4, y: -30 }, { x: 26, y: -18 }, { x: 30, y: 6 },
      { x: 16, y: 24 }, { x: -10, y: 28 }, { x: -30, y: 10 }
    ]
  ],
  gebirge: [
    // Mountains 1: Elongated jagged mountain range
    [
      { x: -36, y: -4 }, { x: -12, y: -12 }, { x: 12, y: -6 }, { x: 36, y: -10 },
      { x: 24, y: 10 }, { x: 0, y: 6 }, { x: -20, y: 12 }
    ],
    // Mountains 2: Jagged volcanic group
    [
      { x: 0, y: -24 }, { x: 10, y: -22 }, { x: 6, y: -8 }, { x: 22, y: -4 },
      { x: 8, y: 8 }, { x: 4, y: 22 }, { x: -10, y: 8 }, { x: -22, y: 4 },
      { x: -8, y: -8 }
    ],
    // Mountains 3: Triangular ridge
    [
      { x: 0, y: -28 }, { x: 15, y: 10 }, { x: 8, y: 12 }, { x: -8, y: 12 },
      { x: -15, y: 10 }
    ],
    // Mountains 4: Sharp alpine massif
    [
      { x: -28, y: -16 }, { x: -10, y: -28 }, { x: 8, y: -22 }, { x: 30, y: -14 },
      { x: 22, y: 8 }, { x: 6, y: 24 }, { x: -12, y: 16 }, { x: -26, y: 4 }
    ]
  ],
  wald: [
    // Forest 1: Puffy lobed cloud forest
    [
      { x: 0, y: -28 }, { x: 12, y: -25 }, { x: 20, y: -16 }, { x: 28, y: -4 },
      { x: 24, y: 12 }, { x: 16, y: 24 }, { x: 0, y: 28 }, { x: -16, y: 24 },
      { x: -25, y: 12 }, { x: -28, y: -4 }, { x: -20, y: -18 }
    ],
    // Forest 2: Spidery spread forest clearing
    [
      { x: -4, y: -30 }, { x: 6, y: -12 }, { x: 28, y: -16 }, { x: 14, y: 4 },
      { x: 25, y: 22 }, { x: 0, y: 12 }, { x: -20, y: 25 }, { x: -12, y: 4 },
      { x: -30, y: -8 }, { x: -10, y: -14 }
    ],
    // Forest 3: Ring/clumpy forest patch
    [
      { x: -15, y: -20 }, { x: 0, y: -25 }, { x: 15, y: -20 }, { x: 22, y: -5 },
      { x: 15, y: 15 }, { x: 0, y: 22 }, { x: -15, y: 15 }, { x: -22, y: -5 }
    ]
  ],
  fluss: [
    // River 1: Winding stream path (closed ribbon)
    [
      { x: -36, y: -4 }, { x: -12, y: 12 }, { x: 12, y: -12 }, { x: 36, y: 4 },
      { x: 36, y: 10 }, { x: 12, y: -4 }, { x: -12, y: 20 }, { x: -36, y: 4 }
    ],
    // River 2: Branched delta river ribbon
    [
      { x: -36, y: -12 }, { x: -12, y: -4 }, { x: 12, y: -8 }, { x: 36, y: -20 },
      { x: 33, y: -14 }, { x: 16, y: -4 }, { x: 36, y: 12 }, { x: 30, y: 18 },
      { x: 10, y: 2 }, { x: -12, y: 6 }, { x: -36, y: -4 }
    ],
    // River 3: S-Curve river bed
    [
      { x: -30, y: -25 }, { x: -10, y: -20 }, { x: 10, y: 5 }, { x: 30, y: 10 },
      { x: 28, y: 16 }, { x: 8, y: 11 }, { x: -12, y: -14 }, { x: -32, y: -19 }
    ]
  ],
  stadt: [
    // Town 1: Small irregular pentagonal town wall outline
    [
      { x: 0, y: -15 }, { x: 14, y: -6 }, { x: 9, y: 11 }, { x: -9, y: 11 },
      { x: -14, y: -6 }
    ],
    // Town 2: Double-ring cluster layout
    [
      { x: -5, y: -12 }, { x: 8, y: -10 }, { x: 12, y: 2 }, { x: 5, y: 12 },
      { x: -8, y: 10 }, { x: -12, y: -2 }
    ],
    // Town 3: Harbor port with sea breakwater
    [
      { x: -16, y: -12 }, { x: 6, y: -16 }, { x: 18, y: -6 }, { x: 14, y: 10 },
      { x: -4, y: 14 }, { x: -16, y: 4 }
    ]
  ]
};

/**
 * Generates a procedurally randomized, deformed, and subdivided organic shape points array.
 * Centered precisely at (0, 0) and fully normalized to an average radius of exactly 1.
 */
function createSeededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return function() {
    hash = (hash + 0x6D2B79F5) | 0;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateOrganicShape(type: string, terrain?: string, name?: string, seedKey?: string): { x: number; y: number }[] {
  const tLower = (type || '').toLowerCase();
  const terrLower = (terrain || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  const seedString = seedKey || `${nameLower}-${tLower}-${terrLower}`;
  const rand = createSeededRandom(seedString);

  let selectedGroup = ORGANIC_TEMPLATES.insel;

  // 1. Select template group based on type/terrain/name context
  if (tLower.includes('gebirge') || tLower.includes('vulkan') || terrLower.includes('gebirge') || terrLower.includes('berg') || terrLower.includes('mountain') || nameLower.includes('gebirge') || nameLower.includes('berg') || nameLower.includes('mountain')) {
    selectedGroup = ORGANIC_TEMPLATES.gebirge;
  } else if (tLower.includes('wald') || terrLower.includes('wald') || terrLower.includes('forest') || terrLower.includes('dschungel') || nameLower.includes('wald') || nameLower.includes('forest') || nameLower.includes('dschungel')) {
    selectedGroup = ORGANIC_TEMPLATES.wald;
  } else if (tLower === 'fluss' || terrLower.includes('fluss') || terrLower.includes('river') || nameLower.includes('fluss') || nameLower.includes('river') || nameLower.includes('strom')) {
    selectedGroup = ORGANIC_TEMPLATES.fluss;
  } else if (tLower === 'bucht' || tLower === 'see' || tLower === 'lagune') {
    selectedGroup = ORGANIC_TEMPLATES.insel; // Smooth lagoon/bay curve
  } else if (tLower === 'meer' || tLower === 'ozean') {
    selectedGroup = ORGANIC_TEMPLATES.meer;
  } else if (tLower === 'kontinent') {
    selectedGroup = ORGANIC_TEMPLATES.kontinent;
  } else if (tLower === 'region') {
    selectedGroup = ORGANIC_TEMPLATES.region;
  } else if (tLower === 'stadt' || tLower === 'dorf' || tLower === 'hafen' || tLower === 'festung' || tLower === 'ort' || tLower === 'gebäude') {
    selectedGroup = ORGANIC_TEMPLATES.stadt;
  } else if (tLower === 'zone') {
    selectedGroup = rand() > 0.5 ? ORGANIC_TEMPLATES.wald : ORGANIC_TEMPLATES.gebirge;
  } else {
    selectedGroup = ORGANIC_TEMPLATES.insel;
  }

  // Choose a base template from the selected group
  const rawTemplate = selectedGroup[Math.floor(rand() * selectedGroup.length)];
  let pts = rawTemplate.map(p => ({ ...p }));

  // 2. Rotate by angle [0, 2*PI]
  const angle = rand() * Math.PI * 2;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  pts = pts.map(p => ({
    x: p.x * cosA - p.y * sinA,
    y: p.x * sinA + p.y * cosA
  }));

  // 3. Scale unevenly (independent x and y scaling) to make each generation unique
  const scaleX = 0.75 + rand() * 0.5; // [0.75, 1.25]
  const scaleY = 0.75 + rand() * 0.5; // [0.75, 1.25]
  pts = pts.map(p => ({
    x: p.x * scaleX,
    y: p.y * scaleY
  }));

  // 4. Multi-octave harmonic wave deformation
  const isMountainOrVolcano = tLower.includes('gebirge') || tLower.includes('vulkan') || terrLower.includes('gebirge') || terrLower.includes('vulkan');
  const roughnessMult = isMountainOrVolcano ? 1.4 : 1.0;

  const A1 = (0.08 + rand() * 0.08) * roughnessMult; // low frequency macro amplitude
  const f1 = 2 + Math.floor(rand() * 3); // low frequency (2-4)
  const p1 = rand() * Math.PI * 2;

  const A2 = (0.04 + rand() * 0.04) * roughnessMult; // mid frequency amplitude
  const f2 = 5 + Math.floor(rand() * 4); // mid frequency (5-8)
  const p2 = rand() * Math.PI * 2;

  const A3 = (0.02 + rand() * 0.02) * roughnessMult; // high frequency micro crag amplitude
  const f3 = 9 + Math.floor(rand() * 5); // high frequency (9-13)
  const p3 = rand() * Math.PI * 2;

  pts = pts.map(p => {
    const theta = Math.atan2(p.y, p.x);
    const R = Math.sqrt(p.x * p.x + p.y * p.y);
    if (R === 0) return p;

    const dR = R * (
      A1 * Math.sin(f1 * theta + p1) +
      A2 * Math.sin(f2 * theta + p2) +
      A3 * Math.sin(f3 * theta + p3)
    );
    return {
      x: (R + dR) * Math.cos(theta),
      y: (R + dR) * Math.sin(theta)
    };
  });

  // 5. Fractal Midpoint Subdivision to add natural coastlines & bays
  const subdivided: { x: number; y: number }[] = [];
  const len = pts.length;
  for (let i = 0; i < len; i++) {
    const pCurrent = pts[i];
    const pNext = pts[(i + 1) % len];

    const mx = (pCurrent.x + pNext.x) / 2;
    const my = (pCurrent.y + pNext.y) / 2;

    const dx = pNext.x - pCurrent.x;
    const dy = pNext.y - pCurrent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    subdivided.push(pCurrent);

    if (dist > 2.5) {
      const nx = -dy / (dist || 1);
      const ny = dx / (dist || 1);

      const displaceFactor = (rand() - 0.5) * 0.32 * dist * roughnessMult;

      subdivided.push({
        x: mx + nx * displaceFactor,
        y: my + ny * displaceFactor
      });
    }
  }

  // Apply smoothing pass to ensure coastlines flow naturally without self-intersecting spikes
  let finalPts = smoothPolygonPoints(subdivided);

  // 6. Shift centroid of finalPts back to (0, 0) for perfect anchoring
  const numPoints = finalPts.length;
  const centroidX = finalPts.reduce((acc, p) => acc + p.x, 0) / numPoints;
  const centroidY = finalPts.reduce((acc, p) => acc + p.y, 0) / numPoints;
  finalPts = finalPts.map(p => ({
    x: p.x - centroidX,
    y: p.y - centroidY
  }));

  // 7. Normalize all points so that the average distance from the center is exactly 1.
  const totalDist = finalPts.reduce((acc, p) => acc + Math.sqrt(p.x * p.x + p.y * p.y), 0);
  const avgDist = totalDist / numPoints;
  const normalizationFactor = avgDist || 1;

  return finalPts.map(p => ({
    x: Math.round((p.x / normalizationFactor) * 100) / 100,
    y: Math.round((p.y / normalizationFactor) * 100) / 100
  }));
}

export interface TerritoryDistanceCalculation {
  targetId: string;
  targetName: string;
  targetType: string;
  relationType: 'child' | 'parent' | 'sibling' | 'other';
  directionName: string;
  directionShort: string;
  distanceKm: number;
  travelFoot: string;
  travelHorse: string;
  travelShip?: string;
  formattedSummary: string;
}

export function getCompassDirection(fromX: number, fromY: number, toX: number, toY: number): { name: string; short: string } {
  const dx = toX - fromX;
  const dy = toY - fromY; // y increases downwards on screen
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
    return { name: 'Gleicher Ort', short: 'Zentrum' };
  }
  
  const angleRad = Math.atan2(-dy, dx);
  let angleDeg = (angleRad * (180 / Math.PI) + 360) % 360;

  if (angleDeg >= 337.5 || angleDeg < 22.5) return { name: 'Osten', short: 'Ost' };
  if (angleDeg >= 22.5 && angleDeg < 67.5) return { name: 'Nordost', short: 'Nordost' };
  if (angleDeg >= 67.5 && angleDeg < 112.5) return { name: 'Norden', short: 'Nord' };
  if (angleDeg >= 112.5 && angleDeg < 157.5) return { name: 'Nordwest', short: 'Nordwest' };
  if (angleDeg >= 157.5 && angleDeg < 202.5) return { name: 'Westen', short: 'West' };
  if (angleDeg >= 202.5 && angleDeg < 247.5) return { name: 'Südwest', short: 'Südwest' };
  if (angleDeg >= 247.5 && angleDeg < 292.5) return { name: 'Süden', short: 'Süd' };
  return { name: 'Südost', short: 'Südost' };
}

export function calculateTerritoryDistances(
  fromTerritory: { id?: string; name: string; type?: string; x: number; y: number; parentId?: string | null },
  allTerritories: Array<{ id: string; name: string; type?: string; x: number; y: number; parentId?: string | null }>,
  kmPerCoordinateUnit?: number
): TerritoryDistanceCalculation[] {
  if (!fromTerritory || !allTerritories || allTerritories.length === 0) return [];

  const fromType = (fromTerritory.type || '').toLowerCase();

  // Determine scale (km per coordinate unit) based on global parameter or fallback to 10
  const scaleKmPerUnit = kmPerCoordinateUnit !== undefined && kmPerCoordinateUnit > 0 ? kmPerCoordinateUnit : 10;

  const results: TerritoryDistanceCalculation[] = [];

  allTerritories.forEach(target => {
    // Skip self
    if (target.id === fromTerritory.id || target.name === fromTerritory.name) return;

    // Determine relationship
    let relationType: 'child' | 'parent' | 'sibling' | 'other' = 'other';
    if (fromTerritory.id && target.parentId === fromTerritory.id) {
      relationType = 'child';
    } else if (fromTerritory.parentId && target.id === fromTerritory.parentId) {
      relationType = 'parent';
    } else if (fromTerritory.parentId && target.parentId === fromTerritory.parentId) {
      relationType = 'sibling';
    } else if (!fromTerritory.parentId && !target.parentId) {
      relationType = 'sibling';
    }

    // Only include related territories (children, parent, siblings) or closest locations if few
    const isRelated = relationType === 'child' || relationType === 'parent' || relationType === 'sibling';
    if (!isRelated && allTerritories.length > 15) return; // limit clutter

    const dx = (target.x ?? 50) - (fromTerritory.x ?? 50);
    const dy = (target.y ?? 50) - (fromTerritory.y ?? 50);
    const coordDist = Math.hypot(dx, dy);

    const dir = getCompassDirection(fromTerritory.x ?? 50, fromTerritory.y ?? 50, target.x ?? 50, target.y ?? 50);
    const distanceKm = Math.max(1, Math.round(coordDist * scaleKmPerUnit));

    // Travel Foot
    let travelFoot = '';
    if (distanceKm <= 30) {
      const hours = Math.round((distanceKm / 4.5) * 10) / 10;
      travelFoot = `ca. ${hours} Std. zu Fuß`;
    } else {
      const days = Math.round((distanceKm / 25) * 10) / 10;
      travelFoot = `ca. ${days} Tage zu Fuß`;
    }

    // Travel Horse
    let travelHorse = '';
    if (distanceKm <= 80) {
      const hours = Math.round((distanceKm / 12) * 10) / 10;
      travelHorse = `ca. ${hours} Std. zu Pferd`;
    } else {
      const days = Math.round((distanceKm / 60) * 10) / 10;
      travelHorse = `ca. ${days} Tage zu Pferd`;
    }

    // Travel Ship (if harbour/sea/island involved)
    let travelShip: string | undefined = undefined;
    const isMaritime = ['hafen', 'meer', 'insel', 'küste', 'hafenbucht'].some(m => 
      fromType.includes(m) || (target.type || '').toLowerCase().includes(m)
    );
    if (isMaritime) {
      if (distanceKm <= 150) {
        const hours = Math.round((distanceKm / 15) * 10) / 10;
        travelShip = `ca. ${hours} Std. per Schiff`;
      } else {
        const days = Math.round((distanceKm / 200) * 10) / 10;
        travelShip = `ca. ${days} Tage per Schiff`;
      }
    }

    let summaryText = `${dir.name}: ${target.name} (${distanceKm} km, ${travelFoot} / ${travelHorse})`;
    if (travelShip) {
      summaryText = `${dir.name}: ${target.name} (${distanceKm} km, ${travelShip})`;
    }

    results.push({
      targetId: target.id,
      targetName: target.name,
      targetType: target.type || 'ort',
      relationType,
      directionName: dir.name,
      directionShort: dir.short,
      distanceKm,
      travelFoot,
      travelHorse,
      travelShip,
      formattedSummary: summaryText
    });
  });

  // Sort by distance (closest first)
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDisplayLocationName(locStr: string): string {
  if (!locStr) return 'Unbekannt';

  // 1. Remove grid coordinates like (x: 10, y: 15), [x: 10, y: 15], or (10, 15)
  let clean = locStr
    .replace(/[\(\[]\s*x\s*[:=]?\s*\d+\s*[,;/]?\s*y\s*[:=]?\s*\d+\s*[\)\]]/gi, '')
    .replace(/[\(\[]\s*\d+\s*,\s*\d+\s*[\)\]]/g, '')
    .trim();

  // 2. Breadcrumb hierarchy arrow delimiters: ➔, ->, →, ⇒, >, etc.
  const arrowRegex = /[\u2794\u2192\u21D2➔→⇒>]+|->/g;
  if (arrowRegex.test(clean)) {
    const parts = clean.split(arrowRegex);
    const last = parts[parts.length - 1].trim();
    if (last) clean = last;
  }

  // 3. Path separators like "/"
  if (clean.includes('/') && !clean.startsWith('http')) {
    const parts = clean.split('/');
    const last = parts[parts.length - 1].trim();
    if (last) clean = last;
  }

  clean = clean.trim();

  return clean || locStr.trim() || 'Unbekannt';
}

/**
 * Extracts a numeric km² area from strings such as "ca. 180 km²", "180 km²", "50km2", "1200 qkm"
 */
export function parseKm2FromSizeString(sizeStr?: string): number | null {
  if (!sizeStr) return null;
  const clean = sizeStr.replace(',', '.');
  const match = clean.match(/(\d+(?:\.\d+)?)\s*(?:km²|km2|qkm|kilo)?/i);
  if (match && match[1]) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}



export function normalizeWorldGeometry(world: any) {
  if (!world || !world.territories) return world;
  let changed = false;
  const newTerr = world.territories.map((t: any) => {
    let nx = t.x; let ny = t.y;
    // Fix coordinates that are 0-1000 instead of 0-100
    if (nx > 100 || ny > 100) { nx = nx / 10; ny = ny / 10; changed = true; }
    return { ...t, x: nx, y: ny };
  });
  if (changed) return { ...world, territories: newTerr };
  return world;
}
