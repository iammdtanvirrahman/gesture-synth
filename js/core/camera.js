/* ==========================================================
   Gesture Synth AI
   core/camera.js
========================================================== */

import APP_CONFIG from "../config.js";

export class CameraManager {

    constructor(videoElement) {

        if (!videoElement) {

            throw new Error("CameraManager: video element not found.");

        }

        this.video = videoElement;
        this.stream = null;
        this.ready = false;
        this.starting = false;

    }

    /* =====================================
        Start Camera
    ====================================== */

    async start() {

        if (this.ready) {

            return this.video;

        }

        if (this.starting) {

            return this.video;

        }

        this.starting = true;

        try {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "getUserMedia is not supported."
                );

            }

            this.stream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        facingMode:
                            APP_CONFIG.CAMERA.facingMode,

                        width: {

                            ideal:
                                APP_CONFIG.CAMERA.width

                        },

                        height: {

                            ideal:
                                APP_CONFIG.CAMERA.height

                        }

                    },

                    audio: false

                });

            this.video.srcObject = this.stream;

            await this.video.play();

            await new Promise(resolve => {

                if (this.video.readyState >= 2) {

                    resolve();

                }

                else {

                    this.video.onloadedmetadata = () => resolve();

                }

            });

            this.ready = true;

            console.log("✅ Camera Started");

            return this.video;

        }

        catch (error) {

            console.error("Camera Error:", error);

            this.stop();

            throw error;

        }

        finally {

            this.starting = false;

        }

    }

    /* =====================================
        Stop Camera
    ====================================== */

    stop() {

        if (this.stream) {

            this.stream
                .getTracks()
                .forEach(track => track.stop());

        }

        if (this.video) {

            this.video.pause();

            this.video.srcObject = null;

        }

        this.stream = null;
        this.ready = false;

    }

    /* =====================================
        Restart
    ====================================== */

    async restart() {

        this.stop();

        return await this.start();

    }

    /* =====================================
        Getters
    ====================================== */

    getVideo() {

        return this.video;

    }

    getStream() {

        return this.stream;

    }

    isReady() {

        return this.ready;

    }

}

/* ==========================================================
    Helper
========================================================== */

export async function createCamera(videoElement) {

    const camera = new CameraManager(videoElement);

    await camera.start();

    return camera;

}