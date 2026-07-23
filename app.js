const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");


canvas.width = 640;
canvas.height = 480;


// MediaPipe Hands
const hands = new Hands({

    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }

});


hands.setOptions({

    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7

});



// Result পাওয়ার পর
hands.onResults(results => {


    ctx.clearRect(0,0,640,480);


    ctx.drawImage(
        results.image,
        0,
        0,
        640,
        480
    );


    if(results.multiHandLandmarks){


        status.innerHTML =
        "Hand Detected ✋";


        for(const landmarks of results.multiHandLandmarks){


            drawConnectors(
                ctx,
                landmarks,
                HAND_CONNECTIONS,
                {
                    color:"#00ffcc",
                    lineWidth:3
                }
            );


            drawLandmarks(
                ctx,
                landmarks,
                {
                    color:"#ff0066",
                    lineWidth:2
                }
            );


        }


    }

});




// Camera
const camera = new Camera(video, {

    onFrame: async()=>{

        await hands.send({
            image:video
        });

    },

    width:640,
    height:480

});


camera.start();