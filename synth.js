/**
 * ============================================================================
 * Ambient Synth Engine - Automatic Smooth Transitions
 * ============================================================================
 */
class GuitarSynthEngine {
  constructor() {
    this.synth = null;
    this.isAudioReady = false;
    this.currentPlayingNotes = [];
  }

  async init() {
    try {
      if (window.Tone) {
        await Tone.start();
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        // একদম নরম ও সুন্দর সিন্থ সাউন্ড
        this.synth = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 6,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.15,
            decay: 0.3,
            sustain: 0.6,
            release: 1.2
          }
        }).toDestination();

        this.synth.volume.value = -3;
        this.isAudioReady = true;
      }
    } catch (err) {
      console.error("Audio Init Error:", err);
    }
  }

  playChord(notes) {
    if (!this.isAudioReady || !this.synth) return;

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    // আগের নোট অফ করে নতুন কর্ড রিলিজ করা
    this.synth.releaseAll();
    if (notes && notes.length > 0) {
      this.synth.triggerAttack(notes);
      this.currentPlayingNotes = notes;
    }
  }

  stopAll() {
    if (this.synth) {
      this.synth.releaseAll();
    }
  }
}
