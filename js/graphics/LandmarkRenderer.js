/* ==========================================================
   Gesture Synth AI
   graphics/LandmarkRenderer.js
========================================================== */

export default class LandmarkRenderer {

    constructor(canvas){

        this.canvas=canvas;

        this.ctx=canvas.getContext("2d");

        this.landmarks=[];

        this.connections=[];

        this.glowColor="#00F3FF";

        this.nodeRadius=6;

        this.lineWidth=3;

    }

    update(results){

        this.landmarks=

            results.multiHandLandmarks||[];

    }

    clear(){

        this.ctx.clearRect(

            0,
            0,
            this.canvas.width,
            this.canvas.height

        );

    }

    render(){

        this.clear();

        this.landmarks.forEach(hand=>{

            this.drawConnections(hand);

            this.drawPoints(hand);

        });

    }

    /* ===================================== */

    drawPoints(hand){

        hand.forEach(point=>{

            const x=point.x*this.canvas.width;

            const y=point.y*this.canvas.height;

            this.ctx.beginPath();

            this.ctx.arc(

                x,
                y,
                this.nodeRadius,
                0,
                Math.PI*2

            );

            this.ctx.fillStyle=this.glowColor;

            this.ctx.shadowBlur=20;

            this.ctx.shadowColor=this.glowColor;

            this.ctx.fill();

        });

    }

    /* ===================================== */

    drawConnections(hand){

        const pairs=[

            [0,1],[1,2],[2,3],[3,4],

            [0,5],[5,6],[6,7],[7,8],

            [5,9],[9,10],[10,11],[11,12],

            [9,13],[13,14],[14,15],[15,16],

            [13,17],[17,18],[18,19],[19,20],

            [0,17]

        ];

        this.ctx.strokeStyle=this.glowColor;

        this.ctx.lineWidth=this.lineWidth;

        this.ctx.shadowBlur=10;

        this.ctx.shadowColor=this.glowColor;

        pairs.forEach(pair=>{

            const a=hand[pair[0]];

            const b=hand[pair[1]];

            this.ctx.beginPath();

            this.ctx.moveTo(

                a.x*this.canvas.width,

                a.y*this.canvas.height

            );

            this.ctx.lineTo(

                b.x*this.canvas.width,

                b.y*this.canvas.height

            );

            this.ctx.stroke();

        });

    }

}
/* ==========================================================
   LandmarkRenderer.js
   Part 2
   Premium Effects
========================================================== */

/* ======================================
    Fingertip Glow
====================================== */

drawFingerTips(hand){

    const tips=[4,8,12,16,20];

    tips.forEach(i=>{

        const p=hand[i];

        const x=p.x*this.canvas.width;

        const y=p.y*this.canvas.height;

        const g=this.ctx.createRadialGradient(

            x,y,2,
            x,y,22

        );

        g.addColorStop(0,"#ffffff");

        g.addColorStop(.3,"#00F3FF");

        g.addColorStop(1,"transparent");

        this.ctx.fillStyle=g;

        this.ctx.beginPath();

        this.ctx.arc(

            x,
            y,
            22,
            0,
            Math.PI*2

        );

        this.ctx.fill();

    });

}

/* ======================================
    Energy Ring
====================================== */

drawEnergy(hand){

    const wrist=hand[0];

    const x=wrist.x*this.canvas.width;

    const y=wrist.y*this.canvas.height;

    this.ctx.beginPath();

    this.ctx.strokeStyle="rgba(0,243,255,.35)";

    this.ctx.lineWidth=2;

    this.ctx.arc(

        x,
        y,
        40+Math.sin(Date.now()/200)*8,
        0,
        Math.PI*2

    );

    this.ctx.stroke();

}

/* ======================================
    Motion Trail
====================================== */

drawTrail(hand){

    if(!this.previous){

        this.previous=hand;

        return;

    }

    this.ctx.strokeStyle="rgba(0,243,255,.15)";

    this.ctx.lineWidth=2;

    for(let i=0;i<hand.length;i++){

        this.ctx.beginPath();

        this.ctx.moveTo(

            this.previous[i].x*this.canvas.width,

            this.previous[i].y*this.canvas.height

        );

        this.ctx.lineTo(

            hand[i].x*this.canvas.width,

            hand[i].y*this.canvas.height

        );

        this.ctx.stroke();

    }

    this.previous=hand;

}

/* ======================================
    Pulse
====================================== */

pulse(){

    this.nodeRadius=

        5+

        Math.sin(Date.now()/180);

}

/* ======================================
    Render Upgrade
====================================== */

render(){

    this.clear();

    this.pulse();

    this.landmarks.forEach(hand=>{

        this.drawTrail(hand);

        this.drawConnections(hand);

        this.drawPoints(hand);

        this.drawFingerTips(hand);

        this.drawEnergy(hand);

    });

}
