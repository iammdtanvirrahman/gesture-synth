/**
 * ============================================================================
 * Gesture Synth AI - Application Main Controller & Visualizer
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
    this.canvasCtx = this.canvasElement.getContext('2d');

    this.soundEngine = new GuitarSynthEngine();
    this.gestureEngine = new GestureEngine();
    this.ui = new UIController(this.gestureEngine, this.soundEngine);

    this.lastFrameTime = performance.now();
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

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    this.hands.onResults((results) => this.onResults(results));
    this.startCamera();
  }

  async startCamera() {
    if (this.isCameraRunning) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
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

    if (this.videoElement.readyState >= 2 && !this.isProcessing) {
      this.isProcessing = true;
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

    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    this.canvasCtx.drawImage(
      results.image, 0, 0, this.canvasElement.width, this.canvasElement.height
    );

    let detectedGesture = { id: 'NONE', name: 'SILENT', icon: '❓' };
    let activeChord = null;
    let handFound = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handFound = true;
      const landmarks = results.multiHandLandmarks[0];

      this.drawHandMesh(landmarks);
      detectedGesture = this.gestureEngine.evaluate(landmarks);
      activeChord = this.soundEngine.playChord(detectedGesture.id);
    } else {
      this.soundEngine.stopAll();
    }

    this.drawAudioWaveform();

    this.canvasCtx.restore();

    this.ui.updateMetrics(this.currentFps, results.multiHandedness?.[0]?.score || 0.9, handFound);
    this.ui.setActiveGesture(detectedGesture, activeChord);
  }

  drawHandMesh(landmarks) {
    drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
      color: '#00f3ff',
      lineWidth: 3
    });

    drawLandmarks(this.canvasCtx, landmarks, {
      color: '#ffffff',
      fillColor: '#ffb700',
      lineWidth: 1,
      radius: 4
    });
  }

  drawAudioWaveform() {
    const wave = this.soundEngine.getWaveformData();
    if (!wave) return;

    const ctx = this.canvasCtx;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;
    const baseline = height - 70;

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffb700';
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 12;

    const sliceWidth = width / wave.length;
    let x = 0;

    for (let i = 0; i < wave.length; i++) {
      const v = wave[i];
      const y = baseline + v * 40;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gestureSynthApp = new App();
});
