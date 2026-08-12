/* Gesture Synth AI — Music Theory
 * Pure chord/note utilities. Audio engine logic belongs in SynthEngine.js.
 */
export default class MusicTheory {
    constructor() {
        this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.frequencies = {
            C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13,
            E: 329.63, F: 349.23, "F#": 369.99, G: 392.00,
            "G#": 415.30, A: 440.00, "A#": 466.16, B: 493.88
        };
    }

    noteIndex(note) { return this.notes.indexOf(note); }

    transpose(note, semitones) {
        const index = this.noteIndex(note);
        if (index < 0) return note;
        return this.notes[(index + semitones + 120) % 12];
    }

    frequency(note) { return this.frequencies[note] ?? 440; }

    major(root) { return [root, this.transpose(root, 4), this.transpose(root, 7)]; }
    minor(root) { return [root, this.transpose(root, 3), this.transpose(root, 7)]; }
    dominant7(root) { return [root, this.transpose(root, 4), this.transpose(root, 7), this.transpose(root, 10)]; }
    major7(root) { return [root, this.transpose(root, 4), this.transpose(root, 7), this.transpose(root, 11)]; }
    sus2(root) { return [root, this.transpose(root, 2), this.transpose(root, 7)]; }
    sus4(root) { return [root, this.transpose(root, 5), this.transpose(root, 7)]; }
    diminished(root) { return [root, this.transpose(root, 3), this.transpose(root, 6)]; }
    augmented(root) { return [root, this.transpose(root, 4), this.transpose(root, 8)]; }

    build(name = "C") {
        if (name === "Mute") return [];
        if (name.endsWith("maj7")) return this.major7(name.slice(0, -4));
        if (name.endsWith("sus4")) return this.sus4(name.slice(0, -4));
        if (name.endsWith("sus2")) return this.sus2(name.slice(0, -4));
        if (name.endsWith("dim")) return this.diminished(name.slice(0, -3));
        if (name.endsWith("aug")) return this.augmented(name.slice(0, -3));
        if (name.endsWith("7")) return this.dominant7(name.slice(0, -1));
        if (name.endsWith("m")) return this.minor(name.slice(0, -1));
        return this.major(name);
    }
}
