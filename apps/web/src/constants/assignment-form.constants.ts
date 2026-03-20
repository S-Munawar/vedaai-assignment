export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));

export const SUBJECT_OPTIONS = [
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'English',
  'History',
  'Geography',
  'Computer Science',
] as const;

export const CHAPTER_OPTIONS_BY_SUBJECT: Record<string, string[]> = {
  physics: ['Motion', 'Force and Laws of Motion', 'Work and Energy', 'Gravitation', 'Light'],
  chemistry: [
    'Matter in Our Surroundings',
    'Atoms and Molecules',
    'Structure of Atom',
    'Acids Bases and Salts',
    'Carbon and Its Compounds',
  ],
  biology: ['Cell', 'Tissues', 'Life Processes', 'Control and Coordination', 'Heredity and Evolution'],
  mathematics: ['Number Systems', 'Polynomials', 'Linear Equations', 'Triangles', 'Statistics'],
  english: ['Reading Comprehension', 'Grammar', 'Writing Skills', 'Literature', 'Poetry'],
  history: [
    'The French Revolution',
    'Nationalism in Europe',
    'Print Culture',
    'India and the Contemporary World',
    'Nazism and the Rise of Hitler',
  ],
  geography: [
    'Resources and Development',
    'Forest and Wildlife',
    'Water Resources',
    'Agriculture',
    'Minerals and Energy Resources',
  ],
  'computer science': [
    'Computer Fundamentals',
    'Programming Basics',
    'Data Structures',
    'Database Concepts',
    'Networking',
  ],
};

export function getChapterSuggestions(subject: string): string[] {
  const normalizedSubject = subject.trim().toLowerCase();

  if (!normalizedSubject) {
    return [];
  }

  if (CHAPTER_OPTIONS_BY_SUBJECT[normalizedSubject]) {
    return CHAPTER_OPTIONS_BY_SUBJECT[normalizedSubject] ?? [];
  }

  const closestSubjectKey = Object.keys(CHAPTER_OPTIONS_BY_SUBJECT).find((subjectKey) =>
    subjectKey.includes(normalizedSubject),
  );

  return closestSubjectKey ? (CHAPTER_OPTIONS_BY_SUBJECT[closestSubjectKey] ?? []) : [];
}
