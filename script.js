document.addEventListener('DOMContentLoaded', () => {
    // Images to attach to balloons
    const balloonImages = [
        'images/abhishek.jpg',
        'images/img2.jpg',
        'images/img3.jpg'
    ];

    // 1. Balloon Generation
    const balloonContainer = document.getElementById('balloon-container');
    const colors = ['#ff4b82', '#ff99cc', '#ffe600', '#00e676', '#00b0ff', '#aa00ff'];

    function createBalloon() {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon');

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100; // 0 to 100vw
        const duration = 5 + Math.random() * 10; // 5s to 15s for faster float
        const delay = Math.random() * 2; // 0s to 2s delay

        // Apply styles
        balloon.style.backgroundColor = color;
        balloon.style.left = `${left}vw`;
        balloon.style.animationDuration = `${duration}s`;
        balloon.style.animationDelay = `${delay}s`;

        // Add Image randomly
        if (Math.random() > 0.3) { // 70% chance to have an image
            const img = document.createElement('img');
            img.src = balloonImages[Math.floor(Math.random() * balloonImages.length)];
            img.classList.add('balloon-img');
            balloon.appendChild(img);
        }

        balloonContainer.appendChild(balloon);

        // Remove balloon after it finishes floating to prevent DOM bloat
        setTimeout(() => {
            balloon.remove();
        }, (duration + delay) * 1000);
    }

    // Initialize balloons but don't start creating yet
    let balloonInterval;

    // 2. Birthday Tune Player
    let isPlaying = false;
    let audioContext = null;

    // A simple Web Audio API synthesizer for playing "Happy Birthday" continuously
    function playHappyBirthday() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (isPlaying) return;
        isPlaying = true;

        // Happy Birthday Notes (Frequency in Hz, Duration in seconds)
        // C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25, Bb4 = 466.16
        const notes = [
            { freq: 261.63, dur: 0.3 }, // Hap
            { freq: 261.63, dur: 0.1 }, // py
            { freq: 293.66, dur: 0.4 }, // birth
            { freq: 261.63, dur: 0.4 }, // day
            { freq: 349.23, dur: 0.4 }, // to
            { freq: 329.63, dur: 0.8 }, // you

            { freq: 261.63, dur: 0.3 }, // Hap
            { freq: 261.63, dur: 0.1 }, // py
            { freq: 293.66, dur: 0.4 }, // birth
            { freq: 261.63, dur: 0.4 }, // day
            { freq: 392.00, dur: 0.4 }, // to
            { freq: 349.23, dur: 0.8 }, // you

            { freq: 261.63, dur: 0.3 }, // Hap
            { freq: 261.63, dur: 0.1 }, // py
            { freq: 523.25, dur: 0.4 }, // birth
            { freq: 440.00, dur: 0.4 }, // day
            { freq: 349.23, dur: 0.4 }, // dear
            { freq: 329.63, dur: 0.4 }, // Abhi
            { freq: 293.66, dur: 0.6 }, // shek

            { freq: 466.16, dur: 0.3 }, // Hap
            { freq: 466.16, dur: 0.1 }, // py
            { freq: 440.00, dur: 0.4 }, // birth
            { freq: 349.23, dur: 0.4 }, // day
            { freq: 392.00, dur: 0.4 }, // to
            { freq: 349.23, dur: 1.0 }, // you
        ];

        let time = audioContext.currentTime + 0.1;

        notes.forEach((note, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            // Envelope to avoid clicking sounds
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
            gain.gain.setValueAtTime(0.3, time + note.dur - 0.05);
            gain.gain.linearRampToValueAtTime(0, time + note.dur);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start(time);
            osc.stop(time + note.dur);

            time += note.dur + 0.05; // gap between notes
        });

        // Loop song after it finishes
        setTimeout(() => {
            isPlaying = false;
            playHappyBirthday(); // Play again
        }, (time - audioContext.currentTime) * 1000 + 2000); // Wait 2s before restarting
    }

    // 3. Fireworks Effect
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.radius = Math.random() * 2 + 1;
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * velocity;
            this.vy = Math.sin(angle) * velocity;
            this.life = 1.0;
            this.decay = Math.random() * 0.015 + 0.015;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05; // gravity
            this.life -= this.decay;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
            ctx.fill();
        }
    }

    function createFirework(x, y) {
        const colors = ['255, 75, 130', '255, 230, 0', '0, 230, 118', '0, 176, 255', '170, 0, 255'];
        const baseColor = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(x, y, baseColor));
        }
    }

    function animateFireworks() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Slight fade for trails
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.draw();
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // Randomly launch fireworks
        if (Math.random() < 0.05) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.5; // Top half
            createFirework(x, y);
        }

        requestAnimationFrame(animateFireworks);
    }

    // 4. Start Event
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');

    startBtn.addEventListener('click', () => {
        // Hide overlay
        startScreen.style.opacity = '0';
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 500);

        // Start Audio
        if(audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        playHappyBirthday();

        // Start Balloons
        for (let i = 0; i < 15; i++) {
            setTimeout(createBalloon, Math.random() * 1500);
        }
        balloonInterval = setInterval(createBalloon, 800);

        // Start Fireworks
        animateFireworks();
    });
});
