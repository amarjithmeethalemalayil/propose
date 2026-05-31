// --- State & References ---
window.gsap = window.gsap || (() => {
    const resolveTargets = (target) => {
        if (typeof target === 'string') return Array.from(document.querySelectorAll(target));
        if (target instanceof Element || target === window) return [target];
        return Array.from(target || []);
    };
    const applyVars = (target, vars = {}) => {
        resolveTargets(target).forEach((element) => {
            if (!element.style) return;
            if ('opacity' in vars) element.style.opacity = vars.opacity;
            if ('visibility' in vars) element.style.visibility = vars.visibility;
            if ('left' in vars) element.style.left = `${vars.left}px`;
            if ('top' in vars) element.style.top = `${vars.top}px`;
            if ('position' in vars) element.style.position = vars.position;

            const transforms = [];
            if ('x' in vars) transforms.push(`translateX(${typeof vars.x === 'number' ? `${vars.x}px` : vars.x})`);
            if ('y' in vars) transforms.push(`translateY(${typeof vars.y === 'number' ? `${vars.y}px` : vars.y})`);
            if ('scale' in vars) transforms.push(`scale(${vars.scale})`);
            if ('rotation' in vars) transforms.push(`rotate(${vars.rotation}deg)`);
            if (transforms.length) element.style.transform = transforms.join(' ');
        });
    };
    const complete = (vars = {}) => {
        const delay = ((vars.delay || 0) + (vars.duration || 0)) * 1000;
        window.setTimeout(() => vars.onComplete?.(), delay);
    };
    return {
        to(target, vars) {
            applyVars(target, vars);
            complete(vars);
        },
        from(target, vars) {
            applyVars(target, { opacity: 1, scale: 1, x: 0, y: 0 });
            complete(vars);
        },
        fromTo(target, fromVars, toVars) {
            applyVars(target, fromVars);
            requestAnimationFrame(() => applyVars(target, toVars));
            complete(toVars);
        },
        set(target, vars) {
            applyVars(target, vars);
        },
        timeline() {
            const api = {
                to(target, vars) { this._last = { target, vars }; gsap.to(target, vars); return this; },
                set(target, vars) { gsap.set(target, vars); return this; },
                add(callback) { callback?.(); return this; },
                call(callback) { callback?.(); return this; }
            };
            return api;
        }
    };
})();
window.confetti = window.confetti || (() => {});
const pages = Array.from(document.querySelectorAll('.page'));
const pageLabels = ['Rose', 'Before', 'Special', 'Question', 'Forever'];
let currentPageIndex = 0;
let noClickCount = 0;
let isMusicPlaying = false;
let heartCanvasStarted = false;
let pageTwoCompleted = false;
let celebrationStarted = false;

const pageIndicatorCount = document.getElementById('indicator-count');
const pageIndicatorLabel = document.getElementById('indicator-label');
const cursorFollower = document.getElementById('cursor-follower');
const musicBtn = document.getElementById('music-toggle');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let audioContext;
let masterGain;
let melodyTimer;
let nextChordIndex = 0;

const romanticChords = [
    [261.63, 329.63, 392.00],
    [293.66, 349.23, 440.00],
    [220.00, 329.63, 392.00],
    [246.94, 311.13, 392.00]
];

const noMessages = [
    'Not yet?',
    'Please?',
    'Think again...',
    'One more chance',
    'Come on ❤️'
];

const updateIndicator = (index) => {
    pageIndicatorCount.textContent = index === 0 ? '00 / 04' : `0${index} / 04`;
    pageIndicatorLabel.textContent = pageLabels[index].toUpperCase();
};

const updateMusicButton = () => {
    musicBtn.style.opacity = isMusicPlaying ? '1' : '0.7';
    musicBtn.setAttribute('aria-label', isMusicPlaying ? 'Pause background music' : 'Play background music');
    musicBtn.setAttribute('aria-pressed', String(isMusicPlaying));
};

const playChord = () => {
    if (!audioContext || !masterGain || !isMusicPlaying) return;

    const now = audioContext.currentTime;
    const chord = romanticChords[nextChordIndex % romanticChords.length];
    nextChordIndex += 1;

    chord.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.detune.setValueAtTime(index * 4, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.08 : 0.045, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        oscillator.connect(gain).connect(masterGain);
        oscillator.start(now);
        oscillator.stop(now + 2.35);
    });
};

const startRomanticMusic = async () => {
    if (isMusicPlaying) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = audioContext || new AudioContextClass();
    if (!masterGain) {
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.32;
        masterGain.connect(audioContext.destination);
    }

    await audioContext.resume();
    isMusicPlaying = true;
    updateMusicButton();
    playChord();
    clearInterval(melodyTimer);
    melodyTimer = setInterval(playChord, 2100);
};

const stopRomanticMusic = () => {
    isMusicPlaying = false;
    clearInterval(melodyTimer);
    melodyTimer = null;
    updateMusicButton();
};

const armFirstInteractionMusic = () => {
    const startOnce = (event) => {
        if (event.target?.closest?.('#music-toggle')) return;
        startRomanticMusic().catch(() => {});
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, startOnce, { once: true, passive: true });
    });
    startRomanticMusic().catch(() => {});
};

const transitionToPage = (index) => {
    if (index === currentPageIndex) return;

    const currentPage = pages[currentPageIndex];
    const nextPage = pages[index];
    const timeline = gsap.timeline({ defaults: { duration: 0.8, ease: 'power2.inOut' } });

    timeline
        .to(currentPage, { opacity: 0, y: -24, duration: 0.65 })
        .set(currentPage, { visibility: 'hidden' })
        .set(nextPage, { visibility: 'visible' })
        .fromTo(nextPage, { opacity: 0, y: 24 }, {
            opacity: 1,
            y: 0,
            onStart: () => {
                currentPage.classList.remove('active');
                nextPage.classList.add('active');
                currentPageIndex = index;
                updateIndicator(index);
                runPageLogic(index);
            }
        });
};

const animateWords = (text, container) => {
    return new Promise((resolve) => {
        const paragraph = document.createElement('p');
        paragraph.className = 'typewriter';
        text.split(' ').forEach((word) => {
            const span = document.createElement('span');
            span.className = 'animated-word';
            span.textContent = word;
            paragraph.appendChild(span);
        });
        container.appendChild(paragraph);
        gsap.to(paragraph.querySelectorAll('.animated-word'), {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: 'power3.out',
            onComplete: resolve
        });
    });
};

const createMagicBloom = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 18; i += 1) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.textContent = Math.random() > 0.5 ? '🌸' : '🌹';
        document.body.appendChild(petal);

        const angle = (Math.PI * 2 * i) / 18;
        const distance = 220 + Math.random() * 100;
        const targetX = centerX + Math.cos(angle) * distance;
        const targetY = centerY + Math.sin(angle) * distance;

        gsap.set(petal, {
            left: 0,
            top: 0,
            x: centerX,
            y: centerY,
            opacity: 0,
            scale: 0.6,
            position: 'fixed'
        });

        gsap.to(petal, {
            x: targetX,
            y: targetY,
            opacity: 1,
            scale: 1.3,
            rotation: Math.random() * 110 - 55,
            duration: 1.2,
            ease: 'power3.out',
            onComplete: () => {
                gsap.to(petal, {
                    opacity: 0,
                    duration: 0.8,
                    delay: 0.4,
                    onComplete: () => petal.remove()
                });
            }
        });
    }
};

const initBackground = () => {
    const starsContainer = document.querySelector('.stars-container');
    const starCount = prefersReducedMotion ? 60 : 180;
    for (let i = 0; i < starCount; i += 1) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.opacity = `${0.3 + Math.random() * 0.6}`;
        starsContainer.appendChild(star);
    }

    const petalsContainer = document.querySelector('.petals-container');
    const createPetal = () => {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.textContent = Math.random() > 0.6 ? '🌹' : '🌸';
        const startX = Math.random() * window.innerWidth;
        petal.style.position = 'fixed';
        petal.style.left = `${startX}px`;
        petal.style.top = '-40px';
        petal.style.fontSize = `${Math.random() * 18 + 14}px`;
        petalsContainer.appendChild(petal);

        gsap.to(petal, {
            y: window.innerHeight + 120,
            x: `+=${Math.random() * 200 - 100}`,
            rotation: Math.random() * 540,
            opacity: 0.85,
            duration: Math.random() * 7 + 5,
            ease: 'power1.out',
            onComplete: () => petal.remove()
        });
    };
    if (!prefersReducedMotion) {
        createPetal();
        setInterval(createPetal, 650);
    }

    const createShootingStar = () => {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        star.style.right = `${Math.random() * 60 + 10}%`;
        star.style.top = `${Math.random() * 30 + 5}%`;
        starsContainer.appendChild(star);
        gsap.fromTo(star, { opacity: 0, x: 0, y: 0 }, {
            opacity: 0,
            x: -360,
            y: 360,
            duration: 2.6,
            ease: 'power1.out',
            keyframes: [
                { opacity: 1, duration: 0.2 },
                { opacity: 0, duration: 2.4 }
            ]
        });
        setTimeout(() => star.remove(), 3200);
    };
    if (!prefersReducedMotion) {
        setInterval(createShootingStar, 3800);
    }
};

const initCursor = () => {
    document.addEventListener('pointermove', (event) => {
        gsap.to(cursorFollower, {
            x: event.clientX,
            y: event.clientY,
            duration: 0.18,
            ease: 'power2.out'
        });
        cursorFollower.classList.add('active');

        if (!prefersReducedMotion) {
            const depthX = (event.clientX / window.innerWidth - 0.5);
            const depthY = (event.clientY / window.innerHeight - 0.5);
            gsap.to('.stars-container', { x: depthX * 12, y: depthY * 10, duration: 1.4, ease: 'power2.out' });
            gsap.to('.aurora-layer', { x: depthX * -18, y: depthY * -12, duration: 1.8, ease: 'power2.out' });
            gsap.to('.floating-hand', { x: depthX * 10, y: depthY * 8, duration: 1.2, ease: 'power2.out' });
        }
    });

    document.addEventListener('pointerdown', () => {
        gsap.to(cursorFollower, { scale: 0.9, duration: 0.15 });
    });

    document.addEventListener('pointerup', () => {
        gsap.to(cursorFollower, { scale: 1.2, duration: 0.18 });
    });
};

const initHeartCanvas = () => {
    if (heartCanvasStarted) return;
    heartCanvasStarted = true;

    const canvas = document.getElementById('heart-canvas');
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;

    const resize = () => {
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const particleCount = 180;

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.t = Math.random() * Math.PI * 2;
            this.x = canvas.offsetWidth / 2;
            this.y = canvas.offsetHeight / 2;
            this.size = Math.random() * 3 + 1.2;
            this.speed = Math.random() * 0.03 + 0.01;
            const alpha = 0.4 + Math.random() * 0.5;
            this.color = `rgba(255, 110, 175, ${alpha})`;
        }
        update() {
            const scale = 11;
            const targetX = canvas.offsetWidth / 2 + scale * 16 * Math.pow(Math.sin(this.t), 3);
            const targetY = canvas.offsetHeight / 2 - scale * (13 * Math.cos(this.t) - 5 * Math.cos(2 * this.t) - 2 * Math.cos(3 * this.t) - Math.cos(4 * this.t));
            this.x += (targetX - this.x) * 0.06;
            this.y += (targetY - this.y) * 0.06;
            this.t += this.speed;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i += 1) {
        particles.push(new Particle());
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        particles.forEach((particle) => {
            particle.update();
            particle.draw();
        });
        if (!prefersReducedMotion) {
            requestAnimationFrame(animate);
        }
    };
    animate();
};

const updateSpecialProgress = () => {
    const selectedCards = document.querySelectorAll('.special-card.selected').length;
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('completed', index < selectedCards);
    });

    if (selectedCards === dots.length && !pageTwoCompleted) {
        pageTwoCompleted = true;
        const favoriteMsg = document.getElementById('favorite-person-msg');
        const continueBtn = document.getElementById('continue-2');
        favoriteMsg.classList.remove('hidden');
        continueBtn.classList.remove('hidden');
        gsap.fromTo(favoriteMsg, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
        gsap.fromTo(continueBtn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.25, ease: 'elastic.out(1, 0.5)' });
    }
};

const resetSpecialPage = () => {
    pageTwoCompleted = false;
    document.querySelectorAll('.special-card').forEach((card) => {
        card.classList.remove('selected');
        card.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('.progress-dot').forEach((dot) => dot.classList.remove('completed'));
    document.getElementById('favorite-person-msg').classList.add('hidden');
    document.getElementById('continue-2').classList.add('hidden');
};

const runPageLogic = async (index) => {
    switch (index) {
        case 0: {
            const container = document.getElementById('splash-text-1').parentElement;
            container.innerHTML = '';
            await animateWords('I brought something for you...', container);
            await new Promise((resolve) => setTimeout(resolve, 850));
            await animateWords('Will you accept this rose?', container);
            const takeBtn = document.getElementById('take-rose-btn');
            takeBtn.classList.remove('hidden');
            gsap.fromTo(takeBtn, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)' });
            break;
        }
        case 1: {
            const container = document.getElementById('messages-1');
            container.innerHTML = '';
            const messages = [
                'I never expected someone like you to walk into my life.',
                'But somehow...',
                'You became someone incredibly special.',
                'And before I ask you something important...',
                'There are beautiful moments I want to share with you.'
            ];
            for (const message of messages) {
                await animateWords(message, container);
                await new Promise((resolve) => setTimeout(resolve, 950));
            }
            const cards = document.getElementById('journey-1-cards');
            cards.classList.remove('hidden');
            gsap.from('.glass-card', {
                scale: 0.55,
                opacity: 0,
                duration: 0.9,
                stagger: 0.18,
                ease: 'back.out(1.7)'
            });
            const continueBtn = document.getElementById('continue-1');
            continueBtn.classList.add('hidden');
            break;
        }
        case 2: {
            resetSpecialPage();
            const specialCards = document.querySelectorAll('.special-card');
            for (const card of specialCards) {
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.95,
                    ease: 'power3.out'
                });
                await new Promise((resolve) => setTimeout(resolve, 450));
            }
            break;
        }
        case 3: {
            document.querySelector('.aurora-layer').classList.add('visible');
            initHeartCanvas();
            const texts = ['prop-text-1', 'prop-text-2', 'prop-text-3'];
            for (const id of texts) {
                gsap.fromTo(`#${id}`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });
                await new Promise((resolve) => setTimeout(resolve, 1300));
            }
            gsap.fromTo('#proposal-title', { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 1.7, ease: 'elastic.out(1, 0.4)' });
            gsap.fromTo('.proposal-buttons', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 1 });
            break;
        }
        case 4: {
            document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
            });
            startCelebration();
            break;
        }
    }
};

const showCardSpark = (card) => {
    const sparkle = document.createElement('div');
    sparkle.className = 'spark';
    document.body.appendChild(sparkle);
    const rect = card.getBoundingClientRect();
    gsap.set(sparkle, {
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height / 2,
        opacity: 1,
        scale: 0.4
    });
    gsap.to(sparkle, {
        x: `+=${Math.random() * 160 - 80}`,
        y: `+=${Math.random() * 120 - 90}`,
        opacity: 0,
        scale: 1.2,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => sparkle.remove()
    });
};

document.getElementById('take-rose-btn').addEventListener('click', () => {
    const rose = document.getElementById('rose-hand');
    const timeline = gsap.timeline();
    timeline
        .to(rose, { scale: 1.14, y: -12, duration: 0.75, ease: 'power2.out' })
        .to(rose, { rotation: -4, duration: 1.0, ease: 'elastic.out(1, 0.7)' }, '<')
        .to('.splash-content', { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, '-=0.4')
        .add(() => createMagicBloom(), 0.5)
        .call(() => transitionToPage(1), null, 1.2);
});

document.querySelectorAll('.glass-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, { scale: 1.02, duration: 0.35, ease: 'power3.out' });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, { scale: 1, duration: 0.35, ease: 'power3.out' });
    });

    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
        card.setAttribute('aria-pressed', String(card.classList.contains('flipped')));
        showCardSpark(card);
        checkCardsReveal();
    });

    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.click();
        }
    });
});

document.querySelectorAll('.special-card').forEach((card) => {
    card.addEventListener('click', () => {
        if (card.classList.contains('selected')) return;
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        showCardSpark(card);
        gsap.fromTo(card, { scale: 0.98 }, { scale: 1.02, yoyo: true, repeat: 1, duration: 0.18, ease: 'power2.out' });
        updateSpecialProgress();
    });
});

const checkCardsReveal = () => {
    const flipped = document.querySelectorAll('.glass-card.flipped');
    if (flipped.length >= 4) {
        const continueBtn = document.getElementById('continue-1');
        continueBtn.classList.remove('hidden');
        gsap.fromTo(continueBtn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.65, ease: 'back.out(1.2)' });
    }
};

document.getElementById('continue-1').addEventListener('click', () => transitionToPage(2));
document.getElementById('continue-2').addEventListener('click', () => transitionToPage(3));

const noBtn = document.getElementById('no-btn');

const moveNoButton = () => {
    const x = Math.random() * (window.innerWidth - 180) + 60;
    const y = Math.random() * (window.innerHeight - 140) + 80;
    const rot = Math.random() * 28 - 14;

    gsap.to(noBtn, {
        left: x,
        top: y,
        position: 'fixed',
        rotation: rot,
        duration: 0.45,
        ease: 'back.out(1.7)'
    });

    noBtn.innerText = noMessages[noClickCount % noMessages.length];
    noClickCount += 1;
};

noBtn.addEventListener('mouseenter', moveNoButton);
noBtn.addEventListener('touchstart', (event) => {
    event.preventDefault();
    moveNoButton();
});

const yesBtn = document.getElementById('yes-btn');
yesBtn.addEventListener('click', () => {
    const confettiColors = ['#F15A79', '#FF8ACD', '#FFD379', '#FFFFFF'];
    for (let i = 0; i < 3; i += 1) {
        confetti({
            particleCount: 50,
            spread: 80,
            origin: { y: 0.55 },
            colors: confettiColors,
            gravity: 0.55,
            scalar: 1.1
        });
    }

    gsap.to('.proposal-wrapper', { scale: 0.98, duration: 0.6, ease: 'power2.inOut' });
    setTimeout(() => transitionToPage(4), 1100);
});

const startCelebration = () => {
    if (celebrationStarted) return;
    celebrationStarted = true;

    const duration = 14000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            clearInterval(interval);
            return;
        }

        const particleCount = 35 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random() * 0.4 + 0.05, y: Math.random() - 0.3 }, colors: ['#FF8ACD', '#FFD379', '#FFE6F2'] }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random() * 0.4 + 0.55, y: Math.random() - 0.3 }, colors: ['#FFF4FF', '#FFB2D6', '#F8E1B8'] }));
    }, 250);

    if (!prefersReducedMotion) {
        setInterval(spawnFloatingHeart, 700);
        setInterval(spawnCelebrationSpark, 320);
    }
};

const spawnFloatingHeart = () => {
    const container = document.querySelector('.hearts-container');
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = Math.random() > 0.45 ? '♥' : '♡';
    container.appendChild(heart);

    gsap.set(heart, {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 40,
        scale: 0.75 + Math.random() * 0.8,
        opacity: 0
    });
    gsap.to(heart, {
        y: -80,
        x: `+=${Math.random() * 160 - 80}`,
        opacity: 0.9,
        rotation: Math.random() * 80 - 40,
        duration: 7 + Math.random() * 3,
        ease: 'power1.out',
        onComplete: () => heart.remove()
    });
};

const spawnCelebrationSpark = () => {
    const spark = document.createElement('div');
    spark.className = 'celebration-spark';
    document.body.appendChild(spark);

    gsap.set(spark, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: 0,
        scale: 0.4
    });
    gsap.to(spark, {
        opacity: 1,
        scale: 1.4,
        duration: 0.45,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        onComplete: () => spark.remove()
    });
};

musicBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        stopRomanticMusic();
    } else {
        startRomanticMusic().catch(() => {
            console.warn('Browser blocked audio. Tap the music icon again.');
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    initBackground();
    initCursor();
    updateIndicator(0);
    updateMusicButton();
    armFirstInteractionMusic();
    runPageLogic(0);
});
