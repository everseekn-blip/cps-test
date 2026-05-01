// ====== FLEX YOUR CPS - Game Logic ======

// ====== JSONBIN CONFIG ======
// jsonbin.io'dan alacağın API Key ve Bin ID'yi buraya yapıştır
const JSONBIN_CONFIG = {
    API_KEY: '$2a$10$af0DhWYHHPpquLjKOUrNEe/QyqURuUFDb2ezuqq.KHballN7UeMAy',   // https://jsonbin.io profil sayfandan al
    BIN_ID: '69f5121e36566621a814de8a',     // Create Bin dedikten sonra URL'den al
    BASE_URL: 'https://api.jsonbin.io/v3',
};
// ===========================

const state = {
    clicks: [],           // timestamps of clicks
    totalClicks: 0,
    maxCps: parseInt(localStorage.getItem('maxCps')) || 0,
    currentCps: 0,
    bestStreak: parseInt(localStorage.getItem('bestStreak')) || 0,
    currentStreak: 0,
    isRunning: false,
    startTime: null,
    timeLimit: 5,         // seconds (0 = infinite)
    animFrameId: null,
    timerInterval: null,
    lastSessionCps: 0,    // last completed game CPS
    lastSessionMode: 5,   // last completed game mode
    leaderboardData: null,
    leaderboardMode: 5,   // currently viewed leaderboard tab
};

// DOM Elements
const maxCpsValue = document.getElementById('max-cps-value');
const currentCpsValue = document.getElementById('current-cps-value');
const statMax = document.getElementById('stat-max');
const statCurrent = document.getElementById('stat-current');
const statTotal = document.getElementById('stat-total');
const statStreak = document.getElementById('stat-streak');
const clickButton = document.getElementById('click-button');
const clickCount = document.getElementById('click-count');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const particlesContainer = document.getElementById('particles-container');
const rippleContainer = document.getElementById('click-ripple-container');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const playerNameInput = document.getElementById('player-name-input');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const leaderboardClose = document.getElementById('leaderboard-close');
const leaderboardList = document.getElementById('leaderboard-list');
const submitScoreBtn = document.getElementById('submit-score-btn');
const lbTabs = document.querySelectorAll('.lb-tab');

// Initialize display
function init() {
    maxCpsValue.textContent = state.maxCps;
    statMax.textContent = state.maxCps;
    statStreak.textContent = state.bestStreak;

    // Load saved player name
    const savedName = localStorage.getItem('playerName') || '';
    playerNameInput.value = savedName;

    // Save name on change
    playerNameInput.addEventListener('input', () => {
        localStorage.setItem('playerName', playerNameInput.value.trim());
    });
}

// Calculate CPS from click timestamps
function calculateCps() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove clicks older than 1 second
    state.clicks = state.clicks.filter(t => t > oneSecondAgo);

    return state.clicks.length;
}

// Update all displays
function updateDisplay() {
    state.currentCps = calculateCps();

    currentCpsValue.textContent = state.currentCps;
    statCurrent.textContent = state.currentCps;
    statTotal.textContent = state.totalClicks;
    clickCount.textContent = `${state.totalClicks} clicks`;

    // Check for new max
    if (state.currentCps > state.maxCps) {
        state.maxCps = state.currentCps;
        maxCpsValue.textContent = state.maxCps;
        statMax.textContent = state.maxCps;
        localStorage.setItem('maxCps', state.maxCps);

        // New record animation
        const maxBadge = document.querySelector('.max-cps');
        maxBadge.classList.add('new-record', 'record');
        setTimeout(() => maxBadge.classList.remove('new-record'), 1500);
    }

    // Update streak
    if (state.currentCps > state.bestStreak) {
        state.bestStreak = state.currentCps;
        statStreak.textContent = state.bestStreak;
        localStorage.setItem('bestStreak', state.bestStreak);
    }

    // Update timer bar
    if (state.isRunning && state.timeLimit > 0) {
        const elapsed = (Date.now() - state.startTime) / 1000;
        const remaining = Math.max(0, state.timeLimit - elapsed);
        const pct = (remaining / state.timeLimit) * 100;
        timerBar.style.width = pct + '%';
        timerText.textContent = `${remaining.toFixed(1)}s remaining`;

        if (remaining <= 0) {
            endGame();
            return;
        }
    }

    state.animFrameId = requestAnimationFrame(updateDisplay);
}

// Handle click
function handleClick(e) {
    if (!state.isRunning) {
        startGame();
    }

    const now = Date.now();
    state.clicks.push(now);
    state.totalClicks++;

    // Button press animation
    clickButton.classList.add('pressing');
    setTimeout(() => clickButton.classList.remove('pressing'), 60);

    // Ripple effect
    createRipple(e);

    // Particle effect
    if (state.currentCps > 5 || Math.random() < 0.3) {
        createParticle(e);
    }
}

// Start game
function startGame() {
    state.isRunning = true;
    state.startTime = Date.now();
    state.totalClicks = 0;
    state.clicks = [];
    state.currentStreak = 0;

    timerBar.style.width = '100%';

    if (state.timeLimit > 0) {
        timerText.textContent = `${state.timeLimit}s`;
    } else {
        timerText.textContent = '∞ mode - click away!';
    }

    state.animFrameId = requestAnimationFrame(updateDisplay);
}

// End game
function endGame() {
    state.isRunning = false;
    cancelAnimationFrame(state.animFrameId);

    // Final CPS calculation
    state.currentCps = calculateCps();
    currentCpsValue.textContent = state.currentCps;
    statCurrent.textContent = state.currentCps;

    timerBar.style.width = '0%';
    timerText.textContent = `Done! Final CPS: ${state.currentCps}`;

    // Show result
    if (state.currentCps >= state.maxCps) {
        timerText.textContent = `🏆 NEW RECORD: ${state.currentCps} CPS! 🏆`;
    }

    // Save last session for leaderboard submission
    state.lastSessionCps = state.currentCps;
    state.lastSessionMode = state.timeLimit || 0;
}

// Reset game
function resetGame() {
    state.isRunning = false;
    state.clicks = [];
    state.totalClicks = 0;
    state.currentCps = 0;
    state.currentStreak = 0;
    state.startTime = null;

    cancelAnimationFrame(state.animFrameId);

    currentCpsValue.textContent = '0';
    statCurrent.textContent = '0';
    statTotal.textContent = '0';
    clickCount.textContent = '0 clicks';
    timerBar.style.width = '100%';
    timerText.textContent = 'Click to start!';

}

// ====== AIM TEST ======
const aimState = {
    running: false,
    hits: 0,
    shots: 0,
    timer: null,
    timeLeft: 0,
};
const aimTarget = document.getElementById('aim-target');
const aimHits = document.getElementById('aim-hits');
const aimShots = document.getElementById('aim-shots');
const aimAccuracy = document.getElementById('aim-accuracy');
const aimStartBtn = document.getElementById('aim-start-btn');
const aimTestArea = document.getElementById('aim-test-area');

function startAimTest() {
    aimState.running = true;
    aimState.hits = 0;
    aimState.shots = 0;
    aimState.timeLeft = 15;
    aimHits.textContent = '0';
    aimShots.textContent = '0';
    aimAccuracy.textContent = '0%';
    aimStartBtn.style.display = 'none';
    spawnAimTarget();

    aimState.timer = setInterval(() => {
        aimState.timeLeft--;
        if (aimState.timeLeft <= 0) {
            endAimTest();
        }
    }, 1000);
}

function spawnAimTarget() {
    if (!aimState.running) return;
    const area = aimTestArea.getBoundingClientRect();
    const maxX = area.width - 40;
    const maxY = area.height - 50;
    aimTarget.style.left = (Math.random() * maxX) + 'px';
    aimTarget.style.top = (10 + Math.random() * maxY) + 'px';
    aimTarget.style.display = 'block';
    aimTarget.classList.remove('hit');
}

aimTarget.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (!aimState.running) return;
    aimState.hits++;
    aimState.shots++;
    aimHits.textContent = aimState.hits;
    aimShots.textContent = aimState.shots;
    aimAccuracy.textContent = Math.round((aimState.hits / aimState.shots) * 100) + '%';
    aimTarget.classList.add('hit');
    setTimeout(() => spawnAimTarget(), 150);
});

aimTestArea.addEventListener('mousedown', () => {
    if (!aimState.running) return;
    if (aimTarget.style.display === 'none') return;
    aimState.shots++;
    aimShots.textContent = aimState.shots;
    aimAccuracy.textContent = Math.round((aimState.hits / aimState.shots) * 100) + '%';
});

function endAimTest() {
    aimState.running = false;
    clearInterval(aimState.timer);
    aimTarget.style.display = 'none';
    aimStartBtn.style.display = '';
    const acc = aimState.shots > 0 ? Math.round((aimState.hits / aimState.shots) * 100) : 0;
    aimAccuracy.textContent = acc + '%';
}

aimStartBtn.addEventListener('click', startAimTest);

// ====== REACTION TEST ======
const reactionState = {
    phase: 'idle', // idle, waiting, ready, done
    startTime: 0,
    timeout: null,
};
const reactionBox = document.getElementById('reaction-box');
const reactionResult = document.getElementById('reaction-result');
const reactionStartBtn = document.getElementById('reaction-start-btn');

function startReactionTest() {
    reactionState.phase = 'waiting';
    reactionBox.className = 'waiting';
    reactionBox.textContent = 'Bekle...';
    reactionResult.textContent = '';
    reactionStartBtn.style.display = 'none';

    const delay = 1000 + Math.random() * 4000;
    reactionState.timeout = setTimeout(() => {
        reactionState.phase = 'ready';
        reactionState.startTime = Date.now();
        reactionBox.className = 'ready';
        reactionBox.textContent = 'ŞIMDI TIKLA!';
    }, delay);
}

reactionBox.addEventListener('mousedown', () => {
    if (reactionState.phase === 'waiting') {
        clearTimeout(reactionState.timeout);
        reactionState.phase = 'idle';
        reactionBox.className = 'early';
        reactionBox.textContent = 'Çok erken!';
        reactionResult.textContent = '';
        reactionStartBtn.style.display = '';
    } else if (reactionState.phase === 'ready') {
        const ms = Date.now() - reactionState.startTime;
        reactionState.phase = 'done';
        reactionBox.className = '';
        reactionBox.textContent = ms + ' ms';
        reactionResult.textContent = ms < 200 ? '⚡ Süper!' : ms < 300 ? '🔥 Hızlı!' : ms < 500 ? '👍 İyi' : '🐢 Yavaş';
        reactionStartBtn.style.display = '';
    }
});

reactionStartBtn.addEventListener('click', startReactionTest);

// ====== STABILITY TEST ======
const stabilityState = {
    running: false,
    clicks: [],
    timer: null,
    timeLeft: 0,
};
const stabilityCanvas = document.getElementById('stability-canvas');
const stabilityScore = document.getElementById('stability-score');
const stabilityStartBtn = document.getElementById('stability-start-btn');
const sCtx = stabilityCanvas.getContext('2d');

function drawStabilityGraph() {
    const w = stabilityCanvas.width;
    const h = stabilityCanvas.height;
    sCtx.clearRect(0, 0, w, h);

    // Grid
    sCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    sCtx.lineWidth = 1;
    for (let y = 0; y < h; y += 20) {
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(w, y);
        sCtx.stroke();
    }

    if (stabilityState.clicks.length < 2) return;

    const cpsValues = [];
    const oneSec = 1000;
    for (let i = 0; i < stabilityState.clicks.length; i++) {
        const t = stabilityState.clicks[i];
        const count = stabilityState.clicks.filter(c => c > t - oneSec && c <= t).length;
        cpsValues.push(count);
    }

    const maxCps = Math.max(...cpsValues, 1);
    const step = w / Math.max(cpsValues.length - 1, 1);

    // Fill
    sCtx.beginPath();
    sCtx.moveTo(0, h);
    cpsValues.forEach((v, i) => {
        const x = i * step;
        const y = h - (v / maxCps) * (h - 10);
        sCtx.lineTo(x, y);
    });
    sCtx.lineTo((cpsValues.length - 1) * step, h);
    sCtx.closePath();
    sCtx.fillStyle = 'rgba(72, 219, 251, 0.1)';
    sCtx.fill();

    // Line
    sCtx.beginPath();
    cpsValues.forEach((v, i) => {
        const x = i * step;
        const y = h - (v / maxCps) * (h - 10);
        if (i === 0) sCtx.moveTo(x, y);
        else sCtx.lineTo(x, y);
    });
    sCtx.strokeStyle = '#48dbfb';
    sCtx.lineWidth = 2;
    sCtx.stroke();

    // Deviation
    if (cpsValues.length > 1) {
        const avg = cpsValues.reduce((a, b) => a + b, 0) / cpsValues.length;
        const variance = cpsValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / cpsValues.length;
        const stdDev = Math.sqrt(variance);
        stabilityScore.textContent = `Sapma: ${stdDev.toFixed(2)}`;
    }
}

function startStabilityTest() {
    stabilityState.running = true;
    stabilityState.clicks = [];
    stabilityState.timeLeft = 10;
    stabilityScore.textContent = 'Sapma: --';
    stabilityStartBtn.style.display = 'none';
    sCtx.clearRect(0, 0, stabilityCanvas.width, stabilityCanvas.height);

    stabilityState.timer = setInterval(() => {
        stabilityState.timeLeft--;
        if (stabilityState.timeLeft <= 0) {
            stabilityState.running = false;
            clearInterval(stabilityState.timer);
            stabilityStartBtn.style.display = '';
            drawStabilityGraph();
        }
    }, 1000);

    stabilityCanvas.addEventListener('click', stabilityClickHandler);
}

function stabilityClickHandler() {
    if (!stabilityState.running) return;
    stabilityState.clicks.push(Date.now());
    drawStabilityGraph();
}

stabilityStartBtn.addEventListener('click', startStabilityTest);

// ====== JITTER TEST ======
const jitterState = {
    running: false,
    timestamps: [],
    timer: null,
    timeLeft: 0,
};
const jitterValue = document.getElementById('jitter-value');
const jitterStartBtn = document.getElementById('jitter-start-btn');
const jitterArea = document.getElementById('jitter-area');

function startJitterTest() {
    jitterState.running = true;
    jitterState.timestamps = [];
    jitterState.timeLeft = 10;
    jitterValue.textContent = '0';
    jitterStartBtn.style.display = 'none';

    jitterState.timer = setInterval(() => {
        jitterState.timeLeft--;
        if (jitterState.timeLeft <= 0) {
            jitterState.running = false;
            clearInterval(jitterState.timer);
            jitterStartBtn.style.display = '';
        }
    }, 1000);

    jitterArea.addEventListener('click', jitterClickHandler);
}

function jitterClickHandler() {
    if (!jitterState.running) return;
    jitterState.timestamps.push(Date.now());

    if (jitterState.timestamps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < jitterState.timestamps.length; i++) {
            intervals.push(jitterState.timestamps[i] - jitterState.timestamps[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        jitterValue.textContent = Math.round(avg);
    }
}

jitterStartBtn.addEventListener('click', startJitterTest);

// Create ripple effect on click
function createRipple(e) {
    const rect = clickButton.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    rippleContainer.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// Create floating particle
function createParticle(e) {
    const x = e.clientX || e.touches?.[0]?.clientX || window.innerWidth / 2;
    const y = e.clientY || e.touches?.[0]?.clientY || window.innerHeight / 2;

    const particle = document.createElement('div');
    particle.className = 'particle';

    const symbols = ['+1', '⚡', '🔥', '💥', '✨'];
    const colors = ['#48dbfb', '#feca57', '#ff6b6b', '#ff9ff3', '#6be5ff'];

    const idx = Math.floor(Math.random() * symbols.length);
    particle.textContent = symbols[idx];
    particle.style.color = colors[idx];
    particle.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
    particle.style.top = (y - 20) + 'px';

    particlesContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
}

// Mode selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeLimit = parseInt(btn.dataset.time);
        resetGame();
    });
});

// Event listeners
clickButton.addEventListener('mousedown', handleClick);
clickButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleClick(e);
});

resetBtn.addEventListener('click', resetGame);

// Prevent context menu on click zone
clickButton.addEventListener('contextmenu', e => e.preventDefault());

// ====== LEADERBOARD LOGIC ======

function isJsonBinConfigured() {
    return JSONBIN_CONFIG.API_KEY !== 'BURAYA_API_KEY_YAPISTIR' &&
           JSONBIN_CONFIG.BIN_ID !== 'BURAYA_BIN_ID_YAPISTIR';
}

async function fetchLeaderboard() {
    if (!isJsonBinConfigured()) {
        return getLocalLeaderboard();
    }

    try {
        const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_CONFIG.API_KEY }
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        state.leaderboardData = data.record.scores || [];
        return state.leaderboardData;
    } catch (err) {
        console.error('Leaderboard fetch error:', err);
        return getLocalLeaderboard();
    }
}

function getLocalLeaderboard() {
    const data = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    state.leaderboardData = data;
    return data;
}

async function submitScore(name, cps, mode) {
    const entry = {
        name: name,
        cps: cps,
        mode: mode,
        date: new Date().toISOString()
    };

    if (!isJsonBinConfigured()) {
        // Local mode
        const data = getLocalLeaderboard();
        data.push(entry);
        localStorage.setItem('leaderboard', JSON.stringify(data));
        state.leaderboardData = data;
        return true;
    }

    try {
        // Get latest data first to avoid overwrites
        const current = await fetchLeaderboard();
        current.push(entry);

        const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify({ scores: current })
        });

        if (!res.ok) throw new Error('Submit error');
        state.leaderboardData = current;
        return true;
    } catch (err) {
        console.error('Submit error:', err);
        // Fallback to local
        const data = getLocalLeaderboard();
        data.push(entry);
        localStorage.setItem('leaderboard', JSON.stringify(data));
        state.leaderboardData = data;
        return true;
    }
}

function renderLeaderboard(data, mode) {
    // Filter by mode and sort by CPS descending
    const filtered = data
        .filter(e => e.mode == mode)
        .sort((a, b) => b.cps - a.cps)
        .slice(0, 20);  // Top 20

    const playerName = playerNameInput.value.trim().toLowerCase();

    if (filtered.length === 0) {
        leaderboardList.innerHTML = '<div class="lb-empty">Henüz skor yok! 🎮</div>';
        return;
    }

    leaderboardList.innerHTML = filtered.map((entry, i) => {
        const rank = i + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const isSelf = entry.name.toLowerCase() === playerName;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

        return `
            <div class="lb-row ${isSelf ? 'lb-self' : ''}">
                <div class="lb-rank ${rankClass}">${rankEmoji}</div>
                <div class="lb-name">${escapeHtml(entry.name)}</div>
                <div class="lb-score">${entry.cps} <span>CPS</span></div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Leaderboard UI events
leaderboardBtn.addEventListener('click', async () => {
    leaderboardOverlay.classList.add('open');
    leaderboardList.innerHTML = '<div class="lb-loading">Yükleniyor...</div>';

    const data = await fetchLeaderboard();
    renderLeaderboard(data, state.leaderboardMode);
});

leaderboardClose.addEventListener('click', () => {
    leaderboardOverlay.classList.remove('open');
});

leaderboardOverlay.addEventListener('click', (e) => {
    if (e.target === leaderboardOverlay) {
        leaderboardOverlay.classList.remove('open');
    }
});

lbTabs.forEach(tab => {
    tab.addEventListener('click', async () => {
        lbTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.leaderboardMode = parseInt(tab.dataset.mode);

        const data = state.leaderboardData || await fetchLeaderboard();
        renderLeaderboard(data, state.leaderboardMode);
    });
});

submitScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        playerNameInput.focus();
        playerNameInput.style.borderColor = '#ff6b6b';
        setTimeout(() => playerNameInput.style.borderColor = '', 1500);
        return;
    }

    if (state.lastSessionCps <= 0) {
        return;
    }

    submitScoreBtn.disabled = true;
    submitScoreBtn.textContent = 'Gönderiliyor...';

    const success = await submitScore(name, state.lastSessionCps, state.lastSessionMode);

    if (success) {
        submitScoreBtn.textContent = '✓ Gönderildi!';
        setTimeout(() => {
            submitScoreBtn.textContent = 'Skorumu Gönder';
            submitScoreBtn.disabled = false;
        }, 2000);

        // Refresh leaderboard
        const data = state.leaderboardData || [];
        renderLeaderboard(data, state.leaderboardMode);
    } else {
        submitScoreBtn.textContent = 'Hata! Tekrar Dene';
        submitScoreBtn.disabled = false;
    }
});

// Initialize
init();
