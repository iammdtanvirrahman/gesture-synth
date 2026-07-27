/* ==========================================================
   Gesture Synth AI
   graphics/EnergyRenderer.js
========================================================== */

export default class EnergyRenderer {

    constructor(canvas) {

        if (!canvas) {

            throw new Error(
                "EnergyRenderer: Canvas not found."
            );

        }

        this.canvas = canvas;

        this.ctx = canvas.getContext("2d");

        this.energy = 0;

        this.color = "#00F3FF";

        this.maxParticles = 120;

        this.particles = [];

        this.createParticles();

    }

    /* =====================================
        Create Particles
    ===================================== */

    createParticles() {

        this.particles.length = 0;

        for (let i = 0; i < this.maxParticles; i++) {

            this.particles.push({

                x: Math.random() * this.canvas.width,

                y: Math.random() * this.canvas.height,

                vx: (Math.random() - 0.5) * 2,

                vy: (Math.random() - 0.5) * 2,

                size: 2 + Math.random() * 4,

                alpha: 0.2 + Math.random() * 0.8

            });

        }

    }

    /* =====================================
        Resize
    ===================================== */

    resize() {

        this.createParticles();

    }

    /* =====================================
        Update
    ===================================== */

    update(level = 0) {

        this.energy = Math.max(

            0,

            Math.min(1, level)

        );

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
        Background Glow
    ===================================== */

    drawGlow() {

        const g = this.ctx.createRadialGradient(

            this.canvas.width / 2,

            this.canvas.height / 2,

            50,

            this.canvas.width / 2,

            this.canvas.height / 2,

            this.canvas.width

        );

        g.addColorStop(0, "rgba(0,243,255,.08)");

        g.addColorStop(1, "transparent");

        this.ctx.fillStyle = g;

        this.ctx.fillRect(

            0,

            0,

            this.canvas.width,

            this.canvas.height

        );

    }

    /* =====================================
        Particles
    ===================================== */

    drawParticles() {

        const ctx = this.ctx;

        ctx.shadowBlur = 20;

        ctx.shadowColor = this.color;

        for (const p of this.particles) {

            const speed =

                1 + this.energy * 4;

            p.x += p.vx * speed;

            p.y += p.vy * speed;

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;

            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            ctx.beginPath();

            ctx.arc(

                p.x,

                p.y,

                p.size,

                0,

                Math.PI * 2

            );

            ctx.fillStyle =

                `rgba(0,243,255,${p.alpha})`;

            ctx.fill();

        }

    }

    /* =====================================
        Ripple
    ===================================== */

    ripple() {

        const ctx = this.ctx;

        const radius =

            80 +

            Math.sin(

                performance.now() * 0.006

            ) * 20 +

            this.energy * 60;

        ctx.beginPath();

        ctx.arc(

            this.canvas.width / 2,

            this.canvas.height / 2,

            radius,

            0,

            Math.PI * 2

        );

        ctx.strokeStyle =

            "rgba(0,243,255,.25)";

        ctx.lineWidth = 2;

        ctx.stroke();

    }

    /* =====================================
        Render
    ===================================== */

    render() {

        this.clear();

        this.drawGlow();

        this.drawParticles();

        this.ripple();

    }

    /* =====================================
        Reset
    ===================================== */

    reset() {

        this.energy = 0;

        this.clear();

    }

}
