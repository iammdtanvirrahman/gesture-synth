/* ==========================================================
   Gesture Synth AI
   ui/VolumeMeter.js
========================================================== */

import { clearCanvas } from '../utils/canvas.js';

export default class VolumeMeter {

    constructor(canvas) {

        if (!canvas) {

            throw new Error("VolumeMeter: Canvas not found.");

        }

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.level = 0;
        this.target = 0;

        this.bars = 32;
        this.barGap = 4;

        this.resize();

        this.gradient = this.ctx.createLinearGradient(
            0,
            this.canvas.height,
            0,
            0
        );

        this.gradient.addColorStop(0, "#00F3FF");
        this.gradient.addColorStop(0.5, "#19FFD5");
        this.gradient.addColorStop(1, "#FFFFFF");

    }

    /* =====================================
        Resize
    ===================================== */

    resize() {

        this.maxHeight = this.canvas.height - 10;

        this.barWidth =

            (this.canvas.width -

                this.barGap * (this.bars - 1))

            / this.bars;

    }

    /* =====================================
        Update
    ===================================== */

    update(level) {

        this.target = Math.max(
            0,
            Math.min(1, level)
        );

    }

    /* =====================================
        Animation
    ===================================== */

    animate() {

        this.level +=

            (this.target - this.level) * 0.15;

    }

    /* =====================================
        Clear
    ===================================== */

    clear() {

        clearCanvas(this.ctx, this.canvas);

    }

    /* =====================================
        Draw Bars
    ===================================== */

    drawBars() {

        const ctx = this.ctx;

        ctx.fillStyle = this.gradient;

        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00F3FF";

        for (let i = 0; i < this.bars; i++) {

            const variation =

                0.85 +

                0.15 *

                Math.sin(

                    performance.now() * 0.01 + i

                );

            const h =

                this.level *

                variation *

                this.maxHeight;

            const x =

                i *

                (this.barWidth + this.barGap);

            const y =

                this.canvas.height - h;

            ctx.fillRect(

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

        const ctx = this.ctx;

        const y =

            this.canvas.height -

            this.level *

            this.maxHeight;

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(

            this.canvas.width,

            y

        );

        ctx.strokeStyle =

            "rgba(255,255,255,.35)";

        ctx.lineWidth = 2;

        ctx.stroke();

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

    /* =====================================
        Reset
    ===================================== */

    reset() {

        this.level = 0;

        this.target = 0;

        this.clear();

    }

}
