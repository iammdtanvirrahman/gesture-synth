/* ==========================================================
   Gesture Synth AI
   core/camera.js
========================================================== */

import APP_CONFIG from "../config.js";

export class CameraManager {

    constructor(videoElement) {

        this.video = videoElement;

        this.stream = null;

        this.ready = false;

    }

    async start() {

        try {

            this.stream = await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode: APP_CONFIG.CAMERA.facingMode,

                    width: {

                        ideal: APP_CONFIG.CAMERA.width

                    },

                    height: {

                        ideal: APP_CONFIG.CAMERA.height

                    }

                },

                audio: false

            });

            this.video.srcObject = this.stream;

            await this.video.play();

            this.ready = true;

            console.log("✅ Camera Started");

            return this.video;

        }

        catch(error){

            console.error("Camera Error :",error);

            throw error;

        }

    }

    stop(){

        if(!this.stream) return;

        this.stream.getTracks().forEach(track=>{

            track.stop();

        });

        this.stream=null;

        this.ready=false;

    }

    async restart(){

        this.stop();

        return await this.start();

    }

    getVideo(){

        return this.video;

    }

    isReady(){

        return this.ready;

    }

}

/* ==========================================================
    Helper
========================================================== */

export async function createCamera(videoElement){

    const camera=new CameraManager(videoElement);

    await camera.start();

    return camera;

}