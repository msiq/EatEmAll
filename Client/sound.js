/**
 * Eat 'Em All - Web Audio API Sound Synthesizer
 * 100% zero external audio file dependencies.
 * Synthesizes crisp procedural sound effects dynamically.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem("eea_muted") === "true";
        this.volume = 0.55;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.init();
        this.muted = !this.muted;
        localStorage.setItem("eea_muted", this.muted ? "true" : "false");
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    // Gentle, bubbly high-pitched pop when consuming a dot
    playPop() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 520 + Math.random() * 100;
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.05);

        gain.gain.setValueAtTime(0.22 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.075);
    }

    // Visceral bass crunch / chomp when swallowing another player
    playChomp() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.32);

        gain.gain.setValueAtTime(0.65 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.33);
    }

    // Heavy rubber impulse impact when two players bounce
    playBounce() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);

        gain.gain.setValueAtTime(0.38 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.165);
    }

    // Dramatic descending defeat chord
    playGameOver() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [311.13, 233.08, 155.56, 77.78]; // Eb4 -> Bb3 -> Eb3 -> Eb2
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            const start = now + idx * 0.14;

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.85, start + 0.7);

            filter.type = "lowpass";
            filter.frequency.value = 550;

            gain.gain.setValueAtTime(0.28 * this.volume, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 0.75);
        });
    }

    // Uplifting ascending chime on spawn / respawn
    playSpawn() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.07;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.25 * this.volume, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 0.23);
        });
    }
}

window.soundManager = new SoundManager();