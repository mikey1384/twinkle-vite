// A question type as members read it (Train's deck, drills, boss prep).
const LABELS: Record<string, string> = {
  'math.algebra': 'Algebra',
  'math.calculus': 'Calculus',
  'math.stats': 'Probability and statistics',
  'kor.speech': 'Speech',
  'kor.language': 'Grammar',
  'kor.reading': 'Reading',
  'kor.readwrite': 'Reading and writing',
  'kor.writing': 'Writing',
  'kor.lit': 'Literature',
  'khist.prehistory': 'Prehistory',
  'khist.ancient': 'Ancient kingdoms',
  'khist.goryeo': 'Goryeo',
  'khist.joseonEarly': 'Early Joseon',
  'khist.joseonLate': 'Late Joseon',
  'khist.opening': 'Opening and reform',
  'khist.colonial': 'Colonial era',
  'khist.contemporary': 'Modern Korea',
  'khist.thematic': 'Themes'
};

export function typeLabel(type: string) {
  const short = type.endsWith('.short');
  const base = short ? type.slice(0, -'.short'.length) : type;
  const known = LABELS[base];
  if (known) return short ? `${known} (short answer)` : known;
  // eng.l.longReply → Listening: long reply; eng.blankPhrase → Blank phrase
  const parts = base.split('.');
  const listening = parts[1] === 'l';
  const words = parts[parts.length - 1]
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();
  const text = words.charAt(0).toUpperCase() + words.slice(1);
  return listening ? `Listening: ${words}` : text;
}
