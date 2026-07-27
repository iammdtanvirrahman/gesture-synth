/* ==========================================================
   Gesture Synth AI
   gesture/ChordClassifier.js
========================================================== */

export default class ChordClassifier {

    constructor() {

        this.root = "C";

        this.lastChord = "C";

        this.confidence = 1;

        this.history = [];

        this.notes = [

            "C",
            "C#",
            "D",
            "D#",
            "E",
            "F",
            "F#",
            "G",
            "G#",
            "A",
            "A#",
            "B"

        ];

    }

    setRoot(root) {

        if (this.notes.includes(root)) {

            this.root = root;

        }

    }

    classify(fingers) {

        let chord = this.root;

        const count = fingers.count();

        const state = fingers.states();

        switch (count) {

            case 0:

                chord = "Mute";

                break;

            case 1:

                chord = this.root;

                break;

            case 2:

                chord = this.root + "m";

                break;

            case 3:

                chord = this.root + "7";

                break;

            case 4:

                chord = this.root + "maj7";

                break;

            case 5:

                chord = this.root + "sus4";

                break;

        }

        if (state[1] && state[2] && !state[3] && !state[4]) {

            chord = this.root + "m";

        }

        if (state[0] && state[1] && state[2] && state[3] && state[4]) {

            chord = this.root + "maj7";

        }

        if (state[1] && state[4] && !state[2]) {

            chord = this.root + "5";

        }

        this.lastChord = chord;

        this.history.push(chord);

        if (this.history.length > 20) {

            this.history.shift();

        }

        return {

            chord,

            confidence: this.confidence,

            fingers: count,

            history: this.history

        };

    }

    getCurrentChord() {

        return this.lastChord;

    }

    getHistory() {

        return this.history;

    }

}