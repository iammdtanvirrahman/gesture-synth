/* ==========================================================
   Gesture Synth AI
   audio/MusicTheory.js
========================================================== */

export default class MusicTheory {

    constructor() {

        this.notes = [
            "C","C#","D","D#","E","F",
            "F#","G","G#","A","A#","B"
        ];

        this.frequencies = {
            "C":261.63,
            "C#":277.18,
            "D":293.66,
            "D#":311.13,
            "E":329.63,
            "F":349.23,
            "F#":369.99,
            "G":392.00,
            "G#":415.30,
            "A":440.00,
            "A#":466.16,
            "B":493.88
        };

    }

    /* ==========================================
       Utilities
    ========================================== */

    noteIndex(note){

        return this.notes.indexOf(note);

    }

    transpose(note,semitones){

        let i=this.noteIndex(note);

        i=(i+semitones+12)%12;

        return this.notes[i];

    }

    frequency(note){

        return this.frequencies[note]||440;

    }

    /* ==========================================
       Major Chord
    ========================================== */

    major(root){

        return [

            root,

            this.transpose(root,4),

            this.transpose(root,7)

        ];

    }

    /* ==========================================
       Minor Chord
    ========================================== */

    minor(root){

        return [

            root,

            this.transpose(root,3),

            this.transpose(root,7)

        ];

    }

    /* ==========================================
       Seventh
    ========================================== */

    dominant7(root){

        return [

            root,

            this.transpose(root,4),

            this.transpose(root,7),

            this.transpose(root,10)

        ];

    }

    major7(root){

        return [

            root,

            this.transpose(root,4),

            this.transpose(root,7),

            this.transpose(root,11)

        ];

    }

    /* ==========================================
       Sus
    ========================================== */

    sus2(root){

        return [

            root,

            this.transpose(root,2),

            this.transpose(root,7)

        ];

    }

    sus4(root){

        return [

            root,

            this.transpose(root,5),

            this.transpose(root,7)

        ];

    }

    /* ==========================================
       Dim / Aug
    ========================================== */

    diminished(root){

        return [

            root,

            this.transpose(root,3),

            this.transpose(root,6)

        ];

    }

    augmented(root){

        return [

            root,

            this.transpose(root,4),

            this.transpose(root,8)

        ];

    }

    /* ==========================================
       Generic Parser
    ========================================== */

    build(name){

        if(name==="Mute") return [];

        if(name.endsWith("maj7"))
            return this.major7(name.replace("maj7",""));

        if(name.endsWith("sus4"))
            return this.sus4(name.replace("sus4",""));

        if(name.endsWith("sus2"))
            return this.sus2(name.replace("sus2",""));

        if(name.endsWith("7"))
            return this.dominant7(name.replace("7",""));

        if(name.endsWith("dim"))
            return this.diminished(name.replace("dim",""));

        if(name.endsWith("aug"))
            return this.augmented(name.replace("aug",""));

        if(name.endsWith("m"))
            return this.minor(name.replace("m",""));

        return this.major(name);

    }

}