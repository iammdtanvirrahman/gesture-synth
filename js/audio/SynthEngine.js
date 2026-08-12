/* Gesture Synth AI — Guitar-first WebAudio engine */
import APP_CONFIG from "../config.js";
import MusicTheory from "./MusicTheory.js";

export default class SynthEngine {
    constructor() {
        this.audio = null;
        this.master = null;
        this.filter = null;
        this.compressor = null;
        this.panner = null;
        this.theory = new MusicTheory();
        this.oscillators = [];
        this.gains = [];
        this.lfos = [];
        this.releaseTimers = [];
        this.activeChord = "";
        this.ready = false;
        this.strumMs = 34;
        this.guitarMode = true;
        this.stringMIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
        this.noteMap = Object.fromEntries(this.theory.notes.map((n, i) => [n, i]));
    }

    async initialize() {
        if (this.ready) { await this.resume(); return; }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) throw new Error("Web Audio API is not supported.");
        this.audio = new AudioCtx();

        this.master = this.audio.createGain();
        this.master.gain.value = Number(APP_CONFIG.AUDIO.masterVolume ?? 0.7);

        this.filter = this.audio.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = Number(APP_CONFIG.FILTER.default ?? 2800);
        this.filter.Q.value = 0.9;

        this.compressor = this.audio.createDynamicsCompressor();
        this.compressor.threshold.value = -20;
        this.compressor.knee.value = 20;
        this.compressor.ratio.value = 6;
        this.compressor.attack.value = 0.008;
        this.compressor.release.value = 0.18;

        this.panner = this.audio.createStereoPanner();
        this.filter.connect(this.panner);
        this.panner.connect(this.compressor);
        this.compressor.connect(this.master);
        this.master.connect(this.audio.destination);

        this.ready = true;
        await this.resume();
    }

    async resume() {
        if (this.audio?.state === "suspended") await this.audio.resume();
    }

    midiToFrequency(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /* Find a natural six-string guitar voicing from a pitch-class chord. */
    guitarVoicing(chordName) {
        const notes = this.theory.build(chordName);
        if (!notes.length) return [];
        const pcs = new Set(notes.map(n => this.noteMap[n]));
        const candidates = [];

        for (const open of this.stringMIDI) {
            let best = null;
            for (let fret = 0; fret <= 12; fret++) {
                const midi = open + fret;
                if (pcs.has((midi % 12 + 12) % 12)) {
                    const pitch = this.midiToFrequency(midi);
                    const chordTone = notes.indexOf(this.theory.notes[midi % 12]);
                    const score = fret + (chordTone === 0 ? -2 : 0);
                    if (!best || score < best.score) best = { midi, pitch, score };
                }
            }
            if (best) candidates.push(best);
        }
        return candidates;
    }

    createVoice(freq, velocity = 0.16, pan = 0) {
        const osc = this.audio.createOscillator();
        const harmonic = this.audio.createOscillator();
        const gain = this.audio.createGain();
        const harmonicGain = this.audio.createGain();
        const stringFilter = this.audio.createBiquadFilter();
        const stringPan = this.audio.createStereoPanner();

        // Two detuned partials give a plucked-string character without harsh digital edges.
        osc.type = "triangle";
        harmonic.type = "sine";
        osc.frequency.value = freq;
        harmonic.frequency.value = freq * 2.003;
        harmonicGain.gain.value = velocity * 0.16;
        stringFilter.type = "lowpass";
        stringFilter.frequency.value = Math.min(7200, Math.max(1100, freq * 8));
        stringFilter.Q.value = 0.55;
        stringPan.pan.value = Math.max(-1, Math.min(1, pan));
        gain.gain.value = 0;

        osc.connect(gain);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(gain);
        gain.connect(stringFilter);
        stringFilter.connect(stringPan);
        stringPan.connect(this.filter);

        osc.start();
        harmonic.start();
        return { osc, harmonic, gain, harmonicGain, filter: stringFilter, pan: stringPan, velocity };
    }

    attack(voice, when = this.audio.currentTime, velocity = 0.16) {
        const attack = Math.max(0.008, Number(APP_CONFIG.AUDIO.attack ?? 0.035));
        const now = Math.max(when, this.audio.currentTime);
        const g = voice.gain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.0001, now);
        g.exponentialRampToValueAtTime(Math.max(0.001, velocity), now + attack);
    }

    release(gain, when = this.audio.currentTime) {
        const release = Math.max(0.08, Number(APP_CONFIG.AUDIO.release ?? 0.22));
        const now = Math.max(when, this.audio.currentTime);
        const g = gain.gain;
        g.cancelScheduledValues(now);
        g.setValueAtTime(Math.max(0.0001, g.value), now);
        g.exponentialRampToValueAtTime(0.0001, now + release);
    }

    stopChord(immediate = false) {
        if (!this.audio) return;
        const now = this.audio.currentTime;
        const release = immediate ? 0.015 : Math.max(0.08, Number(APP_CONFIG.AUDIO.release ?? 0.22));

        for (const timer of this.releaseTimers) clearTimeout(timer);
        this.releaseTimers = [];

        for (const voice of this.oscillators) {
            try {
                const g = voice.gain.gain;
                g.cancelScheduledValues(now);
                g.setValueAtTime(Math.max(0.0001, g.value), now);
                g.exponentialRampToValueAtTime(0.0001, now + release);
                const stopAt = now + release + 0.03;
                voice.osc.stop(stopAt);
                voice.harmonic.stop(stopAt);
            } catch (_) {}
        }
        this.oscillators = [];
        this.gains = [];
        this.lfos.forEach(lfo => { try { lfo.osc.stop(now + 0.02); } catch (_) {} });
        this.lfos = [];
        this.activeChord = "";
    }

    playChord(chordName) {
        if (!this.ready) return;
        if (!chordName || chordName === "Mute") { this.stopChord(); return; }
        if (this.activeChord === chordName) return;

        this.stopChord();
        const voices = this.guitarMode ? this.guitarVoicing(chordName) : [];
        const fallback = this.theory.build(chordName).map((n, i) => ({
            midi: 52 + this.noteMap[n] + (i * 12),
            pitch: this.theory.frequency(n)
        }));
        const strings = voices.length >= 3 ? voices : fallback;
        this.activeChord = chordName;

        strings.forEach((string, index) => {
            const velocity = 0.12 + Math.min(0.07, index * 0.008);
            const pan = ((index / Math.max(1, strings.length - 1)) * 2 - 1) * 0.22;
            const voice = this.createVoice(string.pitch, velocity, pan);
            this.oscillators.push(voice);
            this.gains.push(voice.gain);
            this.attack(voice, this.audio.currentTime + index * this.strumMs / 1000, velocity);
        });
    }

    setMasterVolume(value = 0.7) {
        if (!this.master) return;
        const v = Math.max(0, Math.min(1, Number(value)));
        this.master.gain.setTargetAtTime(v, this.audio.currentTime, 0.025);
    }

    setFilter(value) {
        if (!this.filter) return;
        const min = Number(APP_CONFIG.FILTER.min ?? 250);
        const max = Number(APP_CONFIG.FILTER.max ?? 8000);
        const v = Math.max(min, Math.min(max, Number(value)));
        this.filter.frequency.setTargetAtTime(v, this.audio.currentTime, 0.035);
    }

    setDetune(value = 0) {
        for (const voice of this.oscillators) {
            voice.osc.detune.setTargetAtTime(Number(value), this.audio.currentTime, 0.04);
            voice.harmonic.detune.setTargetAtTime(Number(value) * 0.65, this.audio.currentTime, 0.04);
        }
    }

    setVibrato(depth = 0) {
        if (!this.audio) return;
        const now = this.audio.currentTime;
        this.lfos.forEach(lfo => { try { lfo.osc.stop(now + 0.02); } catch (_) {} });
        this.lfos = [];
        const d = Math.max(0, Math.min(1, Number(depth)));
        if (d < 0.01) return;

        for (const voice of this.oscillators) {
            const osc = this.audio.createOscillator();
            const gain = this.audio.createGain();
            osc.type = "sine";
            osc.frequency.value = 4.7;
            gain.gain.value = d * 8;
            osc.connect(gain);
            gain.connect(voice.osc.detune);
            osc.start();
            this.lfos.push({ osc, gain });
        }
    }

    setPan(value = 0) {
        if (!this.panner) return;
        this.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, Number(value))), this.audio.currentTime, 0.04);
    }

    setPreset(name = "Default") {
        if (name === "Warm") { this.setFilter(1200); this.setMasterVolume(0.68); }
        else if (name === "Bright") { this.setFilter(4300); this.setMasterVolume(0.78); }
        else if (name === "Dark") { this.setFilter(750); this.setMasterVolume(0.6); }
        else { this.setFilter(APP_CONFIG.FILTER.default); this.setMasterVolume(APP_CONFIG.AUDIO.masterVolume); }
    }

    update({ volume, filter, vibrato, detune, pan } = {}) {
        if (volume !== undefined) this.setMasterVolume(volume);
        if (filter !== undefined) this.setFilter(filter);
        if (vibrato !== undefined) this.setVibrato(vibrato);
        if (detune !== undefined) this.setDetune(detune);
        if (pan !== undefined) this.setPan(pan);
    }

    panic() { this.stopChord(true); }

    async destroy() {
        this.stopChord(true);
        if (this.audio && this.audio.state !== "closed") await this.audio.close();
        this.audio = this.master = this.filter = this.compressor = this.panner = null;
        this.ready = false;
    }
}
