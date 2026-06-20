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
let secondsRemaining = 60;
let activeTable = null;
let soundEnabled = true;
let audioContext = null;

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
        if (timerInterval) clearInterval(timerInterval); // Pause game timer
        document.getElementById('confirm-modal').classList.add('active');
    });

    document.getElementById('btn-confirm-yes').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.remove('active');
        endGameSession(false, true);
    });

    document.getElementById('btn-confirm-no').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.remove('active');
        // Resume game timer
        startTime = Date.now() - (60 - secondsRemaining) * 1000;
        timerInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            secondsRemaining = Math.max(0, 60 - elapsed);
            updateTimerUI();
            
            if (secondsRemaining <= 0) {
                clearInterval(timerInterval);
                endGameSession(false);
            }
        }, 100);
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
        } else {
            endGameSession(true);
        }
    });

    // Navigation triggers on Summary
    btnReplay.addEventListener('click', () => {
        startPractice(activeTable);
    });

    btnNextPlanet.addEventListener('click', () => {
        if (activeTable < 12) {
            startPractice(activeTable + 1);
        } else {
            showScreen(mapScreen);
        }
    });

    btnGoMap.addEventListener('click', () => {
        showScreen(mapScreen);
    });
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
            stats = await res.json();
        } else {
            throw new Error();
        }
    } catch (e) {
        console.warn("Could not load statistics from server API, falling back to LocalStorage.");
        const fallback = localStorage.getItem('math_galaxy_stats');
        stats = fallback ? JSON.parse(fallback) : {};
    }
    updateOverallStats();
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
        const isMultiPerfect = hasMultiStar && (multiStats.failures === 0 || multiStats.best_time !== null); // simplifies perfect visualization check

        // Division stats
        const divKey = `div_${table}`;
        const divStats = stats[divKey] || {};
        const hasDivStar = (divStats.successes || 0) > 0;
        const bestDiv = divStats.best_time;

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

        card.innerHTML = `
            <div class="planet-sphere p-${table}">
                <div class="planet-num">${table}</div>
            </div>
            <div class="planet-name">${PLANET_NAMES[table]}</div>
            ${badgesHtml}
            <div class="planet-stats">${statsLabelText}</div>
        `;

        card.addEventListener('click', () => {
            startPractice(table);
        });

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
    secondsRemaining = 60;
    
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
    
    // Timer Loop
    startTime = Date.now();
    updateTimerUI();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        secondsRemaining = Math.max(0, 60 - elapsed);
        updateTimerUI();
        
        if (secondsRemaining <= 0) {
            clearInterval(timerInterval);
            endGameSession(false);
        }
    }, 100);
}

function updateTimerUI() {
    const pct = (secondsRemaining / 60) * 100;
    timerBar.style.width = `${pct}%`;
    timerText.innerText = `${Math.ceil(secondsRemaining)}s`;

    // Handle timer alert styling
    timerBar.className = 'timer-bar';
    if (secondsRemaining < 15) {
        timerBar.classList.add('danger');
    } else if (secondsRemaining < 30) {
        timerBar.classList.add('warning');
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

// --- End Session (Victory/Game Over) ---
async function endGameSession(completedAllQuestions = true, aborted = false) {
    if (timerInterval) clearInterval(timerInterval);
    
    if (aborted) {
        showScreen(mapScreen);
        return;
    }

    const elapsed = 60 - secondsRemaining;
    const isSuccess = completedAllQuestions && correctAnswers >= 18 && elapsed <= 60;
    
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
        btnNextPlanet.style.display = activeTable < 12 ? 'block' : 'none';

        // Write stats to api/local
        await syncGameStats(activeTable, true, elapsed);
    } else {
        summaryTitle.innerText = "MISSION ABORTED ⏱️";
        summaryTitle.style.color = 'var(--color-danger)';
        summaryBadgeVisual.innerText = '💥';
        summarySubtitle.innerText = "We didn't reach the target destination. Let's practice and re-launch!";
        
        bestTimeContainer.style.display = 'none';
        rewardNotification.innerText = `⚠️ Goal: Get at least 18 correct answers in 60 seconds (Got ${correctAnswers} in ${elapsed.toFixed(1)}s).`;
        btnNextPlanet.style.display = 'none';

        // Write fail attempts to API
        await syncGameStats(activeTable, false, elapsed);
    }

    showScreen(summaryScreen);
}

// Start app
window.addEventListener('DOMContentLoaded', initApp);
