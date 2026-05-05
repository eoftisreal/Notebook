document.addEventListener('DOMContentLoaded', () => {
    // 1. Balloon Generation
    const balloonContainer = document.getElementById('balloon-container');
    const colors = ['#ff4b82', '#ff99cc', '#ffe600', '#00e676', '#00b0ff', '#aa00ff'];

    function createBalloon() {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon');

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100; // 0 to 100vw
        const duration = 10 + Math.random() * 15; // 10s to 25s
        const delay = Math.random() * 5; // 0s to 5s delay

        // Apply styles
        balloon.style.backgroundColor = color;
        balloon.style.left = `${left}vw`;
        balloon.style.animationDuration = `${duration}s`;
        balloon.style.animationDelay = `${delay}s`;

        balloonContainer.appendChild(balloon);

        // Remove balloon after it finishes floating to prevent DOM bloat
        setTimeout(() => {
            balloon.remove();
        }, (duration + delay) * 1000);
    }

    // Create initial batch of balloons
    for (let i = 0; i < 20; i++) {
        setTimeout(createBalloon, Math.random() * 3000);
    }

    // Continuously create balloons
    setInterval(createBalloon, 1500);

    // 2. Birthday Tune Player
    const playBtn = document.getElementById('playMusicBtn');
    let isPlaying = false;
    let audioContext = null;

    // A simple Web Audio API synthesizer for playing "Happy Birthday"
    function playHappyBirthday() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (isPlaying) return;
        isPlaying = true;
        playBtn.innerText = "🎶 Playing... 🎶";
        playBtn.style.opacity = '0.7';

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

        // Reset button after song finishes
        setTimeout(() => {
            isPlaying = false;
            playBtn.innerText = "🎵 Play Birthday Tune 🎵";
            playBtn.style.opacity = '1';
        }, (time - audioContext.currentTime) * 1000);
    }

    playBtn.addEventListener('click', playHappyBirthday);
});
