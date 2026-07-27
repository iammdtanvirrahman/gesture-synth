import { FINGER_TIPS, COLORS } from '../utils/constants.js';

export default class LandmarkRenderer {
    constructor(canvas) {
        // ... (আগের কোড) ...
        
        // FIX: হার্ডকোড করা কালারের বদলে কনস্ট্যান্ট ব্যবহার
        this.glowColor = COLORS.CYAN; 
        
        // FIX: একাধিক হাতের জন্য অ্যারে ব্যবহার
        this.previousHands = []; 
        
        // ... (বাকি কনস্ট্রাক্টর কোড) ...
    }

    // FIX: ইনডেক্স অনুযায়ী প্রতিটি হাতের ট্রেইল আলাদাভাবে ট্র্যাক করা
    drawTrail(hand, handIndex) {
        if (!this.previousHands[handIndex]) {
            this.previousHands[handIndex] = hand.map(p => ({ ...p }));
            return;
        }

        const ctx = this.ctx;
        ctx.strokeStyle = "rgba(0,243,255,.15)";
        ctx.lineWidth = 2;

        for (let i = 0; i < hand.length; i++) {
            ctx.beginPath();
            ctx.moveTo(
                this.previousHands[handIndex][i].x * this.canvas.width,
                this.previousHands[handIndex][i].y * this.canvas.height
            );
            ctx.lineTo(
                hand[i].x * this.canvas.width,
                hand[i].y * this.canvas.height
            );
            ctx.stroke();
        }

        this.previousHands[handIndex] = hand.map(p => ({ ...p }));
    }

    // FIX: হার্ডকোড করা টিপস-এর বদলে FINGER_TIPS কনস্ট্যান্ট ব্যবহার
    drawFingerTips(hand) {
        const ctx = this.ctx;
        for (const i of FINGER_TIPS) {
            const p = hand[i];
            // ... (আগের গ্রেডিয়েন্ট এবং ড্রয়িং কোড) ...
        }
    }

    render() {
        this.clear();
        this.pulse();

        // FIX: ইনডেক্স পাস করা হচ্ছে drawTrail-এ
        this.landmarks.forEach((hand, index) => {
            this.drawTrail(hand, index);
            this.drawConnections(hand);
            this.drawPoints(hand);
            this.drawFingerTips(hand);
            this.drawEnergy(hand);
        });
    }

    reset() {
        this.landmarks = [];
        this.previousHands = []; // FIX: অ্যারে রিসেট
        this.clear();
    }
}
