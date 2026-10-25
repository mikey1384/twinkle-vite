// A question type as members read it (Train's deck, drills, boss prep).
const LABELS: Record<string, string> = {
  'cae.uoe.clozeMC': 'Multiple-choice cloze',
  'cae.uoe.openCloze': 'Open cloze',
  'cae.uoe.wordFormation': 'Word formation',
  'cae.uoe.keyWordTransformation': 'Key word transformations',
  'cae.r.longTextMC': 'Reading: meaning and attitude',
  'cae.r.crossText': 'Reading: comparing writers',
  'cae.r.gappedParagraphs': 'Reading: missing paragraphs',
  'cae.r.multipleMatching': 'Reading: matching details',
  'cae.w.essay': 'Writing: essay',
  'cae.w.choice': 'Writing: chosen task',
  'cae.l.extractsMC': 'Listening: short extracts',
  'cae.l.sentenceCompletion': 'Listening: sentence completion',
  'cae.l.interviewMC': 'Listening: interview',
  'cae.l.multipleMatching': 'Listening: matching speakers',
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
  'khist.thematic': 'Themes',
  'hanja.hunEum': 'Meaning and sound',
  'gmat.v.cr': 'Critical reasoning',
  'gmat.v.rc': 'Reading comprehension',
  'lsat.lr': 'Logical reasoning',
  'lsat.rc': 'Reading comprehension',
  'lsat.rc.comparative': 'Comparative reading',
  'ielts.l.mc3': 'Listening: multiple choice',
  'ielts.r.mc4': 'Multiple choice',
  'ielts.r.tfng': 'True / False / Not Given',
  'ielts.r.ynng': 'Yes / No / Not Given',
  'ielts.r.summaryWordBox': 'Summary (word box)',
  'ielts.w.task1': 'Writing Task 1',
  'ielts.w.task2': 'Writing Task 2',
  'sat.math.advanced': 'Advanced math',
  'sat.math.data': 'Problem-solving and data',
  'sat.math.geometry': 'Geometry and trigonometry',
  'sat.rw.crossText': 'Cross-text connections',
  'sat.rw.conventions': 'Standard English conventions',
  'sat.rw.evidenceQuant': 'Evidence (quantitative)',
  'sat.rw.evidenceText': 'Evidence (textual)',
  'sat.rw.synthesis': 'Rhetorical synthesis',
  'toeflj.lfm.cloze': 'Language form and meaning',
  'toeflj.r.nonacademic': 'Non-academic reading',
  'toeflj.r.academic': 'Academic reading',
  'toeflj.r.narrative': 'Narrative reading',
  'eng.implied': 'Implied meaning',
  'eng.l.todo': 'Listening: what to do',
  'eng.l.setTopic': 'Listening: topic (paired)',
  'eng.l.setNotMentioned': 'Listening: not mentioned (paired)',
  'ltm.ahead': 'Ahead of grade',
  'ltm.apply': 'Applied problems',
  'ltm.calc': 'Calculation',
  'ltm.concept': 'Concepts',
  'ltm.thinking': 'Thinking',
  'ket.l.dialogueMC': 'Listening: short conversations',
  'ket.l.gistMC': 'Listening: main idea',
  'ket.l.notesGap': 'Listening: fill in the notes',
  'ket.l.pictureMC': 'Listening: pictures',
  'ket.r.clozeMC': 'Cloze (multiple choice)',
  'ket.r.longTextMC': 'Long text',
  'ket.r.matching3': 'Matching',
  'ket.w.email': 'Writing: email',
  'ket.w.pictureStory': 'Writing: picture story',
  'lt.g.completion': 'Grammar: complete the sentence',
  'lt.g.error': 'Grammar: find the error',
  'lt.r.passage': 'Reading passage',
  'lt.v.antonym': 'Vocabulary: opposites',
  'lt.v.completion': 'Vocabulary: complete the sentence',
  'lt.v.definition': 'Vocabulary: definitions',
  'lt.v.synonym': 'Vocabulary: same meaning',
  'tosel.l.listenSpeak': 'Listening: listen and speak',
  'tosel.l.recognize': 'Listening: recognize',
  'tosel.l.respond': 'Listening: respond',
  'tosel.l.retell': 'Listening: retell',
  'tosel.r.general': 'General reading',
  'tosel.r.practical': 'Practical reading',
  // 내신: the school test's own sections
  'kor.hs.language': 'Grammar',
  'kor.hs.lit.poem': 'Poetry',
  'kor.hs.lit.prose': 'Prose',
  'kor.hs.read': 'Reading',
  'kor.hs.outside': 'Outside the textbook',
  'kor.hs.outside.killer': 'Outside the textbook (hardest)',
  'eng.hs.long': 'Long passage',
  'eng.hs.outside': 'Outside the textbook',
  'eng.hs.vocab': 'Vocabulary',
  'eng.hs.essay.cond': 'Essay: follow the conditions',
  'eng.hs.essay.summary': 'Essay: summary',
  'eng.hs.essay.topic': 'Essay: topic',
  'eng.hs.short.fix': 'Short answer: fix the error',
  'eng.hs.short.form': 'Short answer: word form',
  'eng.hs.short.keyword': 'Short answer: key word',
  'eng.hs.short.order': 'Short answer: word order',
  'intsci.bio': 'Biology',
  'intsci.chem': 'Chemistry',
  'intsci.earth': 'Earth science',
  'intsci.phys': 'Physics',
  'intsci.hs.calc': 'Calculation',
  'intsci.hs.term': 'Key terms',
  'intsoc.geo': 'Geography',
  'intsoc.fusion': 'Combined topics',
  'math.hs.counting': 'Counting',
  'math.hs.equation': 'Equations and inequalities',
  'math.hs.matrix': 'Matrices',
  'math.hs.poly': 'Polynomials'
};

// a type's level or answer form, after its subject ("math.hs.poly.killer")
const SUFFIXES: Record<string, string> = {
  short: 'short answer',
  spr: 'type your answer',
  essay: 'essay',
  basic: 'basic',
  hard: 'hard',
  killer: 'hardest'
};

export function typeLabel(type: string): string {
  if (LABELS[type]) return LABELS[type];
  const parts = type.split('.');
  const last = parts[parts.length - 1];
  // a subject-wide type ("kor.hs.short") is the form alone
  if (SUFFIXES[last] && parts.length > 1) {
    const base = parts.slice(0, -1).join('.');
    const baseLabel = LABELS[base] || (isSchoolOnly(base) ? '' : typeLabel(base));
    const form = SUFFIXES[last];
    return baseLabel
      ? `${baseLabel} (${form})`
      : form.charAt(0).toUpperCase() + form.slice(1);
  }
  // the same subject on the 내신 paper reads as the 수능 one ("intsoc.hs.geo")
  const school = parts.indexOf('hs');
  if (school > 0) {
    const plain = [...parts.slice(0, school), ...parts.slice(school + 1)].join('.');
    if (LABELS[plain]) return LABELS[plain];
  }
  // eng.l.longReply → Listening: long reply; eng.blankPhrase → Blank phrase
  const listening = parts[1] === 'l';
  const words = last.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  const text = words.charAt(0).toUpperCase() + words.slice(1);
  return listening ? `Listening: ${words}` : text;
}

// "kor.hs": only the exam and the school marker, no subject of its own
function isSchoolOnly(base: string) {
  const parts = base.split('.');
  return parts.length === 2 && parts[1] === 'hs';
}
