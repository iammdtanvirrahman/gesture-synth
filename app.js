/**
 * ============================================================================
 * Fast & Smooth Controller with Strict Hand Locking
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
      modelComplexity: 0, // ফাস্ট পারফর্ম্যান্সের জন্য ০
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => this.onResults(results));
    this.startCamera();
  }

  async startCamera() {
    if (this.isCameraRunning) return;

    try {
      // ৩২০x২৪০ রেজোলিউশন ল্যাগ একদম দূর করে দেয়
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240, frameRate: { max: 30 } },
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

    // 🪞 আয়নার মতো রেন্ডার
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
    ctx.drawImage(results.image, 0, 0, width, height);

    let leftHand = null;
    let rightHand = null;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // মিডিয়াপাইপের লেবেল অনুযায়ী বাম ও ডান হাত আলাদা করা
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const label = results.multiHandedness[index]?.label;
        // মিররড মোডে MediaPipe 'Left' = আপনার ডান হাত, 'Right' = আপনার বাম হাত
        if (label === 'Right') {
          leftHand = landmarks; // Physical Left Hand
        } else {
          rightHand = landmarks; // Physical Right Hand
        }
      });

      // হাত আঁকা (বাম হাত = সায়ান, ডান হাত = কমলা)
      if (leftHand) this.drawLandmarks(ctx, leftHand, width, height, '#00f3ff');
      if (rightHand) this.drawLandmarks(ctx, rightHand, width, height, '#ff8800');

      const chordInfo = this.gestureEngine.evaluateBothHands(leftHand, rightHand);

      if (chordInfo.id !== this.lastChordId) {
        this.lastChordId = chordInfo.id;
        if (chordInfo.id === 'SILENT') {
          this.soundEngine.stopAll();
          this.ui.updateTitle('🖐 Show Left Hand for Root Note');
        } else {
          this.soundEngine.playChord(chordInfo.id, chordInfo.notes);
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

  drawLandmarks(ctx, landmarks, width, height, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i].x * width;
      const y = landmarks[i].y * height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gestureSynthApp = new App();
});
