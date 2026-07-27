/* ==========================================================
   Gesture Synth AI
   core/animationLoop.js
========================================================== */

export default class AnimationLoop {

    constructor({

        mediapipe,

        fingerDetector,

        handTilt,

        chordClassifier,

        synth,

        landmarkRenderer,

        energyRenderer,

        hud,

        volumeMeter

    }) {

        this.mp = mediapipe;

        this.detector = fingerDetector;

        this.tilt = handTilt;

        this.classifier = chordClassifier;

        this.synth = synth;

        this.landmark = landmarkRenderer;

        this.energy = energyRenderer;

        this.hud = hud;

        this.volume = volumeMeter;

        this.running = false;

        this.frameId = null;

        this.lastTime = performance.now();

        this.delta = 0;

    }

    /* =====================================
        Start
    ===================================== */

    start() {

        if (this.running) return;

        this.running = true;

        this.loop();

    }

    /* =====================================
        Stop
    ===================================== */

    stop() {

        this.running = false;

        cancelAnimationFrame(

            this.frameId

        );

    }

    /* =====================================
        Main Loop
    ===================================== */

    loop = () => {

        if (!this.running)

            return;

        const now = performance.now();

        this.delta = now - this.lastTime;

        this.lastTime = now;

        this.update();

        this.render();

        this.frameId =

            requestAnimationFrame(

                this.loop

            );

    }

    /* =====================================
        Update
    ===================================== */

    update() {

        this.hud.updateFPS();

    }

    /* =====================================
        Receive MediaPipe Result
    ===================================== */

    onResults(results) {

        this.landmark.update(results);

        const hands =

            results.multiHandLandmarks || [];

        this.hud.setHands(

            hands.length

        );

        if (!hands.length) {

            this.synth.stopChord();

            return;

        }

        const hand = hands[0];

        const handedness =

            results.multiHandedness?.[0]

            ?.label || "Right";

        this.detector.update(

            hand,

            handedness

        );

        this.tilt.update(hand);

        const chord =

            this.classifier.classify(

                this.detector

            );

        this.synth.playChord(

            chord.chord

        );

        this.synth.update({

            filter:

                this.tilt.getFilterValue(),

            volume:

                this.tilt.getVolume(),

            vibrato:

                this.tilt.getVibratoDepth()

        });

        this.energy.update(

            this.detector.count() / 5

        );

        this.volume.update(

            this.tilt.getVolume()

        );

        this.hud.update({

            chord:

                chord.chord,

            confidence:

                chord.confidence,

            filter:

                this.tilt.getFilterValue(),

            volume:

                this.tilt.getVolume(),

            key:

                this.classifier.root

        });

    }

    /* =====================================
        Render
    ===================================== */

    render() {

        this.landmark.render();

        this.energy.render();

        this.volume.render();

    }

}