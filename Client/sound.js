/**
 * Eat 'Em All - Procedural Web Audio API Sound Engine
 * 100% zero external audio dependencies.
 * Synthesizes dynamic, pitch-varied, combo-aware audio on the fly.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem("eea_muted") === "true";
        this.volume = parseFloat(localStorage.getItem("eea_volume") || "0.6");
        this.dotStyle = localStorage.getItem("eea_dot_style") || "melody";
        this.bouncesEnabled = localStorage.getItem("eea_bounces") !== "false";
        this.chompsEnabled = localStorage.getItem("eea_chomps") !== "false";

        // Pentatonic Scale: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6
        this.pentatonicScale = [
            261.63, 293.66, 329.63, 392.00, 440.00,
            523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
        ];
        this.comboIndex = 0;
        this.lastDotTime = 0;
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

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        localStorage.setItem("eea_volume", this.volume.toString());
    }

    getVolume() {
        return this.volume;
    }

    setDotStyle(style) {
        this.dotStyle = style;
        localStorage.setItem("eea_dot_style", style);
    }

    getDotStyle() {
        return this.dotStyle;
    }

    setBouncesEnabled(enabled) {
        this.bouncesEnabled = enabled;
        localStorage.setItem("eea_bounces", enabled ? "true" : "false");
    }

    isBouncesEnabled() {
        return this.bouncesEnabled;
    }

    setChompsEnabled(enabled) {
        this.chompsEnabled = enabled;
        localStorage.setItem("eea_chomps", enabled ? "true" : "false");
    }

    isChompsEnabled() {
        return this.chompsEnabled;
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

    // Play chosen dot eating flavor
    playDotSound(playerRadius = 20) {
        if (this.muted || this.dotStyle === "off") return;
        this.init();
        if (!this.ctx) return;

        switch (this.dotStyle) {
            case "melody":
                this.playMelodyDot(playerRadius);
                break;
            case "woodblock":
                this.playWoodblockDot(playerRadius);
                break;
            case "retro":
                this.playRetroDot(playerRadius);
                break;
            case "bubble":
            default:
                this.playBubbleDot(playerRadius);
                break;
        }
    }

    // 1. Pentatonic Scale Melody (Ascending notes on consecutive dots)
    playMelodyDot(radius = 20) {
        const now = this.ctx.currentTime;
        // Combo resets if > 650ms between dots
        if (now - this.lastDotTime > 0.65) {
            this.comboIndex = 0;
        } else {
            this.comboIndex = (this.comboIndex + 1) % this.pentatonicScale.length;
        }
        this.lastDotTime = now;

        const baseFreq = this.pentatonicScale[this.comboIndex];
        const sizeShift = Math.max(0.75, Math.min(1.25, 25 / radius));
        const freq = baseFreq * sizeShift;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.24 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.125);
    }

    // 2. Soft Bubble Pop (Classic gentle water droplet)
    playBubbleDot(radius = 20) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const pitchFactor = Math.max(0.7, Math.min(1.3, 25 / radius));
        const baseFreq = (500 + Math.random() * 80) * pitchFactor;

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

    // 3. Tactile Woodblock (Quiet, subtle ASMR click that never fatigues)
    playWoodblockDot(radius = 20) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        const baseFreq = 750 + Math.random() * 60;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.035);

        filter.type = "bandpass";
        filter.frequency.value = 850;
        filter.Q.value = 3.0;

        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    // 4. Retro 8-Bit (Arcade chiptune coin blip)
    playRetroDot(radius = 20) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 660 + (Math.floor(Math.random() * 3) * 110);
        osc.type = "square";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.035);

        gain.gain.setValueAtTime(0.12 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.075);
    }

    // Instant preview for settings modal
    previewDotStyle(style) {
        this.init();
        if (!this.ctx) return;
        const prevStyle = this.dotStyle;
        const wasMuted = this.muted;
        this.dotStyle = style;
        this.muted = false;
        this.playDotSound(20);
        this.dotStyle = prevStyle;
        this.muted = wasMuted;
    }

    // Visceral bass crunch / chomp when swallowing another player
    playChomp() {
        if (this.muted || !this.chompsEnabled) return;
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
        if (this.muted || !this.bouncesEnabled) return;
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