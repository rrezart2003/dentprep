
// ===== UI TRANSLATIONS =====
const UI = {
  en: {
    subtitle: "Ace your dental exams",
    answered: "Answered", accuracy: "Accuracy", streak: "Best Streak",
    subjects: "Subjects", back: "← Back", quit: "✕ Quit",
    next: "Next →", seeResults: "See Results",
    retry: "Try Again", backHome: "Back to Home",
    questions: "questions",
    modeQuiz: "Questions", modeQuizDesc: "Multiple choice tests",
    modeFc: "Flashcards", modeFcDesc: "Study with summary cards",
    tapReveal: "👆 Tap to reveal answer", fcAnswer: "Answer",
    fcKnew: "✓ Knew it", fcDidnt: "✗ Didn\'t know",
    results: [
      ["Excellent! 🎉","You nailed it!"],
      ["Good job! 💪","Keep reviewing the ones you missed."],
      ["Getting there 📚","Review the explanations and try again."],
      ["Keep studying 🔄","Read through the topic again before retrying."]
    ],
    weakAreas: "Weak Areas", weakAreasDesc: "Practice questions you got wrong",
    history: "History", historyDesc: "View past exam results & analytics",
    reviewMistakes: "🔄 Review Mistakes", share: "📤 Share",
    noWeakQuestions: "No weak questions! Keep studying.",
    examHistory: "Exam History", back: "← Back",
    last5Avg: "Last 5 avg", overallAvg: "Overall avg",
    noExamHistory: "No exam history yet. Take an exam first!",
    online: "Online", offline: "Offline",
    streakDay: "day streak", streakDays: "day streak", longestStreak: "longest",
    searchPlaceholder: "Search questions...", matchingQuestions: "matching questions",
    practiceTimer: "Per-question timer", timerOff: "Off",
    copiedClipboard: "Copied to clipboard!"
  },
  sq: {
    subtitle: "Përgatitu për provimet e stomatologjisë",
    answered: "Përgjigjur", accuracy: "Saktësia", streak: "Seria Më e Mirë",
    subjects: "Lëndët", back: "← Kthehu", quit: "✕ Dil",
    next: "Tjetra →", seeResults: "Shiko Rezultatet",
    retry: "Provo Përsëri", backHome: "Kthehu në Ballinë",
    questions: "pyetje",
    modeQuiz: "Pyetje", modeQuizDesc: "Teste me zgjedhje të shumëfishtë",
    modeFc: "Flashcards", modeFcDesc: "Mëso me karta përmbledhëse",
    tapReveal: "👆 Kliko për përgjigjen", fcAnswer: "Përgjigja",
    fcKnew: "✓ E dija", fcDidnt: "✗ Nuk e dija",
    results: [
      ["Shkëlqyeshëm! 🎉","E kalove me sukses!"],
      ["Punë e mirë! 💪","Rishiko ato që i gabove."],
      ["Je në rrugë! 📚","Rishiko shpjegimet dhe provo përsëri."],
      ["Vazhdo mësimin 🔄","Lexo temën përsëri para se të provosh."]
    ],
    weakAreas: "Pikat e Dobëta", weakAreasDesc: "Praktiko pyetjet që i gabove",
    history: "Historiku", historyDesc: "Shiko rezultatet e provimeve & analitikën",
    reviewMistakes: "🔄 Rishiko Gabimet", share: "📤 Shpërndaj",
    noWeakQuestions: "Nuk ka pyetje të dobëta! Vazhdo mësimin.",
    examHistory: "Historiku i Provimeve", back: "← Kthehu",
    last5Avg: "Mesatarja e 5 të fundit", overallAvg: "Mesatarja e përgjithshme",
    noExamHistory: "Nuk ka historik provimesh. Jep një provim së pari!",
    online: "Online", offline: "Offline",
    streakDay: "ditë seria", streakDays: "ditë seria", longestStreak: "më e gjata",
    searchPlaceholder: "Kërko pyetje...", matchingQuestions: "pyetje përputhen",
    practiceTimer: "Kohëmatësi për pyetje", timerOff: "Joaktiv",
    copiedClipboard: "U kopjua në clipboard!"
  }
};

// ===== QUESTION BANK (BILINGUAL) =====
let SUBJECTS = [];

async function loadQuestions() {
  try {
    const resp = await fetch('data/questions.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    SUBJECTS = await resp.json();
  } catch (err) {
    console.warn('Failed to load questions.json:', err.message);
    SUBJECTS = [];
  }
}

// ===== STATE =====
let lang = localStorage.getItem('dentprep_lang') || null;
let stats = JSON.parse(localStorage.getItem('dentprep_stats') || '{"answered":0,"correct":0,"streak":0,"best_streak":0,"topicScores":{}}');
let bookmarks = JSON.parse(localStorage.getItem('dentprep_bookmarks') || '[]');
let weakQuestions = JSON.parse(localStorage.getItem('dentprep_wrong') || '[]');
let streakData = JSON.parse(localStorage.getItem('dentprep_streak') || '{"lastDate":"","currentStreak":0,"longestStreak":0}');
let sessionWrongQuestions = [];
let practiceTimerInterval = null;
let practiceTimerSeconds = 0;
let searchFilteredQuestionIds = null;

let currentSubject = null;
let currentTopic = null;
let currentQuestions = [];
let currentIdx = 0;
let quizCorrect = 0;
let answered = false;

// ===== HELPERS =====
const t = (obj) => typeof obj === 'object' ? (obj[lang] || obj.en) : obj;
const ui = (key) => UI[lang]?.[key] || UI.en[key];

// ===== LANGUAGE =====
function setLang(l) {
  lang = l;
  localStorage.setItem('dentprep_lang', l);
  document.getElementById('lang-switch-btn').textContent = l === 'sq' ? '🇦🇱 SQ' : '🇬🇧 EN';
  showScreen('home');
}

// ===== THEME =====
function initTheme() {
  const saved = localStorage.getItem('dentprep_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = saved === 'light' ? '☀️' : '🌙';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('dentprep_theme', next);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = next === 'light' ? '☀️' : '🌙';
  // Re-render settings if visible
  if (document.getElementById('settings')?.classList.contains('active')) showSettingsScreen();
}
initTheme();

// ===== OFFLINE INDICATOR =====
function updateOnlineStatus() {
  const el = document.getElementById('offline-indicator');
  if (!el) return;
  if (navigator.onLine) {
    el.textContent = '🟢 ' + (UI[lang]?.online || 'Online');
  } else {
    el.textContent = '🔴 ' + (UI[lang]?.offline || 'Offline');
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ===== STREAK =====
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (streakData.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streakData.lastDate === yesterday) {
    streakData.currentStreak++;
  } else if (streakData.lastDate !== today) {
    streakData.currentStreak = 1;
  }
  streakData.lastDate = today;
  if (streakData.currentStreak > streakData.longestStreak) {
    streakData.longestStreak = streakData.currentStreak;
  }
  localStorage.setItem('dentprep_streak', JSON.stringify(streakData));
}

function renderStreak() {
  const el = document.getElementById('streak-display');
  if (!el) return;
  if (streakData.currentStreak > 0) {
    const dayText = ui('streakDays') || 'day streak';
    const longestText = ui('longestStreak') || 'longest';
    el.textContent = `🔥 ${streakData.currentStreak} ${dayText}` + (streakData.longestStreak > streakData.currentStreak ? ` · ${streakData.longestStreak} ${longestText}` : '');
  } else {
    el.textContent = '';
  }
}

// ===== TOAST =====
function showToast(message, duration = 3000) {
  const container = document.getElementById('toast-container');
  if (container) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.className = 'toast hide'; setTimeout(() => toast.remove(), 400); }, duration);
    return;
  }
  // Fallback to old toast element
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ===== WEAK AREAS =====
function addWeakQuestion(questionId) {
  if (!weakQuestions.includes(questionId)) {
    weakQuestions.push(questionId);
    localStorage.setItem('dentprep_wrong', JSON.stringify(weakQuestions));
  }
}
function removeWeakQuestion(questionId) {
  const idx = weakQuestions.indexOf(questionId);
  if (idx >= 0) {
    weakQuestions.splice(idx, 1);
    localStorage.setItem('dentprep_wrong', JSON.stringify(weakQuestions));
  }
}
function getQuestionId(q) {
  return (q.q.en || '') + '|' + q.correct;
}
function startWeakAreas() {
  if (weakQuestions.length === 0) {
    alert(ui('noWeakQuestions'));
    return;
  }
  const allQs = [];
  SUBJECTS.forEach(s => s.topics.forEach(tp => tp.questions.forEach(q => {
    if (weakQuestions.includes(getQuestionId(q))) allQs.push(q);
  })));
  if (allQs.length === 0) { alert(ui('noWeakQuestions')); return; }
  currentSubject = { id: 'weak', name: { en: 'Weak Areas', sq: 'Pikat e Dobëta' }, emoji: '🔴' };
  const topic = { name: { en: 'Weak Areas', sq: 'Pikat e Dobëta' }, questions: allQs };
  startQuiz(topic);
}

// ===== NAVIGATION =====
function showScreen(id) {
  if (id !== 'lang-select' && !lang) { id = 'lang-select'; }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'mode-config') initModeConfig();
  if (id === 'exam-history') renderExamHistory();
  if (id === 'settings') showSettingsScreen();
  if (id === 'challenge') showChallengeScreen();
  if (id === 'achievements') showAchievementsScreen();
  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { home: 'nav-home', challenge: 'nav-challenge', achievements: 'nav-achievements', settings: 'nav-settings' };
  const navBtn = document.getElementById(navMap[id]);
  if (navBtn) navBtn.classList.add('active');
}

// ===== HOME =====
function renderHome() {
  document.getElementById('home-subtitle').textContent = ui('subtitle');
  document.getElementById('lbl-answered').textContent = ui('answered');
  document.getElementById('lbl-accuracy').textContent = ui('accuracy');
  document.getElementById('lbl-streak').textContent = ui('streak');
  document.getElementById('stat-answered').textContent = stats.answered;
  document.getElementById('stat-accuracy').textContent = stats.answered ? Math.round(stats.correct/stats.answered*100)+'%' : '0%';
  document.getElementById('stat-streak').textContent = stats.best_streak;
  // Localize mode buttons
  if (lang === 'sq') {
    document.getElementById('home-exam-title').textContent = 'Provimi';
    document.getElementById('home-exam-desc').textContent = 'Testo veten me kohë dhe rezultat';
    document.getElementById('home-q-title').textContent = 'Pyetje';
    document.getElementById('home-q-desc').textContent = 'Mëso me përgjigje të menjëhershme';
    document.getElementById('home-fc-title').textContent = 'Flashcards';
    document.getElementById('home-fc-desc').textContent = 'Karta përmbledhëse për rishikim';
  } else {
    document.getElementById('home-exam-title').textContent = 'Exam';
    document.getElementById('home-exam-desc').textContent = 'Test yourself with timer and scoring';
    document.getElementById('home-q-title').textContent = 'Questions';
    document.getElementById('home-q-desc').textContent = 'Learn with instant feedback';
    document.getElementById('home-fc-title').textContent = 'Flashcards';
    document.getElementById('home-fc-desc').textContent = 'Review cards for quick study';
  }
  // Weak areas button
  document.getElementById('home-weak-title').textContent = ui('weakAreas');
  const weakCount = weakQuestions.length;
  document.getElementById('home-weak-desc').textContent = (ui('weakAreasDesc') || 'Practice questions you got wrong') + (weakCount > 0 ? ` (${weakCount})` : '');
  // History button
  document.getElementById('home-history-title').textContent = ui('history');
  document.getElementById('home-history-desc').textContent = ui('historyDesc');
  // Streak
  renderStreak();
  // Online status
  updateOnlineStatus();
  // Update streak pill
  const streakPillData = JSON.parse(localStorage.getItem('dentprep_streak') || '{}');
  const pill = document.getElementById('streak-pill');
  if (pill) pill.textContent = '🔥 ' + (streakPillData.currentStreak || 0);
  // Update online status indicator
  const statusEl = document.getElementById('online-status');
  if (statusEl) statusEl.textContent = navigator.onLine ? '🟢' : '🔴';
  // Render subject progress overview
  renderSubjectProgress();
}

function renderSubjectProgress() {
  let container = document.getElementById('subject-progress');
  if (!container) {
    container = document.createElement('div');
    container.id = 'subject-progress';
    container.style.cssText = 'margin:16px 0;padding:0 4px;';
    const homeContent = document.querySelector('#home .content');
    if (homeContent) homeContent.appendChild(container);
  }
  if (!SUBJECTS.length) { container.innerHTML = ''; return; }
  
  const title = lang === 'sq' ? 'Progresi sipas lëndës' : 'Progress by Subject';
  const resetText = lang === 'sq' ? 'Reseto' : 'Reset';
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.7);">${title}</div>
    <button onclick="resetAllStats()" style="background:rgba(214,48,49,0.2);border:1px solid rgba(214,48,49,0.4);color:#e17055;padding:4px 12px;border-radius:8px;font-size:11px;cursor:pointer;">${resetText}</button>
  </div>`;
  
  SUBJECTS.forEach(sub => {
    const totalQs = sub.topics.reduce((a, tp) => a + tp.questions.length, 0);
    // Count answered questions for this subject from topicScores
    let answeredQs = 0;
    let correctQs = 0;
    Object.keys(stats.topicScores).forEach(key => {
      if (key.startsWith(sub.id + '_') || key === sub.id) {
        answeredQs += stats.topicScores[key].answered || 0;
        correctQs += stats.topicScores[key].correct || 0;
      }
    });
    const pct = totalQs > 0 ? Math.min(100, Math.round(answeredQs / totalQs * 100)) : 0;
    const color = pct >= 80 ? '#00b894' : pct >= 40 ? '#fdcb6e' : '#6c5ce7';
    html += `<div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:3px;">
        <span>${sub.emoji} ${t(sub.name)}</span>
        <span>${pct}%${answeredQs > 0 ? ' (' + correctQs + '/' + answeredQs + ')' : ''}</span>
      </div>
      <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:6px;overflow:hidden;">
        <div style="background:${color};height:100%;width:${pct}%;border-radius:4px;transition:width 0.3s;"></div>
      </div>
    </div>`;
  });
  
  // Bookmarks count
  if (bookmarks.length > 0) {
    const bmText = lang === 'sq' ? `⭐ ${bookmarks.length} pyetje të ruajtura` : `⭐ ${bookmarks.length} bookmarked questions`;
    html += `<div style="margin-top:12px;text-align:center;font-size:13px;color:rgba(255,255,255,0.5);">${bmText}</div>`;
  }
  
  container.innerHTML = html;
}

// ===== TOPICS =====
function openSubject(sub) {
  currentSubject = sub;
  document.getElementById('back-mode').textContent = ui('back');
  document.getElementById('mode-subject-name').textContent = sub.emoji + ' ' + t(sub.name);
  document.getElementById('mode-subject-desc').textContent = t(sub.desc);
  document.getElementById('mode-quiz-title').textContent = ui('modeQuiz');
  document.getElementById('mode-quiz-desc').textContent = ui('modeQuizDesc');
  document.getElementById('mode-fc-title').textContent = ui('modeFc');
  document.getElementById('mode-fc-desc').textContent = ui('modeFcDesc');
  showScreen('subject-mode');
}

function openSubjectTopics() {
  const sub = currentSubject;
  // Combine all questions from all topics into one quiz
  const allQs = sub.topics.reduce((acc, tp) => acc.concat(tp.questions), []);
  const combinedTopic = { name: sub.name, questions: allQs };
  startQuiz(combinedTopic);
}

// ===== QUIZ =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}

function startQuiz(topic) {
  currentTopic = topic;
  currentQuestions = shuffle(topic.questions);
  currentIdx = 0;
  quizCorrect = 0;
  sessionWrongQuestions = [];
  if (practiceTimerInterval) { clearInterval(practiceTimerInterval); practiceTimerInterval = null; }
  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = currentQuestions[currentIdx];
  answered = false;
  document.getElementById('quit-btn').textContent = ui('quit');
  document.getElementById('quiz-counter').textContent = `${currentIdx+1} / ${currentQuestions.length}`;
  document.getElementById('quiz-progress-fill').style.width = `${(currentIdx/currentQuestions.length)*100}%`;
  document.getElementById('question-text').textContent = t(q.q);
  // Practice timer
  if (practiceTimerInterval) { clearInterval(practiceTimerInterval); practiceTimerInterval = null; }
  const timerEl = document.getElementById('practice-timer');
  if (practiceTimerSeconds > 0) {
    let timeLeft = practiceTimerSeconds;
    timerEl.style.display = '';
    timerEl.classList.remove('warning');
    timerEl.textContent = formatTimer(timeLeft);
    practiceTimerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = formatTimer(timeLeft);
      timerEl.classList.toggle('warning', timeLeft <= 10);
      if (timeLeft <= 0) {
        clearInterval(practiceTimerInterval);
        practiceTimerInterval = null;
        if (!answered) selectAnswer(-1); // auto-advance, mark wrong
        setTimeout(() => nextQuestion(), 1500);
      }
    }, 1000);
  } else {
    timerEl.style.display = 'none';
  }
  // Bookmark button
  const qText = t(q.q);
  let bmBtn = document.getElementById('bookmark-btn');
  if (!bmBtn) {
    bmBtn = document.createElement('button');
    bmBtn.id = 'bookmark-btn';
    bmBtn.style.cssText = 'background:none;border:none;font-size:24px;cursor:pointer;position:absolute;top:10px;right:10px;';
    document.querySelector('.question-area').style.position = 'relative';
    document.querySelector('.question-area').appendChild(bmBtn);
  }
  bmBtn.textContent = isBookmarked(qText) ? '⭐' : '☆';
  bmBtn.onclick = () => {
    const now = toggleBookmark(qText);
    bmBtn.textContent = now ? '⭐' : '☆';
  };
  document.getElementById('explanation').classList.remove('show');
  document.getElementById('explanation').innerHTML = '';
  // Remove any lingering AI explanation
  document.querySelectorAll('.ai-explanation').forEach(el => el.remove());
  document.getElementById('next-btn').classList.remove('show');
  const opts = document.getElementById('options');
  opts.innerHTML = '';
  const letters = ['A','B','C','D'];
  const options = t(q.options);
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="letter">${letters[i]}</span><span>${opt}</span>`;
    btn.onclick = () => selectAnswer(i);
    opts.appendChild(btn);
  });
}

function selectAnswer(idx) {
  if (answered) return;
  answered = true;
  if (practiceTimerInterval) { clearInterval(practiceTimerInterval); practiceTimerInterval = null; }
  const q = currentQuestions[currentIdx];
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.classList.add('disabled');
    if (i === q.correct) btn.classList.add('correct');
    if (i === idx && idx !== q.correct) btn.classList.add('wrong');
  });
  const qId = getQuestionId(q);
  if (idx === q.correct) {
    quizCorrect++;
    stats.correct++;
    stats.streak++;
    if (stats.streak > stats.best_streak) stats.best_streak = stats.streak;
    removeWeakQuestion(qId);
  } else {
    stats.streak = 0;
    addWeakQuestion(qId);
    sessionWrongQuestions.push(q);
  }
  stats.answered++;
  updateStreak();
  const expl = document.getElementById('explanation');
  expl.innerHTML = t(q.explanation);
  expl.classList.add('show');
  if (idx !== q.correct) {
    const explainBtn = document.createElement('button');
    explainBtn.textContent = lang === 'sq' ? '🤖 Shpjego Më Shumë' : '🤖 Explain More';
    explainBtn.style.cssText = 'background:linear-gradient(135deg,var(--accent-blue),var(--primary));color:#fff;border:none;border-radius:12px;padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px;width:100%;';
    explainBtn.onclick = () => showAIExplanation(q, idx);
    expl.appendChild(explainBtn);
  }
  const nb = document.getElementById('next-btn');
  nb.classList.add('show');
  nb.textContent = currentIdx < currentQuestions.length-1 ? ui('next') : ui('seeResults');
  saveStats();
  checkAchievements();
}

function nextQuestion() {
  currentIdx++;
  if (currentIdx >= currentQuestions.length) showResults();
  else renderQuestion();
}

// ===== RESULTS =====
function showResults() {
  const pct = Math.round(quizCorrect/currentQuestions.length*100);
  const circle = document.getElementById('results-circle');
  circle.className = 'results-circle ' + (pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad');
  document.getElementById('results-pct').textContent = pct + '%';
  document.getElementById('results-of').textContent = `${quizCorrect}/${currentQuestions.length}`;
  const r = ui('results');
  const msgs = pct >= 90 ? r[0] : pct >= 70 ? r[1] : pct >= 50 ? r[2] : r[3];
  document.getElementById('results-msg').textContent = msgs[0];
  document.getElementById('results-sub').textContent = msgs[1];
  document.getElementById('btn-retry').textContent = ui('retry');
  document.getElementById('btn-back-home').textContent = ui('backHome');
  // Review mistakes button
  const rmBtn = document.getElementById('btn-review-mistakes');
  if (sessionWrongQuestions.length > 0) {
    rmBtn.style.display = '';
    rmBtn.textContent = ui('reviewMistakes') + ` (${sessionWrongQuestions.length})`;
  } else {
    rmBtn.style.display = 'none';
  }
  // Share button
  document.getElementById('btn-share-results').textContent = ui('share');
  const key = currentSubject.id + '_' + (currentTopic.name.en || currentTopic.name);
  stats.topicScores[key] = { answered: currentQuestions.length, correct: quizCorrect };
  saveStats();
  document.getElementById('quiz-progress-fill').style.width = '100%';
  showScreen('results');
  checkAchievements();
  checkQuizAchievements(currentQuestions.length, quizCorrect, false, false);
  if (pct >= 80) { const c = document.getElementById('confetti'); if (c) c.style.display = 'block'; setTimeout(() => { if (c) c.style.display = 'none'; }, 3000); }
}

function retryQuiz() { startQuiz(currentTopic); }
function saveStats() { localStorage.setItem('dentprep_stats', JSON.stringify(stats)); }
function saveBookmarks() { localStorage.setItem('dentprep_bookmarks', JSON.stringify(bookmarks)); }

function toggleBookmark(questionText) {
  const idx = bookmarks.indexOf(questionText);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(questionText);
  }
  saveBookmarks();
  return idx < 0; // returns true if now bookmarked
}

function isBookmarked(questionText) {
  return bookmarks.includes(questionText);
}

function resetAllStats() {
  if (!confirm(lang === 'sq' ? 'Jeni të sigurt? Kjo do të fshijë të gjitha statistikat.' : 'Are you sure? This will delete all statistics.')) return;
  stats = { answered: 0, correct: 0, streak: 0, best_streak: 0, topicScores: {} };
  bookmarks = [];
  saveStats();
  saveBookmarks();
  localStorage.removeItem('dentprep_exams');
  renderHome();
}

// ===== REVIEW MISTAKES =====
function reviewMistakes() {
  if (sessionWrongQuestions.length === 0) return;
  const topic = { name: { en: 'Review Mistakes', sq: 'Rishiko Gabimet' }, questions: [...sessionWrongQuestions] };
  currentSubject = currentSubject || { id: 'review', name: { en: 'Review', sq: 'Rishikim' }, emoji: '🔄' };
  startQuiz(topic);
}

// ===== SHARE RESULTS =====
function shareResults() {
  const pct = Math.round(quizCorrect / currentQuestions.length * 100);
  const subjectName = currentSubject ? t(currentSubject.name) : 'Mixed';
  const text = `🦷 DentPrep: I scored ${pct}% (${quizCorrect}/${currentQuestions.length}) on ${subjectName}! #DentPrep`;
  shareText(text);
}
function shareExamResults() {
  let correct = 0;
  examQuestions.forEach((q, i) => { if (examAnswers[i] === q.correct) correct++; });
  const pct = Math.round(correct / examQuestions.length * 100);
  const text = `🦷 DentPrep: I scored ${pct}% (${correct}/${examQuestions.length}) on the exam! #DentPrep`;
  shareText(text);
}
function shareText(text) {
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(ui('copiedClipboard'))).catch(() => {});
  } else {
    showToast(text);
  }
}

// ===== TIMER HELPER =====
function formatTimer(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

// ===== EXAM HISTORY =====
function renderExamHistory() {
  document.getElementById('history-back-btn').textContent = ui('back');
  document.getElementById('history-title').textContent = '📊 ' + ui('examHistory');
  const exams = JSON.parse(localStorage.getItem('dentprep_exams') || '[]');
  const analyticsEl = document.getElementById('history-analytics');
  const listEl = document.getElementById('history-list');

  if (exams.length === 0) {
    analyticsEl.innerHTML = '';
    listEl.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:40px 0;">${ui('noExamHistory')}</p>`;
    return;
  }

  // Analytics
  const allPcts = exams.map(e => e.pct);
  const overallAvg = Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length);
  const last5 = allPcts.slice(-5);
  const last5Avg = Math.round(last5.reduce((a, b) => a + b, 0) / last5.length);
  const trend = last5Avg > overallAvg ? '📈' : last5Avg < overallAvg ? '📉' : '➡️';

  analyticsEl.innerHTML = `
    <div class="history-analytics-card">
      <div style="display:flex;justify-content:space-around;text-align:center;">
        <div>
          <div style="font-size:28px;font-weight:700;color:var(--primary-light);">${last5Avg}%</div>
          <div style="font-size:12px;color:var(--text-dim);">${ui('last5Avg')} ${trend}</div>
        </div>
        <div>
          <div style="font-size:28px;font-weight:700;color:var(--text);">${overallAvg}%</div>
          <div style="font-size:12px;color:var(--text-dim);">${ui('overallAvg')}</div>
        </div>
        <div>
          <div style="font-size:28px;font-weight:700;color:var(--success);">${exams.length}</div>
          <div style="font-size:12px;color:var(--text-dim);">${lang === 'sq' ? 'Provime' : 'Exams'}</div>
        </div>
      </div>
    </div>`;

  // List
  let html = '';
  [...exams].reverse().forEach((exam, i) => {
    const date = new Date(exam.date);
    const dateStr = date.toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString(lang === 'sq' ? 'sq-AL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const colorClass = exam.pct >= 80 ? 'var(--success)' : exam.pct >= 50 ? '#fdcb6e' : 'var(--danger)';
    html += `<div class="history-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:600;font-size:15px;">${exam.correct}/${exam.total}</div>
          <div style="font-size:12px;color:var(--text-dim);">${dateStr} · ${timeStr}</div>
        </div>
        <div style="font-size:24px;font-weight:700;color:${colorClass};">${exam.pct}%</div>
      </div>
    </div>`;
  });
  listEl.innerHTML = html;
}

// ===== SEARCH =====
function onSearchInput() {
  const query = document.getElementById('config-search-input').value.trim().toLowerCase();
  const countEl = document.getElementById('search-count');
  if (!query) {
    searchFilteredQuestionIds = null;
    countEl.textContent = '';
    return;
  }
  const pool = getFilteredQuestions();
  const matches = pool.filter(q => {
    const text = (q.q[lang] || q.q.en || '').toLowerCase();
    return text.includes(query);
  });
  searchFilteredQuestionIds = new Set(matches.map(q => getQuestionId(q)));
  countEl.textContent = `${matches.length} ${ui('matchingQuestions')}`;
}

// ===== FLASHCARDS =====
let fcCards = [];
let fcIdx = 0;
let fcKnew = 0;

async function loadFlashcards() {
  // Load from consolidated questions.json (flashcards embedded per topic)
  if (SUBJECTS.length) {
    const all = [];
    SUBJECTS.forEach(sub => {
      sub.topics.forEach(tp => {
        (tp.flashcards || []).forEach(fc => {
          all.push({ ...fc, subject: sub.name.en || sub.name });
        });
      });
    });
    if (all.length > 0) return all;
  }
  // Fallback to standalone flashcards.json
  try {
    const resp = await fetch('data/flashcards.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    console.warn('Failed to load flashcards:', err.message);
    return [];
  }
}

async function startSubjectFlashcards() {
  const all = await loadFlashcards();
  const subjectName = currentSubject.name.en || currentSubject.name;
  fcCards = shuffle(all.filter(fc => fc.subject === subjectName));
  if (fcCards.length === 0) { alert(lang === 'sq' ? 'Nuk ka flashcards për këtë lëndë.' : 'No flashcards for this subject.'); return; }
  fcIdx = 0;
  fcKnew = 0;
  showScreen('flashcards');
  renderFlashcard();
}

async function startFlashcards() {
  const all = await loadFlashcards();
  fcCards = shuffle(all);
  fcIdx = 0;
  fcKnew = 0;
  showScreen('flashcards');
  renderFlashcard();
}

function renderFlashcard() {
  const fc = fcCards[fcIdx];
  document.getElementById('fc-quit-btn').textContent = ui('quit');
  document.getElementById('fc-counter').textContent = `${fcIdx+1} / ${fcCards.length}`;
  document.getElementById('fc-progress-fill').style.width = `${(fcIdx/fcCards.length)*100}%`;
  document.getElementById('fc-subject').textContent = fc.subject;
  document.getElementById('fc-question').textContent = t(fc.question);
  document.getElementById('fc-answer').innerHTML = t(fc.answer);
  document.getElementById('fc-tap-hint').textContent = ui('tapReveal');
  document.getElementById('flip-card').classList.remove('flipped');
  document.getElementById('fc-nav').style.display = 'none';
  document.getElementById('fc-knew').textContent = ui('fcKnew');
  document.getElementById('fc-didnt').textContent = ui('fcDidnt');
  // Reset card height
  const front = document.querySelector('.flip-card-front');
  const back = document.querySelector('.flip-card-back');
  requestAnimationFrame(() => {
    const h = Math.max(front.scrollHeight, back.scrollHeight);
    document.getElementById('flip-card').style.minHeight = h + 'px';
    document.querySelector('.flip-card-inner').style.minHeight = h + 'px';
    front.style.minHeight = h + 'px';
    back.style.minHeight = h + 'px';
  });
}

function revealFlashcard() {
  const card = document.getElementById('flip-card');
  if (card.classList.contains('flipped')) return;
  card.classList.add('flipped');
  setTimeout(() => { document.getElementById('fc-nav').style.display = 'flex'; }, 400);
}

function fcNext(knew) {
  if (knew) fcKnew++;
  fcIdx++;
  if (fcIdx >= fcCards.length) {
    showFcResults();
  } else {
    renderFlashcard();
  }
}

function showFcResults() {
  const pct = Math.round(fcKnew/fcCards.length*100);
  document.getElementById('fc-results-title').textContent = pct >= 80 ? '🎉 Excellent!' : pct >= 50 ? '👍 Good effort!' : '💪 Keep studying!';
  document.getElementById('fc-results-score').textContent = `${fcKnew}/${fcCards.length} (${pct}%)`;
  document.getElementById('fc-progress-fill').style.width = '100%';
  showScreen('fc-results');
}


// ===== EXAM MODE =====
let examQuestions = [];
let examAnswers = [];
let examIdx = 0;
let examSelected = -1;
let examTimerInterval = null;
let examTimePerQ = 60;
let examTimeLeft = 0;
let examStartTime = 0;
let examTotalTime = 0;

let selectedMode = 'exam';

function selectMode(mode) {
  selectedMode = mode;
  showScreen('mode-config');
}

function initModeConfig() {
  const sel = document.getElementById('config-subject-select');
  sel.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = lang === 'sq' ? 'Të gjitha lëndët' : 'All subjects';
  sel.appendChild(allOpt);
  SUBJECTS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = t(s.name);
    sel.appendChild(opt);
  });

  // Title based on mode
  const titles = { exam: '📋 ' + (lang==='sq'?'Provimi':'Exam'), questions: '📝 ' + (lang==='sq'?'Pyetje':'Questions'), flashcards: '📚 Flashcards' };
  document.getElementById('config-title').textContent = titles[selectedMode] || titles.exam;
  document.getElementById('config-back-btn').textContent = ui('back');
  document.getElementById('lbl-config-subject').textContent = lang === 'sq' ? 'Lënda' : 'Subject';
  document.getElementById('lbl-config-count').textContent = lang === 'sq' ? 'Numri i pyetjeve' : 'Number of questions';
  document.getElementById('lbl-config-time').textContent = lang === 'sq' ? 'Koha për pyetje' : 'Time per question';
  document.getElementById('lbl-config-diff').textContent = lang === 'sq' ? 'Vështirësia' : 'Difficulty';
  
  // Localize difficulty options
  const diffSel = document.getElementById('config-diff-select');
  const diffTexts = lang === 'sq' ? ['Të gjitha','E lehtë','E mesme','E vështirë'] : ['All','Easy','Medium','Hard'];
  Array.from(diffSel.options).forEach((o,i) => o.textContent = diffTexts[i]);
  
  // Localize time options
  const timeSel = document.getElementById('config-time-select');
  const timeTexts = lang === 'sq' ? ['30 sekonda','1 minutë','1.5 minuta','2 minuta','Pa limit kohor'] : ['30 seconds','1 minute','1.5 minutes','2 minutes','No time limit'];
  Array.from(timeSel.options).forEach((o,i) => o.textContent = timeTexts[i]);

  // Localize count - add 'all' option text
  const countSel = document.getElementById('config-count-select');
  Array.from(countSel.options).forEach(o => { if(o.value==='all') o.textContent = lang==='sq' ? 'Të gjitha' : 'All'; });

  // Show/hide fields based on mode
  document.getElementById('config-time-field').style.display = selectedMode === 'exam' ? '' : 'none';
  document.getElementById('config-count-field').style.display = selectedMode === 'flashcards' ? 'none' : '';
  document.getElementById('config-practice-timer-field').style.display = selectedMode === 'questions' ? '' : 'none';
  document.getElementById('config-search-field').style.display = (selectedMode === 'questions' || selectedMode === 'exam') ? '' : 'none';
  // Localize search & practice timer
  document.getElementById('lbl-config-search').textContent = '🔍 ' + (lang === 'sq' ? 'Kërko' : 'Search');
  document.getElementById('config-search-input').placeholder = ui('searchPlaceholder');
  document.getElementById('lbl-config-practice-timer').textContent = ui('practiceTimer');
  const ptSel = document.getElementById('config-practice-timer-select');
  ptSel.options[0].textContent = ui('timerOff');
  // Reset search
  document.getElementById('config-search-input').value = '';
  document.getElementById('search-count').textContent = '';
  searchFilteredQuestionIds = null;

  // Button text
  const btnTexts = { exam: lang==='sq'?'Fillo Provimin':'Start Exam', questions: lang==='sq'?'Fillo Pyetjet':'Start Questions', flashcards: lang==='sq'?'Fillo Flashcards':'Start Flashcards' };
  document.getElementById('config-start-btn').textContent = btnTexts[selectedMode];
  
  // Style button based on mode
  const btn = document.getElementById('config-start-btn');
  if (selectedMode === 'exam') {
    btn.style.background = 'linear-gradient(135deg, #e17055, #d63031)';
  } else {
    btn.style.background = 'var(--primary)';
  }
}

function getFilteredQuestions() {
  const subjId = document.getElementById('config-subject-select').value;
  const diff = document.getElementById('config-diff-select').value;
  let pool = [];
  if (subjId === 'all') {
    SUBJECTS.forEach(s => s.topics.forEach(tp => pool = pool.concat(tp.questions)));
  } else {
    const s = SUBJECTS.find(s => s.id === subjId);
    if (s) s.topics.forEach(tp => pool = pool.concat(tp.questions));
  }
  if (diff !== 'all') {
    pool = pool.filter(q => (q.difficulty || 'medium') === diff);
  }
  return pool;
}

function startSelectedMode() {
  if (selectedMode === 'exam') {
    startExam();
  } else if (selectedMode === 'questions') {
    startQuestionsMode();
  } else if (selectedMode === 'flashcards') {
    startFlashcardsMode();
  }
}

function startQuestionsMode() {
  const countVal = document.getElementById('config-count-select').value;
  let pool = getFilteredQuestions();
  // Apply search filter
  if (searchFilteredQuestionIds && searchFilteredQuestionIds.size > 0) {
    pool = pool.filter(q => searchFilteredQuestionIds.has(getQuestionId(q)));
  }
  pool = shuffle(pool);
  if (countVal !== 'all') pool = pool.slice(0, Math.min(parseInt(countVal), pool.length));
  if (pool.length === 0) { alert(lang==='sq'?'Nuk ka pyetje për këtë përzgjedhje.':'No questions for this selection.'); return; }
  // Set practice timer
  practiceTimerSeconds = parseInt(document.getElementById('config-practice-timer-select').value) || 0;
  const combinedTopic = { name: {en:'Questions',sq:'Pyetje'}, questions: pool };
  currentSubject = { id:'mixed', name:{en:'Mixed',sq:'Të përziera'}, emoji:'📝' };
  startQuiz(combinedTopic);
}

async function startFlashcardsMode() {
  const subjId = document.getElementById('config-subject-select').value;
  const all = await loadFlashcards();
  let cards;
  if (subjId === 'all') {
    cards = all;
  } else {
    const s = SUBJECTS.find(s => s.id === subjId);
    const subjectName = s ? (s.name.en || s.name) : '';
    cards = all.filter(fc => fc.subject === subjectName);
  }
  if (cards.length === 0) { alert(lang==='sq'?'Nuk ka flashcards për këtë përzgjedhje.':'No flashcards for this selection.'); return; }
  fcCards = shuffle(cards);
  fcIdx = 0;
  fcKnew = 0;
  showScreen('flashcards');
  renderFlashcard();
}

function quitExam() {
  const msg = lang === 'sq' ? 'Je i sigurt që dëshiron ta lësh provimin?' : 'Are you sure you want to quit the exam?';
  if (confirm(msg)) {
    if (examTimerInterval) clearInterval(examTimerInterval);
    showScreen('home');
  }
}

function startExam() {
  const countVal = document.getElementById('config-count-select').value;
  examTimePerQ = parseInt(document.getElementById('config-time-select').value);
  practiceTimerSeconds = 0; // no practice timer in exam mode
  let pool = getFilteredQuestions();
  // Apply search filter
  if (searchFilteredQuestionIds && searchFilteredQuestionIds.size > 0) {
    pool = pool.filter(q => searchFilteredQuestionIds.has(getQuestionId(q)));
  }
  const count = countVal === 'all' ? pool.length : parseInt(countVal);
  examQuestions = shuffle(pool).slice(0, Math.min(count, pool.length));
  examAnswers = new Array(examQuestions.length).fill(-1);
  examIdx = 0;
  examSelected = -1;
  examStartTime = Date.now();
  
  showScreen('exam-quiz');
  renderExamQ();
}

function renderExamQ() {
  const q = examQuestions[examIdx];
  examSelected = examAnswers[examIdx];
  
  document.getElementById('exam-q-info').textContent = (examIdx + 1) + ' / ' + examQuestions.length;
  document.getElementById('exam-q-text').textContent = t(q.q);
  
  const opts = document.getElementById('exam-opts');
  opts.innerHTML = '';
  const letters = ['A','B','C','D'];
  const options = t(q.options);
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'exam-option-btn' + (examSelected === i ? ' selected' : '');
    btn.innerHTML = '<span class="letter">' + letters[i] + '</span><span>' + opt + '</span>';
    btn.onclick = () => selectExamAnswer(i);
    opts.appendChild(btn);
  });
  
  // Localize buttons
  document.getElementById('exam-skip-btn').textContent = lang === 'sq' ? 'Kalo →' : 'Skip →';
  const isLast = examIdx >= examQuestions.length - 1;
  document.getElementById('exam-confirm-btn').textContent = isLast ? (lang === 'sq' ? 'Përfundo' : 'Finish') : (lang === 'sq' ? 'Konfirmo →' : 'Confirm →');
  
  // Timer
  if (examTimerInterval) clearInterval(examTimerInterval);
  if (examTimePerQ > 0) {
    examTimeLeft = examTimePerQ;
    updateExamClock();
    examTimerInterval = setInterval(() => {
      examTimeLeft--;
      updateExamClock();
      if (examTimeLeft <= 0) {
        clearInterval(examTimerInterval);
        examNext(false);
      }
    }, 1000);
  } else {
    document.getElementById('exam-clock').textContent = '∞';
    document.getElementById('exam-clock').classList.remove('warning');
  }
}

function updateExamClock() {
  const m = Math.floor(examTimeLeft / 60);
  const s = examTimeLeft % 60;
  const el = document.getElementById('exam-clock');
  el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  el.classList.toggle('warning', examTimeLeft <= 10);
}

function selectExamAnswer(idx) {
  examSelected = idx;
  examAnswers[examIdx] = idx;
  document.querySelectorAll('.exam-option-btn').forEach((btn, i) => {
    btn.classList.toggle('selected', i === idx);
  });
}

function examNext(confirmed) {
  if (confirmed && examSelected >= 0) {
    examAnswers[examIdx] = examSelected;
  }
  if (examTimerInterval) clearInterval(examTimerInterval);
  examIdx++;
  if (examIdx >= examQuestions.length) {
    showExamResults();
  } else {
    examSelected = examAnswers[examIdx];
    renderExamQ();
  }
}

function showExamResults() {
  if (examTimerInterval) clearInterval(examTimerInterval);
  examTotalTime = Math.round((Date.now() - examStartTime) / 1000);
  
  let correct = 0;
  examQuestions.forEach((q, i) => { if (examAnswers[i] === q.correct) correct++; });
  const pct = Math.round(correct / examQuestions.length * 100);
  
  // Title
  const titles = lang === 'sq' 
    ? (pct >= 90 ? 'Shkëlqyeshëm!' : pct >= 70 ? 'Shumë mirë!' : pct >= 50 ? 'Mjaftueshëm' : 'Duhet të studiosh më shumë')
    : (pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Good job!' : pct >= 50 ? 'Passing' : 'Needs improvement');
  
  document.getElementById('exam-res-title').textContent = titles;
  document.getElementById('exam-res-score').textContent = pct + '%';
  document.getElementById('exam-res-sub').textContent = correct + '/' + examQuestions.length + (lang === 'sq' ? ' përgjigje të sakta' : ' correct answers');
  
  const mins = Math.floor(examTotalTime / 60);
  const secs = examTotalTime % 60;
  document.getElementById('exam-res-time').textContent = (lang === 'sq' ? 'Koha: ' : 'Time: ') + mins + 'm ' + secs + 's';
  
  // Review list
  const list = document.getElementById('exam-review-list');
  list.innerHTML = '';
  const letters = ['A','B','C','D'];
  examQuestions.forEach((q, i) => {
    const isCorrect = examAnswers[i] === q.correct;
    const opts = t(q.options);
    const div = document.createElement('div');
    div.className = 'exam-review-item ' + (isCorrect ? 'correct-answer' : 'wrong-answer');
    
    let html = '<div class="eri-question">' + (i+1) + '. ' + t(q.q) + '</div>';
    if (examAnswers[i] >= 0) {
      html += '<div class="eri-row ' + (isCorrect ? 'correct' : 'wrong') + '">' + (lang === 'sq' ? 'Përgjigja jote: ' : 'Your answer: ') + letters[examAnswers[i]] + ') ' + opts[examAnswers[i]] + '</div>';
    } else {
      html += '<div class="eri-row wrong">' + (lang === 'sq' ? 'Pa përgjigje' : 'No answer') + '</div>';
    }
    if (!isCorrect) {
      html += '<div class="eri-row correct">' + (lang === 'sq' ? 'Përgjigja e saktë: ' : 'Correct answer: ') + letters[q.correct] + ') ' + opts[q.correct] + '</div>';
    }
    if (q.explanation) {
      html += '<div class="eri-explanation">' + t(q.explanation) + '</div>';
    }
    div.innerHTML = html;
    list.appendChild(div);
  });
  
  // Save exam result
  const examResults = JSON.parse(localStorage.getItem('dentprep_exams') || '[]');
  examResults.push({ date: Date.now(), total: examQuestions.length, correct, pct, time: examTotalTime });
  localStorage.setItem('dentprep_exams', JSON.stringify(examResults));
  
  showScreen('exam-results');
}

// ===== CHALLENGE MODE =====
function generateChallenge() {
  let allQs = [];
  SUBJECTS.forEach((sub, si) => {
    sub.topics.forEach((tp, ti) => {
      tp.questions.forEach((q, qi) => {
        allQs.push({ si, ti, qi, q });
      });
    });
  });
  const selected = shuffle(allQs).slice(0, 10);
  const code = selected.map(s => `${s.si}.${s.ti}.${s.qi}`).join(',');
  const encoded = btoa(code);
  const url = `${window.location.origin}${window.location.pathname}#challenge=${encoded}`;
  return { url, questions: selected.map(s => s.q) };
}

function startChallenge() {
  const { url, questions } = generateChallenge();
  window._challengeUrl = url;
  window._challengeMode = true;
  currentSubject = { id: 'challenge', name: { en: 'Challenge', sq: 'Sfidë' }, emoji: '⚔️' };
  currentTopic = { name: { en: 'Challenge', sq: 'Sfidë' }, questions };
  currentQuestions = questions;
  currentIdx = 0;
  quizCorrect = 0;
  showScreen('quiz');
  renderQuestion();
}

function loadChallengeFromURL() {
  const hash = window.location.hash;
  if (!hash.startsWith('#challenge=')) return false;
  try {
    const encoded = hash.substring('#challenge='.length);
    const code = atob(encoded);
    const indices = code.split(',').map(s => {
      const [si, ti, qi] = s.split('.').map(Number);
      return { si, ti, qi };
    });
    const questions = indices.map(({ si, ti, qi }) => SUBJECTS[si]?.topics[ti]?.questions[qi]).filter(Boolean);
    if (questions.length === 0) return false;
    window._challengeMode = true;
    window._challengeUrl = window.location.href;
    currentSubject = { id: 'challenge', name: { en: 'Challenge', sq: 'Sfidë' }, emoji: '⚔️' };
    currentTopic = { name: { en: 'Challenge', sq: 'Sfidë' }, questions };
    currentQuestions = questions;
    currentIdx = 0;
    quizCorrect = 0;
    showScreen('quiz');
    renderQuestion();
    history.replaceState(null, '', window.location.pathname);
    return true;
  } catch(e) { return false; }
}

function showChallengeScreen() {
  const el = document.getElementById('challenge');
  const title = lang === 'sq' ? 'Sfido Shokët' : 'Challenge Friends';
  const desc = lang === 'sq' ? 'Gjenero një sfidë me 10 pyetje dhe ndaje me shokët!' : 'Generate a 10-question challenge and share with friends!';
  const btnText = lang === 'sq' ? '⚔️ Gjenero Sfidë' : '⚔️ Generate Challenge';
  const backText = ui('back');
  el.innerHTML = `
    <div style="padding:20px;padding-top:env(safe-area-inset-top,20px);padding-bottom:80px;">
      <button class="back-btn" onclick="showScreen('home')">${backText}</button>
      <div style="text-align:center;padding:40px 0;">
        <div style="font-size:64px;margin-bottom:16px;">⚔️</div>
        <h2 style="margin-bottom:8px;">${title}</h2>
        <p style="color:var(--text-dim);margin-bottom:32px;">${desc}</p>
        <button onclick="startChallengeWithShare()" style="background:linear-gradient(135deg,var(--primary),var(--accent-coral));color:#fff;border:none;border-radius:14px;padding:16px 32px;font-size:16px;font-weight:700;cursor:pointer;">${btnText}</button>
      </div>
    </div>`;
  showScreen('challenge');
}

function startChallengeWithShare() {
  const { url, questions } = generateChallenge();
  const shareText = lang === 'sq' ? '🦷 Të sfidoj në DentPrep! Provoje: ' : '🦷 I challenge you on DentPrep! Try it: ';
  if (navigator.share) {
    navigator.share({ title: 'DentPrep Challenge', text: shareText, url }).then(() => {
      window._challengeUrl = url;
      window._challengeMode = true;
      currentSubject = { id: 'challenge', name: { en: 'Challenge', sq: 'Sfidë' }, emoji: '⚔️' };
      currentTopic = { name: { en: 'Challenge', sq: 'Sfidë' }, questions };
      currentQuestions = questions;
      currentIdx = 0;
      quizCorrect = 0;
      showScreen('quiz');
      renderQuestion();
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => showToast(lang === 'sq' ? 'Linku u kopjua!' : 'Link copied!')).catch(() => {});
    window._challengeUrl = url;
    window._challengeMode = true;
    currentSubject = { id: 'challenge', name: { en: 'Challenge', sq: 'Sfidë' }, emoji: '⚔️' };
    currentTopic = { name: { en: 'Challenge', sq: 'Sfidë' }, questions };
    currentQuestions = questions;
    currentIdx = 0;
    quizCorrect = 0;
    showScreen('quiz');
    renderQuestion();
  }
}

// ===== ACHIEVEMENTS =====
const ACHIEVEMENT_DEFS = [
  { id: 'first_steps', emoji: '🏅', name: { en: 'First Steps', sq: 'Hapat e Parë' }, desc: { en: 'Complete your first quiz', sq: 'Përfundo kuizin e parë' } },
  { id: 'on_fire', emoji: '🔥', name: { en: 'On Fire', sq: 'Në Zjarr' }, desc: { en: '5 day study streak', sq: 'Seria 5-ditore e studimit' } },
  { id: 'perfect', emoji: '💯', name: { en: 'Perfect Score', sq: 'Rezultat Perfekt' }, desc: { en: '100% on a quiz with 10+ questions', sq: '100% në një kuiz me 10+ pyetje' } },
  { id: 'bookworm', emoji: '📚', name: { en: 'Bookworm', sq: 'Lexues i Zellshëm' }, desc: { en: 'Answer 100 questions', sq: 'Përgjigju 100 pyetje' } },
  { id: 'subject_master', emoji: '🧠', name: { en: 'Subject Master', sq: 'Master i Lëndës' }, desc: { en: '80%+ on all questions in a subject', sq: '80%+ në të gjitha pyetjet e një lënde' } },
  { id: 'elite', emoji: '🏆', name: { en: 'Elite', sq: 'Elitë' }, desc: { en: '90%+ average across 50+ questions', sq: '90%+ mesatare në 50+ pyetje' } },
  { id: 'speed_demon', emoji: '⚡', name: { en: 'Speed Demon', sq: 'Shpejtësia' }, desc: { en: 'Complete timed quiz 80%+ with time to spare', sq: 'Përfundo kuizin me kohë 80%+ me kohë të mbetur' } },
  { id: 'challenger', emoji: '⚔️', name: { en: 'Challenger', sq: 'Sfidues' }, desc: { en: 'Complete a challenge', sq: 'Përfundo një sfidë' } }
];

let achievements = JSON.parse(localStorage.getItem('dentprep_achievements') || '{}');

function unlockAchievement(id) {
  if (achievements[id]) return false;
  achievements[id] = { date: new Date().toISOString() };
  localStorage.setItem('dentprep_achievements', JSON.stringify(achievements));
  const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
  if (def) showToast(`${def.emoji} ${t(def.name)}!`);
  return true;
}

function checkAchievements() {
  if (stats.answered > 0) unlockAchievement('first_steps');
  if (stats.answered >= 100) unlockAchievement('bookworm');
  if (stats.answered >= 50 && stats.correct / stats.answered >= 0.9) unlockAchievement('elite');
  const streak = JSON.parse(localStorage.getItem('dentprep_streak') || '{}');
  if (streak.currentStreak >= 5) unlockAchievement('on_fire');
  if (window._challengeMode) unlockAchievement('challenger');
}

function checkQuizAchievements(total, correct, wasTimed, hadTimeLeft) {
  if (total >= 10 && correct === total) unlockAchievement('perfect');
  if (wasTimed && hadTimeLeft && total >= 5 && correct / total >= 0.8) unlockAchievement('speed_demon');
  Object.keys(stats.topicScores).forEach(key => {
    const score = stats.topicScores[key];
    if (score.answered >= 10 && score.correct / score.answered >= 0.8) unlockAchievement('subject_master');
  });
}

function showAchievementsScreen() {
  const el = document.getElementById('achievements');
  const title = lang === 'sq' ? 'Arritjet' : 'Achievements';
  const backText = ui('back');
  let html = `<div style="padding:20px;padding-top:env(safe-area-inset-top,20px);padding-bottom:80px;">
    <button class="back-btn" onclick="showScreen('home')">${backText}</button>
    <h2 style="text-align:center;margin:20px 0;">${title}</h2>
    <div style="display:flex;flex-direction:column;gap:12px;">`;

  ACHIEVEMENT_DEFS.forEach(def => {
    const unlocked = achievements[def.id];
    const opacity = unlocked ? '1' : '0.4';
    const dateText = unlocked ? new Date(unlocked.date).toLocaleDateString() : (lang === 'sq' ? '🔒 I kyçur' : '🔒 Locked');
    html += `<div style="background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;opacity:${opacity};${unlocked ? 'box-shadow:0 0 20px rgba(124,92,252,0.15);' : ''}">
      <div style="font-size:36px;min-width:44px;text-align:center;">${def.emoji}</div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:15px;">${t(def.name)}</div>
        <div style="font-size:13px;color:var(--text-dim);margin-top:2px;">${t(def.desc)}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${dateText}</div>
      </div>
    </div>`;
  });

  html += '</div></div>';
  el.innerHTML = html;
  showScreen('achievements');
}

// ===== AI EXPLAIN MORE =====
function showAIExplanation(q, userAnswer) {
  const options = t(q.options);
  const letters = ['A', 'B', 'C', 'D'];
  let html = '<div class="ai-explanation" style="background:var(--card);border:1px solid var(--accent-blue);border-radius:16px;padding:16px;margin-top:12px;animation:fadeIn 0.3s ease;">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:20px;">🤖</span><span style="font-weight:600;color:var(--accent-blue);">' + (lang === 'sq' ? 'Asistenti AI' : 'AI Assistant') + '</span></div>';

  options.forEach((opt, i) => {
    if (i === q.correct) {
      html += `<div style="margin-bottom:8px;padding:8px;background:rgba(34,197,94,0.1);border-radius:8px;"><span style="color:var(--accent-green);font-weight:600;">✅ ${letters[i]}) ${opt}</span><br><span style="font-size:13px;color:var(--text-dim);">${lang === 'sq' ? 'Kjo është përgjigja e saktë.' : 'This is the correct answer.'} ${t(q.explanation)}</span></div>`;
    } else {
      const wrongColor = i === userAnswer ? 'var(--accent-coral)' : 'var(--text-muted)';
      const prefix = i === userAnswer ? (lang === 'sq' ? '❌ Zgjedhja juaj: ' : '❌ Your choice: ') : '❌ ';
      html += `<div style="margin-bottom:8px;padding:8px;border-radius:8px;"><span style="color:${wrongColor};font-weight:500;">${prefix}${letters[i]}) ${opt}</span><br><span style="font-size:13px;color:var(--text-dim);">${lang === 'sq' ? 'Jo e saktë.' : 'Not correct.'}</span></div>`;
    }
  });

  html += `<div style="margin-top:12px;padding:12px;background:rgba(245,158,11,0.1);border-radius:10px;border:1px solid rgba(245,158,11,0.2);"><span style="font-size:14px;">💡 <strong>${lang === 'sq' ? 'Këshillë për memorizim' : 'Memory Tip'}:</strong> ${lang === 'sq' ? 'Përgjigja e saktë është' : 'The correct answer is'} <strong>${letters[q.correct]}) ${options[q.correct]}</strong>. ${t(q.explanation)}</span></div>`;
  html += '</div>';

  const expl = document.getElementById('explanation');
  const div = document.createElement('div');
  div.innerHTML = html;
  expl.parentNode.insertBefore(div.firstElementChild, expl.nextSibling);
}

// ===== INIT =====
(async function init() {
  await loadQuestions();
  if (lang) {
    document.getElementById('lang-switch-btn').textContent = lang === 'sq' ? '🇦🇱 SQ' : '🇬🇧 EN';
    // Check for challenge URL first
    if (!loadChallengeFromURL()) {
      showScreen('home');
    }
  }
})();

// ===== ONLINE/OFFLINE STATUS =====
window.addEventListener('online', () => { const s = document.getElementById('online-status'); if (s) s.textContent = '🟢'; });
window.addEventListener('offline', () => { const s = document.getElementById('online-status'); if (s) s.textContent = '🔴'; });

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'activated') {
          window.location.reload();
        }
      });
    });
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}

// ===== SETTINGS SCREEN =====
function showSettingsScreen() {
  const el = document.getElementById('settings');
  const settings = JSON.parse(localStorage.getItem('dentprep_settings') || '{"notifications":false,"notifyTime":"09:00","theme":"dark"}');
  const backText = ui('back');
  const isDark = (localStorage.getItem('dentprep_theme') || 'dark') === 'dark';
  
  el.innerHTML = `
    <div style="padding:20px;padding-top:env(safe-area-inset-top,20px);padding-bottom:80px;">
      <button class="back-btn" onclick="showScreen('home')">${backText}</button>
      <h2 style="text-align:center;margin:20px 0;">⚙️ ${lang === 'sq' ? 'Cilësimet' : 'Settings'}</h2>
      
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- Theme -->
        <div style="background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:600;">${lang === 'sq' ? 'Tema' : 'Theme'}</div>
            <div style="font-size:13px;color:var(--text-dim);">${isDark ? '🌙 Dark' : '☀️ Light'}</div>
          </div>
          <button onclick="toggleTheme()" style="background:var(--primary);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;cursor:pointer;">
            ${isDark ? '☀️' : '🌙'}
          </button>
        </div>
        
        <!-- Notifications -->
        <div style="background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <div style="font-weight:600;">🔔 ${lang === 'sq' ? 'Kujtesa për studim' : 'Study Reminders'}</div>
              <div style="font-size:13px;color:var(--text-dim);">${lang === 'sq' ? 'Njoftim ditor' : 'Daily notification'}</div>
            </div>
            <button onclick="toggleNotifications()" id="notif-toggle" style="background:${settings.notifications ? 'var(--accent-green)' : 'var(--card-border)'};color:#fff;border:none;border-radius:20px;padding:8px 16px;font-size:13px;cursor:pointer;min-width:60px;">
              ${settings.notifications ? 'ON' : 'OFF'}
            </button>
          </div>
          <div style="${settings.notifications ? '' : 'opacity:0.5;pointer-events:none;'}">
            <label style="font-size:13px;color:var(--text-dim);display:block;margin-bottom:6px;">${lang === 'sq' ? 'Ora e kujtesës' : 'Reminder time'}</label>
            <select onchange="updateNotifyTime(this.value)" style="width:100%;background:var(--bg);border:1px solid var(--card-border);color:var(--text);border-radius:10px;padding:10px;font-size:14px;">
              ${Array.from({length:15}, (_,i) => {
                const h = (8+i).toString().padStart(2,'0') + ':00';
                return `<option value="${h}" ${settings.notifyTime === h ? 'selected' : ''}>${h}</option>`;
              }).join('')}
            </select>
          </div>
        </div>
        
        <!-- Language -->
        <div onclick="lang=lang==='sq'?'en':'sq';localStorage.setItem('dentprep_lang',lang);document.getElementById('lang-switch-btn').textContent=lang==='sq'?'🇦🇱 SQ':'🇬🇧 EN';showSettingsScreen();" style="background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <div>
            <div style="font-weight:600;">${lang === 'sq' ? 'Gjuha' : 'Language'}</div>
            <div style="font-size:13px;color:var(--text-dim);">${lang === 'sq' ? '🇦🇱 Shqip' : '🇬🇧 English'}</div>
          </div>
          <span style="color:var(--text-dim);font-size:18px;">→</span>
        </div>

        <!-- Submit Question -->
        <div onclick="showSubmitQuestionScreen()" style="background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <div>
            <div style="font-weight:600;">➕ ${lang === 'sq' ? 'Dërgo Pyetje' : 'Submit Question'}</div>
            <div style="font-size:13px;color:var(--text-dim);">${lang === 'sq' ? 'Kontribuo me pyetje të reja' : 'Contribute new questions'}</div>
          </div>
          <span style="color:var(--text-dim);font-size:18px;">→</span>
        </div>
        
        <!-- Danger Zone -->
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--card-border);">
          <div style="font-size:12px;color:var(--accent-coral);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">${lang === 'sq' ? 'Zona e rrezikshme' : 'Danger Zone'}</div>
          <button onclick="resetAllStats()" style="background:rgba(255,107,107,0.15);border:1px solid rgba(255,107,107,0.3);color:var(--accent-coral);border-radius:12px;padding:14px;width:100%;font-size:14px;font-weight:600;cursor:pointer;">
            🗑️ ${lang === 'sq' ? 'Fshi të gjitha të dhënat' : 'Delete all data'}
          </button>
        </div>
      </div>
    </div>`;
}

function toggleNotifications() {
  const settings = JSON.parse(localStorage.getItem('dentprep_settings') || '{"notifications":false,"notifyTime":"09:00"}');
  if (!settings.notifications) {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          settings.notifications = true;
          localStorage.setItem('dentprep_settings', JSON.stringify(settings));
          showToast(lang === 'sq' ? 'Njoftimet u aktivizuan!' : 'Notifications enabled!');
          showSettingsScreen();
        } else {
          showToast(lang === 'sq' ? 'Leja u refuzua' : 'Permission denied');
        }
      });
    } else {
      showToast(lang === 'sq' ? 'Njoftimet nuk mbështeten' : 'Notifications not supported');
    }
  } else {
    settings.notifications = false;
    localStorage.setItem('dentprep_settings', JSON.stringify(settings));
    showSettingsScreen();
  }
}

function updateNotifyTime(time) {
  const settings = JSON.parse(localStorage.getItem('dentprep_settings') || '{"notifications":false,"notifyTime":"09:00"}');
  settings.notifyTime = time;
  localStorage.setItem('dentprep_settings', JSON.stringify(settings));
}

// Check notifications every minute
setInterval(() => {
  const settings = JSON.parse(localStorage.getItem('dentprep_settings') || '{}');
  if (!settings.notifications) return;
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const today = now.toISOString().split('T')[0];
  if (currentTime === settings.notifyTime && settings.lastNotifyDate !== today) {
    settings.lastNotifyDate = today;
    localStorage.setItem('dentprep_settings', JSON.stringify(settings));
    if (Notification.permission === 'granted') {
      new Notification('🦷 DentPrep', {
        body: lang === 'sq' ? 'Koha për të studiuar! Mos e humb serinë tënde.' : "Time to study! Don't lose your streak.",
        icon: 'icon-192.png'
      });
    }
  }
}, 60000);

// ===== SUBMIT QUESTION SCREEN =====
function showSubmitQuestionScreen() {
  const el = document.getElementById('submit-question');
  const backText = ui('back');
  const title = lang === 'sq' ? 'Dërgo Pyetje të Re' : 'Submit New Question';
  
  let subjectOpts = SUBJECTS.map(s => `<option value="${s.id}">${t(s.name)}</option>`).join('');
  
  el.innerHTML = `
    <div style="padding:20px;padding-top:env(safe-area-inset-top,20px);padding-bottom:80px;">
      <button class="back-btn" onclick="showScreen('settings')">${backText}</button>
      <h2 style="text-align:center;margin:20px 0;">➕ ${title}</h2>
      
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label style="font-size:13px;color:var(--text-dim);display:block;margin-bottom:6px;">${lang === 'sq' ? 'Lënda' : 'Subject'}</label>
          <select id="sq-subject" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;">
            ${subjectOpts}
          </select>
        </div>
        
        <div>
          <label style="font-size:13px;color:var(--text-dim);display:block;margin-bottom:6px;">${lang === 'sq' ? 'Pyetja' : 'Question'}</label>
          <textarea id="sq-question" rows="3" placeholder="${lang === 'sq' ? 'Shkruani pyetjen këtu...' : 'Write the question here...'}" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;resize:vertical;font-family:inherit;"></textarea>
        </div>
        
        <div>
          <label style="font-size:13px;color:var(--text-dim);display:block;margin-bottom:6px;">${lang === 'sq' ? 'Opsionet (4)' : 'Options (4)'}</label>
          <input id="sq-opt-a" placeholder="A)" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;margin-bottom:8px;">
          <input id="sq-opt-b" placeholder="B)" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;margin-bottom:8px;">
          <input id="sq-opt-c" placeholder="C)" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;margin-bottom:8px;">
          <input id="sq-opt-d" placeholder="D)" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;">
        </div>
        
        <div>
          <label style="font-size:13px;color:var(--text-dim);display:block;margin-bottom:6px;">${lang === 'sq' ? 'Përgjigja e saktë' : 'Correct answer'}</label>
          <div style="display:flex;gap:10px;">
            ${['A','B','C','D'].map((l,i) => `<label style="flex:1;background:var(--card);border:1px solid var(--card-border);border-radius:12px;padding:12px;text-align:center;cursor:pointer;"><input type="radio" name="sq-correct" value="${i}" style="display:none;"><span style="font-weight:600;">${l}</span></label>`).join('')}
          </div>
        </div>
        
        <div>
          <label style="font-size:13px;color:var(--text-dim);display:block;margin-bottom:6px;">${lang === 'sq' ? 'Shpjegimi (opsional)' : 'Explanation (optional)'}</label>
          <textarea id="sq-explanation" rows="2" placeholder="${lang === 'sq' ? 'Pse kjo përgjigje është e saktë...' : 'Why this answer is correct...'}" style="width:100%;background:var(--card);border:1px solid var(--card-border);color:var(--text);border-radius:12px;padding:12px;font-size:15px;resize:vertical;font-family:inherit;"></textarea>
        </div>
        
        <button onclick="submitQuestion()" style="background:linear-gradient(135deg,var(--primary),var(--accent-green));color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;">
          📤 ${lang === 'sq' ? 'Dërgo & Ndaj' : 'Submit & Share'}
        </button>
      </div>
    </div>`;
  
  // Style radio buttons
  setTimeout(() => {
    el.querySelectorAll('input[name="sq-correct"]').forEach(radio => {
      radio.addEventListener('change', () => {
        el.querySelectorAll('input[name="sq-correct"]').forEach(r => {
          r.parentElement.style.borderColor = r.checked ? 'var(--accent-green)' : 'var(--card-border)';
          r.parentElement.style.background = r.checked ? 'rgba(34,197,94,0.15)' : 'var(--card)';
        });
      });
    });
  }, 100);
  
  showScreen('submit-question');
}

function submitQuestion() {
  const subject = document.getElementById('sq-subject')?.value;
  const question = document.getElementById('sq-question')?.value?.trim();
  const optA = document.getElementById('sq-opt-a')?.value?.trim();
  const optB = document.getElementById('sq-opt-b')?.value?.trim();
  const optC = document.getElementById('sq-opt-c')?.value?.trim();
  const optD = document.getElementById('sq-opt-d')?.value?.trim();
  const correct = document.querySelector('input[name="sq-correct"]:checked')?.value;
  const explanation = document.getElementById('sq-explanation')?.value?.trim();
  
  if (!question || !optA || !optB || !optC || !optD || correct === undefined) {
    showToast(lang === 'sq' ? 'Plotësoni të gjitha fushat!' : 'Please fill all fields!');
    return;
  }
  
  const subName = SUBJECTS.find(s => s.id === subject)?.name;
  const letters = ['A','B','C','D'];
  const formatted = `📝 DentPrep - New Question Submission
━━━━━━━━━━━━━━━━━━━━
Subject: ${subName ? t(subName) : subject}
Question: ${question}

A) ${optA}
B) ${optB}
C) ${optC}
D) ${optD}

Correct: ${letters[parseInt(correct)]}
${explanation ? 'Explanation: ' + explanation : ''}
━━━━━━━━━━━━━━━━━━━━`;
  
  const shareTitle = 'DentPrep Question';
  const shareText = formatted;
  
  if (navigator.share) {
    navigator.share({ title: shareTitle, text: shareText }).then(() => {
      showToast(lang === 'sq' ? 'Faleminderit! Pyetja u dërgua!' : 'Thank you! Question submitted!');
      showScreen('settings');
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(formatted).then(() => {
      showToast(lang === 'sq' ? 'U kopjua! Dërgojeni te ekipi i DentPrep.' : 'Copied! Send it to the DentPrep team.');
      showScreen('settings');
    }).catch(() => {
      showToast(lang === 'sq' ? 'Gabim - provoni përsëri' : 'Error - try again');
    });
  }
}

