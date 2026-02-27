// questions.js — Dynamic flashcard loader for DentPrep PWA
// Fetches questions.json from GitHub Pages with offline fallback

const QUESTIONS_URL = 'https://rrezart2003.github.io/dentprep/questions.json';

let _cachedQuestions = null;

/**
 * Fetch all questions from the remote JSON file.
 * Falls back to an empty array if offline or fetch fails.
 * Caches the result for subsequent calls within the same session.
 * @returns {Promise<Array>}
 */
export async function fetchQuestions() {
  if (_cachedQuestions) return _cachedQuestions;

  try {
    const response = await fetch(QUESTIONS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    _cachedQuestions = await response.json();
  } catch (err) {
    console.warn('Failed to fetch questions, using fallback:', err.message);
    _cachedQuestions = [];
  }

  return _cachedQuestions;
}

/**
 * Get all questions (alias for fetchQuestions).
 * @returns {Promise<Array>}
 */
export async function getAllQuestions() {
  return fetchQuestions();
}

/**
 * Get all flashcards (alias for fetchQuestions).
 * @returns {Promise<Array>}
 */
export async function getFlashcards() {
  return fetchQuestions();
}

/**
 * Get questions filtered by subject/category (case-insensitive match).
 * Checks both "subject" and "category" fields for compatibility.
 * @param {string} subject
 * @returns {Promise<Array>}
 */
export async function getQuestionsBySubject(subject) {
  const questions = await fetchQuestions();
  const target = subject.toLowerCase();
  return questions.filter(q =>
    (q.subject && q.subject.toLowerCase() === target) ||
    (q.category && q.category.toLowerCase() === target)
  );
}

/**
 * Get questions filtered by difficulty.
 * Supports both string ("easy","medium","hard") and numeric (1,2,3) formats.
 * @param {string|number} level
 * @returns {Promise<Array>}
 */
export async function getQuestionsByDifficulty(level) {
  const questions = await fetchQuestions();
  const numMap = { easy: 1, medium: 2, hard: 3 };
  const strMap = { 1: 'easy', 2: 'medium', 3: 'hard' };

  return questions.filter(q => {
    if (typeof level === 'string') {
      return q.difficulty === level || q.difficulty === numMap[level.toLowerCase()];
    }
    return q.difficulty === level || q.difficulty === strMap[level];
  });
}

/**
 * Get questions filtered by academic year (1-5).
 * Only applies to questions that have a "year" field.
 * @param {number} year
 * @returns {Promise<Array>}
 */
export async function getQuestionsByYear(year) {
  const questions = await fetchQuestions();
  return questions.filter(q => q.year === year);
}

/**
 * Get questions filtered by category (legacy alias for getQuestionsBySubject).
 * @param {string} category
 * @returns {Promise<Array>}
 */
export async function getCategoryQuestions(category) {
  return getQuestionsBySubject(category);
}

/**
 * Get questions filtered by difficulty level (legacy numeric alias).
 * @param {number} level
 * @returns {Promise<Array>}
 */
export async function getDifficultyQuestions(level) {
  return getQuestionsByDifficulty(level);
}

/**
 * Get a list of all unique subjects/categories.
 * @returns {Promise<string[]>}
 */
export async function getCategories() {
  const questions = await fetchQuestions();
  return [...new Set(questions.map(q => q.subject || q.category))];
}

/**
 * Get a random subset of questions for quiz mode.
 * @param {number} count - Number of questions to return
 * @returns {Promise<Array>}
 */
export async function getRandomQuestions(count = 10) {
  const questions = await fetchQuestions();
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Force re-fetch from remote (clears cache).
 * @returns {Promise<Array>}
 */
export async function refreshQuestions() {
  _cachedQuestions = null;
  return fetchQuestions();
}
