/* ==========================================================
   Gesture Synth AI
   ui/HUD.js
========================================================== */

export default class HUD {

    constructor() {

        const find = (...ids) => {

            for (const id of ids) {

                const el = document.getElementById(id);

                if (el) return el;

            }

            return null;

        };

        this.elements = {

            fps: find("fps"),

            hands: find("hands"),

            chord: find("chordDisplay", "chord"),

            quality: find("qualityDisplay", "quality"),

            status: find("aiStatus", "status"),

            confidence: find("confidence"),

            filter: find("filterValue", "filter"),

            volume: find("volumeValue", "volume"),

            key: find("currentKey", "key")

        };

        this.cache = {};

        this.lastFrame = performance.now();

        this.frames = 0;

        this.fps = 0;

    }

    /* ======================================
        Safe Text Update
    ====================================== */

    setText(element, value) {

        if (!element) return;

        if (element.textContent === String(value)) return;

        element.textContent = value;

    }

    /* ======================================
        FPS
    ====================================== */

    updateFPS(value = null) {

        if (value !== null) {

            this.fps = value;

            this.setText(

                this.elements.fps,

                value

            );

            return;

        }

        this.frames++;

        const now = performance.now();

        if (now - this.lastFrame >= 1000) {

            this.fps = this.frames;

            this.frames = 0;

            this.lastFrame = now;

            this.setText(

                this.elements.fps,

                this.fps

            );

        }

    }

    /* ======================================
        Hands
    ====================================== */

    setHands(count) {

        this.setText(

            this.elements.hands,

            count

        );

    }

    /* ======================================
        Chord
    ====================================== */

    setChord(chord) {

        this.setText(

            this.elements.chord,

            chord

        );

    }

    /* ======================================
        Quality
    ====================================== */

    setQuality(text) {

        this.setText(

            this.elements.quality,

            text

        );

    }

    /* ======================================
        AI Status
    ====================================== */

    setStatus(text, good = true) {

        if (!this.elements.status) return;

        this.setText(

            this.elements.status,

            text

        );

        this.elements.status.className =

            good

                ? "success"

                : "danger";

    }

    /* ======================================
        Confidence
    ====================================== */

    setConfidence(value) {

        this.setText(

            this.elements.confidence,

            `${Math.round(value * 100)}%`

        );

    }

    /* ======================================
        Filter
    ====================================== */

    setFilter(value) {

        this.setText(

            this.elements.filter,

            `${Math.round(value)} Hz`

        );

    }

    /* ======================================
        Volume
    ====================================== */

    setVolume(value) {

        this.setText(

            this.elements.volume,

            `${Math.round(value * 100)}%`

        );

    }

    /* ======================================
        Key
    ====================================== */

    setKey(key) {

        this.setText(

            this.elements.key,

            key

        );

    }

    /* ======================================
        Update
    ====================================== */

    update(data = {}) {

        this.updateFPS();

        if (data.hands !== undefined)
            this.setHands(data.hands);

        if (data.chord !== undefined)
            this.setChord(data.chord);

        if (data.quality !== undefined)
            this.setQuality(data.quality);

        if (data.status !== undefined)
            this.setStatus(data.status);

        if (data.confidence !== undefined)
            this.setConfidence(data.confidence);

        if (data.filter !== undefined)
            this.setFilter(data.filter);

        if (data.volume !== undefined)
            this.setVolume(data.volume);

        if (data.key !== undefined)
            this.setKey(data.key);

    }

    /* ======================================
        Reset
    ====================================== */

    reset() {

        this.update({

            hands: 0,

            chord: "-",

            confidence: 0,

            filter: 0,

            volume: 0,

            key: "-"

        });

    }

}
