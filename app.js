/**
 * ============================================================================
 * Gesture Synth AI - Final Mobile Performance & Audio Fixed Engine
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
    if (!this.elements.gestureGrid) return;
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
    if (this.elements.cameraStatusText) this.elements.cameraStatusText.textContent = 'Virtual Guitar Active';
    if (this.elements.cameraStatusDot) this.elements.cameraStatusDot.className = 'status-dot active';
  }

  updateMetrics(fps, confidence, handDetected) {
    if (this.elements.fps) this.elements.fps.textContent = Math.round(fps);
    if (this.elements.confidence) this.elements.confidence.textContent = handDetected ? `${Math.round(confidence * 100)}%` : '0%';

    if (this.elements.handPresence && this.elements.handIndicator) {
      if (handDetected) {
        this.elements.handPresence.textContent = 'Hand Strumming';
        this.elements.handIndicator.classList.add('detected');
      } else {
        this.elements.handPresence.textContent = 'No Hand';
        this.elements.handIndicator.classList.remove('detected');
      }
    }
  }

  setActiveGesture(gesture, chord) {
    this.gestureCards.forEach(card => card.classList.remove('active'));

    if (!gesture || gesture.id === 'NONE' || !chord) {
      if (this.elements.gestureTitle) this.elements.gestureTitle.textContent = 'SILENT';
      return;
    }

    if (this.elements.gestureTitle) this.elements.gestureTitle.textContent = `${gesture.icon} ${chord.name}`;

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
    this.currentFps = 0;
    this.isCameraRunning = false;
    this.isProcessing = false;
    this.lastActiveGestureId = null;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.ui.elements.btnStartSynth) return;

    this.ui.elements.btnStartSynth.addEventListener('click', async () => {
      try {
        // Mobile Web Audio Context Unlock
        if (window.Tone) {
          await Tone.start();
          if (Tone.context.state !== 'running') {
            await Tone.context.resume();
          }
        }
      } catch (e) {
        console.error('Tone Unlock Error:', e);
      }

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

    // Mobile FPS and Speed Boost
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.4,
      minTrackingConfidence: 0.4
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

      // 320x240 Resolution: Light-weight for mobile GPU/CPU
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 320 }, 
          height: { ideal: 240 },
          frameRate: { max: 24 }
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
      if (this.ui.elements.cameraStatusText) {
        this.ui.elements.cameraStatusText.textContent = 'Camera Denied';
      }
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

      this.drawFastHandMesh(ctx, landmarks, width, height);

      detectedGesture = this.gestureEngine.evaluate(landmarks);

      // Audio Trigger Debounce
      if (detectedGesture.id !== this.lastActiveGestureId) {
        this.lastActiveGestureId = detectedGesture.id;
        activeChord = this.soundEngine.playChord(detectedGesture.id);
      } else {
        activeChord = this.soundEngine.chordMap[detectedGesture.id] || null;
      }
    } else {
      if (this.lastActiveGestureId !== null) {
        this.lastActiveGestureId = null;
        this.soundEngine.stopAll();
      }
    }

    this.drawAudioWaveform(ctx, width, height);
    ctx.restore();

    this.ui.updateMetrics(this.currentFps, results.multiHandedness?.[0]?.score || 0.8, handFound);
    this.ui.setActiveGesture(detectedGesture, activeChord);
  }

  drawFastHandMesh(ctx, landmarks, width, height) {
    ctx.fillStyle = '#ffb700';
    for (let i = 0; i < landmarks.length; i += 2) {
      const x = landmarks[i].x * width;
      const y = landmarks[i].y * height;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  drawAudioWaveform(ctx, width, height) {
    const wave = this.soundEngine.getWaveformData();
    if (!wave) return;

    const baseline = height - 20;
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f3ff';

    const sliceWidth = width / wave.length;
    let x = 0;

    for (let i = 0; i < wave.length; i += 4) {
      const v = wave[i];
      const y = baseline + v * 15;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth * 4;
    }

    ctx.stroke();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gestureSynthApp = new App();
});
