/**
 * ============================================================================
 * Gesture Synth AI - Main Controller with Mirrored Camera (Left=Chord, Right=Pluck)
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
    if (this.elements.cameraStatusText) this.elements.cameraStatusText.textContent = 'Mirrored Guitar Ready';
    if (this.elements.cameraStatusDot) this.elements.cameraStatusDot.className = 'status-dot active';
  }

  updateMetrics(fps, confidence, handsCount) {
    if (this.elements.fps) this.elements.fps.textContent = Math.round(fps);
    if (this.elements.confidence) this.elements.confidence.textContent = `${Math.round(confidence * 100)}%`;

    if (this.elements.handPresence && this.elements.handIndicator) {
      if (handsCount > 0) {
        this.elements.handPresence.textContent = `${handsCount} Hand(s) Active`;
        this.elements.handIndicator.classList.add('detected');
      } else {
        this.elements.handPresence.textContent = 'Show 2 Hands';
        this.elements.handIndicator.classList.remove('detected');
      }
    }
  }

  setActiveGesture(gestureId, chordName, isPlucking) {
    this.gestureCards.forEach(card => card.classList.remove('active'));

    if (this.elements.gestureTitle) {
      if (isPlucking) {
        this.elements.gestureTitle.textContent = `🎸 PLUCK! [${chordName}]`;
      } else {
        this.elements.gestureTitle.textContent = `Chord: ${chordName}`;
      }
    }

    const activeCard = this.gestureCards.get(gestureId);
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

    this.currentSelectedChordId = 'OPEN_PALM';
    this.lastPluckTime = 0;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.ui.elements.btnStartSynth) return;

    this.ui.elements.btnStartSynth.addEventListener('click', async () => {
      try {
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

    this.hands.setOptions({
      maxNumHands: 2,
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
      console.error('Camera Error:', err);
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

    // 🪞 MIRROR EFFECT START
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);

    // Draw mirrored camera feed
    ctx.drawImage(results.image, 0, 0, width, height);

    let chordName = 'C Major';
    let isPlucked = false;
    let handsCount = 0;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handsCount = results.multiHandLandmarks.length;

      // Sort hands based on mirrored screen X position
      // Screen Left = smallest screenX, Screen Right = largest screenX
      const hands = results.multiHandLandmarks.map(landmarks => {
        const avgX = landmarks.reduce((sum, pt) => sum + pt.x, 0) / landmarks.length;
        const screenX = 1 - avgX; // Calculate position on mirrored screen
        return { landmarks, screenX };
      }).sort((a, b) => a.screenX - b.screenX);

      // Hand on Screen Left (Your physical Left Hand) = CHORD HAND
      const leftHandLandmarks = hands[0].landmarks;
      const detectedGesture = this.gestureEngine.evaluate(leftHandLandmarks);
      this.currentSelectedChordId = detectedGesture.id;
      chordName = detectedGesture.name;

      this.drawHandMesh(ctx, leftHandLandmarks, width, height, '#00f3ff');

      // Hand on Screen Right (Your physical Right Hand) = PLUCK HAND
      if (hands.length > 1) {
        const rightHandLandmarks = hands[1].landmarks;
        this.drawHandMesh(ctx, rightHandLandmarks, width, height, '#ffb700');

        // Distance between Thumb Tip (4) and Index Tip (8)
        const thumbTip = rightHandLandmarks[4];
        const indexTip = rightHandLandmarks[8];
        const pinchDistance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        // Pinch trigger (< 0.05) & cooldown (250ms)
        if (pinchDistance < 0.05 && (now - this.lastPluckTime > 250)) {
          this.soundEngine.strumChord(this.currentSelectedChordId);
          this.lastPluckTime = now;
          isPlucked = true;
        }
      }
    }

    ctx.restore(); // 🪞 MIRROR EFFECT END

    // Draw Waveform in normal orientation
    ctx.save();
    this.drawAudioWaveform(ctx, width, height);
    ctx.restore();

    this.ui.updateMetrics(this.currentFps, results.multiHandedness?.[0]?.score || 0.8, handsCount);
    this.ui.setActiveGesture(this.currentSelectedChordId, chordName, isPlucked);
  }

  drawHandMesh(ctx, landmarks, width, height, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < landmarks.length; i += 3) {
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
