/* VisionFlow — performance-first runtime configuration */
export const APP_CONFIG = {
    APP_NAME: "VisionFlow",
    VERSION: "6.1.0",
    DEBUG: false,
    MAX_HANDS: 1,

    CAMERA: {
        width: 640,
        height: 360,
        facingMode: "user",
        frameRate: 24
    },

    PERFORMANCE: {
        pixelRatio: 1.25,
        inferenceFps: 24,
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
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55
    },

    UI: {
        showFPS: true,
        showLandmarks: true,
        showParticles: true,
        showEnergy: true,
        updateHz: 15
    },

    COLORS: {
        primary: "#00F3FF",
        secondary: "#E8A13D",
        success: "#3DDC84",
        danger: "#FF4D5C"
    }
};

export default APP_CONFIG;
