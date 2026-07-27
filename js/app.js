/* ==========================================================
   Gesture Synth AI
   app.js
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

        /* =========================
            DOM
        ========================= */

        this.video = document.getElementById("video");

        this.canvas = document.getElementById("canvas");

        this.volumeCanvas =

            document.getElementById("volumeCanvas");

    }

    async initialize() {

        /* =========================
            Camera
        ========================= */

        this.camera = await createCamera(

            this.video

        );

        /* =========================
            MediaPipe
        ========================= */

        this.mediapipe =

            new MediaPipeManager(

                this.video

            );

        await this.mediapipe.initialize();

        /* =========================
            Gesture
        ========================= */

        this.detector =

            new FingerDetector();

        this.handTilt =

            new HandTilt();

        this.classifier =

            new ChordClassifier();

        /* =========================
            Audio
        ========================= */

        this.synth =

            new SynthEngine();

        await this.synth.initialize();

        /* =========================
            Graphics
        ========================= */

        this.landmark =

            new LandmarkRenderer(

                this.canvas

            );

        this.energy =

            new EnergyRenderer(

                this.canvas

            );

        /* =========================
            UI
        ========================= */

        this.hud =

            new HUD();

        this.volume =

            new VolumeMeter(

                this.volumeCanvas

            );

        this.help =

            new HelpModal();

        /* =========================
            Animation Loop
        ========================= */

        this.loop =

            new AnimationLoop({

                mediapipe:this.mediapipe,

                fingerDetector:this.detector,

                handTilt:this.handTilt,

                chordClassifier:this.classifier,

                synth:this.synth,

                landmarkRenderer:this.landmark,

                energyRenderer:this.energy,

                hud:this.hud,

                volumeMeter:this.volume

            });

        this.mediapipe.onResults(results=>{

            this.loop.onResults(results);

        });

        this.loop.start();

        console.log(

            "✅ Gesture Synth AI Ready"

        );

    }

    /* =========================
        Destroy
    ========================= */

    destroy(){

        this.loop.stop();

        this.camera.stop();

        this.mediapipe.stop();

        this.synth.destroy();

    }

}