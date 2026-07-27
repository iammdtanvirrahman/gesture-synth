/* ==========================================================
   Gesture Synth AI
   ui/VolumeMeter.js
========================================================== */

export default class VolumeMeter {

    constructor(canvas) {

        this.canvas = canvas;

        this.ctx = canvas.getContext("2d");

        this.level = 0;

        this.target = 0;

        this.bars = 32;

        this.maxHeight = canvas.height - 10;

        this.barGap = 4;

        this.barWidth =

            (canvas.width - this.barGap * this.bars)

            / this.bars;

        this.gradient = this.ctx.createLinearGradient(

            0,
            canvas.height,
            0,
            0

        );

        this.gradient.addColorStop(0, "#00F3FF");
        this.gradient.addColorStop(.5, "#19FFD5");
        this.gradient.addColorStop(1, "#FFFFFF");

    }

    /* =====================================
        Set Volume
    ===================================== */

    update(level) {

        this.target = Math.max(

            0,

            Math.min(

                1,

                level

            )

        );

    }

    /* =====================================
        Smooth Animation
    ===================================== */

    animate() {

        this.level +=

            (this.target - this.level)

            * .15;

    }

    /* =====================================
        Background
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
        Draw Bars
    ===================================== */

    drawBars() {

        this.ctx.fillStyle = this.gradient;

        for (

            let i = 0;

            i < this.bars;

            i++

        ) {

            const noise =

                Math.random() * .2;

            const h =

                (this.level + noise)

                * this.maxHeight

                * Math.random();

            const x =

                i *

                (this.barWidth + this.barGap);

            const y =

                this.canvas.height - h;

            this.ctx.shadowBlur = 12;

            this.ctx.shadowColor = "#00F3FF";

            this.ctx.fillRect(

                x,

                y,

                this.barWidth,

                h

            );

        }

    }

    /* =====================================
        Peak Line
    ===================================== */

    drawPeak() {

        const y =

            this.canvas.height -

            this.level *

            this.maxHeight;

        this.ctx.beginPath();

        this.ctx.moveTo(

            0,

            y

        );

        this.ctx.lineTo(

            this.canvas.width,

            y

        );

        this.ctx.strokeStyle =

            "rgba(255,255,255,.35)";

        this.ctx.lineWidth = 2;

        this.ctx.stroke();

    }

    /* =====================================
        Render
    ===================================== */

    render() {

        this.animate();

        this.clear();

        this.drawBars();

        this.drawPeak();

    }

}