/* ==========================================================
   Gesture Synth AI
   audio/SynthEngine.js
========================================================== */

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

        this.activeChord = "";

        this.ready = false;

    }

    /* ======================================
        Initialize
    ====================================== */

    async initialize() {

        if (this.ready) return;

        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;

        this.audio = new AudioCtx();

        /* Master */

        this.master = this.audio.createGain();

        this.master.gain.value =
            APP_CONFIG.AUDIO.masterVolume;

        /* Filter */

        this.filter =
            this.audio.createBiquadFilter();

        this.filter.type = "lowpass";

        this.filter.frequency.value =
            APP_CONFIG.FILTER.default;

        this.filter.Q.value = 1.5;

        /* Compressor */

        this.compressor =
            this.audio.createDynamicsCompressor();

        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 8;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        /* Stereo */

        this.panner =
            this.audio.createStereoPanner();

        /* Connect */

        this.filter.connect(this.panner);

        this.panner.connect(this.compressor);

        this.compressor.connect(this.master);

        this.master.connect(
            this.audio.destination
        );

        this.ready = true;

    }

    /* ======================================
        Resume
    ====================================== */

    async resume() {

        if (!this.audio) return;

        if (this.audio.state === "suspended") {

            await this.audio.resume();

        }

    }

    /* ======================================
        Create Voice
    ====================================== */

    createVoice(freq) {

        const osc =
            this.audio.createOscillator();

        const gain =
            this.audio.createGain();

        osc.type =
            APP_CONFIG.AUDIO.waveform;

        osc.frequency.value = freq;

        gain.gain.value = 0;

        osc.connect(gain);

        gain.connect(this.filter);

        osc.start();

        return {

            osc,

            gain

        };

    }

    /* ======================================
        ADSR Attack
    ====================================== */

    attack(gain) {

        const now =
            this.audio.currentTime;

        gain.gain.cancelScheduledValues(now);

        gain.gain.setValueAtTime(

            0,

            now

        );

        gain.gain.linearRampToValueAtTime(

            0.25,

            now +

            APP_CONFIG.AUDIO.attack

        );

    }

    /* ======================================
        ADSR Release
    ====================================== */

    release(gain) {

        const now =
            this.audio.currentTime;

        gain.gain.cancelScheduledValues(now);

        gain.gain.setValueAtTime(

            gain.gain.value,

            now

        );

        gain.gain.linearRampToValueAtTime(

            0,

            now +

            APP_CONFIG.AUDIO.release

        );

    }
       /* ======================================
        Stop Chord
    ====================================== */

    stopChord() {

        if (!this.audio) return;

        const now = this.audio.currentTime;

        for (let i = 0; i < this.gains.length; i++) {

            const gain = this.gains[i];

            this.release(gain);

        }

        for (const lfo of this.lfos) {

            try {

                lfo.osc.stop(now + APP_CONFIG.AUDIO.release + 0.05);

                lfo.osc.disconnect();

                lfo.gain.disconnect();

            } catch (e) {}

        }

        this.lfos = [];

        for (const osc of this.oscillators) {

            try {

                osc.stop(now + APP_CONFIG.AUDIO.release + 0.05);

                osc.disconnect();

            } catch (e) {}

        }

        for (const gain of this.gains) {

            try {

                gain.disconnect();

            } catch (e) {}

        }

        this.oscillators = [];

        this.gains = [];

        this.activeChord = "";

    }

    /* ======================================
        Play Chord
    ====================================== */

    playChord(chordName) {

        if (!this.ready) return;

        if (!chordName || chordName === "Mute") {

            this.stopChord();

            return;

        }

        if (this.activeChord === chordName)

            return;

        this.stopChord();

        const notes =

            this.theory.build(chordName);

        this.activeChord = chordName;

        for (const note of notes) {

            const freq =

                this.theory.frequency(note);

            const voice =

                this.createVoice(freq);

            this.oscillators.push(

                voice.osc

            );

            this.gains.push(

                voice.gain

            );

            this.attack(

                voice.gain

            );

        }

    }

    /* ======================================
        Master Volume
    ====================================== */

    setMasterVolume(value) {

        if (!this.master) return;

        value = Math.max(

            0,

            Math.min(1, value)

        );

        this.master.gain.linearRampToValueAtTime(

            value,

            this.audio.currentTime + 0.05

        );

    }

    /* ======================================
        Filter
    ====================================== */

    setFilter(value) {

        if (!this.filter) return;

        value = Math.max(

            APP_CONFIG.FILTER.min,

            Math.min(

                APP_CONFIG.FILTER.max,

                value

            )

        );

        this.filter.frequency.linearRampToValueAtTime(

            value,

            this.audio.currentTime + 0.05

        );

    }

    /* ======================================
        Detune
    ====================================== */

    setDetune(value = 0) {

        for (const osc of this.oscillators) {

            osc.detune.linearRampToValueAtTime(

                value,

                this.audio.currentTime + 0.05

            );

        }

    }

    /* ======================================
        Panic
    ====================================== */

    panic() {

        this.stopChord();

    }
       /* ======================================
        Vibrato
    ====================================== */

    setVibrato(depth = 0) {

        if (!this.audio) return;

        /* Remove previous LFOs */

        for (const lfo of this.lfos) {

            try {

                lfo.osc.stop();

                lfo.osc.disconnect();

                lfo.gain.disconnect();

            } catch (e) {}

        }

        this.lfos = [];

        if (depth <= 0) return;

        for (const osc of this.oscillators) {

            const lfoOsc =

                this.audio.createOscillator();

            const lfoGain =

                this.audio.createGain();

            lfoOsc.type = "sine";

            lfoOsc.frequency.value = 5;

            lfoGain.gain.value = depth * 15;

            lfoOsc.connect(lfoGain);

            lfoGain.connect(osc.detune);

            lfoOsc.start();

            this.lfos.push({

                osc: lfoOsc,

                gain: lfoGain

            });

        }

    }

    /* ======================================
        Stereo Pan
    ====================================== */

    setPan(value = 0) {

        if (!this.panner) return;

        value = Math.max(

            -1,

            Math.min(1, value)

        );

        this.panner.pan.linearRampToValueAtTime(

            value,

            this.audio.currentTime + 0.05

        );

    }

    /* ======================================
        Presets
    ====================================== */

    setPreset(name = "Default") {

        switch (name) {

            case "Warm":

                this.setFilter(1200);

                this.setMasterVolume(0.7);

                break;

            case "Bright":

                this.setFilter(4500);

                this.setMasterVolume(0.8);

                break;

            case "Dark":

                this.setFilter(700);

                this.setMasterVolume(0.6);

                break;

            default:

                this.setFilter(

                    APP_CONFIG.FILTER.default

                );

                this.setMasterVolume(

                    APP_CONFIG.AUDIO.masterVolume

                );

        }

    }

    /* ======================================
        Update
    ====================================== */

    update({

        volume,

        filter,

        vibrato

    } = {}) {

        if (volume !== undefined)

            this.setMasterVolume(volume);

        if (filter !== undefined)

            this.setFilter(filter);

        if (vibrato !== undefined)

            this.setVibrato(vibrato);

    }

    /* ======================================
        Destroy
    ====================================== */

    async destroy() {

        this.stopChord();

        if (this.audio &&
            this.audio.state !== "closed") {

            await this.audio.close();

        }

        this.ready = false;

        this.audio = null;

        this.master = null;

        this.filter = null;

        this.compressor = null;

        this.panner = null;

        this.oscillators = [];

        this.gains = [];

        this.lfos = [];

        this.activeChord = "";

    }

}
