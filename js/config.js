/* ==========================================================
   Gesture Synth AI
   config.js
========================================================== */

export const APP_CONFIG = {

    APP_NAME: "Gesture Synth AI",

    VERSION: "3.0.0",

    DEBUG: false,

    MAX_HANDS: 2,

    CAMERA: {

        width: 1280,

        height: 720,

        facingMode: "user"

    },

    CANVAS: {

        mirror: true,

        alpha: true

    },

    AUDIO: {

        masterVolume: 0.7,

        attack: 0.03,

        release: 0.25,

        waveform: "triangle"

    },

    FILTER: {

        min: 250,

        max: 5000,

        default: 1200

    },

    DETECTION: {

        minHandDetectionConfidence: 0.6,

        minHandPresenceConfidence: 0.6,

        minTrackingConfidence: 0.6

    },

    UI: {

        showFPS: true,

        showLandmarks: true,

        showParticles: true,

        showEnergy: true

    },

    COLORS: {

        primary: "#00F3FF",

        secondary: "#E8A13D",

        success: "#3DDC84",

        danger: "#FF4D5C"

    }

};

export default APP_CONFIG;