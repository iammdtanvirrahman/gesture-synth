/* ==========================================================
   Gesture Synth AI
   gesture/HandTilt.js
========================================================== */

import { LANDMARK } from "../utils/constants.js";

export default class HandTilt {

    constructor() {

        this.landmarks = null;

        this.angle = 0;

        this.pitch = 0;

        this.roll = 0;

        this.yaw = 0;

    }

    update(landmarks) {

        this.landmarks = landmarks;

        this.calculate();

    }

    calculate() {

        if (!this.landmarks) return;

        const wrist = this.landmarks[LANDMARK.WRIST];

        const middle = this.landmarks[LANDMARK.MIDDLE_MCP];

        const dx = middle.x - wrist.x;

        const dy = middle.y - wrist.y;

        this.angle = Math.atan2(dy, dx);

        this.roll = this.angle;

        this.pitch = (0.5 - wrist.y) * 2;

        this.yaw = (0.5 - wrist.x) * 2;

    }

    /* ======================================= */

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

    /* ======================================= */

    getFilterValue(min = 250, max = 5000) {

        const t = Math.max(

            0,

            Math.min(

                1,

                (this.pitch + 1) / 2

            )

        );

        return min + (max - min) * t;

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

    /* ======================================= */

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

}