/* ==========================================================
   Gesture Synth AI
   Application Controller
   Part 1
========================================================== */

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

export default class App {

    constructor() {

        /* =====================================
            STATE
        ====================================== */

        this.initialized = false;
        this.running = false;

        this.camera = null;
        this.mediapipe = null;
        this.synth = null;
        this.loop = null;

        this.detector = null;
        this.handTilt = null;
        this.classifier = null;

        this.landmarkRenderer = null;
        this.energyRenderer = null;

        this.hud = null;
        this.volumeMeter = null;
        this.helpModal = null;

        this.bindDOM();
        this.installEvents();

    }

    /* =====================================
        DOM
    ====================================== */

    bindDOM() {

        const pick = (...ids) => {

            for (const id of ids) {

                const element = document.getElementById(id);

                if (element) return element;

            }

            return null;

        };

        /* ---------- Camera ---------- */

        this.video = pick(

            "video",
            "webcam"

        );

        /* ---------- Canvas ---------- */

        this.canvas = pick(

            "canvas",
            "overlay"

        );

        /* ---------- Volume ---------- */

        this.volumeCanvas = pick(

            "volumeCanvas",
            "volumeMeter"

        );

        /* ---------- Landing ---------- */

        this.startButton = pick(

            "startExperience",
            "startButton"

        );

        this.loadingScreen = pick(

            "loadingScreen"

        );

        this.loadingText = pick(

            "loadingStatus",

            "loadingText"

        );

        this.loadingBar = pick(

            "loadingFill",

            "loadingBar"

        );

        this.loadingPercent = pick(

            "loadingPercent"

        );

        this.stage = pick(

            "mainStage",

            "stage"

        );

        if (!this.video)
            console.warn("Video element not found.");

        if (!this.canvas)
            console.warn("Canvas element not found.");

    }

    /* =====================================
        EVENTS
    ====================================== */

    installEvents() {

        window.addEventListener(

            "resize",

            () => this.resize()

        );

        document.addEventListener(

            "visibilitychange",

            () => {

                if (!this.synth) return;

                if (document.hidden) {

                    this.synth.suspend?.();

                }

                else {

                    this.synth.resume?.();

                }

            }

        );

    }

    /* =====================================
        Loading
    ====================================== */

    setLoading(percent, text) {

        if (this.loadingBar) {

            this.loadingBar.style.width =

                percent + "%";

        }

        if (this.loadingPercent) {

            this.loadingPercent.textContent = percent + "%";

        }

        if (this.loadingText) {

            this.loadingText.textContent = text;

        }

    }

    /* =====================================
        Resize
    ====================================== */

    resize() {

        if (!this.canvas) return;

        this.canvas.width =

            this.canvas.clientWidth;

        this.canvas.height =

            this.canvas.clientHeight;

    }
    /* =====================================
        INITIALIZE
    ====================================== */

    async initialize() {

        if (this.initialized) {

            console.warn("App already initialized.");

            return;

        }

        try {

            /* ---------- STEP 1 ---------- */

            this.setLoading(

                5,

                "Preparing application..."

            );

            this.resize();

            /* ---------- STEP 2 ---------- */

            this.setLoading(

                15,

                "Starting camera..."

            );

            this.camera = await createCamera(

                this.video

            );

            /* ---------- STEP 3 ---------- */

            this.setLoading(

                30,

                "Loading MediaPipe..."

            );

            this.mediapipe =

                new MediaPipeManager(

                    this.video

                );

            await this.mediapipe.initialize();

            /* ---------- STEP 4 ---------- */

            this.setLoading(

                45,

                "Loading gesture engine..."

            );

            this.detector =

                new FingerDetector();

            this.handTilt =

                new HandTilt();

            this.classifier =

                new ChordClassifier();

            /* ---------- STEP 5 ---------- */

            this.setLoading(

                60,

                "Loading synthesizer..."

            );

            this.synth =

                new SynthEngine();

            await this.synth.initialize();

            /* ---------- STEP 6 ---------- */

            this.setLoading(

                75,

                "Preparing graphics..."

            );

            this.landmarkRenderer =

                new LandmarkRenderer(

                    this.canvas

                );

            this.energyRenderer =

                new EnergyRenderer(

                    this.canvas

                );

            /* ---------- STEP 7 ---------- */

            this.setLoading(

                85,

                "Preparing interface..."

            );

            this.hud =

                new HUD();

            this.volumeMeter =

                new VolumeMeter(

                    this.volumeCanvas

                );

            this.helpModal =

                new HelpModal();

            /* ---------- STEP 8 ---------- */

            this.setLoading(

                95,

                "Building animation loop..."

            );

            this.loop =

                new AnimationLoop({

                    mediapipe:

                        this.mediapipe,

                    fingerDetector:

                        this.detector,

                    handTilt:

                        this.handTilt,

                    chordClassifier:

                        this.classifier,

                    synth:

                        this.synth,

                    landmarkRenderer:

                        this.landmarkRenderer,

                    energyRenderer:

                        this.energyRenderer,

                    hud:

                        this.hud,

                    volumeMeter:

                        this.volumeMeter

                });

            /* ---------- STEP 9 ---------- */

            this.mediapipe.onResults(

                results => {

                    this.loop.onResults(

                        results

                    );

                }

            );

            this.setLoading(

                100,

                "Ready."

            );

            this.initialized = true;

            console.log(

                "✅ Initialization Complete"

            );

        }

        catch (error) {

            console.error(

                "Initialization Failed",

                error

            );

            throw error;

        }

    }
    /* =====================================
        START APPLICATION
    ====================================== */

    async start() {

        if (!this.initialized) {

            await this.initialize();

        }

        if (this.running) {

            return;

        }

        try {

            /* ---------- Resume Audio ---------- */

            if (this.synth?.resume) {

                await this.synth.resume();

            }

            /* ---------- Start Loop ---------- */

            this.loop?.start();

            this.running = true;

            /* ---------- Hide Loading ---------- */

            if (this.loadingScreen) {

                this.loadingScreen.classList.add("hidden");

            }

            /* ---------- Show Main Stage ---------- */

            if (this.stage) {

                this.stage.classList.remove("hidden");

            }

            console.log("🚀 Gesture Synth Started");

        }

        catch (error) {

            console.error(

                "Failed to start application",

                error

            );

            throw error;

        }

    }

    /* =====================================
        STOP
    ====================================== */

    stop() {

        if (!this.running) {

            return;

        }

        this.loop?.stop();

        this.synth?.suspend?.();

        this.running = false;

        console.log("⏸ Application Paused");

    }

    /* =====================================
        RESUME
    ====================================== */

    async resume() {

        if (!this.initialized) {

            return;

        }

        if (this.running) {

            return;

        }

        await this.synth?.resume?.();

        this.loop?.start();

        this.running = true;

    }

    /* =====================================
        RESET
    ====================================== */

    reset() {

        this.loop?.reset?.();

        this.volumeMeter?.reset?.();

        this.hud?.reset?.();

    }

    /* =====================================
        STATUS
    ====================================== */

    isRunning() {

        return this.running;

    }

    isInitialized() {

        return this.initialized;

    }

    getCamera() {

        return this.camera;

    }

    getMediaPipe() {

        return this.mediapipe;

    }

    getSynth() {

        return this.synth;

    }

    getLoop() {

        return this.loop;

    }
    /* =====================================
        DESTROY
    ====================================== */

    destroy() {

        console.log("🛑 Destroying application...");

        try {

            /* ---------- Stop Animation ---------- */

            this.loop?.stop();

            /* ---------- Stop Camera ---------- */

            this.camera?.stop?.();

            /* ---------- Stop MediaPipe ---------- */

            this.mediapipe?.stop?.();

            this.mediapipe?.destroy?.();

            /* ---------- Stop Audio ---------- */

            this.synth?.destroy?.();

            /* ---------- Reset UI ---------- */

            this.volumeMeter?.reset?.();

            this.hud?.reset?.();

            /* ---------- Close Modal ---------- */

            this.helpModal?.close?.();

            /* ---------- Clear References ---------- */

            this.loop = null;
            this.camera = null;
            this.mediapipe = null;
            this.synth = null;

            this.detector = null;
            this.handTilt = null;
            this.classifier = null;

            this.landmarkRenderer = null;
            this.energyRenderer = null;

            this.volumeMeter = null;
            this.hud = null;
            this.helpModal = null;

            this.initialized = false;
            this.running = false;

            console.log("✅ Application Destroyed");

        }

        catch (error) {

            console.error(

                "Destroy Error",

                error

            );

        }

    }

}