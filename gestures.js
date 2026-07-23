/**
 * ============================================================================
 * Simple Finger Count & Gesture Evaluator (Eric's Gesture Synth Style)
 * ============================================================================
 */
class GestureEngine {
  constructor() {
    this.rootNotes = {
      1: { name: 'C', baseFreq: 'C4' },
      2: { name: 'D', baseFreq: 'D4' },
      3: { name: 'E', baseFreq: 'E4' },
      4: { name: 'F', baseFreq: 'F4' },
      5: { name: 'G / V', baseFreq: 'G3' }
    };
  }

  // আঙুল কতগুলো খোলা আছে তা গণনার ফাংশন
  countFingers(landmarks) {
    if (!landmarks || landmarks.length === 0) return 0;

    const wrist = landmarks[0];
    const fingerTips = [8, 12, 16, 20]; // index, middle, ring, pinky
    let count = 0;

    // ৪টি প্রধান আঙুল চেক
    fingerTips.forEach(tipIdx => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[tipIdx - 2];
      if (tip.y < pip.y) count++; // আঙুল ওপরের দিকে থাকলে
    });

    // বুড়ো আঙুল (Thumb) চেক
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    if (Math.abs(thumbTip.x - wrist.x) > Math.abs(thumbMcp.x - wrist.x)) {
      count++;
    }

    return count;
  }

  evaluateBothHands(hand1Landmarks, hand2Landmarks) {
    const hand1Fingers = this.countFingers(hand1Landmarks);
    const hand2Fingers = this.countFingers(hand2Landmarks);

    // ডিফল্ট কর্ড
    if (hand1Fingers === 0 && hand2Fingers === 0) {
      return { id: 'SILENT', displayName: 'Awaiting Gestures...', notes: [] };
    }

    // বাম হাত = রুট নোট
    const root = this.rootNotes[hand1Fingers] || { name: 'G', baseFreq: 'G3' };

    // ডান হাত = কর্ড টাইপ (২ আঙুল V = Major -8ve, ৩ আঙুল = Minor, ইত্যাদি)
    let modifierName = 'Major';
    let notes = [root.baseFreq];

    if (hand2Fingers === 2) {
      modifierName = 'Major (-8ve)';
      // V shape -> Major Chord with low octave
      notes = this.getChordNotes(root.name, 'major', -1);
    } else if (hand2Fingers === 3) {
      modifierName = 'Minor';
      notes = this.getChordNotes(root.name, 'minor', 0);
    } else if (hand2Fingers === 4) {
      modifierName = '7th Chord';
      notes = this.getChordNotes(root.name, '7th', 0);
    } else {
      modifierName = 'Major';
      notes = this.getChordNotes(root.name, 'major', 0);
    }

    const displayName = `${root.name} ${modifierName}`;
    const id = `${root.name}_${modifierName}`;

    return { id, displayName, notes };
  }

  getChordNotes(root, type, octaveShift = 0) {
    const chords = {
      'C': { major: ['C4', 'E4', 'G4'], minor: ['C4', 'Eb4', 'G4'], '7th': ['C4', 'E4', 'G4', 'Bb4'] },
      'D': { major: ['D4', 'F#4', 'A4'], minor: ['D4', 'F4', 'A4'], '7th': ['D4', 'F#4', 'A4', 'C5'] },
      'E': { major: ['E4', 'G#4', 'B4'], minor: ['E3', 'G3', 'B3'], '7th': ['E4', 'G#4', 'B4', 'D5'] },
      'F': { major: ['F3', 'A3', 'C4'], minor: ['F3', 'Ab3', 'C4'], '7th': ['F3', 'A3', 'C4', 'Eb4'] },
      'G / V': { major: ['G3', 'B3', 'D4'], minor: ['G3', 'Bb3', 'D4'], '7th': ['G3', 'B3', 'D4', 'F4'] }
    };

    let baseNotes = (chords[root] && chords[root][type]) ? chords[root][type] : ['C4', 'E4', 'G4'];

    if (octaveShift === -1) {
      // অক্টেভ এক ধাপ নামিয়ে দেওয়া (-8ve)
      baseNotes = baseNotes.map(note => {
        const noteLetter = note.slice(0, -1);
        const octave = parseInt(note.slice(-1)) - 1;
        return `${noteLetter}${octave}`;
      });
    }

    return baseNotes;
  }
}
