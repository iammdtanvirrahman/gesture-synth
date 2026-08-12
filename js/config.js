/* VisionFlow — performance-first runtime configuration */
export const APP_CONFIG = {
    APP_NAME: "VisionFlow",
    VERSION: "6.0.0",
    DEBUG: false,

    MAX_HANDS: 1,

    CAMERA: {
        width: 960,
        height: 540,
        facingMode: "user",
        frameRate: 30
    },

    PERFORMANCE: {
        pixelRatio: 1.5,
        inferenceFps: 30,
        renderFps: 60,
        trail: false
    },

    CANVAS: { mirror: true, alpha: true },

    AUDIO: {
        masterVolume: 0.7,
        attack: 0.03,
        release: 0.25,
        waveform: "triangle"
    },

    FILTER: { min: 250, max: 5000, default: 1200 },

    DETECTION: {
        minHandDetectionConfidence: 0.65,
        minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.65
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
