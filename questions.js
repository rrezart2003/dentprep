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
 * Get all flashcards (alias for fetchQuestions).
 * @returns {Promise<Array>}
 */
export async function getFlashcards() {
  return fetchQuestions();
}

/**
 * Get questions filtered by category (case-insensitive match).
 * @param {string} category
 * @returns {Promise<Array>}
 */
export async function getCategoryQuestions(category) {
  const questions = await fetchQuestions();
  const target = category.toLowerCase();
  return questions.filter(q => q.category.toLowerCase() === target);
}

/**
 * Get questions filtered by difficulty level (1-3).
 * @param {number} level
 * @returns {Promise<Array>}
 */
export async function getDifficultyQuestions(level) {
  const questions = await fetchQuestions();
  return questions.filter(q => q.difficulty === level);
}

/**
 * Get a list of all unique categories.
 * @returns {Promise<string[]>}
 */
export async function getCategories() {
  const questions = await fetchQuestions();
  return [...new Set(questions.map(q => q.category))];
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
