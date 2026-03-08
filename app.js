
// ===== UI TRANSLATIONS =====
const UI = {
  en: {
    subtitle: "Ace your dental exams",
    answered: "Answered", accuracy: "Accuracy", streak: "Streak",
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
    ]
  },
  sq: {
    subtitle: "Përgatitu për provimet e stomatologjisë",
    answered: "Përgjigjur", accuracy: "Saktësia", streak: "Seria",
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
    ]
  }
};

// ===== QUESTION BANK (BILINGUAL) =====
let SUBJECTS = [];

async function loadQuestions() {
  try {
    const resp = await fetch('questions.json');
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

// ===== NAVIGATION =====
function showScreen(id) {
  if (id !== 'lang-select' && !lang) { id = 'lang-select'; }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'mode-config') initModeConfig();
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
  const q = currentQuestions[currentIdx];
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.classList.add('disabled');
    if (i === q.correct) btn.classList.add('correct');
    if (i === idx && idx !== q.correct) btn.classList.add('wrong');
  });
  if (idx === q.correct) { quizCorrect++; stats.correct++; stats.streak++; if (stats.streak > stats.best_streak) stats.best_streak = stats.streak; } else { stats.streak = 0; }
  stats.answered++;
  const expl = document.getElementById('explanation');
  expl.innerHTML = t(q.explanation);
  expl.classList.add('show');
  const nb = document.getElementById('next-btn');
  nb.classList.add('show');
  nb.textContent = currentIdx < currentQuestions.length-1 ? ui('next') : ui('seeResults');
  saveStats();
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
  const key = currentSubject.id + '_' + (currentTopic.name.en || currentTopic.name);
  stats.topicScores[key] = { answered: currentQuestions.length, correct: quizCorrect };
  saveStats();
  document.getElementById('quiz-progress-fill').style.width = '100%';
  showScreen('results');
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
    const resp = await fetch('flashcards.json');
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
  pool = shuffle(pool);
  if (countVal !== 'all') pool = pool.slice(0, Math.min(parseInt(countVal), pool.length));
  if (pool.length === 0) { alert(lang==='sq'?'Nuk ka pyetje për këtë përzgjedhje.':'No questions for this selection.'); return; }
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
  let pool = getFilteredQuestions();
  
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

// ===== INIT =====
(async function init() {
  await loadQuestions();
  if (lang) { document.getElementById('lang-switch-btn').textContent = lang === 'sq' ? '🇦🇱 SQ' : '🇬🇧 EN'; showScreen('home'); }
})();

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

