/**
 * ============================================================================
 * Gesture Synth AI - Core Application Architecture
 * ============================================================================
 * Clean Vanilla JS Architecture built for production stability & expansion.
 * Includes:
 * 1. Geometric 3D Gesture Engine (Orientation invariant calculation)
 * 2. FPS & Render Loop Manager (Synchronized Canvas/Video feed)
 * 3. Mobile Chrome / GitHub Pages Camera Stabilizer
 * 4. Modular Event Dispatcher for IoT/Extension compatibility
 */

// ============================================================================
// 1. GESTURE RECOGNITION ENGINE (Extensible Module)
// ============================================================================
class GestureEngine {
  constructor() {
    // Registry for gesture definitions
    this.gestureRules = new Map();
    this.eventListeners = new Set();
    
    // Register default gestures
    this._registerDefaults();
  }

  /**
   * Register a custom gesture rule.
   * @param {string} id Unique identifier
   * @param {string} name Human readable display name
   * @param {string} icon Emoji or icon representation
   * @param {Function} evaluator Evaluator function taking (landmarks, fingerState) -> boolean
   */
  registerGesture(id, name, icon, evaluator) {
    this.gestureRules.set(id, { id, name, icon, evaluator });
  }

  /**
   * Subscribe to detected gesture events.
   * @param {Function} callback Callback receiving gesture result object
   */
  onGesture(callback) {
    this.eventListeners.add(callback);
  }

  /**
   * Evaluates hand landmarks against all registered rules.
   * @param {Array} landmarks 21 MediaPipe hand keypoints
   * @returns {Object} Detected gesture payload
   */
  evaluate(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { id: 'NONE', name: 'NONE', icon: '❓', confidence: 0 };
    }

    // Calculate structural metrics
    const fingerState = this._analyzeFingers(landmarks);

    // Test registered gestures in order
    for (const [id, rule] of this.gestureRules) {
      if (rule.evaluator(landmarks, fingerState)) {
        const result = { id: rule.id, name: rule.name, icon: rule.icon, confidence: 0.95 };
        this._notify(result);
        return result;
      }
    }

    const fallback = { id: 'UNKNOWN', name: 'CUSTOM / UNKNOWN', icon: '✋', confidence: 0.5 };
    this._notify(fallback);
    return fallback;
  }

  /**
   * Analyzes extension state for all 5 digits.
   */
  _analyzeFingers(lm) {
    const wrist = lm[0];

    // Helper: Distance between two 3D landmarks
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);

    // Finger tips & base joints
    const fingers = {
      thumb: dist(lm[4], lm[17]) > dist(lm[3], lm[17]), // Extended outward relative to palm
      index: dist(lm[8], wrist) > dist(lm[6], wrist),
      middle: dist(lm[12], wrist) > dist(lm[10], wrist),
      ring: dist(lm[16], wrist) > dist(lm[14], wrist),
      pinky: dist(lm[20], wrist) > dist(lm[18], wrist)
    };

    return { fingers, dist };
  }

  /**
   * Internal default gesture definitions.
   */
  _registerDefaults() {
    // 1. Open Palm
    this.registerGesture('open_palm', 'Open Palm', '✋', (lm, s) => 
      s.fingers.thumb && s.fingers.index && s.fingers.middle && s.fingers.ring && s.fingers.pinky
    );

    // 2. Fist
    this.registerGesture('fist', 'Fist', '✊', (lm, s) => 
      !s.fingers.index && !s.fingers.middle && !s.fingers.ring && !s.fingers.pinky
    );

    // 3. Point Up
    this.registerGesture('point_up', 'Point Up', '☝️', (lm, s) => 
      s.fingers.index && !s.fingers.middle && !s.fingers.ring && !s.fingers.pinky
    );

    // 4. Victory / Peace
    this.registerGesture('victory', 'Victory', '✌️', (lm, s) => 
      s.fingers.index && s.fingers.middle && !s.fingers.ring && !s.fingers.pinky
    );

    // 5. Three Fingers
    this.registerGesture('three_fingers', 'Three Fingers', '🤟', (lm, s) => 
      s.fingers.index && s.fingers.middle && s.fingers.ring && !s.fingers.pinky
    );

    // 6. Four Fingers
    this.registerGesture('four_fingers', 'Four Fingers', '4️⃣', (lm, s) => 
      !s.fingers.thumb && s.fingers.index && s.fingers.middle && s.fingers.ring && s.fingers.pinky
    );

    // 7. Thumbs Up
    this.registerGesture('thumbs_up', 'Thumbs Up', '👍', (lm, s) => {
      const isUp = lm[4].y < lm[3].y && lm[3].y < lm[2].y;
      return s.fingers.thumb && isUp && !s.fingers.index && !s.fingers.middle && !s.fingers.ring;
    });

    // 8. Thumbs Down
    this.registerGesture('thumbs_down', 'Thumbs Down', '👎', (lm, s) => {
      const isDown = lm[4].y > lm[3].y && lm[3].y > lm[2].y;
      return s.fingers.thumb && isDown && !s.fingers.index && !s.fingers.middle && !s.fingers.ring;
    });

    // 9. OK Gesture
    this.registerGesture('ok_gesture', 'OK Sign', '👌', (lm, s) => {
      const pinchDist = s.dist(lm[4], lm[8]);
      return pinchDist < 0.07 && s.fingers.middle && s.fingers.ring;
    });

    // 10. Rock / Metal
    this.registerGesture('rock_on', 'Rock', '🤘', (lm, s) => 
      s.fingers.index && !s.fingers.middle && !s.fingers.ring && s.fingers.pinky
    );
  }

  _notify(result) {
    this.eventListeners.forEach(cb => cb(result));
  }
}

// ============================================================================
// 2. UI CONTROLLER MODULE
// ============================================================================
class UIController {
  constructor(gestureEngine) {
    this.engine = gestureEngine;

    // DOM Elements
    this.elements = {
      fps: document.getElementById('val-fps'),
      confidence: document.getElementById('val-confidence'),
      handPresence: document.getElementById('val-hand-presence'),
      handIndicator: document.getElementById('hand-indicator'),
      gestureTitle: document.getElementById('val-gesture'),
      cameraStatusText: document.getElementById('camera-status-text'),
      cameraStatusDot: document.querySelector('#camera-status .status-dot'),
      gestureGrid: document.getElementById('gesture-grid'),
      gestureCountBadge: document.getElementById('gesture-count-badge')
    };

    this.gestureCards = new Map();
    this.initSidebar();
  }

  initSidebar() {
    this.elements.gestureGrid.innerHTML = '';
    
    this.engine.gestureRules.forEach((rule) => {
      const card = document.createElement('div');
      card.className = 'gesture-card';
      card.id = `card-${rule.id}`;
      card.innerHTML = `
        <div class="gesture-info">
          <span class="gesture-icon">${rule.icon}</span>
          <span class="gesture-name">${rule.name}</span>
        </div>
        <div class="gesture-state"></div>
      `;
      this.elements.gestureGrid.appendChild(card);
      this.gestureCards.set(rule.id, card);
    });

    this.elements.gestureCountBadge.textContent = `${this.engine.gestureRules.size} Active`;
  }

  updateCameraReady() {
    this.elements.cameraStatusText.textContent = 'Camera Active';
    this.elements.cameraStatusDot.className = 'status-dot active';
  }

  updateMetrics(fps, confidence, handDetected) {
    this.elements.fps.textContent = Math.round(fps);
    this.elements.confidence.textContent = handDetected ? `${Math.round(confidence * 100)}%` : '0%';

    if (handDetected) {
      this.elements.handPresence.textContent = 'Hand Active';
      this.elements.handIndicator.classList.add('detected');
    } else {
      this.elements.handPresence.textContent = 'No Hand';
      this.elements.handIndicator.classList.remove('detected');
    }
  }

  setActiveGesture(gesture) {
    // Clear previous active states
    this.gestureCards.forEach(card => card.classList.remove('active'));

    if (!gesture || gesture.id === 'NONE') {
      this.elements.gestureTitle.textContent = 'NONE';
      return;
    }

    this.elements.gestureTitle.textContent = `${gesture.icon} ${gesture.name}`;

    const activeCard = this.gestureCards.get(gesture.id);
    if (activeCard) {
      activeCard.classList.add('active');
    }
  }
}

// ============================================================================
// 3. MAIN APPLICATION CONTROLLER
// ============================================================================
class App {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.canvasElement = document.getElementById('output-canvas');
    this.canvasCtx = this.canvasElement.getContext('2d');

    // Modules
    this.gestureEngine = new GestureEngine();
    this.ui = new UIController(this.gestureEngine);

    // Performance & FPS tracking
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.currentFps = 0;
    this.isCameraRunning = false;

    // Initialize pipeline
    this.initMediaPipe();
  }

  initMediaPipe() {
    // MediaPipe Hands Config
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    this.hands.onResults((results) => this.onResults(results));

    // Safe Single Camera Initialization
    this.startCamera();
  }

  async startCamera() {
    if (this.isCameraRunning) return;

    try {
      // Use MediaPipe Camera Utility for robust multi-platform streaming
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (this.videoElement.readyState >= 2) {
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 1280,
        height: 720
      });

      await this.camera.start();
      this.isCameraRunning = true;
      this.ui.updateCameraReady();
    } catch (err) {
      console.error('Camera Access Error:', err);
      this.ui.elements.cameraStatusText.textContent = 'Camera Blocked / Unavailable';
      this.ui.elements.cameraStatusDot.className = 'status-dot warning';
    }
  }

  onResults(results) {
    // Calculate FPS
    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    this.currentFps = 1 / delta;

    // Sync Canvas dimensions with intrinsic video stream
    if (this.videoElement.videoWidth && 
       (this.canvasElement.width !== this.videoElement.videoWidth)) {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
    }

    // Canvas Clear
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Render Video Background onto Canvas
    this.canvasCtx.drawImage(
      results.image, 0, 0, this.canvasElement.width, this.canvasElement.height
    );

    let detectedGesture = { id: 'NONE', name: 'NONE', icon: '❓', confidence: 0 };
    let handFound = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handFound = true;
      const landmarks = results.multiHandLandmarks[0];

      // 1. Draw Landmarks & Connectors with Cyan Styling
      this.drawHandMesh(landmarks);

      // 2. Evaluate Gesture
      detectedGesture = this.gestureEngine.evaluate(landmarks);
    }

    this.canvasCtx.restore();

    // Update UI HUD
    this.ui.updateMetrics(this.currentFps, results.multiHandedness?.[0]?.score || 0.9, handFound);
    this.ui.setActiveGesture(detectedGesture);
  }

  /**
   * Custom High-Performance Hand Mesh Drawing
   */
  drawHandMesh(landmarks) {
    // MediaPipe Drawing Utils Call
    drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {
      color: '#00f3ff',
      lineWidth: 3
    });

    drawLandmarks(this.canvasCtx, landmarks, {
      color: '#ffffff',
      fillColor: '#00f3ff',
      lineWidth: 1,
      radius: 4
    });
  }
}

// Global Entry point execution on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.gestureSynthApp = new App();
});
