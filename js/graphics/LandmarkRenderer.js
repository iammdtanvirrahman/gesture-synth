import { FINGER_TIPS, COLORS } from "../utils/constants.js";

const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17]
];

export default class LandmarkRenderer {
    constructor(canvas) {
        if (!canvas) throw new Error("LandmarkRenderer: canvas not found.");
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.landmarks = [];
        this.previousHands = [];
        this.glowColor = COLORS?.CYAN || "#00f3ff";
    }

    update(results) {
        this.landmarks = results?.multiHandLandmarks || [];
    }

    drawConnections(hand) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(0,243,255,.72)";
        ctx.lineWidth = Math.max(1.5, this.canvas.width / 900);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.glowColor;
        for (const [a,b] of HAND_CONNECTIONS) {
            const p = hand[a], q = hand[b];
            if (!p || !q) continue;
            ctx.beginPath();
            ctx.moveTo(p.x * this.canvas.width, p.y * this.canvas.height);
            ctx.lineTo(q.x * this.canvas.width, q.y * this.canvas.height);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawPoints(hand) {
        const ctx = this.ctx;
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.glowColor;
        for (let i = 0; i < hand.length; i++) {
            const p = hand[i];
            ctx.beginPath();
            ctx.arc(p.x * this.canvas.width, p.y * this.canvas.height, i === 0 ? 5 : 3.2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(235,255,255,.95)";
            ctx.fill();
        }
        ctx.restore();
    }

    drawFingerTips(hand) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(0,255,213,.95)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#00ffd5";
        for (const i of FINGER_TIPS) {
            const p = hand[i];
            if (!p) continue;
            ctx.beginPath();
            ctx.arc(p.x * this.canvas.width, p.y * this.canvas.height, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawTrail(hand, index) {
        const previous = this.previousHands[index];
        if (!previous || previous.length !== hand.length) {
            this.previousHands[index] = hand.map(p => ({ x:p.x, y:p.y }));
            return;
        }
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(0,243,255,.14)";
        ctx.lineWidth = 2;
        for (let i = 0; i < hand.length; i++) {
            ctx.beginPath();
            ctx.moveTo(previous[i].x * this.canvas.width, previous[i].y * this.canvas.height);
            ctx.lineTo(hand[i].x * this.canvas.width, hand[i].y * this.canvas.height);
            ctx.stroke();
        }
        ctx.restore();
        this.previousHands[index] = hand.map(p => ({ x:p.x, y:p.y }));
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.landmarks.forEach((hand, i) => {
            this.drawTrail(hand, i);
            this.drawConnections(hand);
            this.drawPoints(hand);
            this.drawFingerTips(hand);
        });
        if (!this.landmarks.length) this.previousHands = [];
    }

    resize() {}

    reset() {
        this.landmarks = [];
        this.previousHands = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
