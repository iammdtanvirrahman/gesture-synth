/**
 * ============================================================================
 * Gesture Engine - Chord Evaluator for Left Hand
 * ============================================================================
 */
class GestureEngine {
  constructor() {
    this.gestureRules = [
      { id: 'OPEN_PALM', name: 'C Major', icon: '✋' },
      { id: 'FIST', name: 'G Major', icon: '✊' },
      { id: 'PEACE', name: 'A Minor', icon: '✌️' },
      { id: 'POINTING', name: 'E Minor', icon: '👉' },
      { id: 'THREE_FINGERS', name: 'Cadd9', icon: '🖖' },
      { id: 'ROCK', name: 'Power Chord E', icon: '🤘' }
    ];
  }

  evaluate(landmarks) {
    if (!landmarks || landmarks.length === 0) return { id: 'OPEN_PALM', name: 'C Major', icon: '✋' };

    const wrist = landmarks[0];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const isExtended = (tip) => Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > 0.22;

    const indexExt = isExtended(indexTip);
    const middleExt = isExtended(middleTip);
    const ringExt = isExtended(ringTip);
    const pinkyExt = isExtended(pinkyTip);

    if (indexExt && middleExt && ringExt && pinkyExt) {
      return { id: 'OPEN_PALM', name: 'C Major', icon: '✋' };
    } else if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
      return { id: 'FIST', name: 'G Major', icon: '✊' };
    } else if (indexExt && middleExt && !ringExt && !pinkyExt) {
      return { id: 'PEACE', name: 'A Minor', icon: '✌️' };
    } else if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      return { id: 'POINTING', name: 'E Minor', icon: '👉' };
    } else if (indexExt && middleExt && ringExt && !pinkyExt) {
      return { id: 'THREE_FINGERS', name: 'Cadd9', icon: '🖖' };
    } else {
      return { id: 'ROCK', name: 'Power Chord E', icon: '🤘' };
    }
  }
}
