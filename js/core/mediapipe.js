/* ==========================================================
   Gesture Synth AI
   core/mediapipe.js
========================================================== */

import APP_CONFIG from "../config.js";

export class MediaPipeManager{

    constructor(video){

        this.video=video;

        this.hands=null;

        this.onResultsCallback=null;

        this.ready=false;

    }

    async initialize(){

        this.hands=new Hands({

            locateFile:(file)=>{

                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;

            }

        });

        this.hands.setOptions({

            maxNumHands:APP_CONFIG.MAX_HANDS,

            modelComplexity:1,

            minDetectionConfidence:
                APP_CONFIG.DETECTION.minHandDetectionConfidence,

            minTrackingConfidence:
                APP_CONFIG.DETECTION.minTrackingConfidence

        });

        this.hands.onResults((results)=>{

            if(this.onResultsCallback){

                this.onResultsCallback(results);

            }

        });

        this.camera=new Camera(

            this.video,

            {

                onFrame:async()=>{

                    await this.hands.send({

                        image:this.video

                    });

                },

                width:APP_CONFIG.CAMERA.width,

                height:APP_CONFIG.CAMERA.height

            }

        );

        await this.camera.start();

        this.ready=true;

        console.log("✅ MediaPipe Ready");

    }

    onResults(callback){

        this.onResultsCallback=callback;

    }

    stop(){

        if(this.camera){

            this.camera.stop();

        }

    }

    isReady(){

        return this.ready;

    }

}