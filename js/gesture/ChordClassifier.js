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

            "C","C#","D","D#","E","F",

            "F#","G","G#","A","A#","B"

        ];

    }

    /* ======================================
        Root Note
    ====================================== */

    setRoot(root) {

        if (this.notes.includes(root)) {

            this.root = root;

        }

    }

    /* ======================================
        Classify
    ====================================== */

    classify(detector) {

        const count = detector.count();

        const state = detector.states();

        let chord = this.root;

        /* -------- Priority Gestures -------- */

        if (detector.fist()) {

            chord = "Mute";

        }

        else if (detector.openPalm()) {

            chord = this.root + "maj7";

        }

        else if (detector.peace()) {

            chord = this.root + "m";

        }

        else if (detector.rock()) {

            chord = this.root + "7";

        }

        else {

            switch (count) {

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

                default:

                    chord = "Mute";

            }

        }

        /* ======================================
            Confidence
        ====================================== */

        this.confidence =

            Math.min(

                1,

                0.6 +

                count * 0.08

            );

        /* ======================================
            History
        ====================================== */

        if (

            this.lastChord !== chord

        ) {

            this.history.push(chord);

            if (

                this.history.length > 20

            ) {

                this.history.shift();

            }

        }

        this.lastChord = chord;

        return {

            chord,

            confidence: this.confidence,

            fingers: count,

            history: [...this.history]

        };

    }

    /* ======================================
        Current
    ====================================== */

    getCurrentChord() {

        return this.lastChord;

    }

    getHistory() {

        return [...this.history];

    }

    /* ======================================
        Reset
    ====================================== */

    reset() {

        this.lastChord = this.root;

        this.history = [];

        this.confidence = 1;

    }

}
