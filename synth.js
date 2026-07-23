/**
 * ============================================================================
 * Guitar Synth Engine - Tone.js Polyphonic Sound Synthesizer
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
      'POINTING': { name: 'E Minor', notes: ['E3', 'G3', 'B3'] },
      'THREE_FINGERS': { name: 'Cadd9', notes: ['C4', 'E4', 'G4', 'D5'] },
      'ROCK': { name: 'Power Chord E', notes: ['E2', 'B2', 'E3'] }
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
            attack: 0.02,
            decay: 0.4,
            sustain: 0.1,
            release: 0.8
          }
        }).toDestination();

        this.synth.volume.value = 2;

        this.waveform = new Tone.Waveform(64);
        Tone.Destination.connect(this.waveform);

        this.isAudioReady = true;
        console.log("Audio Engine Ready!");
      }
    } catch (err) {
      console.error("Audio Init Error:", err);
    }
  }

  strumChord(gestureId) {
    if (!this.isAudioReady || !this.synth) return null;

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    const chord = this.chordMap[gestureId] || this.chordMap['OPEN_PALM'];
    
    try {
      this.synth.triggerAttackRelease(chord.notes, '0.6');
    } catch (err) {
      console.error('Strum Error:', err);
    }

    return chord;
  }

  getWaveformData() {
    return this.waveform ? this.waveform.getValue() : null;
  }
}
