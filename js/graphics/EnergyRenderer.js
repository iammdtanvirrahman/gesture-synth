/* ==========================================================
   Gesture Synth AI
   graphics/EnergyRenderer.js
========================================================== */

export default class EnergyRenderer {

    constructor(canvas) {

        this.canvas = canvas;

        this.ctx = canvas.getContext("2d");

        this.particles = [];

        this.maxParticles = 120;

        this.energy = 0;

        this.color = "#00F3FF";

        this.createParticles();

    }

    /* ======================================
        Create Particles
    ====================================== */

    createParticles() {

        for (let i = 0; i < this.maxParticles; i++) {

            this.particles.push({

                x: Math.random() * this.canvas.width,

                y: Math.random() * this.canvas.height,

                vx: (Math.random() - 0.5) * 2,

                vy: (Math.random() - 0.5) * 2,

                size: 2 + Math.random() * 4,

                alpha: Math.random()

            });

        }

    }

    /* ======================================
        Update Energy
    ====================================== */

    update(level = 0) {

        this.energy = level;

    }

    /* ======================================
        Draw Background Glow
    ====================================== */

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

    /* ======================================
        Draw Particles
    ====================================== */

    drawParticles() {

        this.particles.forEach(p => {

            p.x += p.vx * (1 + this.energy * 4);

            p.y += p.vy * (1 + this.energy * 4);

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;

            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            this.ctx.beginPath();

            this.ctx.arc(

                p.x,

                p.y,

                p.size,

                0,

                Math.PI * 2

            );

            this.ctx.fillStyle = `rgba(0,243,255,${p.alpha})`;

            this.ctx.shadowBlur = 20;

            this.ctx.shadowColor = this.color;

            this.ctx.fill();

        });

    }

    /* ======================================
        Ripple
    ====================================== */

    ripple() {

        const r =

            80 +

            Math.sin(Date.now() / 150) * 20 +

            this.energy * 60;

        this.ctx.beginPath();

        this.ctx.arc(

            this.canvas.width / 2,

            this.canvas.height / 2,

            r,

            0,

            Math.PI * 2

        );

        this.ctx.strokeStyle =

            "rgba(0,243,255,.25)";

        this.ctx.lineWidth = 2;

        this.ctx.stroke();

    }

    /* ======================================
        Render
    ====================================== */

    render() {

        this.drawGlow();

        this.drawParticles();

        this.ripple();

    }

}