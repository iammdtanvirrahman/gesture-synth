/**
 * ============================================================================
 * Gesture Synth AI - Eric's Style Simple Auto Synth Controller
 * ============================================================================
 */
class UIController {
  constructor() {
    this.elements = {
      fps: document.getElementById('val-fps'),
      gestureTitle: document.getElementById('val-gesture'),
      audioOverlay: document.getElementById('audio-overlay'),
      btnStartSynth: document.getElementById('btn-start-synth')
    };
  }

  updateTitle(text) {
    if (this.elements.gestureTitle) {
      this.elements.gestureTitle.textContent = text;
    }
  }
}

class App {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.canvasElement = document.getElementById('output-canvas');
    this.canvasCtx = this.canvasElement.getContext('2d', { alpha: false });

    this.soundEngine = new GuitarSynthEngine();
    this.gestureEngine = new GestureEngine();
    this.ui = new UIController();

    this.isCameraRunning = false;
    this.isProcessing = false;
    this.lastChordId = '';

    this.bindEvents();
  }

  bindEvents() {
    if (!this.ui.elements.btnStartSynth) return;

    this.ui.elements.btnStartSynth.addEventListener('click', async () => {
      await this.soundEngine.init();
      if (this.ui.elements.audioOverlay) {
        this.ui.elements.audioOverlay.classList.add('hidden');
      }
      this.initMediaPipe();
    });
  }

  initMediaPipe() {
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results) => this.onResults(results));
    this.startCamera();
  }

  async startCamera() {
    if (this.isCameraRunning) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });

      this.videoElement.srcObject = stream;
      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });

      this.isCameraRunning = true;
      this.renderLoop();
    } catch (err) {
      console.error('Camera Error:', err);
    }
  }

  async renderLoop() {
    if (!this.isCameraRunning) return;

    if (this.videoElement.readyState >= 2 && !this.isProcessing) {
      this.isProcessing = true;
      try {
        await this.hands.send({ image: this.videoElement });
      } catch (e) {
        console.error(e);
      }
      this.isProcessing = false;
    }

    requestAnimationFrame(() => this.renderLoop());
  }

  onResults(results) {
    if (this.videoElement.videoWidth && 
       (this.canvasElement.width !== this.videoElement.videoWidth)) {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
    }

    const ctx = this.canvasCtx;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    // 🪞 আয়নার মতো Mirror View
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
    ctx.drawImage(results.image, 0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // হাতগুলোকে স্ক্রিনের অবস্থান অনুযায়ী ফিল্টার (Left vs Right)
      const hands = results.multiHandLandmarks.map(landmarks => {
        const avgX = landmarks.reduce((sum, pt) => sum + pt.x, 0) / landmarks.length;
        return { landmarks, screenX: 1 - avgX };
      }).sort((a, b) => a.screenX - b.screenX);

      const leftHand = hands[0]?.landmarks || null;
      const rightHand = hands[1]?.landmarks || null;

      // লাল/কমলা পয়েন্ট পয়েন্টগুলো আঁকা (Eric-এর স্টাইলে)
      if (leftHand) this.drawLandmarks(ctx, leftHand, width, height);
      if (rightHand) this.drawLandmarks(ctx, rightHand, width, height);

      // দুই হাতের ভঙ্গি মূল্যায়ন
      const chordInfo = this.gestureEngine.evaluateBothHands(leftHand, rightHand);

      // কর্ড চেঞ্জ হলে অটো সাউন্ড প্লে হবে
      if (chordInfo.id !== this.lastChordId) {
        this.lastChordId = chordInfo.id;
        if (chordInfo.id === 'SILENT') {
          this.soundEngine.stopAll();
          this.ui.updateTitle('Awaiting Gestures...');
        } else {
          this.soundEngine.playChord(chordInfo.notes);
          this.ui.updateTitle(chordInfo.displayName);
        }
      }
    } else {
      if (this.lastChordId !== 'SILENT') {
        this.lastChordId = 'SILENT';
        this.soundEngine.stopAll();
        this.ui.updateTitle('Show Hands to Play');
      }
    }

    ctx.restore();
  }

  drawLandmarks(ctx, landmarks, width, height) {
    ctx.fillStyle = '#ff4500';
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i].x * width;
      const y = landmarks[i].y * height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gestureSynthApp = new App();
});
