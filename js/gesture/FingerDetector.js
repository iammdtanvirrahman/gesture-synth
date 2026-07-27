/* ==========================================================
   Gesture Synth AI
   gesture/FingerDetector.js
========================================================== */

import {
    LANDMARK
} from "../utils/constants.js";

export default class FingerDetector {

    constructor() {

        this.landmarks = null;
        this.handedness = "Right";

    }

    update(landmarks, handedness = "Right") {

        this.landmarks = landmarks;
        this.handedness = handedness;

    }

    /* =====================================================
        Individual Fingers
    ===================================================== */

    thumb() {

        if (!this.landmarks) return false;

        const tip = this.landmarks[LANDMARK.THUMB_TIP];
        const ip = this.landmarks[LANDMARK.THUMB_IP];

        if (this.handedness === "Right") {

            return tip.x < ip.x;

        }

        return tip.x > ip.x;

    }

    index() {

        return this.landmarks[LANDMARK.INDEX_TIP].y <
               this.landmarks[LANDMARK.INDEX_PIP].y;

    }

    middle() {

        return this.landmarks[LANDMARK.MIDDLE_TIP].y <
               this.landmarks[LANDMARK.MIDDLE_PIP].y;

    }

    ring() {

        return this.landmarks[LANDMARK.RING_TIP].y <
               this.landmarks[LANDMARK.RING_PIP].y;

    }

    pinky() {

        return this.landmarks[LANDMARK.PINKY_TIP].y <
               this.landmarks[LANDMARK.PINKY_PIP].y;

    }

    /* =====================================================
        Finger Array
    ===================================================== */

    states() {

        return [

            this.thumb(),

            this.index(),

            this.middle(),

            this.ring(),

            this.pinky()

        ];

    }

    /* =====================================================
        Finger Count
    ===================================================== */

    count() {

        return this.states()

            .filter(Boolean)

            .length;

    }

    /* =====================================================
        Ready Gestures
    ===================================================== */

    fist() {

        return this.count() === 0;

    }

    openPalm() {

        return this.count() === 5;

    }

    peace() {

        const f = this.states();

        return (

            !f[0] &&
            f[1] &&
            f[2] &&
            !f[3] &&
            !f[4]

        );

    }

    rock() {

        const f = this.states();

        return (

            !f[0] &&
            f[1] &&
            !f[2] &&
            !f[3] &&
            f[4]

        );

    }

    pinch() {

        const a = this.landmarks[LANDMARK.THUMB_TIP];
        const b = this.landmarks[LANDMARK.INDEX_TIP];

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.sqrt(

            dx * dx +

            dy * dy

        ) < 0.05;

    }

    /* =====================================================
        Raw Info
    ===================================================== */

    getInfo() {

        return {

            fingers: this.states(),

            count: this.count(),

            fist: this.fist(),

            openPalm: this.openPalm(),

            peace: this.peace(),

            rock: this.rock(),

            pinch: this.pinch()

        };

    }

}