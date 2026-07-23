/**
 * ============================================================================
 * Gesture Synth AI - Tone.js Virtual Guitar Audio Engine
 * ============================================================================
 */
class GuitarSynthEngine {
  constructor() {
    this.synth = null;
    this.waveform = null;
    this.currentChordId = null;
    this.isAudioReady = false;

    // Guitar Chords Map
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

    // Pluck Synth Engine
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 1.2,
        sustain: 0.1,
        release: 1.2
      }
    }).toDestination();

    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    this.synth.connect(reverb);

    this.waveform = new Tone.Waveform(128);
    Tone.Destination.connect(this.waveform);

    this.isAudioReady = true;
  }

  playChord(gestureId) {
    if (!this.isAudioReady) return null;
    if (this.currentChordId === gestureId) return this.chordMap[gestureId];

    this.synth.releaseAll();

    const chord = this.chordMap[gestureId];
    if (chord) {
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
