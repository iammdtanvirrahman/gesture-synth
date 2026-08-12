import { createCamera } from "./core/camera.js";
import { MediaPipeManager } from "./core/mediapipe.js";
import FingerDetector from "./gesture/FingerDetector.js";
import HandTilt from "./gesture/HandTilt.js";
import ChordClassifier from "./gesture/ChordClassifier.js";
import SynthEngine from "./audio/SynthEngine.js";
import LandmarkRenderer from "./graphics/LandmarkRenderer.js";
import EnergyRenderer from "./graphics/EnergyRenderer.js";
import HUD from "./ui/HUD.js";
import VolumeMeter from "./ui/VolumeMeter.js";
import HelpModal from "./ui/HelpModal.js";
import AnimationLoop from "./core/animationLoop.js";
import APP_CONFIG from "./config.js";

export default class App {
    constructor() {
        this.initialized = false;
        this.running = false;
        this.resizeRaf = 0;
        this.bindDOM();
    }

    bindDOM() {
        const id = name => document.getElementById(name);
        this.video = id("video");
        this.canvas = id("canvas");
        this.energyCanvas = id("energyCanvas");
        this.volumeCanvas = id("volumeCanvas");
        this.loadingScreen = id("loadingScreen");
        this.loadingBar = id("loadingFill");
        this.loadingPercent = id("loadingPercent");
        this.loadingText = id("loadingStatus");
        this.stage = id("stage");
        if (!this.video || !this.canvas || !this.energyCanvas || !this.volumeCanvas) {
            throw new Error("Required application elements are missing.");
        }
        this.onResize = () => {
            if (this.resizeRaf) return;
            this.resizeRaf = requestAnimationFrame(() => {
                this.resizeRaf = 0;
                this.resize();
            });
        };
        window.addEventListener("resize", this.onResize, { passive: true });
    }

    setLoading(percent, text) {
        if (this.loadingBar) this.loadingBar.style.width = `${percent}%`;
        if (this.loadingPercent) this.loadingPercent.textContent = `${percent}%`;
        if (this.loadingText) this.loadingText.textContent = text;
    }

    resizeCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, APP_CONFIG.PERFORMANCE.pixelRatio);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    }

    resize() {
        if (!this.canvas) return;
        this.resizeCanvas(this.canvas);
        this.resizeCanvas(this.energyCanvas);
        this.volumeMeter?.resize?.();
        this.energyRenderer?.resize?.();
    }

    async initialize() {
        if (this.initialized) return;
        try {
            this.setLoading(5, "Preparing spatial workspace…");
            this.resize();
            this.setLoading(15, "Requesting camera access…");
            this.camera = await createCamera(this.video);
            this.setLoading(30, "Loading optimized hand tracking…");
            this.mediapipe = new MediaPipeManager(this.video);
            await this.mediapipe.initialize();
            this.setLoading(45, "Preparing gesture recognition…");
            this.detector = new FingerDetector();
            this.handTilt = new HandTilt();
            this.classifier = new ChordClassifier();
            this.setLoading(60, "Initializing spatial audio…");
            this.synth = new SynthEngine();
            await this.synth.initialize();
            this.setLoading(75, "Building visual layer…");
            this.landmarkRenderer = new LandmarkRenderer(this.canvas);
            this.energyRenderer = new EnergyRenderer(this.energyCanvas);
            this.setLoading(88, "Preparing interface…");
            this.hud = new HUD();
            this.volumeMeter = new VolumeMeter(this.volumeCanvas);
            this.helpModal = new HelpModal();
            this.helpModal.setVersion(APP_CONFIG.VERSION);
            this.loop = new AnimationLoop({
                mediapipe: this.mediapipe,
                fingerDetector: this.detector,
                handTilt: this.handTilt,
                chordClassifier: this.classifier,
                synth: this.synth,
                landmarkRenderer: this.landmarkRenderer,
                energyRenderer: this.energyRenderer,
                hud: this.hud,
                volumeMeter: this.volumeMeter
            });
            this.mediapipe.onResults(results => this.loop.onResults(results));
            this.setLoading(100, "Ready — raise your hand");
            this.initialized = true;
        } catch (error) {
            this.destroy();
            throw error;
        }
    }

    async start() {
        if (this.running) return;
        const landing = document.getElementById("landingScreen");
        landing?.classList.add("hidden");
        this.loadingScreen?.classList.remove("hidden");
        try {
            await this.initialize();
            await this.synth.resume();
            this.loop.start();
            this.running = true;
            this.loadingScreen?.classList.add("hidden");
            this.hud?.setStatus("Live", true);
        } catch (error) {
            this.loadingScreen?.classList.add("hidden");
            landing?.classList.remove("hidden");
            throw error;
        }
    }

    stop() {
        this.loop?.stop();
        this.synth?.suspend?.();
        this.running = false;
    }

    destroy() {
        try { this.loop?.stop(); } catch {}
        try { this.camera?.stop?.(); } catch {}
        try { this.mediapipe?.stop?.(); } catch {}
        try { this.synth?.destroy?.(); } catch {}
        try { this.helpModal?.destroy?.(); } catch {}
        if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
        this.resizeRaf = 0;
        this.initialized = false;
        this.running = false;
    }
}
