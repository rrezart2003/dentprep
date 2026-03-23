// questions.js — Dynamic flashcard loader for DentPrep PWA
// Fetches questions.json (SUBJECTS array) with offline fallback

const QUESTIONS_URL = 'https://rrezart2003.github.io/dentprep/data/questions.json';

let _cachedSubjects = null;

/**
 * Fetch all subjects from the remote JSON file.
 * @returns {Promise<Array>} Array of subject objects
 */
export async function fetchSubjects() {
  if (_cachedSubjects) return _cachedSubjects;
  try {
    const response = await fetch(QUESTIONS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    _cachedSubjects = await response.json();
  } catch (err) {
    console.warn('Failed to fetch questions:', err.message);
    _cachedSubjects = [];
  }
  return _cachedSubjects;
}

/**
 * Flatten all questions from all subjects/topics.
 * @returns {Promise<Array>}
 */
export async function getAllQuestions() {
  const subjects = await fetchSubjects();
  return subjects.flatMap(s => s.topics.flatMap(t => t.questions));
}

/**
 * Get all questions for a given subject (case-insensitive match on subject id or name).
 * @param {string} subject
 * @returns {Promise<Array>}
 */
export async function getQuestionsBySubject(subject) {
  const subjects = await fetchSubjects();
  const target = subject.toLowerCase();
  const sub = subjects.find(s =>
    s.id.toLowerCase() === target ||
    (s.name.en && s.name.en.toLowerCase() === target) ||
    (s.name.sq && s.name.sq.toLowerCase() === target)
  );
  return sub ? sub.topics.flatMap(t => t.questions) : [];
}

/**
 * Get questions filtered by difficulty (not applicable to MCQ format, stub for compatibility).
 * @param {string|number} level
 * @returns {Promise<Array>}
 */
export async function getQuestionsByDifficulty(level) {
  const all = await getAllQuestions();
  return all.filter(q => q.difficulty === level);
}

/**
 * Get questions filtered by year (not applicable to current MCQ format, stub for compatibility).
 * @param {number} year
 * @returns {Promise<Array>}
 */
export async function getQuestionsByYear(year) {
  const all = await getAllQuestions();
  return all.filter(q => q.year === year);
}

/**
 * Get all flashcards (alias).
 * @returns {Promise<Array>}
 */
export async function getFlashcards() {
  return getAllQuestions();
}

/**
 * Get a random subset of questions for quiz mode.
 * @param {number} count
 * @returns {Promise<Array>}
 */
export async function getRandomQuestions(count = 10) {
  const questions = await getAllQuestions();
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a list of all unique subject names.
 * @returns {Promise<string[]>}
 */
export async function getCategories() {
  const subjects = await fetchSubjects();
  return subjects.map(s => s.name.en);
}

/**
 * Force re-fetch from remote (clears cache).
 * @returns {Promise<Array>}
 */
export async function refreshQuestions() {
  _cachedSubjects = null;
  return fetchSubjects();
}
