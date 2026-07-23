const video=document.getElementById("video");
const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");
const status=document.getElementById("status");


canvas.width=640;
canvas.height=480;



const hands=new Hands({

locateFile:(file)=>{

return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/"+file;

}

});



hands.setOptions({

maxNumHands:2,

modelComplexity:1,

minDetectionConfidence:0.5,

minTrackingConfidence:0.5

});





hands.onResults((results)=>{


ctx.clearRect(0,0,640,480);



ctx.drawImage(

results.image,

0,

0,

640,

480

);



if(results.multiHandLandmarks && results.multiHandLandmarks.length>0){


status.innerHTML="Hand Detected ✋";



for(let hand of results.multiHandLandmarks){



drawConnectors(

ctx,

hand,

HAND_CONNECTIONS,

{

color:"#00ffcc",

lineWidth:4

}

);



drawLandmarks(

ctx,

hand,

{

color:"#ff0066",

radius:5

}

);



}



}

else{

status.innerHTML="Show Hand ✋";

}



});






const camera=new Camera(video,{

onFrame:async()=>{

await hands.send({

image:video

});

},


width:640,

height:480


});



camera.start();