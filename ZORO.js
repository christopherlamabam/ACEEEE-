
const TEXTS = {
  easy: [
  "Hey, I'm Spider-Man! Just your friendly neighborhood hero. Swinging through the city feels amazing. Gotta keep everyone safe out there. With great power comes great responsibility.",

  "Another day, another rescue! Sometimes it's tough, but I never quit. The city depends on me. Even heroes need a little rest. But when danger calls, I’m ready."
],

medium: [
  "Being Spider-Man isn’t just about fighting villains. It’s about making choices that protect people, even when it costs me something important. Balancing my normal life and hero life is the hardest challenge I face every day.",

  "New York never sleeps, and neither do its problems. From stopping crime to saving lives, I have to stay alert every second. Sometimes I fail, but I always get back up because people are counting on me."
],

hard: [
  "Every swing through the skyline reminds me that responsibility isn’t optional, it’s a burden I choose. Behind the mask, I’m just a kid trying to do the right thing, but the consequences of my actions ripple across the city in ways I can’t always control.",

  "The line between hero and sacrifice is razor thin. Each decision I make as Spider-Man carries weight, forcing me to weigh personal loss against the greater good. In the end, being a hero means standing alone sometimes, and still choosing to protect everyone else."
]
  
};

const DIFF_TIME = { easy: 60, medium: 60, hard: 45 };

/* ---------- Session Helpers ---------- */
function saveUser(data) {
  sessionStorage.setItem('typerx_user', JSON.stringify(data));
}
function loadUser() {
  const raw = sessionStorage.getItem('typerx_user');
  return raw ? JSON.parse(raw) : null;
}

/* ---------- Toast ---------- */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
let selectedDifficulty = 'easy';

function selectDiff(btn) {
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedDifficulty = btn.dataset.diff;
}

function handleLogin() {
  const name  = document.getElementById('inp-name').value.trim();
  const email = document.getElementById('inp-email').value.trim();
  const pass  = document.getElementById('inp-pass').value;
  let valid   = true;

  document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');

  if (name.length < 2 || name.length > 20) {
    document.getElementById('err-name').style.display = 'block';
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('err-email').style.display = 'block';
    valid = false;
  }
  if (pass.length < 6) {
    document.getElementById('err-pass').style.display = 'block';
    valid = false;
  }
  if (!valid) return;

  saveUser({ name, email, difficulty: selectedDifficulty });
  window.location.href = 'game.html';
  
  console.log("Button clicked"); 
}

/* ============================================================
   GAME PAGE
   ============================================================ */
let timerInterval = null;
let timeLeft      = 60;
let totalTime     = 60;
let gameStarted   = false;
let currentText   = '';
let currentIndex  = 0;
let errors        = 0;
let totalTyped    = 0;

function initGame() {
  const user = loadUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const nameEl = document.getElementById('display-name');
  const diffEl = document.getElementById('display-diff');
  if (nameEl) nameEl.textContent = user.name;
  if (diffEl) diffEl.textContent = user.difficulty.toUpperCase();

  clearInterval(timerInterval);
  gameStarted  = false;
  currentIndex = 0;
  errors       = 0;
  totalTyped   = 0;
  timeLeft     = DIFF_TIME[user.difficulty] || 60;
  totalTime    = timeLeft;

  const pool  = TEXTS[user.difficulty] || TEXTS.easy;
  currentText = pool[Math.floor(Math.random() * pool.length)];

  renderText();
  updateStats();

  const input = document.getElementById('typing-input');
  if (input) {
    input.value       = '';
    input.disabled    = false;
    input.placeholder = 'Click here and start typing...';
    input.focus();
  }

  const rc = document.getElementById('result-card');
  if (rc) rc.classList.remove('show');

  const pb = document.getElementById('progress-bar');
  if (pb) pb.style.width = '0%';

  const td = document.getElementById('stat-time');
  if (td) td.innerHTML = timeLeft + '<span class="stat-unit">s</span>';
}

function renderText() {
  const display = document.getElementById('text-display');
  if (!display) return;
  display.innerHTML = currentText.split('').map((ch, i) => {
    const cls = i === currentIndex ? 'char current' : 'char pending';
    return `<span class="${cls}" id="c${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`;
  }).join('');
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    const td = document.getElementById('stat-time');
    if (td) td.innerHTML = timeLeft + '<span class="stat-unit">s</span>';
    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

function updateStats() {
  const elapsed = totalTime - timeLeft;
  const minutes = elapsed > 0 ? elapsed / 60 : 0.001;
  const wpm     = Math.round((currentIndex / 5) / minutes);
  const acc     = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
  const prog    = Math.round((currentIndex / currentText.length) * 100);

  const wpmEl  = document.getElementById('stat-wpm');
  const accEl  = document.getElementById('stat-acc');
  const progEl = document.getElementById('stat-prog');
  const pb     = document.getElementById('progress-bar');

  if (wpmEl)  wpmEl.textContent = wpm;
  if (accEl)  accEl.innerHTML   = acc  + '<span class="stat-unit">%</span>';
  if (progEl) progEl.innerHTML  = prog + '<span class="stat-unit">%</span>';
  if (pb)     pb.style.width    = prog + '%';
}

function endGame(completed) {
  clearInterval(timerInterval);
  const input = document.getElementById('typing-input');
  if (input) input.disabled = true;

  const elapsed = completed ? (totalTime - timeLeft) : totalTime;
  const minutes = elapsed > 0 ? elapsed / 60 : 0.001;
  const wpm     = Math.round((currentIndex / 5) / minutes);
  const acc     = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;

  const rc = document.getElementById('result-card');
  if (rc) {
    document.getElementById('res-wpm').textContent    = wpm;
    document.getElementById('res-acc').textContent    = acc + '%';
    document.getElementById('res-chars').textContent  = currentIndex;
    document.getElementById('res-errors').textContent = errors;
    rc.classList.add('show');
  }

  const user = loadUser() || { name: 'Guest', difficulty: 'easy' };
  let scores  = JSON.parse(localStorage.getItem('typerx_scores') || '[]');
  scores.push({
    name:       user.name,
    wpm,
    acc,
    difficulty: user.difficulty,
    date:       new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    ts:         Date.now()
  });
  scores.sort((a, b) => b.wpm - a.wpm);
  scores = scores.slice(0, 20);
  localStorage.setItem('typerx_scores', JSON.stringify(scores));

  const msg = wpm > 80 ? '🔥 Blazing speed!' : wpm > 50 ? '⚡ Great job!' : '💪 Keep practicing!';
  showToast(msg + ' ' + wpm + ' WPM saved!');
}

function resetGame() {
  const rc = document.getElementById('result-card');
  if (rc) rc.classList.remove('show');
  initGame();
}

function bindTypingInput() {
  const input = document.getElementById('typing-input');
  if (!input) return;

  input.addEventListener('input', function () {
    if (timeLeft <= 0) return;

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    const val   = this.value;
    const typed = val[val.length - 1];

    if (typed === undefined) {
      if (currentIndex > 0) {
        currentIndex--;
        const span = document.getElementById('c' + currentIndex);
        if (span) span.className = 'char current';
        const next = document.getElementById('c' + (currentIndex + 1));
        if (next) next.className = 'char pending';
      }
      this.value = '';
      updateStats();
      return;
    }

    const expected = currentText[currentIndex];
    const span     = document.getElementById('c' + currentIndex);
    totalTyped++;

    if (typed === expected) {
      if (span) span.className = 'char correct';
    } else {
      if (span) span.className = 'char wrong';
      errors++;
    }

    currentIndex++;
    this.value = '';

    if (currentIndex < currentText.length) {
      const next = document.getElementById('c' + currentIndex);
      if (next) next.className = 'char current';
    } else {
      endGame(true);
      return;
    }

    updateStats();
  });
}

/* ============================================================
   SCOREBOARD PAGE
   ============================================================ */
function renderScores() {
  const list = document.getElementById('score-list');
  if (!list) return;

  const scores = JSON.parse(localStorage.getItem('typerx_scores') || '[]');
  const medals = ['🥇', '🥈', '🥉'];

  if (!scores.length) {
    list.innerHTML = '<div class="empty-scores">NO SCORES YET — BE THE FIRST!</div>';
    return;
  }

  list.innerHTML = scores.map((s, i) => `
    <div class="score-row data rank-${i + 1}" style="animation-delay:${i * 0.05}s">
      <div class="rank-badge">${i < 3 ? medals[i] : '#' + (i + 1)}</div>
      <div class="score-name">${s.name.replace(/</g, '&lt;')}</div>
      <div class="score-wpm">${s.wpm}</div>
      <div class="score-acc">${s.acc}%</div>
      <div class="score-diff diff-${s.difficulty}">${s.difficulty}</div>
      <div class="score-date">${s.date}</div>
    </div>
  `).join('');
}

function clearScores() {
  if (confirm('Clear all scores? This cannot be undone.')) {
    localStorage.removeItem('typerx_scores');
    renderScores();
    showToast('Scoreboard cleared!');
  }
}

function goToGame() {
  window.location.href = loadUser() ? 'game.html' : 'index.html';
}

/* ============================================================
   AUTO INIT — uses document.title to detect which page is open
   Works with Live Server AND direct file:// opening
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const title = document.title;

  if (title.includes('Game')) {
    if (!loadUser()) {
      window.location.href = 'index.html';
      return;
    }
    initGame();
    bindTypingInput();
  }

  if (title.includes('Scoreboard')) {
    renderScores();
  }
});