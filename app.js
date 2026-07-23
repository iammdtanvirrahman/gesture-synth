const video = document.getElementById("video");
const status = document.getElementById("status");


navigator.mediaDevices.getUserMedia({
    video:{
        width:640,
        height:480
    }
})

.then(stream=>{

    video.srcObject = stream;

    status.innerHTML="Camera Ready ✋";

})

.catch(error=>{

    status.innerHTML="Camera Error ❌";

    console.log(error);

});