/**
 * ============================================================================
 * Gesture Synth AI - Gesture Recognition Engine
 * ============================================================================
 */
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
