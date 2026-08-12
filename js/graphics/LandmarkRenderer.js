import { FINGER_TIPS, COLORS } from "../utils/constants.js";
import APP_CONFIG from "../config.js";

const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]
];

export default class LandmarkRenderer {
    constructor(canvas) {
        if (!canvas) throw new Error("LandmarkRenderer: canvas not found.");
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
        this.landmarks = [];
        this.glowColor = COLORS?.CYAN || APP_CONFIG.COLORS.primary;
    }

    update(results) { this.landmarks = results?.multiHandLandmarks || []; }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!APP_CONFIG.UI.showLandmarks || !this.landmarks.length) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(0,243,255,.68)";
        ctx.lineWidth = Math.max(1.25, w / 1100);

        for (const hand of this.landmarks) {
            ctx.beginPath();
            for (const [a, b] of HAND_CONNECTIONS) {
                const p = hand[a], q = hand[b];
                if (!p || !q) continue;
                ctx.moveTo(p.x * w, p.y * h);
                ctx.lineTo(q.x * w, q.y * h);
            }
            ctx.stroke();

            ctx.fillStyle = "rgba(238,255,255,.9)";
            for (let i = 0; i < hand.length; i++) {
                const p = hand[i];
                const radius = i === 0 ? 4 : 2.2;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = "rgba(0,255,213,.9)";
            ctx.lineWidth = 1.7;
            for (const i of FINGER_TIPS) {
                const p = hand[i];
                if (!p) continue;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, 7, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    resize() {}
    reset() { this.landmarks = []; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}
