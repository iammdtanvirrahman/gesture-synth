/**
 * ============================================================================
 * Stabilized Gesture Engine (Distinct Left vs Right Hand Roles)
 * ============================================================================
 */
class GestureEngine {
  constructor() {
    this.history = [];
    this.historySize = 3; // হাত কাঁপা এড়াতে স্ট্যাবিলাইজার buffer
  }

  countFingers(landmarks) {
    if (!landmarks || landmarks.length === 0) return 0;

    const wrist = landmarks[0];
    const fingerTips = [8, 12, 16, 20];
    let count = 0;

    fingerTips.forEach(tipIdx => {
      if (landmarks[tipIdx].y < landmarks[tipIdx - 2].y) count++;
    });

    // Thumb check
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    if (Math.abs(thumbTip.x - wrist.x) > Math.abs(thumbMcp.x - wrist.x)) {
      count++;
    }

    return count;
  }

  evaluateBothHands(leftHandLandmarks, rightHandLandmarks) {
    const leftFingers = this.countFingers(leftHandLandmarks);
    const rightFingers = this.countFingers(rightHandLandmarks);

    if (leftFingers === 0 && rightFingers === 0) {
      return { id: 'SILENT', displayName: '🖐 Show Left Hand for Root Note', notes: [] };
    }

    // 🔴 1. BISTO LEFT HAND = Root Note Selector
    const rootMap = { 1: 'C', 2: 'D', 3: 'E', 4: 'F', 5: 'G' };
    const root = rootMap[leftFingers] || 'C';

    // 🔵 2. BISTO RIGHT HAND = Modifier Selector
    let modifierName = 'Major';
    let type = 'major';
    let octaveShift = 0;

    if (rightFingers === 2) {
      modifierName = 'Major (-8ve)';
      octaveShift = -1;
    } else if (rightFingers === 3) {
      modifierName = 'Minor';
      type = 'minor';
    } else if (rightFingers === 4) {
      modifierName = '7th';
      type = '7th';
    } else if (rightFingers === 5) {
      modifierName = 'High (+8ve)';
      octaveShift = 1;
    }

    const notes = this.getChordNotes(root, type, octaveShift);
    const displayName = `${root} ${modifierName}`;
    const id = `${root}_${type}_${octaveShift}`;

    return { id, displayName, notes };
  }

  getChordNotes(root, type, octaveShift) {
    const baseChords = {
      'C': { major: ['C4', 'E4', 'G4'], minor: ['C4', 'Eb4', 'G4'], '7th': ['C4', 'E4', 'G4', 'Bb4'] },
      'D': { major: ['D4', 'F#4', 'A4'], minor: ['D4', 'F4', 'A4'], '7th': ['D4', 'F#4', 'A4', 'C5'] },
      'E': { major: ['E4', 'G#4', 'B4'], minor: ['E3', 'G3', 'B3'], '7th': ['E4', 'G#4', 'B4', 'D5'] },
      'F': { major: ['F3', 'A3', 'C4'], minor: ['F3', 'Ab3', 'C4'], '7th': ['F3', 'A3', 'C4', 'Eb4'] },
      'G': { major: ['G3', 'B3', 'D4'], minor: ['G3', 'Bb3', 'D4'], '7th': ['G3', 'B3', 'D4', 'F4'] }
    };

    let notes = (baseChords[root] && baseChords[root][type]) ? [...baseChords[root][type]] : ['C4', 'E4', 'G4'];

    if (octaveShift !== 0) {
      notes = notes.map(n => {
        const letter = n.slice(0, -1);
        const oct = parseInt(n.slice(-1)) + octaveShift;
        return `${letter}${oct}`;
      });
    }

    return notes;
  }
}
