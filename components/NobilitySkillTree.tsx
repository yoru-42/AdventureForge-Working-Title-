import React, { useState, useMemo } from 'react';
import { SocialTitleState } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import {
  Crown,
  Shield,
  Award,
  Check,
  X,
  Info,
  Plus,
  Sparkles,
  Search,
  ArrowDownUp,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

export type NobilityCategory = 'Höchster Adel' | 'Hoher Adel' | 'Mittlerer Adel' | 'Niederer Adel';

export interface NobilityTreeNode {
  id: string;
  title: string;
  rankOrder: number;
  category: NobilityCategory;
  salutation: string;
  privileges: string[];
  duties: string;
  description: string;
  isDynastic?: boolean;
}

export const NOBILITY_CATEGORY_META: Record<NobilityCategory, {
  label: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  description: string;
}> = {
  'Höchster Adel': {
    label: 'Höchster Adel',
    badgeClass: 'bg-amber-950/70 border-amber-500/60 text-amber-300',
    borderClass: 'border-amber-500/50',
    textClass: 'text-amber-400',
    description: 'Imperiale Herrscher, gekrönte Häupter und Thronerben'
  },
  'Hoher Adel': {
    label: 'Hoher Adel',
    badgeClass: 'bg-purple-950/70 border-purple-500/60 text-purple-300',
    borderClass: 'border-purple-500/50',
    textClass: 'text-purple-400',
    description: 'Reichswahlfürsten, Herzöge, Landgrafen und dynastische Fürsten'
  },
  'Mittlerer Adel': {
    label: 'Mittlerer Adel',
    badgeClass: 'bg-sky-950/70 border-sky-500/60 text-sky-300',
    borderClass: 'border-sky-500/50',
    textClass: 'text-sky-400',
    description: 'Regierende Grafen, Burggrafen und freie Herren / Barone'
  },
  'Niederer Adel': {
    label: 'Niederer Adel',
    badgeClass: 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-400',
    description: 'Ritterstand, Dienst- und Landadel sowie ratsfähiges Patriziat'
  }
};

export const PRESET_NOBILITY_TREE_NODES: NobilityTreeNode[] = [
  // ---------------------------------------------------------------------------
  // 1. HÖCHSTER ADEL (Souveräne Herrscher & Thronfolger)
  // ---------------------------------------------------------------------------
  {
    id: 'kaiser',
    title: 'Kaiser / Kaiserin',
    rankOrder: 1,
    category: 'Höchster Adel',
    salutation: 'Eure Kaiserliche Majestät',
    privileges: [
      'Reichsführung & imperiale Souveränität',
      'Krönungsprivileg & Standeserhebungen',
      'Oberster Gerichtsherr (Reichskammergericht)',
      'Münz- und Zollregal im Gesamtreich',
      'Erlass reichsweiter Gesetze und Edikte'
    ],
    duties: 'Schutz des Reiches gegen äußere Feinde, Leitung des Reichstages, Wahrung des imperialen Friedens',
    description: 'Höchster weltlicher Herrschertitel eines Großreiches oder Imperiums mit uneingeschränkter Souveränität über untergeordnete Könige und Fürsten.'
  },
  {
    id: 'koenig',
    title: 'König / Königin',
    rankOrder: 2,
    category: 'Höchster Adel',
    salutation: 'Eure Majestät',
    privileges: [
      'Souveräne Landesherrschaft über das Königreich',
      'Lehnsvergabe & Einforderung des Vasalleneids',
      'Reichsunmittelbarkeit & Immunität',
      'Berg-, Salz- und Zollregale',
      'Oberbefehl über das königliche Landesheer'
    ],
    duties: 'Landesverteidigung, Einberufung der Landstände, Schutz der Untertanen und Rechtsprechung',
    description: 'Souveräner Herrscher eines Königreiches mit oberster exekutiver, richterlicher und legislativer Gewalt über Kronland und Lehnsherrschaften.'
  },
  {
    id: 'kronprinz',
    title: 'Kronprinz / Kronprinzessin',
    rankOrder: 2,
    category: 'Höchster Adel',
    isDynastic: true,
    salutation: 'Eure Kaiserliche / Königliche Hoheit',
    privileges: [
      'Direkte vorrangige Thronanwartschaft auf Krone oder Kaisertum',
      'Ständiger Sitz im Staats- und Kronrat',
      'Ehrenoberbefehl über ein königliches Garderegiment',
      'Eigene Apanage und Hofstaat'
    ],
    duties: 'Repräsentationspflichten, Studium der Regierungs- und Kriegskunst, Wahrung der Dynastie',
    description: 'Direkter Thronfolger eines königlichen oder kaiserlichen Herrscherhauses mit protokollarischem Spitzenrang.'
  },
  {
    id: 'grossherzog',
    title: 'Großherzog / Großherzogin',
    rankOrder: 3,
    category: 'Höchster Adel',
    salutation: 'Eure Königliche Hoheit',
    privileges: [
      'Souveräne Landeshoheit über das Großherzogtum',
      'Gesetzgebungsrecht mit königsgleichen Vorrechten',
      'Stimmrecht im hohen Rat der Reichsfürsten',
      'Eigenes Steuer-, Zoll- und Münzrecht'
    ],
    duties: 'Bündnistreue zum Reich oder Staatenbund, Heereskontingent, Fürsorge für das Land',
    description: 'Souveräner Landesfürst mit königsgleichen Ehrenrechten und weitreichender Autonomie über ein historisches Großherzogtum.'
  },

  // ---------------------------------------------------------------------------
  // 2. HOHER ADEL (Reichsfürsten, Territorialherren & Hochdynastien)
  // ---------------------------------------------------------------------------
  {
    id: 'prinz',
    title: 'Prinz / Prinzessin',
    rankOrder: 3,
    category: 'Hoher Adel',
    isDynastic: true,
    salutation: 'Eure Hoheit',
    privileges: [
      'Hohe dynastische Apanage aus Krongütern',
      'Diplomatischer Sonderstatus bei Auslandsgesandtschaften',
      'Ständiger Geleitschutz durch königliche Gardisten'
    ],
    duties: 'Treue zum Hausgesetz, dynastische Allianzen, Repräsentanz bei Hofe',
    description: 'Nachkomme eines regierenden Königs- oder Kaiserhauses mit hohem internationalem diplomatischem Ansehen.'
  },
  {
    id: 'kurfuerst',
    title: 'Kurfürst / Kurfürstin',
    rankOrder: 4,
    category: 'Hoher Adel',
    salutation: 'Eure Kurfürstliche Durchlaucht',
    privileges: [
      'Exklusives Vorrecht zur Wahl des Königs oder Kaisers',
      'Inhaber eines Reichs-Erzamtes (z. B. Erztruchsess, Erzkanzler)',
      'Unabsetzbare Kurwürde und unteilbares Kurterritorium',
      'Volle Landeshoheit & oberste Gerichtsbarkeit ohne Berufung'
    ],
    duties: 'Wahlversammlung bei Thronvakanz, Reichstagspräsenz, Beratung der Reichsführung',
    description: 'Herausragender Reichsfürst mit dem staatsrechtlichen Privileg der Königswahl und exklusiven Reichs-Erzämtern.'
  },
  {
    id: 'herzog',
    title: 'Herzog / Herzogin',
    rankOrder: 5,
    category: 'Hoher Adel',
    salutation: 'Eure Hoheit / Durchlaucht',
    privileges: [
      'Große Landeshoheit & traditioneller Heerbann',
      'Blutgerichtsbarkeit (Hohe Gerichtsbarkeit über Leben und Tod)',
      'Festungsbau- und Zollprivilegien',
      'Virilstimme im Reichsfürstenrat'
    ],
    duties: 'Bereitstellung von Rittern und Kriegskontingenten im Reichsnotfall, Lehnstreue zur Krone',
    description: 'Hoher Landesherr über ein historisches Herzogtum mit gefestigter Landesherrschaft und umfangreicher Lehnsritterschaft.'
  },
  {
    id: 'erbherzog',
    title: 'Erbherzog / Erbherzogstochter',
    rankOrder: 5,
    category: 'Hoher Adel',
    isDynastic: true,
    salutation: 'Eure Hoheit',
    privileges: [
      'Gesicherte Nachfolge im Herzogtum',
      'Führung eines herzoglichen Lehnsregiments',
      'Sitz und Stimme bei Landtagen des Herzogtums'
    ],
    duties: 'Inspektion der herzoglichen Burgen, Ausbildung im Landesrecht',
    description: 'Erblicher Nachfolger des regierenden Herzogshauses mit militärischer und administrativer Führungsvollmacht.'
  },
  {
    id: 'fuerst',
    title: 'Fürst / Fürstin',
    rankOrder: 6,
    category: 'Hoher Adel',
    salutation: 'Eure Durchlaucht',
    privileges: [
      'Reichsstandschaft mit eigenem Fürstentum',
      'Eigene Gesetzgebung und Steuerhoheit im Territorium',
      'Forst- und Jagdregal über alle fürstlichen Wälder',
      'Verleihung niederer Vasallenlehen'
    ],
    duties: 'Treueid gegenüber der Krone, Unterstützung der Reichskriege, Aufrechterhaltung der Ordnung',
    description: 'Herrscher über ein autonomes Fürstentum mit Reichsstandschaft und landesherrlicher Gerichtsbarkeit.'
  },
  {
    id: 'erbprinz',
    title: 'Erbprinz / Erbprinzessin',
    rankOrder: 6,
    category: 'Hoher Adel',
    isDynastic: true,
    salutation: 'Eure Durchlaucht',
    privileges: [
      'Nachfolge im regierenden Fürstentum',
      'Mitwirkung bei fürstlichen Erlassen und Rechtssprüchen',
      'Vertretung des regierenden Fürsten bei Krankheit oder Feldzug'
    ],
    duties: 'Pflege fürstlicher Domänen, Wahrnehmung von Audienzen',
    description: 'Erblicher Nachfolger eines Fürstenhauses mit garantierter Thronfolge im Fürstentum.'
  },
  {
    id: 'landgraf',
    title: 'Landgraf / Landgräfin',
    rankOrder: 7,
    category: 'Hoher Adel',
    salutation: 'Eure Hochgeboren / Durchlaucht',
    privileges: [
      'Unmittelbare Lehnsherrschaft direkt unter dem Kaiser/König',
      'Vollständige Landesgerichtsbarkeit über die Grafschaft',
      'Zoll- und Geleitaufsicht auf Handelsstraßen'
    ],
    duties: 'Landesverteidigung, Erhebung von Reichssteuern, ständige Geleitsicherung',
    description: 'Unmittelbar dem Landesherrn oder Kaiser unterstehender Herrscher einer Landgrafschaft mit fürstengleicher Stellung.'
  },
  {
    id: 'markgraf',
    title: 'Markgraf / Markgräfin',
    rankOrder: 8,
    category: 'Hoher Adel',
    salutation: 'Eure Hochgeboren / Durchlaucht',
    privileges: [
      'Militärischer Oberbefehl über Grenzmarken des Reiches',
      'Befehl über Grenzburgen, Wachtürme und Garnisonen',
      'Erhöhtes Truppenkontingent & Wegzölle für Grenzwehr'
    ],
    duties: 'Ständige Grenzsicherung, Schutz gegen auswärtige Invasoren, Waffenbereitschaft',
    description: 'Herrscher über ein kaiserliches Grenzgebiet mit erweiterter militärischer Vollmacht und ständiger Verteidigungsaufgabe.'
  },
  {
    id: 'pfalzgraf',
    title: 'Pfalzgraf / Pfalzgräfin',
    rankOrder: 9,
    category: 'Hoher Adel',
    salutation: 'Eure Durchlaucht',
    privileges: [
      'Kaiserliche Statthalterschaft und Vertretung',
      'Richterliche Vollmacht in königlichen Pfalzen',
      'Verwaltung reichsunmittelbarer Krongüter'
    ],
    duties: 'Rechtsprechung im Namen der Krone, Verwaltung von Pfalzen und Kronschätzen',
    description: 'Kaiserlicher Stellvertreter und oberster Richter an königlichen Pfalzen mit hoher administrativer Macht.'
  },

  // ---------------------------------------------------------------------------
  // 3. MITTLERER ADEL (Grafenstand & Freie Herren / Barone)
  // ---------------------------------------------------------------------------
  {
    id: 'graf',
    title: 'Graf / Gräfin',
    rankOrder: 10,
    category: 'Mittlerer Adel',
    salutation: 'Eure Erlaucht / Hochgeboren',
    privileges: [
      'Gerichtsbarkeit über eine Grafschaft',
      'Zehntabgaben und Zolleinnahmen auf Gütern',
      'Befehl über gräfliche Reiter und Vasallen',
      'Patronatsrecht über Pfarrkirchen'
    ],
    duties: 'Rechtspflege im Gau, Heeresfolge mit bewaffneten Knechten, Straßenfrieden',
    description: 'Verwalter und Landesherr einer Grafschaft mit eigener Gerichtsbarkeit und gefestigtem Lehnswesen.'
  },
  {
    id: 'erbgraf',
    title: 'Erbgraf / Erbgräfin (Komtesse)',
    rankOrder: 10,
    category: 'Mittlerer Adel',
    isDynastic: true,
    salutation: 'Erlaucht / Hochgeboren',
    privileges: [
      'Anwartschaft auf die väterliche oder mütterliche Grafschaft',
      'Repräsentation der Grafenfamilie bei Hofversammlungen',
      'Vorrangiges Stimmrecht im Familienrat'
    ],
    duties: 'Erlernen der Güterverwaltung, Beisitz bei Gerichtsverhandlungen',
    description: 'Erblicher Nachfolger oder Tochter einer regierenden Grafenfamilie mit traditioneller Grafschaftsanwartschaft.'
  },
  {
    id: 'burggraf',
    title: 'Burggraf / Burggräfin',
    rankOrder: 11,
    category: 'Mittlerer Adel',
    salutation: 'Wohlgeboren',
    privileges: [
      'Kommando über eine Reichsburg oder Residenzfeste',
      'Schutzvogtei & Brückenzölle im Burgumfeld',
      'Burggerichtsbarkeit über die Burgbesatzung'
    ],
    duties: 'Verteidigung der Feste, Beherbergung des Landesherrn, Aufrechterhaltung der Wachbereitschaft',
    description: 'Militärischer und richterlicher Herrscher über eine reichsunmittelbare oder landesherrliche Burg.'
  },
  {
    id: 'vizegraf',
    title: 'Vizegraf / Vizegräfin (Viscount)',
    rankOrder: 12,
    category: 'Mittlerer Adel',
    salutation: 'Wohlgeboren',
    privileges: [
      'Stellvertretende Führung einer Grafschaft',
      'Niedere Gerichtsbarkeit über bäuerliche Siedlungen',
      'Einkünfte aus Vizegrafschaftsgütern'
    ],
    duties: 'Unterstützung des Grafen, Steuereinzug, Leitung regionaler Gerichtsverhandlungen',
    description: 'Stellvertreter des Grafen oder Lehnsherr einer kleineren Vizegrafschaft.'
  },
  {
    id: 'baron',
    title: 'Baron / Baronin (Freiherr / Freiin)',
    rankOrder: 13,
    category: 'Mittlerer Adel',
    salutation: 'Hoch- und Wohlgeboren',
    privileges: [
      'Freier Allodial- und Grundbesitz über Dörfer und Ländereien',
      'Patrimonialgerichtsbarkeit über eigene Hörige und Bauern',
      'Freies Jagd-, Fischerei- und Holznutzungsrecht'
    ],
    duties: 'Lehnstreue zum Oberherrn, Gestellung bewaffneter Reiter im Krieg',
    description: 'Freier Adelsstand mit eigenem Grundbesitz, Gutshöfen und Lehnsherrschaft über Dorfgemeinden.'
  },
  {
    id: 'baronssohn',
    title: 'Baronssohn / Baronstochter',
    rankOrder: 13,
    category: 'Mittlerer Adel',
    isDynastic: true,
    salutation: 'Wohlgeboren',
    privileges: [
      'Erbrecht an der familiären Freiherrschaft und den Gutshöfen',
      'Teilnahme an adeligen Jagden und Ritterfechten',
      'Führung des Baronswappens'
    ],
    duties: 'Schulung in Landwirtschaft, Waffenhandwerk und Hausverwaltung',
    description: 'Nachkomme einer Freiherren- oder Baronsfamilie mit Anwartschaft auf Landgüter und Gutsgerichtsbarkeit.'
  },

  // ---------------------------------------------------------------------------
  // 4. NIEDERER ADEL (Ritterstand, Dienst- & Landadel, Patriziat)
  // ---------------------------------------------------------------------------
  {
    id: 'ritter',
    title: 'Ritter (Adelsstand / Lehnsritter)',
    rankOrder: 14,
    category: 'Niederer Adel',
    salutation: 'Edler Herr / Wohlgeboren',
    privileges: [
      'Wappenrecht & Turnierfähigkeit im gesamten Reich',
      'Tragen von voller Ritterrüstung, Helmzier und Schwert',
      'Zollbefreiung auf Handels- und Heerwegen',
      'Ehrenplatz bei ritterlichen Zusammenkünften'
    ],
    duties: 'Waffendienst in schwerer Rüstung, Schutz der Schwachen und Eidtreue zum Ritterkodex',
    description: 'Geweihter oder erblicher ritterlicher Adelsstand mit Wappenrecht, ritterlicher Bewaffnung und Lehnsdienst.'
  },
  {
    id: 'edler',
    title: 'Edler / Edle',
    rankOrder: 15,
    category: 'Niederer Adel',
    salutation: 'Edler Herr / Edle Frau',
    privileges: [
      'Erbliches Adelsprädikat (\'von\' / \'zu\')',
      'Steuervergünstigungen auf familiären Grundbesitz',
      'Vorrecht bei höfischen und militärischen Ernennungen'
    ],
    duties: 'Treuhanddienst in der Landesverwaltung, bei Hofe oder im Offizierskorps',
    description: 'Niederer erblicher Adelsstand des ritterbürtigen Landadels ohne eigenes reichsunmittelbares Territorium.'
  },
  {
    id: 'junker',
    title: 'Junker / Edelfräulein',
    rankOrder: 16,
    category: 'Niederer Adel',
    salutation: 'Junker / Edelfräulein',
    privileges: [
      'Anerkannte adelige Standeszugehörigkeit',
      'Zugang zu adeligen Sozietäten, Turnieren und Festmahlen',
      'Führung des Familienwappens mit Beizeichen'
    ],
    duties: 'Schulung an Waffen, Hofetikette und Vorbereitung auf die Lehnsnachfolge',
    description: 'Nachkomme oder junger Spross einer adligen Familie vor der Übernahme eines eigenen Lehens.'
  },
  {
    id: 'patrizier',
    title: 'Patrizier (Stadtadel)',
    rankOrder: 17,
    category: 'Niederer Adel',
    salutation: 'Ehrbar und Wohlgeachtet',
    privileges: [
      'Ratsfähigkeit im Magistrat freier Reichsstädte',
      'Exklusive Handels-, Montan- und Zunftvorrechte',
      'Befreiung von niederen Frondiensten',
      'Schutz durch das städtische Patriziat'
    ],
    duties: 'Finanzierung städtischer Wehranlagen, Teilnahme am Stadtsenat, Stadtwachenaufsicht',
    description: 'Mitglied des erblichen regimentsfähigen Patriziats freier Reichsstädte mit hohem Vermögen und Ratsherrschaft.'
  }
];

const CATEGORY_ORDER: NobilityCategory[] = [
  'Höchster Adel',
  'Hoher Adel',
  'Mittlerer Adel',
  'Niederer Adel'
];

interface NobilitySkillTreeProps {
  socialTitles: SocialTitleState[];
  onChangeSocialTitles: (titles: SocialTitleState[]) => void;
  onOpenCustomTitleModal: () => void;
}

export const NobilitySkillTree: React.FC<NobilitySkillTreeProps> = ({
  socialTitles,
  onChangeSocialTitles,
  onOpenCustomTitleModal
}) => {
  // Tags filter: 'Alle' or one of the 4 nobility tiers
  const [selectedCategory, setSelectedCategory] = useState<'Alle' | NobilityCategory>('Alle');
  // Sort direction: 'desc' = absteigend (Höchster Rang zuerst: Kaiser -> Junker), 'asc' = aufsteigend (Junker -> Kaiser)
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  // Helper: check if a title is held
  const isTitleHeld = (titleName: string): boolean => {
    const norm = titleName.toLowerCase().trim();
    return socialTitles.some(t => {
      const tNorm = t.title.toLowerCase().trim();
      return tNorm === norm || tNorm.split(' / ').some(p => norm.includes(p.trim()) || p.trim().includes(norm));
    });
  };

  // Find the exact SocialTitleState if held
  const getHeldTitleState = (titleName: string): SocialTitleState | undefined => {
    const norm = titleName.toLowerCase().trim();
    return socialTitles.find(t => {
      const tNorm = t.title.toLowerCase().trim();
      return tNorm === norm || tNorm.split(' / ').some(p => norm.includes(p.trim()) || p.trim().includes(norm));
    });
  };

  // Toggle holding a title
  const handleToggleTitle = (node: NobilityTreeNode) => {
    const existing = getHeldTitleState(node.title);
    if (existing) {
      onChangeSocialTitles(socialTitles.filter(t => t.id !== existing.id));
      showToast(`Titel '${node.title}' abgelegt.`);
    } else {
      const isInherited = !!node.isDynastic ||
        node.title.toLowerCase().includes('prinz') ||
        node.title.toLowerCase().includes('erb') ||
        node.title.toLowerCase().includes('sohn') ||
        node.title.toLowerCase().includes('tochter');

      const newTitle: SocialTitleState = {
        id: `title_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: node.title,
        titleType: 'nobility',
        inherited: isInherited,
        reason: node.description
      };
      onChangeSocialTitles([...socialTitles, newTitle]);
      showToast(`Titel '${node.title}' verliehen / angenommen.`);
    }
  };

  // Update reason / grantedBy in real time for a held title
  const handleUpdateHeldTitle = (titleName: string, updates: Partial<SocialTitleState>) => {
    const existing = getHeldTitleState(titleName);
    if (!existing) return;
    const updated = socialTitles.map(t => (t.id === existing.id ? { ...t, ...updates } : t));
    onChangeSocialTitles(updated);
  };

  // Determine the highest active title for the root node
  const heldPresetNodes = PRESET_NOBILITY_TREE_NODES.filter(n => isTitleHeld(n.title));
  // Sort by rank order ascending (1 is highest)
  heldPresetNodes.sort((a, b) => a.rankOrder - b.rankOrder);
  const highestHeldNode = heldPresetNodes[0];

  // Custom titles that are not in the preset list
  const customTitles = socialTitles.filter(st => {
    const stNorm = st.title.toLowerCase().trim();
    return !PRESET_NOBILITY_TREE_NODES.some(pn => {
      const pnNorm = pn.title.toLowerCase().trim();
      return pnNorm === stNorm || pnNorm.split(' / ').some(p => stNorm.includes(p.trim()));
    });
  });

  // Filter and sort nodes based on selectedCategory, searchQuery, and sortDirection
  const processedNodes = useMemo(() => {
    const filtered = PRESET_NOBILITY_TREE_NODES.filter(node => {
      const matchesCategory = selectedCategory === 'Alle' || node.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() ||
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.salutation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort according to sortDirection:
    // 'desc' (Absteigend): Rang 1 (Kaiser) -> Rang 17 (Patrizier)
    // 'asc' (Aufsteigend): Rang 17 (Patrizier) -> Rang 1 (Kaiser)
    filtered.sort((a, b) => {
      if (sortDirection === 'desc') {
        if (a.rankOrder !== b.rankOrder) return a.rankOrder - b.rankOrder;
        return a.title.localeCompare(b.title);
      } else {
        if (a.rankOrder !== b.rankOrder) return b.rankOrder - a.rankOrder;
        return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortDirection]);

  // Order categories for grouped display when 'Alle' is selected
  const orderedCategories = useMemo(() => {
    if (sortDirection === 'desc') {
      return CATEGORY_ORDER;
    } else {
      return [...CATEGORY_ORDER].reverse();
    }
  }, [sortDirection]);

  // ---------------------------------------------------------------------------
  // RENDER COMPACT TALENT NODE
  // ---------------------------------------------------------------------------
  const renderCompactNode = (node: NobilityTreeNode) => {
    const isHeld = isTitleHeld(node.title);
    const isInspected = inspectingNodeId === node.id;
    const heldState = getHeldTitleState(node.title);
    const categoryMeta = NOBILITY_CATEGORY_META[node.category];

    return (
      <div
        key={node.id}
        id={`nobility-node-${node.id}`}
        className={`relative flex flex-col justify-between p-4 rounded-xl transition-all duration-150 border ${
          isHeld
            ? 'bg-amber-950/30 border-amber-500/70 shadow-sm shadow-amber-950/30 ring-1 ring-amber-500/20'
            : isInspected
            ? 'bg-slate-900 border-amber-400/80 ring-1 ring-amber-400/40 shadow-sm'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60 shadow-sm'
        }`}
      >
        <div>
          {/* Top Bar: Category Stand Tag & Rank Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${categoryMeta.badgeClass} whitespace-nowrap`}
              title={categoryMeta.description}
            >
              {node.category}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border whitespace-nowrap ${
                isHeld
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Rang {node.rankOrder}
            </span>
          </div>

          {/* Main Title & Salutation */}
          <div className="flex flex-col min-w-0 mt-1">
            <span
              className="text-sm sm:text-base font-bold text-white font-serif leading-snug break-normal"
              title={node.title}
            >
              {node.title}
            </span>
            <span className="text-[11px] text-amber-300/85 mt-1 leading-tight">
              {node.salutation}
            </span>
            {node.isDynastic && (
              <div className="mt-2">
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-950/50 text-amber-300/90 border border-amber-800/60 whitespace-nowrap">
                  Dynastische Erbfolge
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lower Action Bar: Innehaben Checkbox + Details Button */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isHeld}
              onChange={() => handleToggleTitle(node)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
            />
            <span
              className={`text-xs font-medium whitespace-nowrap transition ${
                isHeld ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {isHeld ? (heldState?.inherited ? 'Inhaber (Geerbt)' : 'Inhaber (Verliehen)') : 'Innehaben'}
            </span>
          </label>

          <button
            type="button"
            onClick={() => setInspectingNodeId(isInspected ? null : node.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              isInspected
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title={isInspected ? 'Details schließen' : 'Details einsehen'}
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{isInspected ? 'Schließen' : 'Details'}</span>
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 1-CLICK EXPANDABLE DETAIL INSPECTOR
  // ---------------------------------------------------------------------------
  const renderNodeInspector = (node: NobilityTreeNode) => {
    const isHeld = isTitleHeld(node.title);
    const heldState = getHeldTitleState(node.title);
    const categoryMeta = NOBILITY_CATEGORY_META[node.category];

    return (
      <div
        id={`nobility-inspector-${node.id}`}
        className="w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 my-3"
      >
        {/* Header: Title & Close */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-white font-serif uppercase tracking-wider">
                {node.title}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryMeta.badgeClass}`}>
                {node.category} &bull; Rangordnung {node.rankOrder}
              </span>
              {node.isDynastic && (
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 text-[10px] font-bold">
                  Dynastisch
                </span>
              )}
              {isHeld && (
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-amber-400" />
                  <span>Aktuell innegehabt</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-400">Formelle Anrede:</span>
              <span className="text-xs font-serif font-bold text-amber-300 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                {node.salutation}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-3xl">
              {node.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Toggle Button */}
            <button
              type="button"
              onClick={() => handleToggleTitle(node)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isHeld
                  ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-sm'
              }`}
            >
              {isHeld ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isHeld ? 'Titel ablegen' : 'Titel annehmen'}</span>
            </button>

            {/* Single-Click Close Button */}
            <button
              type="button"
              onClick={() => setInspectingNodeId(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700 ml-1"
              title="Details schließen"
            >
              <X className="w-3.5 h-3.5 text-amber-400" />
              <span>Schließen</span>
            </button>
          </div>
        </div>

        {/* Privilegien & Pflichten */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Privilegien */}
          <div className="flex flex-col gap-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Standesrechte & Privilegien</span>
            </span>
            <ul className="flex flex-col gap-1 text-xs text-slate-300">
              {node.privileges.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pflichten & Lehnswesen */}
          <div className="flex flex-col gap-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Standespflichten & Lehnstreue</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {node.duties}
            </p>
          </div>
        </div>

        {/* Wenn der Titel innegehabt wird: Verleihungsdetails editieren */}
        {isHeld && heldState && (
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Individuelle Verleihungsdaten & Ahnenbrief
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px]">Verliehen durch / Lehnsherr:</label>
                <input
                  type="text"
                  value={heldState.grantedBy || ''}
                  onChange={e => handleUpdateHeldTitle(node.title, { grantedBy: e.target.value })}
                  placeholder="z. B. Kaiser Maximilian, Großherzog von Alveran..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-[11px]">Erwerbsart / Dynastie:</label>
                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={heldState.inherited || false}
                    onChange={e => handleUpdateHeldTitle(node.title, { inherited: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                  />
                  <span className="text-slate-300">
                    Dynastisch geerbt / Geburtsrecht der Familie
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-400 text-[11px]">Verleihungsgrund / Ahnenurkunde:</label>
              <AutoExpandingTextarea
                value={heldState.reason || ''}
                onChange={e => handleUpdateHeldTitle(node.title, { reason: e.target.value })}
                placeholder="Begründung der Ernennung, Verdienste in der Schlacht, kaiserliches Diplom..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-500"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="nobility-skill-tree-container" className="flex flex-col items-center w-full">
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-amber-500 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          {feedbackMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WURZELKNOTEN: AKTUELLER ADELSSTAND                                      */}
      {/* ========================================================================= */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div
          id="nobility-tree-root-node"
          className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/70 rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-950/20 flex flex-col justify-between relative"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Aktueller Stand & Haupttitel
                </span>
                <h3 className="text-base font-bold text-white font-serif tracking-wide">
                  {highestHeldNode ? highestHeldNode.title : 'Bürgerlicher Stand'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {highestHeldNode && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${NOBILITY_CATEGORY_META[highestHeldNode.category].badgeClass}`}>
                  {highestHeldNode.category}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300">
                {highestHeldNode ? `Rang ${highestHeldNode.rankOrder}` : 'Kein Titel'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {highestHeldNode
              ? `${highestHeldNode.salutation} \u2014 ${highestHeldNode.description}`
              : 'Aktuell ist kein Adelstitel oder Herrscherrang gewählt. Wähle unten einen Standestitel aus dem Talentbaum, um den Charakter im Adel zu verankern.'}
          </p>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-400">
            <span>Innegehabte Adelstitel: <strong className="text-amber-300">{socialTitles.length}</strong></span>
            {highestHeldNode && (
              <button
                type="button"
                onClick={() => setInspectingNodeId(inspectingNodeId === highestHeldNode.id ? null : highestHeldNode.id)}
                className="text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
              >
                {inspectingNodeId === highestHeldNode.id ? 'Details schließen' : 'Haupttitel-Details'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VERBINDUNGSLINIE */}
      <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/60 to-amber-500/40 my-1 mx-auto" />

      {/* ========================================================================= */}
      {/* 2. FILTERLEISTE & TAGS: HÖCHSTER, HOHER, MITTLERER, NIEDERER ADEL          */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col gap-3 my-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Tag Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Alle Filter Button */}
            <button
              type="button"
              onClick={() => setSelectedCategory('Alle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'Alle'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm shadow-amber-950/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span>Alle</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {PRESET_NOBILITY_TREE_NODES.length}
              </span>
            </button>

            {/* Category Tags: Höchster Adel, Hoher Adel, Mittlerer Adel, Niederer Adel */}
            {CATEGORY_ORDER.map(cat => {
              const meta = NOBILITY_CATEGORY_META[cat];
              const totalInCat = PRESET_NOBILITY_TREE_NODES.filter(n => n.category === cat).length;
              const heldInCat = PRESET_NOBILITY_TREE_NODES.filter(n => n.category === cat && isTitleHeld(n.title)).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  title={meta.description}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? `${meta.badgeClass} ring-1 ring-amber-400/30 shadow-sm`
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {heldInCat > 0 ? `${heldInCat}/${totalInCat}` : totalInCat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Controls Right: Sort Direction, Search & Custom Title */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Toggle: Absteigende Ränge vs Aufsteigende Ränge */}
            <button
              type="button"
              onClick={() => setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-800 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title={
                sortDirection === 'desc'
                  ? 'Aktuell: Absteigend (Höchster Rang zuerst: Kaiser → Junker). Klicken für Aufsteigend.'
                  : 'Aktuell: Aufsteigend (Niederer Rang zuerst: Junker → Kaiser). Klicken für Absteigend.'
              }
            >
              {sortDirection === 'desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>{sortDirection === 'desc' ? 'Absteigend (Kaiser → Junker)' : 'Aufsteigend (Junker → Kaiser)'}</span>
            </button>

            {/* Filter Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Titel filtern..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 w-32 sm:w-40"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Add Custom Title Button */}
            <button
              type="button"
              onClick={onOpenCustomTitleModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              title="Individuellen Adelstitel anlegen"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Individueller Titel</span>
            </button>
          </div>
        </div>

        {/* Section Divider with golden accent line */}
        <div className="w-full flex items-center justify-center gap-3 my-1">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent flex-1" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 whitespace-nowrap">
            {selectedCategory === 'Alle'
              ? `Adelstitel & Herrscherstufen (${processedNodes.length}) \u2014 ${
                  sortDirection === 'desc' ? 'Absteigende Ränge' : 'Aufsteigende Ränge'
                }`
              : `${selectedCategory} (${processedNodes.length}) \u2014 ${
                  sortDirection === 'desc' ? 'Absteigend' : 'Aufsteigend'
                }`}
          </span>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent flex-1" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAIL-INSPEKTOR (WENN GEÖFFNET)                                        */}
      {/* ========================================================================= */}
      {inspectingNodeId && (() => {
        const targetNode = PRESET_NOBILITY_TREE_NODES.find(n => n.id === inspectingNodeId);
        if (!targetNode) return null;
        return renderNodeInspector(targetNode);
      })()}

      {/* ========================================================================= */}
      {/* 4. TALENTBAUM-GRID DER ADELSTITEL                                         */}
      {/* ========================================================================= */}
      {selectedCategory === 'Alle' && !searchQuery.trim() ? (
        // Grouped by nobility tiers in chosen sort direction
        <div className="flex flex-col gap-6 w-full">
          {orderedCategories.map(cat => {
            const catNodes = processedNodes.filter(n => n.category === cat);
            if (catNodes.length === 0) return null;
            const meta = NOBILITY_CATEGORY_META[cat];

            return (
              <div key={cat} className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${meta.badgeClass}`}>
                      {cat}
                    </span>
                    <span className="text-xs text-slate-400">
                      {meta.description}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {catNodes.length} {catNodes.length === 1 ? 'Titel' : 'Titel'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 w-full">
                  {catNodes.map(node => renderCompactNode(node))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Single category or filtered search results
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 w-full">
          {processedNodes.length > 0 ? (
            processedNodes.map(node => renderCompactNode(node))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-500 italic bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
              Keine Adelstitel für die aktuellen Filterkriterien gefunden.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INDIVIDUELLE & SONDER-TITEL (FALLS ANGELEGT)                           */}
      {/* ========================================================================= */}
      {customTitles.length > 0 && (
        <div className="w-full flex flex-col gap-2 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Individuell angelegte Titel ({customTitles.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 w-full">
            {customTitles.map(st => (
              <div
                key={st.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-amber-950/20 border border-amber-600/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white font-serif break-normal">
                      {st.title}
                    </span>
                    {st.grantedBy && (
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Verliehen durch: {st.grantedBy}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0 whitespace-nowrap">
                    {st.inherited ? 'Geerbt' : 'Verliehen'}
                  </span>
                </div>

                {st.reason && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {st.reason}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onChangeSocialTitles(socialTitles.filter(t => t.id !== st.id))}
                    className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    Titel entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
