/**
 * ============================================================================
 * Gesture Synth AI - Application Main Controller & Visualizer (Lag Fixed)
 * ============================================================================
 */
class UIController {
  constructor(gestureEngine, soundEngine) {
    this.engine = gestureEngine;
    this.soundEngine = soundEngine;

    this.elements = {
      fps: document.getElementById('val-fps'),
      confidence: document.getElementById('val-confidence'),
      handPresence: document.getElementById('val-hand-presence'),
      handIndicator: document.getElementById('hand-indicator'),
      gestureTitle: document.getElementById('val-gesture'),
      cameraStatusText: document.getElementById('camera-status-text'),
      cameraStatusDot: document.querySelector('#camera-status .status-dot'),
      gestureGrid: document.getElementById('gesture-grid'),
      audioOverlay: document.getElementById('audio-overlay'),
      btnStartSynth: document.getElementById('btn-start-synth')
    };

    this.gestureCards = new Map();
    this.initSidebar();
  }

  initSidebar() {
    this.elements.gestureGrid.innerHTML = '';
    
    this.engine.gestureRules.forEach((rule) => {
      const chordInfo = this.soundEngine.chordMap[rule.id] || { name: 'N/A' };
      const card = document.createElement('div');
      card.className = 'gesture-card';
      card.id = `card-${rule.id}`;
      card.innerHTML = `
        <div class="gesture-info">
          <span class="gesture-icon">${rule.icon}</span>
          <span class="gesture-name">${rule.name}</span>
        </div>
        <span class="gesture-chord">${chordInfo.name}</span>
      `;
      this.elements.gestureGrid.appendChild(card);
      this.gestureCards.set(rule.id, card);
    });
  }

  updateCameraReady() {
    this.elements.cameraStatusText.textContent = 'Virtual Guitar Active';
    this.elements.cameraStatusDot.className = 'status-dot active';
  }

  updateMetrics(fps, confidence, handDetected) {
    this.elements.fps.textContent = Math.round(fps);
    this.elements.confidence.textContent = handDetected ? `${Math.round(confidence * 100)}%` : '0%';

    if (handDetected) {
      this.elements.handPresence.textContent = 'Hand Strumming';
      this.elements.handIndicator.classList.add('detected');
    } else {
      this.elements.handPresence.textContent = 'No Hand';
      this.elements.handIndicator.classList.remove('detected');
    }
  }

  setActiveGesture(gesture, chord) {
    this.gestureCards.forEach(card => card.classList.remove('active'));

    if (!gesture || gesture.id === 'NONE' || !chord) {
      this.elements.gestureTitle.textContent = 'SILENT';
      return;
    }

    this.elements.gestureTitle.textContent = `${gesture.icon} ${chord.name}`;

    const activeCard = this.gestureCards.get(gesture.id);
    if (activeCard) {
      activeCard.classList.add('active');
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
    this.ui = new UIController(this.gestureEngine, this.soundEngine);

    this.lastFrameTime = performance.now();
    this.lastProcessTime = 0;
    this.currentFps = 0;
    this.isCameraRunning = false;
    this.isProcessing = false;

    this.bindEvents();
  }

  bindEvents() {
    this.ui.elements.btnStartSynth.addEventListener('click', async () => {
      await this.soundEngine.init();
      this.ui.elements.audioOverlay.classList.add('hidden');
      this.initMediaPipe();
    });
  }

  initMediaPipe() {
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    });

    // Lite Model for Mobile Speed
    this.hands.setOptions({
      maxNumHands: 1,
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
      if (this.ui.elements.cameraStatusText) {
        this.ui.elements.cameraStatusText.textContent = 'Connecting Camera...';
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 480 }, 
          height: { ideal: 360 } 
        },
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
      this.ui.updateCameraReady();
      this.renderLoop();
    } catch (err) {
      console.error('Camera Access Error:', err);
    }
  }

  async renderLoop() {
    if (!this.isCameraRunning) return;

    const now = performance.now();
    
    // Throttling: AI প্রসেসিং প্রতি ৫০ মিলি-সেকেন্ডে একবার হবে (Max 20 AI FPS)
    // এর ফলে সিপিইউ ফ্রি থাকবে এবং ভিডিও আটকাবে না
    if (this.videoElement.readyState >= 2 && !this.isProcessing && (now - this.lastProcessTime > 50)) {
      this.isProcessing = true;
      this.lastProcessTime = now;
      await this.hands.send({ image: this.videoElement });
      this.isProcessing = false;
    }

    requestAnimationFrame(() => this.renderLoop());
  }

  onResults(results) {
    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    if (delta > 0) this.currentFps = 1 / delta;

    if (this.videoElement.videoWidth && 
       (this.canvasElement.width !== this.videoElement.videoWidth)) {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
    }

    const ctx = this.canvasCtx;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    ctx.save();
    ctx.drawImage(results.image, 0, 0, width, height);

    let detectedGesture = { id: 'NONE', name: 'SILENT', icon: '❓' };
    let activeChord = null;
    let handFound = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handFound = true;
      const landmarks = results.multiHandLandmarks[0];

      // Ultra-fast Light Hand Draw
      this.drawFastHandMesh(ctx, landmarks, width, height);

      detectedGesture = this.gestureEngine.evaluate(landmarks);
      activeChord = this.soundEngine.playChord(detectedGesture.id);
    } else {
      this.soundEngine.stopAll();
    }

    // Fast Audio Waveform
    this.drawAudioWaveform(ctx, width, height);

    ctx.restore();

    this.ui.updateMetrics(this.currentFps, results.multiHandedness?.[0]?.score || 0.9, handFound);
    this.ui.setActiveGesture(detectedGesture, activeChord);
  }

  // মিডিয়াপাইপের ভারী ড্রয়িং উঠিয়ে দিয়ে একদম হালকা ড্রয়িং বসানো হয়েছে
  drawFastHandMesh(ctx, landmarks, width, height) {
    ctx.fillStyle = '#ffb700';
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i].x * width;
      const y = landmarks[i].y * height;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
  }

  drawAudioWaveform(ctx, width, height) {
    const wave = this.soundEngine.getWaveformData();
    if (!wave) return;

    const baseline = height - 50;
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f3ff'; // Glow blur রিমুভ করা হয়েছে যাতে স্পিড ৫ গুণ বাড়ে

    const sliceWidth = width / wave.length;
    let x = 0;

    for (let i = 0; i < wave.length; i += 2) { // Skip alternate samples for performance
      const v = wave[i];
      const y = baseline + v * 30;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth * 2;
    }

    ctx.stroke();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gestureSynthApp = new App();
});
