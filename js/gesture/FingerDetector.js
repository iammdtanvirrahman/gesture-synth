/* ==========================================================
   Gesture Synth AI
   gesture/FingerDetector.js
========================================================== */

import { LANDMARK } from "../utils/constants.js";

export default class FingerDetector {

    constructor() {

        this.landmarks = null;

        this.handedness = "Right";

        this.cachedStates = [false, false, false, false, false];

    }

    /* ======================================
        Update
    ====================================== */

    update(landmarks, handedness = "Right") {

        this.landmarks = landmarks;
        this.handedness = handedness;

        if (!this.landmarks) {

            this.cachedStates = [false, false, false, false, false];

            return;

        }

        this.cachedStates = [

            this.thumb(),

            this.index(),

            this.middle(),

            this.ring(),

            this.pinky()

        ];

    }

    /* ======================================
        Thumb
    ====================================== */

    thumb() {

        if (!this.landmarks) return false;

        const tip = this.landmarks[LANDMARK.THUMB_TIP];
        const ip = this.landmarks[LANDMARK.THUMB_IP];

        if (!tip || !ip) return false;

        return this.handedness === "Right"
            ? tip.x < ip.x
            : tip.x > ip.x;

    }

    /* ======================================
        Index
    ====================================== */

    index() {

        if (!this.landmarks) return false;

        const tip = this.landmarks[LANDMARK.INDEX_TIP];
        const pip = this.landmarks[LANDMARK.INDEX_PIP];

        if (!tip || !pip) return false;

        return tip.y < pip.y;

    }

    /* ======================================
        Middle
    ====================================== */

    middle() {

        if (!this.landmarks) return false;

        const tip = this.landmarks[LANDMARK.MIDDLE_TIP];
        const pip = this.landmarks[LANDMARK.MIDDLE_PIP];

        if (!tip || !pip) return false;

        return tip.y < pip.y;

    }

    /* ======================================
        Ring
    ====================================== */

    ring() {

        if (!this.landmarks) return false;

        const tip = this.landmarks[LANDMARK.RING_TIP];
        const pip = this.landmarks[LANDMARK.RING_PIP];

        if (!tip || !pip) return false;

        return tip.y < pip.y;

    }

    /* ======================================
        Pinky
    ====================================== */

    pinky() {

        if (!this.landmarks) return false;

        const tip = this.landmarks[LANDMARK.PINKY_TIP];
        const pip = this.landmarks[LANDMARK.PINKY_PIP];

        if (!tip || !pip) return false;

        return tip.y < pip.y;

    }

    /* ======================================
        States
    ====================================== */

    states() {

        return [...this.cachedStates];

    }

    /* ======================================
        Count
    ====================================== */

    count() {

        return this.cachedStates.filter(Boolean).length;

    }

    /* ======================================
        Gestures
    ====================================== */

    fist() {

        return this.count() === 0;

    }

    openPalm() {

        return this.count() === 5;

    }

    peace() {

        const f = this.cachedStates;

        return (

            !f[0] &&
            f[1] &&
            f[2] &&
            !f[3] &&
            !f[4]

        );

    }

    rock() {

        const f = this.cachedStates;

        return (

            !f[0] &&
            f[1] &&
            !f[2] &&
            !f[3] &&
            f[4]

        );

    }

    pinch() {

        if (!this.landmarks) return false;

        const a = this.landmarks[LANDMARK.THUMB_TIP];
        const b = this.landmarks[LANDMARK.INDEX_TIP];

        if (!a || !b) return false;

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.hypot(dx, dy) < 0.05;

    }

    /* ======================================
        Raw Info
    ====================================== */

    getInfo() {

        return {

            fingers: [...this.cachedStates],

            count: this.count(),

            fist: this.fist(),

            openPalm: this.openPalm(),

            peace: this.peace(),

            rock: this.rock(),

            pinch: this.pinch()

        };

    }

    /* ======================================
        Reset
    ====================================== */

    reset() {

        this.landmarks = null;

        this.cachedStates = [false, false, false, false, false];

    }

}
