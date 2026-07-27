/* ==========================================================
   Gesture Synth AI
   ui/HUD.js
========================================================== */

export default class HUD {

    constructor() {

        this.elements = {

            fps: document.getElementById("fps"),

            hands: document.getElementById("hands"),

            chord: document.getElementById("chordDisplay"),

            quality: document.getElementById("qualityDisplay"),

            status: document.getElementById("aiStatus"),

            confidence: document.getElementById("confidence"),

            filter: document.getElementById("filterValue"),

            volume: document.getElementById("volumeValue"),

            key: document.getElementById("currentKey")

        };

        this.lastFrame = performance.now();

        this.frames = 0;

        this.fps = 0;

    }

    /* ======================================
       FPS
    ====================================== */

    updateFPS() {

        this.frames++;

        const now = performance.now();

        if (now - this.lastFrame >= 1000) {

            this.fps = this.frames;

            this.frames = 0;

            this.lastFrame = now;

            if (this.elements.fps)

                this.elements.fps.textContent = this.fps;

        }

    }

    /* ======================================
       Hands
    ====================================== */

    setHands(count) {

        if (!this.elements.hands) return;

        this.elements.hands.textContent = count;

    }

    /* ======================================
       Chord
    ====================================== */

    setChord(chord) {

        if (!this.elements.chord) return;

        this.elements.chord.textContent = chord;

    }

    /* ======================================
       Quality
    ====================================== */

    setQuality(text) {

        if (!this.elements.quality) return;

        this.elements.quality.textContent = text;

    }

    /* ======================================
       AI Status
    ====================================== */

    setStatus(text, good = true) {

        if (!this.elements.status) return;

        this.elements.status.textContent = text;

        this.elements.status.className =

            good ? "success" : "danger";

    }

    /* ======================================
       Confidence
    ====================================== */

    setConfidence(value) {

        if (!this.elements.confidence) return;

        this.elements.confidence.textContent =

            `${Math.round(value * 100)}%`;

    }

    /* ======================================
       Filter
    ====================================== */

    setFilter(value) {

        if (!this.elements.filter) return;

        this.elements.filter.textContent =

            `${Math.round(value)} Hz`;

    }

    /* ======================================
       Volume
    ====================================== */

    setVolume(value) {

        if (!this.elements.volume) return;

        this.elements.volume.textContent =

            `${Math.round(value * 100)}%`;

    }

    /* ======================================
       Key
    ====================================== */

    setKey(key) {

        if (!this.elements.key) return;

        this.elements.key.textContent = key;

    }

    /* ======================================
       Update All
    ====================================== */

    update(data = {}) {

        this.updateFPS();

        if (data.hands !== undefined)

            this.setHands(data.hands);

        if (data.chord)

            this.setChord(data.chord);

        if (data.quality)

            this.setQuality(data.quality);

        if (data.status)

            this.setStatus(data.status);

        if (data.confidence !== undefined)

            this.setConfidence(data.confidence);

        if (data.filter !== undefined)

            this.setFilter(data.filter);

        if (data.volume !== undefined)

            this.setVolume(data.volume);

        if (data.key)

            this.setKey(data.key);

    }

}