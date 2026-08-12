/* ==========================================================
   Gesture Synth AI
   core/mediapipe.js
========================================================== */

import APP_CONFIG from "../config.js";

export class MediaPipeManager {

    constructor(video) {

        if (!video) {

            throw new Error("MediaPipeManager: video element not found.");

        }

        this.video = video;

        this.hands = null;

        this.camera = null;

        this.onResultsCallback = null;

        this.ready = false;

        this.initializing = false;

    }

    /* =====================================
        Initialize
    ====================================== */

    async initialize() {

        if (this.ready) return;

        if (this.initializing) return;

        this.initializing = true;

        try {

            if (typeof Hands === "undefined") {

                throw new Error(
                    "MediaPipe Hands library not loaded."
                );

            }

            if (typeof Camera === "undefined") {

                throw new Error(
                    "MediaPipe Camera Utils not loaded."
                );

            }

            this.hands = new Hands({

                locateFile: (file) =>

                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

            });

            this.hands.setOptions({

                maxNumHands: APP_CONFIG.MAX_HANDS,

                modelComplexity: 1,

                minDetectionConfidence:
                    APP_CONFIG.DETECTION.minHandDetectionConfidence,

                minTrackingConfidence:
                    APP_CONFIG.DETECTION.minTrackingConfidence

            });

            this.hands.onResults((results) => {

                if (this.onResultsCallback) {

                    this.onResultsCallback(results);

                }

            });

            // If the video element already has a srcObject (created by another camera manager),
            // don't start a second getUserMedia stream. Instead, feed frames from the existing
            // video element to MediaPipe via requestAnimationFrame.
            if (this.video && this.video.srcObject) {

                this._useExternalStream = true;

                this._frameLoop = async () => {

                    if (!this.hands) return;

                    try {

                        await this.hands.send({ image: this.video });

                    }

                    catch (e) {

                        // ignore transient frame send errors

                        console.warn("MediaPipe frame error:", e);

                    }

                    this._frameReq = requestAnimationFrame(this._frameLoop);

                };

                this._frameReq = requestAnimationFrame(this._frameLoop);

            }

            else {

                this.camera = new Camera(

                    this.video,

                    {

                        onFrame: async () => {

                            if (!this.hands) return;

                            await this.hands.send({

                                image: this.video

                            });

                        },

                        width: APP_CONFIG.CAMERA.width,

                        height: APP_CONFIG.CAMERA.height

                    }

                );

                await this.camera.start();

            }

            this.ready = true;

            console.log("✅ MediaPipe Ready");

        }

        catch (error) {

            console.error(

                "MediaPipe Error:",

                error

            );

            this.stop();

            throw error;

        }

        finally {

            this.initializing = false;

        }

    }

    /* =====================================
        Results
    ====================================== */

    onResults(callback) {

        this.onResultsCallback = callback;

    }

    /* =====================================
        Restart
    ====================================== */

    async restart() {

        this.stop();

        await this.initialize();

    }

    /* =====================================
        Stop
    ====================================== */

    stop() {

        try {

            this.camera?.stop?.();

        }

        catch (e) {

            console.warn(e);

        }

        try {

            this.hands?.close?.();

        }

        catch (e) {

            console.warn(e);

        }

        // If we used an external stream and requestAnimationFrame loop, cancel it.
        try {

            if (this._frameReq) {

                cancelAnimationFrame(this._frameReq);

                this._frameReq = null;

            }

        }

        catch (e) {

            console.warn(e);

        }

        this._useExternalStream = false;

        this.camera = null;

        this.hands = null;

        this.ready = false;

    }

    /* =====================================
        Getter
    ====================================== */

    isReady() {

        return this.ready;

    }

}
