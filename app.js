// --- State Management ---
let currentMode = 'multiplication'; // 'multiplication' or 'division'
let selectedAvatar = 'dog';         // 'dog', 'cat', 'robot', 'fairy'
let stats = {};                      // Statistics loaded from API
let activeProblems = [];             // Shuffled list of 20 problems
let currentProblemIndex = 0;
let points = 0;
let streak = 0;
let maxStreak = 0;
let correctAnswers = 0;
let startTime = null;
let timerInterval = null;
let secondsRemaining = 120;
let timerDuration = 120;
let elapsedSeconds = 0;
let activeTable = null;
let soundEnabled = true;
let audioContext = null;

// Rewards System State
let rewardsData = {
    bonus_stars: 0,
    unlocked_items: [],
    equipped_items: { hat: null, trail: null },
    daily_logs: {}, // 'YYYY-MM-DD' -> { seconds_played: 0, goal_completed: false }
    weekly_history: {},
    parent_settings: { pin: "1234", custom_reward: "5 Skylight Calendar Bonus Stars" }
};
let dailyTimerInterval = null;
let isParentUnlocked = false;

// Avatars configuration
const AVATARS = {
    dog: {
        emoji: '🐶',
        name: 'Cosmo',
        bubble: {
            start: "Ruff! Ready to jump through wormholes, Captain?",
            correct: ["Woof! Spot on!", "Ruff! Double speed!", "Golden bone score!", "You're a star! 🌟"],
            incorrect: ["Sniff... not quite!", "Let's check the radar!", "Oops, try again!"],
            streak: ["AWOOO! Cosmic fire!", "Unlimited treats for this! 🍖"],
            victory: "Bark! Planet conquered! Let's explore more!"
        }
    },
    cat: {
        emoji: '🐱',
        name: 'Nova',
        bubble: {
            start: "Meow. Let's chase some falling stars!",
            correct: ["Purr-fect!", "Meow! Light speed!", "Supernova skill!", "You got it! 🐾"],
            incorrect: ["Hiss... close attempt!", "Let's recalculate!", "Try again, space cadet."],
            streak: ["Claws out! On fire!", "Purr-fection achieved! 🚀"],
            victory: "Meow! We rules the galaxy now!"
        }
    },
    robot: {
        emoji: '🤖',
        name: 'Pip',
        bubble: {
            start: "BEEP. Commencing mathematical adventure module.",
            correct: ["Beep! Logic optimal!", "Computing... CORRECT!", "Accuracy: 100%!", "Optimal solve! ⚙️"],
            incorrect: ["Error detected. Calibrating...", "Calculation fault. Re-routing.", "Try again, human."],
            streak: ["SYSTEM OVERRUN! SPECTACULAR!", "Processing speed: MAXIMUM!"],
            victory: "BEEP. Planet exploration successfully executed. Unit: Pleased."
        }
    },
    fairy: {
        emoji: '🧚‍♀️',
        name: 'Stella',
        bubble: {
            start: "Magic sparkles! Let's cast a math spell!",
            correct: ["Magical!", "Fairy dust score!", "Sparkling correct!", "Simply divine! ✨"],
            incorrect: ["A glitch in the wand! Try again!", "Whisper the right answer!", "Almost magic!"],
            streak: ["Cosmic alignment! Wonderful!", "Magic level: OVERFLOW! 🔮"],
            victory: "The stars align! You are a true Galaxy Master!"
        }
    }
};

// --- DOM References ---
const setupScreen = document.getElementById('setup-screen');
const mapScreen = document.getElementById('map-screen');
const gameScreen = document.getElementById('game-screen');
const summaryScreen = document.getElementById('summary-screen');
const explanationModal = document.getElementById('explanation-modal');

// Buttons
const btnStartExploration = document.getElementById('btn-start-exploration');
const btnMapBack = document.getElementById('btn-map-back');
const btnGameQuit = document.getElementById('btn-game-quit');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');
const btnCloseExplanation = document.getElementById('btn-close-explanation');
const btnReplay = document.getElementById('btn-replay');
const btnNextPlanet = document.getElementById('btn-next-planet');
const btnGoMap = document.getElementById('btn-go-map');
const audioToggle = document.getElementById('audio-toggle');

// Inputs
const userAnswerInput = document.getElementById('user-answer-input');

// Dynamic Text
const totalStarsCount = document.getElementById('total-stars-count');
const hudProgress = document.getElementById('hud-progress');
const hudPoints = document.getElementById('hud-points');
const hudStreak = document.getElementById('hud-streak');
const activeAvatar = document.getElementById('active-avatar');
const copilotBubble = document.getElementById('copilot-bubble');
const numberA = document.getElementById('number-a');
const operator = document.getElementById('operator');
const numberB = document.getElementById('number-b');
const answerFeedbackText = document.getElementById('answer-feedback-text');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const streakBox = document.getElementById('streak-box');

// Summary
const summaryBadgeVisual = document.getElementById('summary-badge-visual');
const summaryTitle = document.getElementById('summary-title');
const summarySubtitle = document.getElementById('summary-subtitle');
const sumCorrect = document.getElementById('sum-correct');
const sumTime = document.getElementById('sum-time');
const sumPoints = document.getElementById('sum-points');
const sumBest = document.getElementById('sum-best');
const bestTimeContainer = document.getElementById('best-time-container');
const rewardNotification = document.getElementById('reward-notification');

// Explanation
const explainEquationText = document.getElementById('explain-equation-text');
const explainVerbalText = document.getElementById('explain-verbal-text');
const explanationGrid = document.getElementById('explanation-grid');

// Canvas
const canvas = document.getElementById('effects-canvas');
const ctx = canvas.getContext('2d');

// --- Audio Synthesizer Engine ---
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const t = audioContext.currentTime;
    
    switch (type) {
        case 'correct': {
            // A warm major third arpeggio (chime)
            const osc1 = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc1.connect(gain);
            gain.connect(audioContext.destination);
            osc1.type = 'sine';
            
            osc1.frequency.setValueAtTime(523.25, t); // C5
            osc1.frequency.setValueAtTime(659.25, t + 0.08); // E5
            
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            
            osc1.start(t);
            osc1.stop(t + 0.25);
            break;
        }
        case 'incorrect': {
            // A descending frequency sweep
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'sawtooth';
            
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);
            
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            
            osc.start(t);
            osc.stop(t + 0.35);
            break;
        }
        case 'streak': {
            // High energy retro laser
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'triangle';
            
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
            
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            
            osc.start(t);
            osc.stop(t + 0.2);
            break;
        }
        case 'victory': {
            // Triumphant fanfare
            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            notes.forEach((freq, idx) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.type = 'sine';
                
                osc.frequency.setValueAtTime(freq, t + idx * 0.1);
                gain.gain.setValueAtTime(0, t);
                gain.gain.setValueAtTime(0.15, t + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.4);
                
                osc.start(t + idx * 0.1);
                osc.stop(t + idx * 0.1 + 0.4);
            });
            break;
        }
        case 'gameover': {
            // Sad sweep
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'sine';
            
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.5);
            
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            
            osc.start(t);
            osc.stop(t + 0.5);
            break;
        }
    }
}

// --- Dynamic Particle Engine ---
let particles = [];
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type; // 'star', 'bubble', 'spark'
        this.size = Math.random() * 5 + 3;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8 - (type === 'spark' ? 2 : 0);
        this.gravity = type === 'spark' ? -0.05 : 0.1;
        this.alpha = 1;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 'star') {
            // Draw a tiny 4-pointed star
            const rot = Math.PI / 2 * 3;
            let cx = this.x;
            let cy = this.y;
            let spikes = 4;
            let outerRadius = this.size;
            let innerRadius = this.size / 2;
            let step = Math.PI / spikes;
            let x = cx;
            let y = cy;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot + i * step * 2) * outerRadius;
                y = cy + Math.sin(rot + i * step * 2) * outerRadius;
                ctx.lineTo(x, y);
                x = cx + Math.cos(rot + (i * step * 2) + step) * innerRadius;
                y = cy + Math.sin(rot + (i * step * 2) + step) * innerRadius;
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
        } else {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function spawnParticles(x, y, color, type, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, type));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}
requestAnimationFrame(animateParticles);

// --- Initialization & UI Binding ---

async function initApp() {
    bindEvents();
    generatePlanetGrid();
    await fetchStats();
}

function bindEvents() {
    // Mode toggle selection
    document.getElementById('mode-multiplication').addEventListener('click', (e) => {
        document.getElementById('mode-multiplication').classList.add('active');
        document.getElementById('mode-division').classList.remove('active');
        currentMode = 'multiplication';
        initAudio();
    });

    document.getElementById('mode-division').addEventListener('click', (e) => {
        document.getElementById('mode-division').classList.add('active');
        document.getElementById('mode-multiplication').classList.remove('active');
        currentMode = 'division';
        initAudio();
    });

    // Avatar selections
    document.querySelectorAll('.avatar-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(item => item.classList.remove('active'));
            el.classList.add('active');
            selectedAvatar = el.dataset.avatar;
            initAudio();
        });
    });

    // Timer selections
    document.querySelectorAll('.timer-btn').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.timer-btn').forEach(item => item.classList.remove('active'));
            el.classList.add('active');
            const selectedTime = el.dataset.time;
            if (selectedTime === 'disabled') {
                timerDuration = null;
            } else {
                timerDuration = parseInt(selectedTime);
            }
            initAudio();
        });
    });

    // Audio Toggle button
    audioToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        audioToggle.querySelector('.sound-icon').innerText = soundEnabled ? '🔊' : '🔇';
    });

    // Start Button
    btnStartExploration.addEventListener('click', () => {
        initAudio();
        showScreen(mapScreen);
    });

    // Back to setup from Map
    btnMapBack.addEventListener('click', () => {
        showScreen(setupScreen);
    });

    // Quit game session
    btnGameQuit.addEventListener('click', () => {
        pauseTimer();
        document.getElementById('confirm-modal').classList.add('active');
    });

    document.getElementById('btn-confirm-yes').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.remove('active');
        endGameSession(false, true);
    });

    document.getElementById('btn-confirm-no').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.remove('active');
        startTimer();
        userAnswerInput.focus();
    });

    // Submit answer buttons
    btnSubmitAnswer.addEventListener('click', checkAnswer);
    userAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // Keypad touches
    document.querySelectorAll('.numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            const currentVal = userAnswerInput.value;
            
            if (val === 'clear') {
                userAnswerInput.value = '';
            } else if (val === 'delete') {
                userAnswerInput.value = currentVal.slice(0, -1);
            } else {
                userAnswerInput.value = currentVal + val;
            }
            userAnswerInput.focus();
        });
    });

    // Mistakes Modal close
    btnCloseExplanation.addEventListener('click', () => {
        explanationModal.classList.remove('active');
        userAnswerInput.value = '';
        userAnswerInput.focus();
        
        // Resume Game Loop next question
        currentProblemIndex++;
        if (currentProblemIndex < activeProblems.length) {
            setupQuestion();
            startTimer();
        } else {
            endGameSession(true);
        }
    });

    // Navigation triggers on Summary
    btnReplay.addEventListener('click', () => {
        startPractice(activeTable);
    });

    btnNextPlanet.addEventListener('click', () => {
        const nextTable = getNextUncompletedPlanet(activeTable + 1) || getNextUncompletedPlanet(2);
        if (nextTable !== null) {
            startPractice(nextTable);
        } else {
            showScreen(mapScreen);
        }
    });

    btnGoMap.addEventListener('click', () => {
        showScreen(mapScreen);
    });

    bindRewardsEvents();
}

function showScreen(screen) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// --- Fetch & Sync stats from API ---
async function fetchStats() {
    try {
        const res = await fetch('/api/stats');
        if (res.ok) {
            const data = await res.json();
            stats = data;
            if (data.rewards_data) {
                rewardsData = mergeRewardsData(rewardsData, data.rewards_data);
            }
        } else {
            throw new Error();
        }
    } catch (e) {
        console.warn("Could not load statistics from server API, falling back to LocalStorage.");
        const fallback = localStorage.getItem('math_galaxy_stats');
        if (fallback) {
            try {
                const parsed = JSON.parse(fallback);
                stats = parsed;
                if (parsed.rewards_data) {
                    rewardsData = mergeRewardsData(rewardsData, parsed.rewards_data);
                }
            } catch(err) {}
        }
    }
    updateOverallStats();
    updateRewardsUI();
}

async function syncGameStats(table, success, elapsed) {
    const key = currentMode === 'multiplication' ? String(table) : `div_${table}`;
    
    // Fallback local storage update
    if (!stats[key]) {
        stats[key] = { attempts: 0, successes: 0, failures: 0, best_time: null };
    }
    stats[key].attempts += 1;
    if (success) {
        stats[key].successes += 1;
        const currentBest = stats[key].best_time;
        if (currentBest === null || elapsed < currentBest) {
            stats[key].best_time = elapsed;
        }
    } else {
        stats[key].failures += 1;
    }
    localStorage.setItem('math_galaxy_stats', JSON.stringify(stats));

    // Save to the API
    try {
        const payload = {};
        payload[key] = {
            attempts: 1,
            successes: success ? 1 : 0,
            failures: success ? 0 : 1,
            best_time: success ? elapsed : null
        };
        const res = await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            stats = await res.json();
        }
    } catch (e) {
        console.error("Failed to post stats to server api.", e);
    }
    updateOverallStats();
}

function updateOverallStats() {
    let totalStars = 0;
    // Calculate stars from keys
    Object.keys(stats).forEach(k => {
        if (stats[k].successes > 0) {
            totalStars++;
        }
    });
    totalStarsCount.innerText = totalStars;
    generatePlanetGrid();
}

// --- Generate Planet Selector Map UI ---
const PLANET_NAMES = {
    2: "Planet Duo",
    3: "Planet Trio",
    4: "Planet Quadra",
    5: "Planet Penta",
    6: "Planet Hexa",
    7: "Planet Hepta",
    8: "Planet Octa",
    9: "Planet Nona",
    10: "Planet Deca",
    11: "Planet Eleven",
    12: "Planet Cosmos"
};

function generatePlanetGrid() {
    const container = document.querySelector('.planet-container');
    container.innerHTML = '';
    
    for (let table = 2; table <= 12; table++) {
        const card = document.createElement('div');
        card.className = 'planet-card';
        card.dataset.table = table;

        // Multiplication stats
        const multiKey = String(table);
        const multiStats = stats[multiKey] || {};
        const hasMultiStar = (multiStats.successes || 0) > 0;
        const bestMulti = multiStats.best_time;

        // Division stats
        const divKey = `div_${table}`;
        const divStats = stats[divKey] || {};
        const hasDivStar = (divStats.successes || 0) > 0;
        const bestDiv = divStats.best_time;

        // Check completion/locking in current mode
        const currentModeKey = currentMode === 'multiplication' ? multiKey : divKey;
        const isModeCompleted = ((stats[currentModeKey] || {}).successes || 0) > 0;

        // We can show badges under planet
        const badgesHtml = `
            <div class="planet-badges">
                <span class="badge-slot ${hasMultiStar ? 'unlocked' : ''}" style="color: #ffd700;" title="Multiplication Star">
                    🌟
                    ${bestMulti && bestMulti < 30 ? '<span class="crown">👑</span>' : ''}
                </span>
                <span class="badge-slot ${hasDivStar ? 'unlocked' : ''}" style="color: #00ffff;" title="Division Star">
                    💫
                    ${bestDiv && bestDiv < 30 ? '<span class="crown">👑</span>' : ''}
                </span>
            </div>
        `;

        // Render best time or stats label
        let statsLabelText = 'Unexplored';
        if (hasMultiStar || hasDivStar) {
            const timeA = bestMulti ? `${bestMulti.toFixed(1)}s` : '-';
            const timeB = bestDiv ? `${bestDiv.toFixed(1)}s` : '-';
            statsLabelText = `✖ ${timeA} | ➗ ${timeB}`;
        }

        const lockOverlayHtml = isModeCompleted ? `<div class="planet-lock-overlay">🔒</div>` : '';

        card.innerHTML = `
            <div class="planet-sphere p-${table}">
                <div class="planet-num">${table}</div>
                ${lockOverlayHtml}
            </div>
            <div class="planet-name">${PLANET_NAMES[table]}</div>
            ${badgesHtml}
            <div class="planet-stats">${statsLabelText}</div>
        `;

        if (isModeCompleted) {
            card.classList.add('locked');
            card.title = `Planet ${table} Completed & Locked`;
        } else {
            card.addEventListener('click', () => {
                startPractice(table);
            });
        }

        container.appendChild(card);
    }
}

// --- Game Play Implementation ---

function generateProblems(table, mode) {
    const list = [];
    if (mode === 'multiplication') {
        // Base 13 problems (0 to 12)
        for (let i = 0; i <= 12; i++) {
            list.push({ a: table, b: i, answer: table * i });
        }
        // 7 random extras
        for (let i = 0; i < 7; i++) {
            const mult = Math.floor(Math.random() * 13);
            list.push({ a: table, b: mult, answer: table * mult });
        }
    } else {
        // Division: Quotient M from 0 to 12. Dividend = M * divisor.
        for (let i = 0; i <= 12; i++) {
            list.push({ a: i * table, b: table, answer: i });
        }
        // 7 random extras
        for (let i = 0; i < 7; i++) {
            const mult = Math.floor(Math.random() * 13);
            list.push({ a: mult * table, b: table, answer: mult });
        }
    }

    // Shuffle problems list (Fisher-Yates)
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }

    return list;
}

function startPractice(table) {
    activeTable = table;
    activeProblems = generateProblems(table, currentMode);
    currentProblemIndex = 0;
    points = 0;
    streak = 0;
    maxStreak = 0;
    correctAnswers = 0;
    elapsedSeconds = 0;
    secondsRemaining = timerDuration;
    
    // Set up active co-pilot avatar
    const copilotData = AVATARS[selectedAvatar];
    activeAvatar.innerText = copilotData.emoji;
    copilotBubble.innerText = copilotData.bubble.start;

    // HUD badges
    document.getElementById('game-mode-badge').innerText = currentMode.toUpperCase();
    document.getElementById('game-level-badge').innerText = `Table ${table} - ${PLANET_NAMES[table]}`;
    
    // Reset inputs
    userAnswerInput.value = '';
    answerFeedbackText.innerText = '';
    answerFeedbackText.className = 'feedback-indicator';
    
    // Update labels
    hudProgress.innerText = `1 / 20`;
    hudPoints.innerText = `0`;
    hudStreak.innerText = `0`;
    streakBox.style.display = 'none';

    // Show screen
    showScreen(gameScreen);
    setupQuestion();
    
    // Start Timer
    startTimer();
}

function startTimer() {
    startTime = Date.now() - elapsedSeconds * 1000;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsedSeconds = (Date.now() - startTime) / 1000;
        
        if (timerDuration !== null) {
            secondsRemaining = Math.max(0, timerDuration - elapsedSeconds);
            updateTimerUI();
            
            if (secondsRemaining <= 0) {
                pauseTimer();
                endGameSession(false);
            }
        } else {
            updateTimerUI();
        }
    }, 100);

    // Start Daily Goal 5-minute Practice Counter
    startDailyPracticeCounter();
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    stopDailyPracticeCounter();
}

function updateTimerUI() {
    if (timerDuration === null) {
        timerBar.style.width = '100%';
        timerText.innerText = `${Math.floor(elapsedSeconds)}s`;
        timerBar.className = 'timer-bar';
    } else {
        const pct = (secondsRemaining / timerDuration) * 100;
        timerBar.style.width = `${pct}%`;
        timerText.innerText = `${Math.ceil(secondsRemaining)}s`;

        // Handle timer alert styling
        timerBar.className = 'timer-bar';
        if (secondsRemaining < timerDuration * 0.25) {
            timerBar.classList.add('danger');
        } else if (secondsRemaining < timerDuration * 0.5) {
            timerBar.classList.add('warning');
        }
    }
}

function setupQuestion() {
    const problem = activeProblems[currentProblemIndex];
    numberA.innerText = problem.a;
    numberB.innerText = problem.b;
    operator.innerText = currentMode === 'multiplication' ? '×' : '÷';

    hudProgress.innerText = `${currentProblemIndex + 1} / 20`;
    userAnswerInput.value = '';
    userAnswerInput.focus();

    // Trigger visual pop in
    const equationContainer = document.getElementById('equation-card-el');
    equationContainer.style.transform = 'scale(0.98)';
    setTimeout(() => equationContainer.style.transform = 'scale(1)', 50);

    // Random idle chatter from co-pilot occasionally
    if (currentProblemIndex > 0 && Math.random() < 0.25) {
        const chatter = ["Keep flying!", "You're doing great!", "Let's capture this star!", "Focus!", "Calculate!"];
        copilotBubble.innerText = chatter[Math.floor(Math.random() * chatter.length)];
    }
}

function checkAnswer() {
    const rawVal = userAnswerInput.value.trim();
    if (rawVal === '') return;

    const answer = parseInt(rawVal);
    const problem = activeProblems[currentProblemIndex];
    const isCorrect = answer === problem.answer;
    
    const inputWrapper = document.querySelector('.input-wrapper');
    const copilotData = AVATARS[selectedAvatar];

    if (isCorrect) {
        correctAnswers++;
        streak++;
        if (streak > maxStreak) maxStreak = streak;

        // Synthesize correct sound
        playSound('correct');

        // Give points based on speed and streak
        const streakBonus = Math.floor(streak / 5) * 50;
        const speedBonus = Math.max(10, Math.floor(secondsRemaining * 2));
        const ptsEarned = 100 + streakBonus + speedBonus;
        points += ptsEarned;
        
        hudPoints.innerText = points;

        // Feedback triggers
        answerFeedbackText.innerText = '✨ CORRECT! ✨';
        answerFeedbackText.className = 'feedback-indicator correct';
        
        // Spawn green particles near user input
        const rect = userAnswerInput.getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#22c55e', 'star', 20);

        // Co-pilot reaction
        if (streak > 0 && streak % 5 === 0) {
            playSound('streak');
            copilotBubble.innerText = copilotData.bubble.streak[Math.floor(Math.random() * copilotData.bubble.streak.length)];
            streakBox.style.display = 'flex';
            hudStreak.innerText = `${streak} 🔥`;
            // Trigger bouncy animation on streak box
            streakBox.style.animation = 'none';
            setTimeout(() => streakBox.style.animation = 'bounce-large 0.4s ease', 10);
        } else {
            copilotBubble.innerText = copilotData.bubble.correct[Math.floor(Math.random() * copilotData.bubble.correct.length)];
        }

        // Advance to next problem immediately or end session
        setTimeout(() => {
            currentProblemIndex++;
            if (currentProblemIndex < activeProblems.length) {
                setupQuestion();
            } else {
                endGameSession(true);
            }
        }, 300);

    } else {
        // Incorrect
        streak = 0;
        hudStreak.innerText = '0';
        streakBox.style.display = 'none';

        // Synthesize warning sound
        playSound('incorrect');

        // Shake the card container
        const cardEl = document.getElementById('equation-card-el');
        cardEl.classList.add('shake-element');
        setTimeout(() => cardEl.classList.remove('shake-element'), 500);

        // Co-pilot sad face / support
        copilotBubble.innerText = copilotData.bubble.incorrect[Math.floor(Math.random() * copilotData.bubble.incorrect.length)];

        // Spawn particles
        const rect = userAnswerInput.getBoundingClientRect();
        spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#ef4444', 'circle', 12);

        // Display correct feedback and open visual explanation modal
        answerFeedbackText.innerText = `Wrong! ${problem.a} ${currentMode === 'multiplication' ? '×' : '÷'} ${problem.b} = ${problem.answer}`;
        answerFeedbackText.className = 'feedback-indicator incorrect';

        setTimeout(() => {
            showMistakeExplanation(problem);
        }, 500);
    }
}

// --- Visual Explanation Grid Maker ---
function showMistakeExplanation(problem) {
    if (timerInterval) clearInterval(timerInterval); // Pause game timer

    let mathText = "";
    let verbalText = "";
    
    // Draw columns/rows grid
    explanationGrid.innerHTML = '';

    if (currentMode === 'multiplication') {
        const rows = problem.a;
        const cols = problem.b;
        mathText = `${rows} × ${cols} = ${problem.answer}`;
        verbalText = `${rows} groups of ${cols} stars = ${problem.answer} stars!`;

        // If table multiplication by 0: special tip
        if (rows === 0 || cols === 0) {
            verbalText = "Rule: Anything multiplied by 0 is always 0!";
            explanationGrid.innerHTML = `<span style="font-size: 3rem;">🕳️ Empty Space</span>`;
        } else {
            // Draw rows/cols star grid
            explanationGrid.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const starCell = document.createElement('div');
                    starCell.className = 'grid-cell';
                    starCell.innerText = '⭐';
                    explanationGrid.appendChild(starCell);
                }
            }
        }
    } else {
        // Division: Dividend (A) / Divisor (B) = Quotient (Ans)
        const dividend = problem.a;
        const divisor = problem.b;
        const quotient = problem.answer;

        mathText = `${dividend} ÷ ${divisor} = ${quotient}`;
        verbalText = `Share ${dividend} stars into ${divisor} equal groups. Each group gets ${quotient} stars!`;

        if (dividend === 0) {
            verbalText = "0 items shared is always 0 items per group!";
            explanationGrid.innerHTML = `<span style="font-size: 3rem;">🕳️ Empty Space</span>`;
        } else {
            // Visualize division: Draw divisor containers enclosing quotient elements
            explanationGrid.style.gridTemplateColumns = `repeat(${divisor}, auto)`;
            for (let group = 0; group < divisor; group++) {
                const container = document.createElement('div');
                container.style.border = '2px dashed rgba(6, 182, 212, 0.4)';
                container.style.borderRadius = '8px';
                container.style.padding = '4px';
                container.style.margin = '2px';
                container.style.display = 'flex';
                container.style.gap = '2px';
                container.style.justifyContent = 'center';
                
                for (let q = 0; q < quotient; q++) {
                    const starCell = document.createElement('div');
                    starCell.className = 'grid-cell';
                    starCell.innerText = '⭐';
                    container.appendChild(starCell);
                }
                explanationGrid.appendChild(container);
            }
        }
    }

    explainEquationText.innerText = mathText;
    explainVerbalText.innerText = verbalText;
    explanationModal.classList.add('active');
}

// --- Helper to find next uncompleted planet ---
function getNextUncompletedPlanet(startTable) {
    for (let t = startTable; t <= 12; t++) {
        const key = currentMode === 'multiplication' ? String(t) : `div_${t}`;
        const isCompleted = ((stats[key] || {}).successes || 0) > 0;
        if (!isCompleted) {
            return t;
        }
    }
    return null;
}

// --- End Session (Victory/Game Over) ---
async function endGameSession(completedAllQuestions = true, aborted = false) {
    pauseTimer();
    
    if (aborted) {
        showScreen(mapScreen);
        return;
    }

    const elapsed = elapsedSeconds;
    const isSuccess = completedAllQuestions && correctAnswers >= 18 && (timerDuration === null || elapsed <= timerDuration);
    
    // Play end sound
    if (isSuccess) {
        playSound('victory');
        // Spawn screen confetti
        for(let i = 0; i < 5; i++) {
            setTimeout(() => {
                spawnParticles(Math.random() * canvas.width, Math.random() * canvas.height * 0.4, '#ec4899', 'star', 30);
            }, i * 300);
        }
    } else {
        playSound('gameover');
    }

    // Load co-pilot victory statement
    const copilotData = AVATARS[selectedAvatar];

    // Trigger Summary Content Updates
    sumCorrect.innerText = `${correctAnswers} / 20`;
    sumTime.innerText = `${elapsed.toFixed(1)}s`;
    sumPoints.innerText = points.toLocaleString();

    // Key check for record
    const recordKey = currentMode === 'multiplication' ? String(activeTable) : `div_${activeTable}`;
    const previousStats = stats[recordKey] || {};
    const oldBest = previousStats.best_time;
    
    if (isSuccess) {
        summaryTitle.innerText = "MISSION SUCCESSFUL! 🏆";
        summaryTitle.style.color = 'var(--color-success)';
        summarySubtitle.innerText = copilotData.bubble.victory;
        summaryBadgeVisual.innerText = '🪐';

        if (oldBest === null || elapsed < oldBest) {
            sumBest.innerText = `NEW RECORD! 🚀`;
            sumBest.className = 'value text-neon-pink';
            rewardNotification.innerText = `🎉 Amazing flight! You unlocked a brand new star badge for table ${activeTable}!`;
        } else {
            sumBest.innerText = `${oldBest.toFixed(1)}s`;
            sumBest.className = 'value';
            rewardNotification.innerText = `🪐 Planet explored! You maintained your star for this level!`;
        }
        bestTimeContainer.style.display = 'flex';

        // Write stats to api/local
        await syncGameStats(activeTable, true, elapsed);

        // Hide replay option since it is now locked
        btnReplay.style.display = 'none';

        // Find the next uncompleted planet (check starting from activeTable+1, then wrap from 2)
        const nextTable = getNextUncompletedPlanet(activeTable + 1) || getNextUncompletedPlanet(2);
        if (nextTable !== null) {
            btnNextPlanet.style.display = 'block';
            btnNextPlanet.innerText = `NEXT PLANET (${PLANET_NAMES[nextTable]}) 🪐`;
        } else {
            btnNextPlanet.style.display = 'none';
            rewardNotification.innerText += `\n🌌 CONGRATULATIONS! You have completed all levels in this mode!`;
        }
    } else {
        summaryTitle.innerText = "MISSION ABORTED ⏱️";
        summaryTitle.style.color = 'var(--color-danger)';
        summaryBadgeVisual.innerText = '💥';
        summarySubtitle.innerText = "We didn't reach the target destination. Let's practice and re-launch!";
        
        bestTimeContainer.style.display = 'none';
        
        const goalText = timerDuration !== null 
            ? `Get at least 18 correct answers in ${timerDuration} seconds`
            : `Get at least 18 correct answers`;
        rewardNotification.innerText = `⚠️ Goal: ${goalText} (Got ${correctAnswers} in ${elapsed.toFixed(1)}s).`;
        
        // Show replay option to let them try again
        btnReplay.style.display = 'block';
        btnNextPlanet.style.display = 'none';

        // Write fail attempts to API
        await syncGameStats(activeTable, false, elapsed);
    }

    showScreen(summaryScreen);
}

// ==========================================================================
// REWARDS & WEEKLY MISSION HUB ENGINE
// ==========================================================================

const SHOP_ITEMS = [
    { id: 'helmet_dog', name: "Astro Helmet (Cosmo)", type: 'hat', avatar: 'dog', cost: 2, icon: '🪖', desc: 'Sleek space helmet' },
    { id: 'goggles_dog', name: "Laser Visor (Cosmo)", type: 'hat', avatar: 'dog', cost: 5, icon: '🥽', desc: 'Tactical laser optics' },
    { id: 'crown_cat', name: "Cosmic Crown (Nova)", type: 'hat', avatar: 'cat', cost: 2, icon: '👑', desc: 'Glowing star crown' },
    { id: 'wings_cat', name: "Star Wings (Nova)", type: 'hat', avatar: 'cat', cost: 5, icon: '🪽', desc: 'Shimmering nebular wings' },
    { id: 'antenna_robot', name: "Neon Antenna (Pip)", type: 'hat', avatar: 'robot', cost: 2, icon: '📡', desc: 'Comm signal rod' },
    { id: 'visor_robot', name: "Quantum Visor (Pip)", type: 'hat', avatar: 'robot', cost: 5, icon: '🕶️', desc: 'Math calculation optics' },
    { id: 'wand_fairy', name: "Sparkle Wand (Stella)", type: 'hat', avatar: 'fairy', cost: 2, icon: '🪄', desc: 'Enchanted star wand' },
    { id: 'halo_fairy', name: "Galaxy Halo (Stella)", type: 'hat', avatar: 'fairy', cost: 5, icon: '😇', desc: 'Floating celestial halo' },
    { id: 'trail_rainbow', name: "Rainbow Trail FX", type: 'trail', avatar: 'all', cost: 8, icon: '🌈', desc: 'Rainbow sparkles on solves' },
    { id: 'trail_fire', name: "Fireball Trail FX", type: 'trail', avatar: 'all', cost: 10, icon: '🔥', desc: 'Cosmic blaze solve effect' }
];

function mergeRewardsData(target, incoming) {
    if (!incoming) return target;
    const res = Object.assign({}, target, incoming);
    if (incoming.bonus_stars !== undefined) {
        res.bonus_stars = Math.max(target.bonus_stars || 0, incoming.bonus_stars || 0);
    }
    if (incoming.daily_logs) {
        res.daily_logs = Object.assign({}, target.daily_logs || {}, incoming.daily_logs);
    }
    if (incoming.unlocked_items) {
        const itemSet = new Set([...(target.unlocked_items || []), ...(incoming.unlocked_items || [])]);
        res.unlocked_items = Array.from(itemSet);
    }
    if (incoming.weekly_history) {
        res.weekly_history = Object.assign({}, target.weekly_history || {}, incoming.weekly_history);
    }
    if (incoming.parent_settings) {
        res.parent_settings = Object.assign({}, target.parent_settings || {}, incoming.parent_settings);
    }
    if (incoming.equipped_items) {
        res.equipped_items = Object.assign({}, target.equipped_items || {}, incoming.equipped_items);
    }
    return res;
}

function getTodayDateStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatSeconds(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function getWeekKey() {
    const d = new Date();
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - startOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
}

function getCurrentWeekDays() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    
    const weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayStr = getTodayDateStr();

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        weekDays.push({
            dateStr,
            dayName: dayNames[i],
            isToday: dateStr === todayStr
        });
    }
    return weekDays;
}

// Active Daily Goal Practice Timer Counter (runs during gameplay)
function startDailyPracticeCounter() {
    if (dailyTimerInterval) clearInterval(dailyTimerInterval);
    dailyTimerInterval = setInterval(() => {
        const todayKey = getTodayDateStr();
        if (!rewardsData.daily_logs[todayKey]) {
            rewardsData.daily_logs[todayKey] = { seconds_played: 0, goal_completed: false };
        }

        const log = rewardsData.daily_logs[todayKey];
        log.seconds_played += 1;

        // Update active HUD counter element
        const hudDailyTime = document.getElementById('hud-daily-time');
        if (hudDailyTime) {
            hudDailyTime.innerText = formatSeconds(log.seconds_played);
        }

        // Check 5-minute threshold (300 seconds)
        if (log.seconds_played >= 300 && !log.goal_completed) {
            log.goal_completed = true;
            rewardsData.bonus_stars += 1;
            playSound('victory');
            showToast("🎉 DAILY GOAL COMPLETED! You earned 1 Bonus Star!", "🌟");
            checkWeeklyCompletion();
            saveRewardsData();
        } else if (log.seconds_played % 10 === 0) {
            saveRewardsData();
        }
        updateRewardsUI();
    }, 1000);
}

function stopDailyPracticeCounter() {
    if (dailyTimerInterval) {
        clearInterval(dailyTimerInterval);
        dailyTimerInterval = null;
    }
    saveRewardsData();
}

function checkWeeklyCompletion() {
    const weekDays = getCurrentWeekDays();
    let completedDaysCount = 0;
    weekDays.forEach(w => {
        const log = rewardsData.daily_logs[w.dateStr];
        if (log && log.goal_completed) {
            completedDaysCount++;
        }
    });

    const weekKey = getWeekKey();
    if (!rewardsData.weekly_history[weekKey]) {
        rewardsData.weekly_history[weekKey] = { claim_code: null, goal_met: false };
    }

    const weekRecord = rewardsData.weekly_history[weekKey];
    if (completedDaysCount >= 5 && !weekRecord.goal_met) {
        weekRecord.goal_met = true;
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        weekRecord.claim_code = `SKYLIGHT-STARS-${codeNum}`;
        rewardsData.bonus_stars += 5;
        playSound('victory');
        showToast(`🏆 WEEKLY MISSION COMPLETE! Claim Card Generated for 5 Skylight Bonus Stars: ${weekRecord.claim_code}`, "🚀");
    }
}

async function saveRewardsData() {
    stats.rewards_data = rewardsData;
    localStorage.setItem('math_galaxy_stats', JSON.stringify(stats));

    try {
        await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewards_data: rewardsData })
        });
    } catch (e) {
        console.error("Failed to post rewards_data to API.", e);
    }
    updateRewardsUI();
}

function showToast(message, icon = '🌟') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<span style="font-size: 1.4rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function updateRewardsUI() {
    const todayKey = getTodayDateStr();
    const todayLog = rewardsData.daily_logs[todayKey] || { seconds_played: 0, goal_completed: false };
    const seconds = todayLog.seconds_played;
    const isCompleted = todayLog.goal_completed;

    // Header Widget
    const widgetTodayStatus = document.getElementById('widget-today-status');
    const widgetStarCount = document.getElementById('widget-star-count');
    if (widgetStarCount) widgetStarCount.innerText = `🪙 ${rewardsData.bonus_stars}`;
    if (widgetTodayStatus) {
        widgetTodayStatus.innerText = isCompleted ? `5m Complete! ⭐` : `${Math.floor(seconds / 60)}/5m`;
        widgetTodayStatus.style.borderColor = isCompleted ? 'var(--color-success)' : 'var(--color-accent-cyan)';
    }

    // Game HUD
    const hudDailyTime = document.getElementById('hud-daily-time');
    if (hudDailyTime) {
        hudDailyTime.innerText = formatSeconds(seconds);
    }

    // Modal Tab 1: Weekly Progress
    const rewardsTodayTime = document.getElementById('rewards-today-time');
    const rewardsTodayBadge = document.getElementById('rewards-today-badge');
    const rewardsTodayBar = document.getElementById('rewards-today-bar');

    if (rewardsTodayTime) rewardsTodayTime.innerText = `${formatSeconds(seconds)} / 5m 00s`;
    if (rewardsTodayBadge) {
        rewardsTodayBadge.innerText = isCompleted ? "Goal Met! ⭐" : "In Progress ⏳";
        rewardsTodayBadge.className = `badge-status ${isCompleted ? 'completed' : 'incomplete'}`;
    }
    if (rewardsTodayBar) {
        const pct = Math.min(100, (seconds / 300) * 100);
        rewardsTodayBar.style.width = `${pct}%`;
    }

    // 7-Day Calendar Grid
    const calendarGrid = document.getElementById('weekly-calendar-grid');
    if (calendarGrid) {
        calendarGrid.innerHTML = '';
        const weekDays = getCurrentWeekDays();
        let completedCount = 0;

        weekDays.forEach(w => {
            const log = rewardsData.daily_logs[w.dateStr] || {};
            const done = log.goal_completed;
            if (done) completedCount++;

            const pill = document.createElement('div');
            pill.className = `day-pill ${done ? 'completed' : ''} ${w.isToday ? 'today' : ''}`;
            pill.innerHTML = `
                <span class="day-name">${w.dayName}${w.isToday ? ' (Today)' : ''}</span>
                <span class="day-icon">${done ? '⭐️' : '⚪'}</span>
                <span class="day-time">${formatSeconds(log.seconds_played || 0)}</span>
            `;
            calendarGrid.appendChild(pill);
        });

        const statusCard = document.getElementById('weekly-mission-status-card');
        if (statusCard) {
            if (completedCount >= 5) {
                statusCard.innerHTML = `
                    <div style="background: rgba(34,197,94,0.15); border: 1px solid #22c55e; border-radius: 12px; padding: 14px; text-align: center;">
                        <h4 style="color: #22c55e; margin-bottom: 4px;">🏆 WEEKLY GOAL COMPLETED! (${completedCount}/5 Days)</h4>
                        <p style="font-size: 0.85rem; color: white;">Your Skylight Chore Claim Card is ready in the next tab!</p>
                    </div>
                `;
            } else {
                statusCard.innerHTML = `
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; text-align: center;">
                        <h4 style="color: white; margin-bottom: 4px;">Weekly Progress: ${completedCount} / 5 Days Completed</h4>
                        <p style="font-size: 0.85rem; color: var(--color-text-dim);">Practice 5 minutes on ${5 - completedCount} more day(s) this week to claim your Skylight bonus stars!</p>
                    </div>
                `;
            }
        }
    }

    // Modal Tab 2: Skylight Claim Card
    const claimDisplay = document.getElementById('claim-card-display');
    if (claimDisplay) {
        const weekKey = getWeekKey();
        const weekRecord = rewardsData.weekly_history[weekKey] || {};
        const parentReward = rewardsData.parent_settings.custom_reward || "5 Skylight Calendar Bonus Stars";

        if (weekRecord.goal_met && weekRecord.claim_code) {
            claimDisplay.className = 'claim-card-box';
            claimDisplay.innerHTML = `
                <span style="font-size: 2.2rem;">🏆</span>
                <h4 style="color: white; font-size: 1.1rem; margin: 0;">OFFICIAL REWARD VERIFICATION</h4>
                <p style="font-size: 0.85rem; color: var(--color-text-dim);">Reward: <strong>${parentReward}</strong></p>
                <div class="claim-code-text">${weekRecord.claim_code}</div>
                <p style="font-size: 0.8rem; color: #38bdf8;">Show this code to your parent to claim your reward on your Skylight Calendar!</p>
                <button id="btn-copy-claim-code" class="btn-primary-sm">Copy Code 📋</button>
            `;
            const copyBtn = document.getElementById('btn-copy-claim-code');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(weekRecord.claim_code);
                    showToast("Claim Code copied to clipboard!", "📋");
                };
            }
        } else {
            claimDisplay.className = 'claim-card-box locked';
            const weekDays = getCurrentWeekDays();
            let count = 0;
            weekDays.forEach(w => {
                if ((rewardsData.daily_logs[w.dateStr] || {}).goal_completed) count++;
            });
            claimDisplay.innerHTML = `
                <span style="font-size: 2.2rem;">🔒</span>
                <h4 style="color: var(--color-text-dim); margin: 0;">CLAIM CARD LOCKED</h4>
                <p style="font-size: 0.85rem; color: var(--color-text-dim);">Complete 5 minutes of practice for 5 days this week to unlock your claim code!</p>
                <div class="badge-status incomplete">Progress: ${count} / 5 Days</div>
            `;
        }
    }

    // Modal Tab 3: Star Shop
    const shopStarBalance = document.getElementById('shop-star-balance');
    if (shopStarBalance) shopStarBalance.innerText = `🪙 ${rewardsData.bonus_stars}`;
    renderShopItems();

    // Modal Tab 4: Parent Zone Logs
    renderParentLogs();
}

function renderShopItems() {
    const grid = document.getElementById('shop-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const isUnlocked = rewardsData.unlocked_items.includes(item.id);
        const isEquipped = rewardsData.equipped_items[item.type] === item.id;

        const card = document.createElement('div');
        card.className = `shop-item-card glass-panel ${isUnlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <span class="shop-item-name">${item.name}</span>
            <span class="shop-item-desc">${item.desc}</span>
            <span class="shop-item-cost">${isUnlocked ? (isEquipped ? 'EQUIPPED ✅' : 'OWNED') : `🪙 ${item.cost}`}</span>
            <button class="btn-${isUnlocked ? (isEquipped ? 'secondary' : 'primary') : 'success'}-sm">${isUnlocked ? (isEquipped ? 'Unequip' : 'Equip') : 'Unlock'}</button>
        `;
        card.querySelector('button').onclick = () => purchaseShopItem(item);
        grid.appendChild(card);
    });
}

function purchaseShopItem(item) {
    if (rewardsData.unlocked_items.includes(item.id)) {
        if (item.type === 'hat') {
            rewardsData.equipped_items.hat = rewardsData.equipped_items.hat === item.id ? null : item.id;
        } else if (item.type === 'trail') {
            rewardsData.equipped_items.trail = rewardsData.equipped_items.trail === item.id ? null : item.id;
        }
        showToast(`${item.name} ${rewardsData.equipped_items[item.type] === item.id ? 'equipped' : 'unequipped'}!`, item.icon);
        saveRewardsData();
        return;
    }

    if (rewardsData.bonus_stars < item.cost) {
        playSound('incorrect');
        showToast(`Need ${item.cost - rewardsData.bonus_stars} more stars to unlock!`, "⚠️");
        return;
    }

    rewardsData.bonus_stars -= item.cost;
    rewardsData.unlocked_items.push(item.id);
    if (item.type === 'hat') rewardsData.equipped_items.hat = item.id;
    if (item.type === 'trail') rewardsData.equipped_items.trail = item.id;

    playSound('streak');
    showToast(`Unlocked ${item.name}!`, "🎉");
    saveRewardsData();
}

function renderParentLogs() {
    const container = document.getElementById('parent-logs-list');
    if (!container) return;
    container.innerHTML = '';

    const sortedDates = Object.keys(rewardsData.daily_logs).sort().reverse();
    if (sortedDates.length === 0) {
        container.innerHTML = `<div style="font-size: 0.8rem; color: var(--color-text-dim); text-align: center; padding: 10px;">No practice sessions logged yet.</div>`;
        return;
    }

    sortedDates.forEach(dateStr => {
        const log = rewardsData.daily_logs[dateStr];
        const row = document.createElement('div');
        row.className = 'log-row';
        row.innerHTML = `
            <span>📅 ${dateStr}</span>
            <span>⏱️ ${formatSeconds(log.seconds_played || 0)}</span>
            <span style="color: ${log.goal_completed ? '#22c55e' : '#f59e0b'}; font-weight: bold;">${log.goal_completed ? '✅ 5m Goal Met' : '⏳ In Progress'}</span>
        `;
        container.appendChild(row);
    });
}

function bindRewardsEvents() {
    // Open/Close Modal
    const btnOpen = document.getElementById('btn-open-rewards');
    const btnClose = document.getElementById('btn-close-rewards');
    const modal = document.getElementById('rewards-modal');

    if (btnOpen) btnOpen.onclick = () => { updateRewardsUI(); modal.classList.add('active'); };
    if (btnClose) btnClose.onclick = () => modal.classList.remove('active');

    // Tab switching
    document.querySelectorAll('.rewards-tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.rewards-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.rewards-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.tab);
            if (target) target.classList.add('active');
        };
    });

    // Parent PIN Unlock
    const btnUnlock = document.getElementById('btn-unlock-parent');
    const pinInput = document.getElementById('parent-pin-input');
    const pinErr = document.getElementById('pin-error-msg');
    const parentContent = document.getElementById('parent-controls-content');
    const parentLock = document.getElementById('parent-pin-lock');

    if (btnUnlock) {
        btnUnlock.onclick = () => {
            const entered = pinInput.value.trim();
            const actualPin = rewardsData.parent_settings.pin || "1234";
            if (entered === actualPin) {
                isParentUnlocked = true;
                pinErr.style.display = 'none';
                parentLock.style.display = 'none';
                parentContent.style.display = 'block';
                const customRewardText = document.getElementById('custom-reward-text');
                if (customRewardText) customRewardText.value = rewardsData.parent_settings.custom_reward || "5 Skylight Calendar Bonus Stars";
            } else {
                pinErr.style.display = 'block';
                playSound('incorrect');
            }
        };
    }

    // Save Reward Text
    const btnSaveReward = document.getElementById('btn-save-parent-reward');
    if (btnSaveReward) {
        btnSaveReward.onclick = () => {
            const val = document.getElementById('custom-reward-text').value.trim();
            if (val) {
                rewardsData.parent_settings.custom_reward = val;
                saveRewardsData();
                showToast("Saved custom reward name!", "⚙️");
            }
        };
    }

    // Save New PIN
    const btnSavePin = document.getElementById('btn-save-pin');
    if (btnSavePin) {
        btnSavePin.onclick = () => {
            const val = document.getElementById('new-pin-text').value.trim();
            if (val && val.length === 4) {
                rewardsData.parent_settings.pin = val;
                saveRewardsData();
                showToast("Updated Parent PIN!", "🔒");
                document.getElementById('new-pin-text').value = '';
            } else {
                showToast("PIN must be 4 digits!", "⚠️");
            }
        };
    }

    // Manual Complete Override
    const btnManualComplete = document.getElementById('btn-parent-manual-complete');
    if (btnManualComplete) {
        btnManualComplete.onclick = () => {
            const todayKey = getTodayDateStr();
            if (!rewardsData.daily_logs[todayKey]) {
                rewardsData.daily_logs[todayKey] = { seconds_played: 300, goal_completed: true };
            } else {
                rewardsData.daily_logs[todayKey].seconds_played = Math.max(300, rewardsData.daily_logs[todayKey].seconds_played);
                rewardsData.daily_logs[todayKey].goal_completed = true;
            }
            rewardsData.bonus_stars += 1;
            checkWeeklyCompletion();
            saveRewardsData();
            showToast("Marked today's practice goal as completed!", "✅");
        };
    }

    // Reset Week Progress
    const btnResetWeek = document.getElementById('btn-parent-reset-week');
    if (btnResetWeek) {
        btnResetWeek.onclick = () => {
            if (confirm("Reset current week's practice logs and claim card status?")) {
                const weekDays = getCurrentWeekDays();
                weekDays.forEach(w => {
                    delete rewardsData.daily_logs[w.dateStr];
                });
                const weekKey = getWeekKey();
                delete rewardsData.weekly_history[weekKey];
                saveRewardsData();
                showToast("Reset week progress!", "🧹");
            }
        };
    }
}

// Start app
window.addEventListener('DOMContentLoaded', initApp);
