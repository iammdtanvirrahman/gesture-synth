const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const result = document.getElementById("result");


// Camera

async function startCamera(){

    const stream =
    await navigator.mediaDevices.getUserMedia({
        video:true
    });

    video.srcObject = stream;

}

startCamera();



// MediaPipe Hands

const hands = new Hands({
    locateFile:(file)=>{
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});


hands.setOptions({

    maxNumHands:1,

    modelComplexity:1,

    minDetectionConfidence:0.7,

    minTrackingConfidence:0.7

});



// Result

hands.onResults((res)=>{


    canvas.width =
    video.videoWidth;

    canvas.height =
    video.videoHeight;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.drawImage(
        res.image,
        0,
        0,
        canvas.width,
        canvas.height
    );



    if(res.multiHandLandmarks){


        let lm =
        res.multiHandLandmarks[0];


        // Draw points

        drawConnectors(
            ctx,
            lm,
            HAND_CONNECTIONS,
            {
                color:"#00ffcc",
                lineWidth:4
            }
        );


        drawLandmarks(
            ctx,
            lm,
            {
                color:"#ff0066",
                radius:5
            }
        );



        let gesture =
        detectGesture(lm);



        result.innerText =
        "Hand Detected ✋\nGesture: "
        + gesture;


    }

    else{

        result.innerText =
        "No Hand";

    }


});




// Camera loop

const camera =
new Camera(video,{

    onFrame: async()=>{

        await hands.send({
            image:video
        });

    },

    width:640,
    height:480

});


camera.start();





// Gesture AI

function detectGesture(lm){


    let fingers=[];


    // Thumb

    if(lm[4].x < lm[3].x){

        fingers.push(1);

    }

    else{

        fingers.push(0);

    }



    // Four fingers

    let tips=[
        8,
        12,
        16,
        20
    ];


    let joints=[
        6,
        10,
        14,
        18
    ];



    for(let i=0;i<4;i++){


        if(
        lm[tips[i]].y <
        lm[joints[i]].y
        ){

            fingers.push(1);

        }

        else{

            fingers.push(0);

        }


    }




    let count =
    fingers.reduce(
        (a,b)=>a+b,
        0
    );



    if(count===5){

        return "MAJOR 🎸";

    }


    if(count===2){

        return "V 🎵";

    }


    if(count===1){

        return "I 🎶";

    }


    if(count===0){

        return "REST";

    }


    return "UNKNOWN";

}