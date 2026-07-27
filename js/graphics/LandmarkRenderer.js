/* ==========================================================
   Gesture Synth AI
   graphics/LandmarkRenderer.js
========================================================== */

export default class LandmarkRenderer {

    constructor(canvas) {

        if (!canvas) {

            throw new Error(
                "LandmarkRenderer: Canvas not found."
            );

        }

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.landmarks = [];

        this.glowColor = "#00F3FF";

        this.nodeRadius = 6;

        this.lineWidth = 3;

        this.previous = null;

        this.connectionPairs = [

            [0,1],[1,2],[2,3],[3,4],

            [0,5],[5,6],[6,7],[7,8],

            [5,9],[9,10],[10,11],[11,12],

            [9,13],[13,14],[14,15],[15,16],

            [13,17],[17,18],[18,19],[19,20],

            [0,17]

        ];

    }

    /* =====================================
        Update
    ===================================== */

    update(results) {

        this.landmarks =

            results?.multiHandLandmarks || [];

    }

    /* =====================================
        Clear
    ===================================== */

    clear() {

        this.ctx.clearRect(

            0,

            0,

            this.canvas.width,

            this.canvas.height

        );

    }

    /* =====================================
        Pulse Animation
    ===================================== */

    pulse() {

        this.nodeRadius =

            5 +

            Math.sin(

                performance.now() * 0.005

            );

    }

    /* =====================================
        Draw Connections
    ===================================== */

    drawConnections(hand) {

        const ctx = this.ctx;

        ctx.strokeStyle = this.glowColor;

        ctx.lineWidth = this.lineWidth;

        ctx.shadowBlur = 10;

        ctx.shadowColor = this.glowColor;

        for (const pair of this.connectionPairs) {

            const a = hand[pair[0]];
            const b = hand[pair[1]];

            ctx.beginPath();

            ctx.moveTo(

                a.x * this.canvas.width,

                a.y * this.canvas.height

            );

            ctx.lineTo(

                b.x * this.canvas.width,

                b.y * this.canvas.height

            );

            ctx.stroke();

        }

    }

    /* =====================================
        Draw Points
    ===================================== */

    drawPoints(hand) {

        const ctx = this.ctx;

        ctx.fillStyle = this.glowColor;

        ctx.shadowBlur = 20;

        ctx.shadowColor = this.glowColor;

        for (const point of hand) {

            ctx.beginPath();

            ctx.arc(

                point.x * this.canvas.width,

                point.y * this.canvas.height,

                this.nodeRadius,

                0,

                Math.PI * 2

            );

            ctx.fill();

        }

    }
       /* =====================================
        Fingertip Glow
    ===================================== */

    drawFingerTips(hand) {

        const tips = [4, 8, 12, 16, 20];

        const ctx = this.ctx;

        for (const i of tips) {

            const p = hand[i];

            const x = p.x * this.canvas.width;

            const y = p.y * this.canvas.height;

            const gradient = ctx.createRadialGradient(

                x, y, 2,

                x, y, 22

            );

            gradient.addColorStop(0, "#FFFFFF");

            gradient.addColorStop(0.35, "#00F3FF");

            gradient.addColorStop(1, "rgba(0,243,255,0)");

            ctx.fillStyle = gradient;

            ctx.beginPath();

            ctx.arc(

                x,

                y,

                22,

                0,

                Math.PI * 2

            );

            ctx.fill();

        }

    }

    /* =====================================
        Motion Trail
    ===================================== */

    drawTrail(hand) {

        if (!this.previous) {

            this.previous = hand.map(p => ({ ...p }));

            return;

        }

        const ctx = this.ctx;

        ctx.strokeStyle =

            "rgba(0,243,255,.15)";

        ctx.lineWidth = 2;

        for (let i = 0; i < hand.length; i++) {

            ctx.beginPath();

            ctx.moveTo(

                this.previous[i].x * this.canvas.width,

                this.previous[i].y * this.canvas.height

            );

            ctx.lineTo(

                hand[i].x * this.canvas.width,

                hand[i].y * this.canvas.height

            );

            ctx.stroke();

        }

        this.previous = hand.map(

            p => ({ ...p })

        );

    }

    /* =====================================
        Energy Ring
    ===================================== */

    drawEnergy(hand) {

        const wrist = hand[0];

        if (!wrist) return;

        const ctx = this.ctx;

        const x = wrist.x * this.canvas.width;

        const y = wrist.y * this.canvas.height;

        const radius =

            40 +

            Math.sin(

                performance.now() * 0.01

            ) * 8;

        ctx.beginPath();

        ctx.arc(

            x,

            y,

            radius,

            0,

            Math.PI * 2

        );

        ctx.strokeStyle =

            "rgba(0,243,255,.35)";

        ctx.lineWidth = 2;

        ctx.stroke();

    }

    /* =====================================
        Render
    ===================================== */

    render() {

        this.clear();

        this.pulse();

        for (const hand of this.landmarks) {

            this.drawTrail(hand);

            this.drawConnections(hand);

            this.drawPoints(hand);

            this.drawFingerTips(hand);

            this.drawEnergy(hand);

        }

    }

    /* =====================================
        Reset
    ===================================== */

    reset() {

        this.landmarks = [];

        this.previous = null;

        this.clear();

    }

}
