/**
 * ============================================================================
 * Optimized Ambient Synth Engine (Distortion Free & Lightweight)
 * ============================================================================
 */
class GuitarSynthEngine {
  constructor() {
    this.synth = null;
    this.limiter = null;
    this.isAudioReady = false;
    this.currentPlayingChordId = null;
  }

  async init() {
    try {
      if (window.Tone) {
        await Tone.start();
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }

        // সাউন্ড ফাটা (Clipping) বন্ধ করার জন্য Limiter
        this.limiter = new Tone.Limiter(-2).toDestination();

        // হালকা ফিল্টারসহ সফট পলিসিন্থ
        this.synth = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 4, // ওভারলোড এড়াতে ৪ নোটের লিমিট
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.5,
            release: 0.8
          }
        }).connect(this.limiter);

        this.synth.volume.value = -6; // ডিসটোরশন এড়াতে ভলিউম ব্যালেন্স
        this.isAudioReady = true;
      }
    } catch (err) {
      console.error("Audio Init Error:", err);
    }
  }

  playChord(chordId, notes) {
    if (!this.isAudioReady || !this.synth) return;

    // একই কর্ড বারবার বেজে অডিও যেন ফ্রিজ না হয়
    if (this.currentPlayingChordId === chordId) return;

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    // স্মুথ ট্রানজিশন
    this.synth.releaseAll();
    if (notes && notes.length > 0) {
      this.synth.triggerAttack(notes);
      this.currentPlayingChordId = chordId;
    }
  }

  stopAll() {
    if (this.synth) {
      this.synth.releaseAll();
      this.currentPlayingChordId = null;
    }
  }
}
