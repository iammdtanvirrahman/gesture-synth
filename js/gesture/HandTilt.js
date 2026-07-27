/* ==========================================================
   Gesture Synth AI
   gesture/HandTilt.js
========================================================== */

import APP_CONFIG from "../config.js";
import { LANDMARK } from "../utils/constants.js";

export default class HandTilt {

    constructor() {

        this.landmarks = null;

        this.angle = 0;
        this.pitch = 0;
        this.roll = 0;
        this.yaw = 0;

        this.smooth = 0.15;

    }

    /* ======================================
        Update
    ====================================== */

    update(landmarks) {

        this.landmarks = landmarks;

        if (!landmarks) {

            this.reset();

            return;

        }

        this.calculate();

    }

    /* ======================================
        Calculate
    ====================================== */

    calculate() {

        const wrist = this.landmarks[LANDMARK.WRIST];
        const middle = this.landmarks[LANDMARK.MIDDLE_MCP];

        if (!wrist || !middle) return;

        const dx = middle.x - wrist.x;
        const dy = middle.y - wrist.y;

        const angle = Math.atan2(dy, dx);

        this.angle +=
            (angle - this.angle) * this.smooth;

        const pitch =
            (0.5 - wrist.y) * 2;

        const yaw =
            (0.5 - wrist.x) * 2;

        const roll =
            this.angle / Math.PI;

        this.pitch +=
            (pitch - this.pitch) * this.smooth;

        this.yaw +=
            (yaw - this.yaw) * this.smooth;

        this.roll +=
            (roll - this.roll) * this.smooth;

    }

    /* ======================================
        Getters
    ====================================== */

    getAngle() {

        return this.angle;

    }

    getPitch() {

        return this.pitch;

    }

    getRoll() {

        return this.roll;

    }

    getYaw() {

        return this.yaw;

    }

    /* ======================================
        Audio Mapping
    ====================================== */

    getFilterValue() {

        const t = Math.max(

            0,

            Math.min(

                1,

                (this.pitch + 1) / 2

            )

        );

        return

            APP_CONFIG.FILTER.min +

            (

                APP_CONFIG.FILTER.max -

                APP_CONFIG.FILTER.min

            ) * t;

    }

    getVolume() {

        return Math.max(

            0,

            Math.min(

                1,

                1 - Math.abs(this.roll)

            )

        );

    }

    getVibratoDepth() {

        return Math.max(

            0,

            Math.min(

                1,

                Math.abs(this.yaw)

            )

        );

    }

    /* ======================================
        Data
    ====================================== */

    getData() {

        return {

            angle: this.angle,

            pitch: this.pitch,

            roll: this.roll,

            yaw: this.yaw,

            filter: this.getFilterValue(),

            volume: this.getVolume(),

            vibrato: this.getVibratoDepth()

        };

    }

    /* ======================================
        Reset
    ====================================== */

    reset() {

        this.landmarks = null;

        this.angle = 0;

        this.pitch = 0;

        this.roll = 0;

        this.yaw = 0;

    }

}
