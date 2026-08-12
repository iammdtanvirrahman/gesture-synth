import APP_CONFIG from "../config.js";

export class MediaPipeManager {
    constructor(video) {
        if (!video) throw new Error("MediaPipeManager: video element not found.");
        this.video = video;
        this.hands = null;
        this.camera = null;
        this.onResultsCallback = null;
        this.ready = false;
        this.initializing = false;
        this.frameReq = null;
        this.sending = false;
        this.stopped = false;
        this.lastInference = 0;
        this.minFrameGap = 1000 / APP_CONFIG.PERFORMANCE.inferenceFps;
    }

    async initialize() {
        if (this.ready || this.initializing) return;
        this.initializing = true;
        this.stopped = false;
        try {
            if (typeof Hands === "undefined") throw new Error("MediaPipe Hands library failed to load.");

            this.hands = new Hands({
                locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });
            this.hands.setOptions({
                maxNumHands: APP_CONFIG.MAX_HANDS,
                modelComplexity: 0,
                minDetectionConfidence: APP_CONFIG.DETECTION.minHandDetectionConfidence,
                minTrackingConfidence: APP_CONFIG.DETECTION.minTrackingConfidence
            });
            this.hands.onResults(results => this.onResultsCallback?.(results));

            if (!this.video.srcObject) {
                if (typeof Camera === "undefined") throw new Error("MediaPipe Camera Utils failed to load.");
                this.camera = new Camera(this.video, {
                    onFrame: async () => this.sendFrame(),
                    width: APP_CONFIG.CAMERA.width,
                    height: APP_CONFIG.CAMERA.height,
                    facingMode: APP_CONFIG.CAMERA.facingMode
                });
                await this.camera.start();
            } else {
                this.frameReq = requestAnimationFrame(this.frameLoop);
            }

            this.ready = true;
        } catch (error) {
            this.stop();
            throw error;
        } finally {
            this.initializing = false;
        }
    }

    frameLoop = async now => {
        if (this.stopped || !this.hands) return;
        if (now - this.lastInference >= this.minFrameGap) await this.sendFrame(now);
        if (!this.stopped) this.frameReq = requestAnimationFrame(this.frameLoop);
    };

    async sendFrame(now = performance.now()) {
        if (!this.hands || this.sending || this.video.readyState < 2) return;
        if (now - this.lastInference < this.minFrameGap) return;
        this.lastInference = now;
        this.sending = true;
        try { await this.hands.send({ image: this.video }); }
        catch (error) { if (APP_CONFIG.DEBUG) console.warn("MediaPipe frame skipped:", error); }
        finally { this.sending = false; }
    }

    onResults(callback) { this.onResultsCallback = callback; }

    async restart() { this.stop(); await this.initialize(); }

    stop() {
        this.stopped = true;
        if (this.frameReq) cancelAnimationFrame(this.frameReq);
        this.frameReq = null;
        try { this.camera?.stop?.(); } catch {}
        try { this.hands?.close?.(); } catch {}
        this.camera = null;
        this.hands = null;
        this.ready = false;
        this.sending = false;
    }

    isReady() { return this.ready; }
}
