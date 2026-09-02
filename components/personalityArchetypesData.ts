import { PersonalityTraits } from '../types';

export interface PersonalityArchetypeDefinition {
  name: string;
  label: string;
  category: 'Klassische Dere-Typen' | 'Subtypen & Varianten' | 'Western-Typen' | 'Spezielle & Exzentrische Typen';
  description: string;
  defaultTraits?: Partial<PersonalityTraits>;
}

export const PERSONALITY_ARCHETYPES: PersonalityArchetypeDefinition[] = [
  // A
  {
    name: 'Amadere',
    label: 'Amadere',
    category: 'Klassische Dere-Typen',
    description: 'Warmherzig, lieblich, anhänglich und fürsorglich; zeigt Zuneigung offen und zärtlich.',
    defaultTraits: { freundlichkeit: 85, geselligkeit: 75, empathie: 85, loyalitaet: 85, emotionalitaet: 75, schuechternheit: 35 }
  },
  {
    name: 'Bakadere',
    label: 'Bakadere',
    category: 'Klassische Dere-Typen',
    description: 'Naiv, tollpatschig, unschuldig und optimistisch; meint es immer gut und handelt nach Bauchgefühl.',
    defaultTraits: { freundlichkeit: 85, humor: 80, impulsivitaet: 75, ehrlichkeit: 90, disziplin: 30, ordnungsliebe: 25 }
  },
  {
    name: 'Biridere',
    label: 'Biridere',
    category: 'Subtypen & Varianten',
    description: 'Äußerlich kühl oder schüchtern, reagiert bei Zuneigung oder Nähe nervös, zittrig oder überfordert.',
    defaultTraits: { schuechternheit: 80, selbstvertrauen: 25, emotionalitaet: 75, freundlichkeit: 65, geduld: 40 }
  },
  {
    name: 'Western:Bocchandere',
    label: 'Western:Bocchandere',
    category: 'Western-Typen',
    description: 'Aus vermögendem oder adligem Hause, verwöhnt und anspruchsvoll, taut bei Vertrauten jedoch auf.',
    defaultTraits: { eitelkeit: 80, dominanz: 65, materialismus: 75, loyalitaet: 70, selbstvertrauen: 75 }
  },
  {
    name: 'Bokodere',
    label: 'Bokodere',
    category: 'Subtypen & Varianten',
    description: 'Verlegen und schüchtern; reagiert in peinlichen Momenten mit reflexartigen physischen Reaktionen oder Flucht.',
    defaultTraits: { schuechternheit: 85, impulsivitaet: 80, temperament: 70, emotionalitaet: 75, selbstvertrauen: 30 }
  },
  {
    name: 'Butsudere',
    label: 'Butsudere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Äußerst distanziert, fast erleuchtet oder gleichgültig gegenüber weltlichen Dingen; öffnet sich nur selten.',
    defaultTraits: { emotionalitaet: 15, temperament: 15, geduld: 90, geselligkeit: 20, disziplin: 85, materialismus: 10 }
  },
  {
    name: 'Western:Byoukidere',
    label: 'Western:Byoukidere',
    category: 'Western-Typen',
    description: 'Körperlich zart oder kränklich, besitzt aber ein sanftes, geduldiges und treues Wesen.',
    defaultTraits: { freundlichkeit: 85, geduld: 80, mut: 60, empathie: 90, loyalitaet: 85, disziplin: 70 }
  },

  // C
  {
    name: 'Chindere',
    label: 'Chindere',
    category: 'Subtypen & Varianten',
    description: 'Ruhig, tiefgründig und philosophisch; denkt viel nach und drückt Gefühle subtil und bedacht aus.',
    defaultTraits: { intelligenzorientierung: 85, emotionalitaet: 40, geduld: 80, geselligkeit: 35, impulsivitaet: 20 }
  },

  // D
  {
    name: 'Dandere',
    label: 'Dandere',
    category: 'Klassische Dere-Typen',
    description: 'Extrem schüchtern, schweigsam und zurückhaltend; taut erst in vertrauter Umgebung oder zu zweit auf.',
    defaultTraits: { schuechternheit: 95, geselligkeit: 15, freundlichkeit: 75, loyalitaet: 90, selbstvertrauen: 20, empathie: 80 }
  },
  {
    name: 'Darudere',
    label: 'Darudere',
    category: 'Subtypen & Varianten',
    description: 'Lustlos, träge und phlegmatisch; erledigt nur das Nötigste, ist im Inneren jedoch zuverlässig und treu.',
    defaultTraits: { disziplin: 20, impulsivitaet: 15, geduld: 75, loyalitaet: 75, temperament: 20, materialismus: 30 }
  },
  {
    name: 'Deredere',
    label: 'Deredere',
    category: 'Klassische Dere-Typen',
    description: 'Durchgehend liebevoll, optimistisch, herzlich und offenherzig gegenüber allen Menschen.',
    defaultTraits: { freundlichkeit: 95, geselligkeit: 90, empathie: 90, loyalitaet: 90, humor: 80, misstrauen: 10 }
  },
  {
    name: 'Deretsun',
    label: 'Deretsun',
    category: 'Subtypen & Varianten',
    description: 'Beginnt überaus freundlich und anhänglich, zieht sich bei Verlegenheit oder Kritik jedoch schroff zurück.',
    defaultTraits: { freundlichkeit: 75, schuechternheit: 60, temperament: 65, emotionalitaet: 75, eitelkeit: 55 }
  },
  {
    name: 'Dorodere',
    label: 'Dorodere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Wirkt nach außen süß und unschuldig, verbirgt im Inneren jedoch düstere, zynische oder verdorbene Gedanken.',
    defaultTraits: { ehrlichkeit: 25, misstrauen: 75, freundlichkeit: 45, intelligenzorientierung: 75, emotionalitaet: 60 }
  },

  // E
  {
    name: 'Erodere',
    label: 'Erodere',
    category: 'Subtypen & Varianten',
    description: 'Offenherzig, kokett und verführerisch; setzt Reize, Charme und Humor selbstbewusst ein.',
    defaultTraits: { selbstvertrauen: 90, schuechternheit: 10, humor: 80, mut: 80, freundlichkeit: 75, dominanz: 65 }
  },

  // G
  {
    name: 'Gandere',
    label: 'Gandere',
    category: 'Subtypen & Varianten',
    description: 'Beharrend, stur und unbeugsam; lässt sich durch nichts von eigenen Zielen und Überzeugungen abbringen.',
    defaultTraits: { durchsetzungsvermoegen: 95, disziplin: 90, mut: 85, geduld: 40, dominanz: 75 }
  },
  {
    name: 'Gesudere',
    label: 'Gesudere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Skrupellos, manipulativ oder schelmisch nach außen, zeigt Verbündeten gegenüber jedoch wahre Loyalität.',
    defaultTraits: { ehrlichkeit: 30, dominanz: 80, loyalitaet: 75, misstrauen: 70, mut: 80, intelligenzorientierung: 85 }
  },
  {
    name: 'Gou-dere',
    label: 'Gou-dere',
    category: 'Subtypen & Varianten',
    description: 'Willensstark, tatkräftig und unerbittlich entschlossen, für die geschätzte Person jedes Hindernis zu überwinden.',
    defaultTraits: { mut: 95, loyalitaet: 95, durchsetzungsvermoegen: 90, disziplin: 85, impulsivitaet: 65 }
  },
  {
    name: 'Gundere',
    label: 'Gundere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Begeistert sich für Waffen, Taktik oder Militär und drückt Gefühle und Schutzinstinkt über Wehrhaftigkeit aus.',
    defaultTraits: { mut: 85, disziplin: 85, ordnungsliebe: 80, emotionalitaet: 45, risikobereitschaft: 75 }
  },
  {
    name: 'Gurodere',
    label: 'Gurodere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Zeigt Zuneigung auf makabre, morbide oder bizarre Weise; fasziniert vom Ungewöhnlichen.',
    defaultTraits: { neugier: 90, kreativitaet: 85, emotionalitaet: 70, misstrauen: 50, ordnungsliebe: 30 }
  },

  // H
  {
    name: 'Hajidere',
    label: 'Hajidere',
    category: 'Subtypen & Varianten',
    description: 'Extrem leicht verlegen; errötet schnell und gerät in Gegenwart wichtiger Personen in nervöse Aufregung.',
    defaultTraits: { schuechternheit: 95, selbstvertrauen: 15, emotionalitaet: 85, freundlichkeit: 80, impulsivitaet: 60 }
  },
  {
    name: 'Hamedere',
    label: 'Hamedere',
    category: 'Subtypen & Varianten',
    description: 'Ungeschickt und fehleranfällig, gibt sich jedoch die größte Mühe und gewinnt dadurch Sympathie.',
    defaultTraits: { ehrlichkeit: 90, freundlichkeit: 85, disziplin: 40, ordnungsliebe: 30, loyalitaet: 85 }
  },
  {
    name: 'Himedere',
    label: 'Himedere',
    category: 'Klassische Dere-Typen',
    description: 'Hochnäsig und anspruchsvoll wie eine Prinzessin; erwartet Sonderbehandlung, sucht aber echte Anerkennung.',
    defaultTraits: { eitelkeit: 95, dominanz: 80, selbstvertrauen: 80, schuechternheit: 15, materialismus: 80, loyalitaet: 70 }
  },
  {
    name: 'Hinedere',
    label: 'Hinedere',
    category: 'Subtypen & Varianten',
    description: 'Zynisch, sarkastisch und arrogant; betrachtet die Welt skeptisch, taut aber bei aufrichtiger Zuneigung auf.',
    defaultTraits: { misstrauen: 85, humor: 75, intelligenzorientierung: 80, freundlichkeit: 30, ehrlichkeit: 70 }
  },

  // K
  {
    name: 'Kamidere',
    label: 'Kamidere',
    category: 'Klassische Dere-Typen',
    description: 'Überheblich mit Überlegenheitsanspruch; fordert Respekt ein, beschützt jedoch loyale Gefolgsleute.',
    defaultTraits: { dominanz: 95, selbstvertrauen: 95, eitelkeit: 90, mut: 85, schuechternheit: 10, loyalitaet: 70 }
  },
  {
    name: 'Kamidere (Bite)',
    label: 'Kamidere (Bite)',
    category: 'Subtypen & Varianten',
    description: 'Überlegenes Auftreten gepaart mit scharfer Zunge, bissigen Kommentaren und dominantem Führungsstil.',
    defaultTraits: { dominanz: 95, temperament: 75, ehrlichkeit: 80, eitelkeit: 85, humor: 65, schuechternheit: 10 }
  },
  {
    name: 'Western:Kanedere',
    label: 'Western:Kanedere',
    category: 'Western-Typen',
    description: 'Rechnet pragmatisch in materiellem Wert und Geld auf, lernt jedoch den Wert wahrer Beziehungen schätzen.',
    defaultTraits: { materialismus: 95, intelligenzorientierung: 80, disziplin: 75, freundlichkeit: 45, eitelkeit: 65 }
  },
  {
    name: 'Western:Kekkondere',
    label: 'Western:Kekkondere',
    category: 'Western-Typen',
    description: 'Stark auf feste Bindung, Heirat und Familiengründung fokussiert; plant weit in die Zukunft.',
    defaultTraits: { loyalitaet: 95, ordnungsliebe: 80, geduld: 75, freundlichkeit: 85, emotionalitaet: 80 }
  },
  {
    name: 'Kichidere',
    label: 'Kichidere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Unberechenbar, exzentrisch und sprunghaft im Verhalten; folgt eigenen, unkonventionellen Regeln.',
    defaultTraits: { impulsivitaet: 90, kreativitaet: 90, ordnungsliebe: 15, disziplin: 25, neugier: 90 }
  },
  {
    name: 'Kiredere',
    label: 'Kiredere',
    category: 'Subtypen & Varianten',
    description: 'Äußerlich sanftmütig und ruhig, neigt jedoch bei Provokation zu plötzlichen, intensiven Zornesausbrüchen.',
    defaultTraits: { temperament: 85, geduld: 40, emotionalitaet: 80, impulsivitaet: 75, mut: 80 }
  },
  {
    name: 'Kiridere',
    label: 'Kiridere',
    category: 'Subtypen & Varianten',
    description: 'Scharfsinnig, diszipliniert und fokussiert; stellt Pflichtbewusstsein und Logik an oberste Stelle.',
    defaultTraits: { disziplin: 95, intelligenzorientierung: 90, ordnungsliebe: 90, emotionalitaet: 25, durchsetzungsvermoegen: 85 }
  },
  {
    name: 'Kundere',
    label: 'Kundere',
    category: 'Subtypen & Varianten',
    description: 'Ruhig, nachdenklich und analytisch; drückt Gefühle sachlich, präzise und unaufgeregt aus.',
    defaultTraits: { geduld: 85, intelligenzorientierung: 85, emotionalitaet: 25, temperament: 20, ordnungsliebe: 75 }
  },
  {
    name: 'Kurodere',
    label: 'Kurodere',
    category: 'Subtypen & Varianten',
    description: 'Mysteriös, verschwiegen und von dunkler, geheimnisvoller Aura umgeben; öffnet sich nur Auserwählten.',
    defaultTraits: { geselligkeit: 20, misstrauen: 80, loyalitaet: 85, intelligenzorientierung: 75, emotionalitaet: 35 }
  },
  {
    name: 'Kuudere',
    label: 'Kuudere',
    category: 'Klassische Dere-Typen',
    description: 'Kühl, emotionslos und stoisch nach außen, verbirgt im Inneren jedoch tiefe Loyalität, Fürsorge und Wärme.',
    defaultTraits: { emotionalitaet: 20, temperament: 15, loyalitaet: 90, geduld: 85, intelligenzorientierung: 80, schuechternheit: 40 }
  },
  {
    name: 'Kuzudere',
    label: 'Kuzudere',
    category: 'Subtypen & Varianten',
    description: 'Nachlässig, frech oder ungezogen im Auftreten, besitzt aber tief im Inneren ein festes Ehrgefühl.',
    defaultTraits: { disziplin: 25, ordnungsliebe: 20, ehrlichkeit: 70, mut: 80, loyalitaet: 75, humor: 75 }
  },

  // M
  {
    name: 'M Dere',
    label: 'M Dere',
    category: 'Subtypen & Varianten',
    description: 'Nachgiebig und hingebungsvoll veranlagt; ordnet sich gern unter und schöpft Zufriedenheit aus Loyalität.',
    defaultTraits: { dominanz: 15, durchsetzungsvermoegen: 20, loyalitaet: 95, geduld: 85, empathie: 85 }
  },
  {
    name: 'Mayadere',
    label: 'Mayadere',
    category: 'Klassische Dere-Typen',
    description: 'Ursprünglich gefährlich, feindselig oder rivalisierend; wechselt aus Respekt oder Zuneigung auf die Seite des Partners.',
    defaultTraits: { mut: 90, dominanz: 85, loyalitaet: 85, misstrauen: 65, durchsetzungsvermoegen: 85 }
  },
  {
    name: 'Western:Megadere',
    label: 'Western:Megadere',
    category: 'Western-Typen',
    description: 'Bedingungslos vernarrt und enthusiastisch; drückt Bewunderung überschwänglich und offen aus.',
    defaultTraits: { loyalitaet: 98, freundlichkeit: 90, emotionalitaet: 90, geselligkeit: 85, schuechternheit: 15 }
  },
  {
    name: 'Megadere',
    label: 'Megadere',
    category: 'Klassische Dere-Typen',
    description: 'Überschwänglich verliebt und fanatisch treu; stellt die geschätzte Person über alle eigenen Belange.',
    defaultTraits: { loyalitaet: 100, freundlichkeit: 90, emotionalitaet: 95, impulsivitaet: 70, empathie: 85 }
  },

  // N
  {
    name: 'Western:Nemuidere',
    label: 'Western:Nemuidere',
    category: 'Western-Typen',
    description: 'Ständig müde, schläfrig und entspannt; sucht Ruhe, Gemütlichkeit und körperliche Nähe.',
    defaultTraits: { geduld: 80, impulsivitaet: 15, disziplin: 25, freundlichkeit: 70, temperament: 20 }
  },
  {
    name: 'Western:Nipadere',
    label: 'Western:Nipadere',
    category: 'Western-Typen',
    description: 'Stets lächelnd, fröhlich und gut gelaunt; nutzt Heiterkeit oft als Schutzschild gegen Sorgen.',
    defaultTraits: { freundlichkeit: 95, humor: 85, geselligkeit: 85, emotionalitaet: 65, ehrlichkeit: 55 }
  },
  {
    name: 'Nyandere',
    label: 'Nyandere',
    category: 'Subtypen & Varianten',
    description: 'Katzenartig verspielt, eigensinnig, anschmiegsam und zeitweise kratzbürstig.',
    defaultTraits: { kreativitaet: 85, impulsivitaet: 75, neugier: 90, humor: 80, disziplin: 35, freundlichkeit: 70 }
  },

  // O
  {
    name: 'Ojoudere',
    label: 'Ojoudere',
    category: 'Klassische Dere-Typen',
    description: 'Aus vornehmem Hause, aristokratisch und kultiviert; pflegt vorbildliche Etikette und hohe Haltung.',
    defaultTraits: { ordnungsliebe: 90, disziplin: 90, eitelkeit: 75, freundlichkeit: 75, selbstvertrauen: 80 }
  },
  {
    name: 'Onidere',
    label: 'Onidere',
    category: 'Subtypen & Varianten',
    description: 'Streng, fordernd und einschüchternd im Auftreten, im tiefsten Inneren jedoch loyal und beschützend.',
    defaultTraits: { dominanz: 90, temperament: 75, durchsetzungsvermoegen: 90, loyalitaet: 90, mut: 90 }
  },
  {
    name: 'Osadere',
    label: 'Osadere',
    category: 'Subtypen & Varianten',
    description: 'Reif, erfahren und fürsorglich; übernimmt wie ein Mentor gerne die Führung und Obhut.',
    defaultTraits: { geduld: 90, empathie: 85, disziplin: 85, selbstvertrauen: 85, loyalitaet: 90 }
  },
  {
    name: 'Western:Oujidere',
    label: 'Western:Oujidere',
    category: 'Western-Typen',
    description: 'Verhält sich wie ein eleganter Prinz; charmant, zuvorkommend, höflich und selbstbewusst.',
    defaultTraits: { selbstvertrauen: 85, freundlichkeit: 85, eitelkeit: 70, mut: 80, disziplin: 80 }
  },
  {
    name: 'Western:Oujodere',
    label: 'Western:Oujodere',
    category: 'Western-Typen',
    description: 'Stolz, nobel und majestätisch; verbindet adelige Eleganz mit Pflichtbewusstsein und Herzlichkeit.',
    defaultTraits: { ordnungsliebe: 85, disziplin: 85, eitelkeit: 75, loyalitaet: 85, freundlichkeit: 75 }
  },

  // R
  {
    name: 'Rindere',
    label: 'Rindere',
    category: 'Subtypen & Varianten',
    description: 'Kühl, elegant und unnahbar; verlangt hohe Standards und gegenseitigen Respekt.',
    defaultTraits: { disziplin: 90, ordnungsliebe: 85, dominanz: 75, emotionalitaet: 30, intelligenzorientierung: 85 }
  },
  {
    name: 'Roshidere',
    label: 'Roshidere',
    category: 'Subtypen & Varianten',
    description: 'Drückt Gefühle in einer Fremdsprache, Geheimcode oder im leisen Flüstern aus.',
    defaultTraits: { schuechternheit: 70, intelligenzorientierung: 85, emotionalitaet: 75, kreativitaet: 80, freundlichkeit: 75 }
  },

  // S
  {
    name: 'S Dere',
    label: 'S Dere',
    category: 'Subtypen & Varianten',
    description: 'Sadistisch oder neckend veranlagt; genießt es, andere spielerisch herauszufordern und zu dominieren.',
    defaultTraits: { dominanz: 95, humor: 80, selbstvertrauen: 90, mut: 85, schuechternheit: 10, empathie: 40 }
  },
  {
    name: 'Sashidere',
    label: 'Sashidere',
    category: 'Subtypen & Varianten',
    description: 'Eifersüchtig und besitzergreifend, zeigt dies jedoch durch überaus aufmerksame Fürsorge.',
    defaultTraits: { loyalitaet: 95, emotionalitaet: 85, misstrauen: 70, freundlichkeit: 75, ordnungsliebe: 70 }
  },
  {
    name: 'Shindere',
    label: 'Shindere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Schwermütig, melancholisch oder lebensmüde; schöpft durch vertraute Personen neuen Lebensmut.',
    defaultTraits: { emotionalitaet: 85, selbstvertrauen: 20, geselligkeit: 20, mut: 30, loyalitaet: 85 }
  },
  {
    name: 'Shittodere',
    label: 'Shittodere',
    category: 'Subtypen & Varianten',
    description: 'Leicht eifersüchtig und besorgt, die Zuneigung der geschätzten Person an andere zu verlieren.',
    defaultTraits: { misstrauen: 75, emotionalitaet: 85, loyalitaet: 90, schuechternheit: 50, selbstvertrauen: 35 }
  },
  {
    name: 'Shundere',
    label: 'Shundere',
    category: 'Subtypen & Varianten',
    description: 'Niedergeschlagen, traurig oder introvertiert; taut durch Ermutigung, Geduld und Wärme auf.',
    defaultTraits: { emotionalitaet: 80, schuechternheit: 85, geselligkeit: 25, selbstvertrauen: 25, loyalitaet: 80 }
  },
  {
    name: 'Western:Smugdere',
    label: 'Western:Smugdere',
    category: 'Western-Typen',
    description: 'Selbstgefällig, hämisch grinsend und siegessicher; freut sich über jeden Erfolg und teilt gerne Spitzen aus.',
    defaultTraits: { selbstvertrauen: 95, eitelkeit: 90, humor: 85, dominanz: 80, schuechternheit: 10 }
  },
  {
    name: 'Sunao Cool',
    label: 'Sunao Cool',
    category: 'Subtypen & Varianten',
    description: 'Natürlich, ungekünstelt, aufrichtig und dabei stets ruhig, gelassen und entspannt.',
    defaultTraits: { ehrlichkeit: 95, temperament: 20, geduld: 85, freundlichkeit: 80, selbstvertrauen: 75 }
  },
  {
    name: 'Sunao Heat',
    label: 'Sunao Heat',
    category: 'Subtypen & Varianten',
    description: 'Leidenschaftlich, direkt und ehrlich; drückt Begeisterung und Gefühle unverblümt aus.',
    defaultTraits: { ehrlichkeit: 95, temperament: 85, impulsivitaet: 80, emotionalitaet: 85, mut: 85 }
  },
  {
    name: 'Sunao Surreal',
    label: 'Sunao Surreal',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Skurril, unkonventionell und exzentrisch, dabei jedoch vollkommen authentisch und unverstellt.',
    defaultTraits: { ehrlichkeit: 90, kreativitaet: 95, neugier: 90, impulsivitaet: 70, ordnungsliebe: 25 }
  },

  // T
  {
    name: 'Western:Teasedere',
    label: 'Western:Teasedere',
    category: 'Western-Typen',
    description: 'Liebt es, andere gutmütig zu necken, spielerisch zu testen und Reaktionen hervorzulocken.',
    defaultTraits: { humor: 90, selbstvertrauen: 85, mut: 80, schuechternheit: 15, freundlichkeit: 75 }
  },
  {
    name: 'Teredere',
    label: 'Teredere',
    category: 'Subtypen & Varianten',
    description: 'Sehr schüchtern und verlegen; versucht Scham durch Schweigen, Lächeln oder Verstecken zu überspielen.',
    defaultTraits: { schuechternheit: 90, selbstvertrauen: 25, emotionalitaet: 80, freundlichkeit: 85, impulsivitaet: 40 }
  },
  {
    name: 'Western:Thugdere',
    label: 'Western:Thugdere',
    category: 'Western-Typen',
    description: 'Wirkt wie ein rauer Raufbold oder Bandit, zeigt im privaten Kreis jedoch einen herzlichen Kern.',
    defaultTraits: { mut: 90, durchsetzungsvermoegen: 85, temperament: 75, loyalitaet: 85, freundlichkeit: 55 }
  },
  {
    name: 'Tomedere',
    label: 'Tomedere',
    category: 'Subtypen & Varianten',
    description: 'Vernünftig, besonnen und mäßigend; fungiert als Friedensstifter und beruhigender Anker.',
    defaultTraits: { geduld: 95, emotionalitaet: 30, temperament: 20, disziplin: 85, empathie: 85 }
  },
  {
    name: 'Tsundere',
    label: 'Tsundere',
    category: 'Klassische Dere-Typen',
    description: 'Nach außen abweisend, stur und aufbrausend, im Inneren jedoch fürsorglich, verletzlich und loyal.',
    defaultTraits: { temperament: 85, schuechternheit: 75, loyalitaet: 90, ehrlichkeit: 45, emotionalitaet: 80, durchsetzungsvermoegen: 80 }
  },
  {
    name: 'Tsuyodere',
    label: 'Tsuyodere',
    category: 'Subtypen & Varianten',
    description: 'Gibt sich stark, stolz und unerschütterlich; gesteht sich eigene Schwächen oder Hilfe nur schwer ein.',
    defaultTraits: { mut: 90, selbstvertrauen: 85, durchsetzungsvermoegen: 90, eitelkeit: 70, emotionalitaet: 40 }
  },

  // U
  {
    name: 'Undere',
    label: 'Undere',
    category: 'Subtypen & Varianten',
    description: 'Stimmt allem wohlwollend zu und nickt alles ab, um der geschätzten Person stets zu gefallen.',
    defaultTraits: { dominanz: 15, durchsetzungsvermoegen: 20, freundlichkeit: 90, loyalitaet: 95, geduld: 85 }
  },
  {
    name: 'Usodere',
    label: 'Usodere',
    category: 'Subtypen & Varianten',
    description: 'Flunkert und schwindelt spielerisch, um wahre Gefühle, Zuneigung oder Verlegenheit zu verbergen.',
    defaultTraits: { ehrlichkeit: 30, kreativitaet: 85, humor: 80, intelligenzorientierung: 75, schuechternheit: 50 }
  },
  {
    name: 'Utsudere',
    label: 'Utsudere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Schwermütig, gehemmt und zweifelnd; sehnt sich nach Halt, Verständnis und Trost.',
    defaultTraits: { emotionalitaet: 85, selbstvertrauen: 20, schuechternheit: 80, geselligkeit: 30, loyalitaet: 80 }
  },
  {
    name: 'Uzadere',
    label: 'Uzadere',
    category: 'Subtypen & Varianten',
    description: 'Aufdringlich, energiegeladen und anstrengend, meint es aber durchweg gut und ehrlich.',
    defaultTraits: { geselligkeit: 95, impulsivitaet: 90, humor: 80, disziplin: 30, schuechternheit: 10, freundlichkeit: 85 }
  },

  // Y
  {
    name: 'Yandere',
    label: 'Yandere',
    category: 'Klassische Dere-Typen',
    description: 'Zunächst sanft und liebevoll, entwickelt jedoch eine obsessive, eifersüchtige und extreme Fixierung.',
    defaultTraits: { loyalitaet: 100, emotionalitaet: 95, misstrauen: 85, impulsivitaet: 80, dominanz: 75, empathie: 35 }
  },
  {
    name: 'Yandere (Yankii)',
    label: 'Yandere (Yankii)',
    category: 'Subtypen & Varianten',
    description: 'Raues Delinquenten-Auftreten kombiniert mit intensiver, besitzergreifender und wehrhafter Fixierung.',
    defaultTraits: { mut: 95, temperament: 90, loyalitaet: 100, dominanz: 85, misstrauen: 80, disziplin: 40 }
  },
  {
    name: 'Yoidere',
    label: 'Yoidere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Zeigt Emotionen, Offenheit und wahre Zuneigung vor allem in berauschter, gelöster Feierlaune.',
    defaultTraits: { impulsivitaet: 80, emotionalitaet: 80, geselligkeit: 85, humor: 85, disziplin: 35 }
  },

  // Z
  {
    name: 'Zondere',
    label: 'Zondere',
    category: 'Spezielle & Exzentrische Typen',
    description: 'Reagiert auf die geschätzte Person scheinbar mit Ekel oder Ablehnung, empfindet im Inneren jedoch tiefe Bindung.',
    defaultTraits: { temperament: 80, ehrlichkeit: 35, emotionalitaet: 80, schuechternheit: 70, loyalitaet: 85 }
  }
];

export const PERSONALITY_ARCHETYPE_OPTIONS: string[] = [
  '-',
  ...PERSONALITY_ARCHETYPES.map(a => a.name)
];

export function getArchetypeDefinition(name?: string): PersonalityArchetypeDefinition | undefined {
  if (!name || name === '-') return undefined;
  const cleanName = name.trim().toLowerCase();
  return PERSONALITY_ARCHETYPES.find(a => 
    a.name.toLowerCase() === cleanName || 
    a.label.toLowerCase() === cleanName ||
    a.name.toLowerCase().replace('western:', '') === cleanName
  );
}

export const DEFAULT_PERSONALITY_TRAITS: Required<PersonalityTraits> = {
  freundlichkeit: 50,
  geselligkeit: 50,
  schuechternheit: 50,
  selbstvertrauen: 50,
  geduld: 50,
  temperament: 50,
  mut: 50,
  risikobereitschaft: 50,
  empathie: 50,
  ehrlichkeit: 50,
  loyalitaet: 50,
  misstrauen: 50,
  dominanz: 50,
  durchsetzungsvermoegen: 50,
  disziplin: 50,
  neugier: 50,
  kreativitaet: 50,
  intelligenzorientierung: 50,
  emotionalitaet: 50,
  impulsivitaet: 50,
  humor: 50,
  eitelkeit: 50,
  materialismus: 50,
  ordnungsliebe: 50
};

export function applyArchetypeToTraits(
  currentTraits: PersonalityTraits | undefined,
  archetypeName?: string
): PersonalityTraits {
  const base: PersonalityTraits = currentTraits && Object.keys(currentTraits).length > 0
    ? { ...currentTraits }
    : { ...DEFAULT_PERSONALITY_TRAITS };

  if (!archetypeName || archetypeName === '-') {
    return base;
  }

  const def = getArchetypeDefinition(archetypeName);
  if (!def || !def.defaultTraits) {
    return base;
  }

  const result: PersonalityTraits = { ...base };
  Object.entries(def.defaultTraits).forEach(([traitKey, traitVal]) => {
    if (typeof traitVal === 'number') {
      (result as any)[traitKey] = traitVal;
    }
  });

  return result;
}

