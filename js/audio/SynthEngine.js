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

        this.oscillators = [];

        this.gains = [];

        this.activeChord = [];

        this.theory = new MusicTheory();

        this.ready = false;

    }

    async initialize() {

        if (this.ready) return;

        this.audio = new (

            window.AudioContext ||

            window.webkitAudioContext

        )();

        /* ======================================
            Master Gain
        ====================================== */

        this.master = this.audio.createGain();

        this.master.gain.value =

            APP_CONFIG.AUDIO.masterVolume;

        /* ======================================
            Filter
        ====================================== */

        this.filter = this.audio.createBiquadFilter();

        this.filter.type = "lowpass";

        this.filter.frequency.value =

            APP_CONFIG.FILTER.default;

        this.filter.Q.value = 1.5;

        /* ======================================
            Compressor
        ====================================== */

        this.compressor =

            this.audio.createDynamicsCompressor();

        this.compressor.threshold.value = -18;

        this.compressor.knee.value = 18;

        this.compressor.ratio.value = 8;

        this.compressor.attack.value = 0.003;

        this.compressor.release.value = 0.25;

        /* ======================================
            Connect Chain
        ====================================== */

        this.filter.connect(this.compressor);

        this.compressor.connect(this.master);

        this.master.connect(this.audio.destination);

        this.ready = true;

    }

    /* ======================================
        Resume Audio
    ====================================== */

    async resume() {

        if (!this.audio) return;

        if (this.audio.state === "suspended") {

            await this.audio.resume();

        }

    }

    /* ======================================
        Master Volume
    ====================================== */

    setMasterVolume(value) {

        if (!this.master) return;

        this.master.gain.linearRampToValueAtTime(

            value,

            this.audio.currentTime + 0.05

        );

    }

    /* ======================================
        Filter Cutoff
    ====================================== */

    setFilter(value) {

        if (!this.filter) return;

        this.filter.frequency.linearRampToValueAtTime(

            value,

            this.audio.currentTime + 0.05

        );

    }

}