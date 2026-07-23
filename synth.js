/**
 * ============================================================================
 * Guitar Synth Engine - Sound Controller using Tone.js
 * ============================================================================
 */
class GuitarSynthEngine {
  constructor() {
    this.synth = null;
    this.waveform = null;
    this.isAudioReady = false;

    this.chordMap = {
      'OPEN_PALM': { name: 'C Major', notes: ['C4', 'E4', 'G4'] },
      'FIST': { name: 'G Major', notes: ['G3', 'B3', 'D4'] },
      'PEACE': { name: 'A Minor', notes: ['A3', 'C4', 'E4'] },
      'THUMBS_UP': { name: 'F Major', notes: ['F3', 'A3', 'C4'] },
      'POINTING': { name: 'E Minor', notes: ['E3', 'G3', 'B3'] },
      'OK_SIGN': { name: 'D Minor', notes: ['D4', 'F4', 'A4'] },
      'ROCK': { name: 'Power Chord E', notes: ['E2', 'B2', 'E3'] },
      'THREE_FINGERS': { name: 'Cadd9', notes: ['C4', 'E4', 'G4', 'D5'] },
      'FOUR_FINGERS': { name: 'Am7', notes: ['A3', 'C4', 'E4', 'G4'] },
      'PINCH': { name: 'G7', notes: ['G3', 'B3', 'D4', 'F4'] }
    };
  }

  async init() {
    try {
      if (window.Tone) {
        await Tone.start();
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        this.synth = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 4,
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.2,
            release: 0.5
          }
        }).toDestination();

        this.synth.volume.value = 0;

        this.waveform = new Tone.Waveform(64);
        Tone.Destination.connect(this.waveform);

        this.isAudioReady = true;
        console.log("Audio Engine Ready!");
      }
    } catch (err) {
      console.error("Audio Engine Init Error:", err);
    }
  }

  playChord(gestureId) {
    if (!this.isAudioReady || !this.synth) return null;

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    const chord = this.chordMap[gestureId];
    if (!chord) {
      this.stopAll();
      return null;
    }

    try {
      this.synth.releaseAll();
      this.synth.triggerAttack(chord.notes);
    } catch (err) {
      console.error('Audio Playback Error:', err);
    }

    return chord;
  }

  stopAll() {
    if (this.synth && this.isAudioReady) {
      try {
        this.synth.releaseAll();
      } catch (e) {}
    }
  }

  getWaveformData() {
    return this.waveform ? this.waveform.getValue() : null;
  }
}
