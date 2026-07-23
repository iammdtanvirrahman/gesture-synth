const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const result = document.getElementById("result");


// Camera start
async function startCamera(){

    const stream = await navigator.mediaDevices.getUserMedia({
        video:{
            width:640,
            height:480
        }
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

    maxNumHands:2,

    modelComplexity:1,

    minDetectionConfidence:0.7,

    minTrackingConfidence:0.7

});


// Draw hand

const draw = new drawUtils();

hands.onResults(results=>{


    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;


    ctx.save();

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.drawImage(
        results.image,
        0,
        0,
        canvas.width,
        canvas.height
    );


    let gestureText="";


    if(results.multiHandLandmarks){


        results.multiHandLandmarks.forEach((landmarks,index)=>{


            drawConnectors(
                ctx,
                landmarks,
                HAND_CONNECTIONS,
                {
                    color:"#00ffcc",
                    lineWidth:4
                }
            );


            drawLandmarks(
                ctx,
                landmarks,
                {
                    color:"#ff0066",
                    radius:5
                }
            );


            let gesture =
            detectGesture(landmarks);


            gestureText +=
            `Hand ${index+1}: ${gesture}\n`;



        });


        result.innerText =
        gestureText;


    }
    else{

        result.innerText =
        "No Hand";

    }


    ctx.restore();

});



// Camera processing

const camera = new Camera(video,{

    onFrame:async()=>{

        await hands.send({
            image:video
        });

    },

    width:640,
    height:480

});


camera.start();





// Gesture Recognition

function detectGesture(lm){


    let fingers=[];


    // Thumb
    if(lm[4].x < lm[3].x)
    {
        fingers.push(1);
    }
    else
    {
        fingers.push(0);
    }



    // Four fingers

    let tips=[
        8,
        12,
        16,
        20
    ];

    let bases=[
        6,
        10,
        14,
        18
    ];


    for(let i=0;i<4;i++){

        if(
            lm[tips[i]].y <
            lm[bases[i]].y
        )
        {
            fingers.push(1);
        }
        else
        {
            fingers.push(0);
        }

    }



    let count =
    fingers.reduce(
        (a,b)=>a+b,
        0
    );



    if(count===5)
        return "MAJOR 🎸";


    if(count===2)
        return "V 🎵";


    if(count===1)
        return "I 🎶";


    if(count===0)
        return "REST";


    return "UNKNOWN";

}