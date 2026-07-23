/**
 * ============================================================================
 * Gesture Synth AI - Virtual Instrument Sound & Gesture Engine
 * ============================================================================
 */

// ============================================================================
// 1. SOUND & AUDIO SYNTH ENGINE (Tone.js Integration)
// ============================================================================
class SoundEngine {
  constructor() {
    this.synth = null;
    this.waveform = null;
    this.currentChordId = null;
    this.isAudioReady = false;

    // Gesture ID -> Musical Chord Definition
    this.chordMap = {
      'fist': { name: 'C Major', notes: ['C3', 'E3', 'G3', 'C4'] },
      'point_up': { name: 'D Minor', notes: ['D3', 'F3', 'A3', 'D4'] },
      'victory': { name: 'E Minor', notes: ['E3', 'G3', 'B3', 'E4'] },
      'three_fingers': { name: 'F Major', notes: ['F3', 'A3', 'C4', 'F4'] },
      'four_fingers': { name: 'G Major', notes: ['G3', 'B3', 'D4', 'G4'] },
      'open_palm': { name: 'A Minor', notes: ['A3', 'C4', 'E4', 'A4'] },
      'rock_on': { name: 'E Power Chord', notes: ['E2', 'B2', 'E3', 'G#3'] },
      'ok_gesture': { name: 'High C Strum', notes: ['C4', 'E4', 'G4', 'C5'] }
    };
  }

  async init() {
    await Tone.start();

    // Guitar / Plucked String Polyphonic Synthesizer
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005, // Fast pluck
        decay: 1.2,    // String vibration decay
        sustain: 0.1,
        release: 1.2
      }
    }).toDestination();

    // Reverb & Delay Effects
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    this.synth.connect(reverb);

    // Audio Waveform Analyzer for Visualizer
    this.waveform = new Tone.Waveform(128);
    Tone.Destination.connect(this.waveform);

    this.isAudioReady = true;
  }

  playChord(gestureId) {
    if (!this.isAudioReady) return null;

    if (this.currentChordId === gestureId) return this.chordMap[gestureId];

    // Release active notes
    this.synth.releaseAll();

    const chord = this.chordMap[gestureId];
    if (chord) {
      // Trigger new chord
      this.synth.triggerAttack(chord.notes);
      this.currentChordId = gestureId;
      return chord;
    } else {
      this.currentChordId = null;
      return null;
    }
  }

  stopAll() {
    if (this.isAudioReady && this.currentChordId) {
      this.synth.releaseAll();
      this.currentChordId = null;
    }
  }

  getWaveformData() {
    return this.waveform ? this.waveform.getValue() : null;
  }
}

// ============================================================================
// 2. GESTURE RECOGNITION ENGINE
// ============================================================================
class GestureEngine {
  constructor() {
    this.gestureRules = new Map();
    this._registerDefaults();
  }

  registerGesture(id, name, icon, evaluator) {
    this.gestureRules.set(id, { id, name, icon, evaluator });
  }

  evaluate(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { id: 'NONE', name: 'SILENT', icon: '❓' };
    }

    const fingerState = this._analyzeFingers(landmarks);

    for (const [id, rule] of this.gestureRules) {
      if (rule.evaluator(landmarks, fingerState)) {
        return { id: rule.id, name: rule.name, icon: rule.icon };
      }
    }

    return { id: 'NONE', name: 'SILENT', icon: '✋' };
  }

  _analyzeFingers(lm) {
    const wrist = lm[0];
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);

    const fingers = {
      thumb: dist(lm[4], lm[17]) > dist(lm[3], lm[17]),
      index: dist(lm[8], wrist) > dist(lm[6], wrist),
      middle: dist(lm[12], wrist) > dist(lm[10], wrist),
      ring: dist(lm[16], wrist) > dist(lm[14], wrist),
      pinky: dist(lm[20], wrist) > dist(lm[18], wrist)
    };

    return { fingers, dist };
  }

  _registerDefaults() {
    this.registerGesture('open_palm', 'A Minor', '✋', (lm, s) => 
      s.fingers.thumb && s.fingers.index && s.fingers.middle && s.fingers.ring && s.fingers.pinky
    );

    this.registerGesture('fist', 'C Major', '✊', (lm, s) => 
      !s.fingers.index && !s.fingers.middle && !s.fingers.ring && !s.fingers.pinky
    );

    this.registerGesture('point_up', 'D Minor', '☝️', (lm, s) => 
      s.fingers.index && !s.fingers.middle && !s.fingers.ring && !s.fingers.pinky
    );

    this.registerGesture('victory', 'E Minor', '✌️', (lm, s) => 
      s.fingers.index && s.fingers.middle && !s.fingers.ring && !s.fingers.pinky
    );

    this.registerGesture('three_fingers', 'F Major', '🤟', (lm, s) => 
      s.fingers.index && s.fingers.middle && s.fingers.ring && !s.fingers.pinky
    );

    this.registerGesture('four_fingers', 'G Major', '4️⃣', (lm, s) => 
      !s.fingers.thumb && s.fingers.index && s.fingers.middle && s.fingers.ring && s.fingers.pinky
    );

    this.registerGesture('rock_on', 'E Power Chord', '🤘', (lm, s) => 
      s.fingers.index && !s.fingers.middle && !s.fingers.ring && s.fingers.pinky
    );

    this.registerGesture('ok_gesture', 'High C Strum', '👌', (lm, s) => {
      const pinchDist = s.dist(lm[4], lm[8]);
      return pinchDist < 0.07 && s.fingers.middle && s.fingers.ring;
    });
  }
}

// ============================================================================
// 3. UI CONTROLLER MODULE
// ============================================================================
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
    this.elements.cameraStatusText.textContent = 'Synth Ready';
    this.elements.cameraStatusDot.className = 'status-dot active';
  }

  updateMetrics(fps, confidence, handDetected) {
    this.elements.fps.textContent = Math.round(fps);
    this.elements.confidence.textContent = handDetected ? `${Math.round(confidence * 100)}%` : '0%';

    if (handDetected) {
      this.elements.handPresence.textContent = 'Playing Hand';
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

// ============================================================================
// 4. MAIN APPLICATION
// ============================================================================
class App {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.canvasElement = document.getElementById('output-canvas');
    this.canvasCtx = this.canvasElement.getContext('2d');

    this.soundEngine = new SoundEngine();
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

    // Draw Video Feed
    this.canvasCtx.drawImage(
      results.image, 0, 0, this.canvasElement.width, this.canvasElement.height
    );

    let detectedGesture = { id: 'NONE', name: 'SILENT', icon: '❓' };
    let activeChord = null;
    let handFound = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handFound = true;
      const landmarks = results.multiHandLandmarks[0];

      // Draw Hand Landmarks
      this.drawHandMesh(landmarks);

      // Recognize Gesture & Play Audio Chord
      detectedGesture = this.gestureEngine.evaluate(landmarks);
      activeChord = this.soundEngine.playChord(detectedGesture.id);
    } else {
      this.soundEngine.stopAll();
    }

    // Draw Audio Waveform (Like in reel screenshot)
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

  /**
   * Draws dynamic audio visualizer line across bottom of video (as shown in reel)
   */
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
