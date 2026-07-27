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
/* ==========================================================
   SynthEngine.js
   Part 2
========================================================== */

/* ======================================
    Create Voice
====================================== */

createVoice(frequency){

    const osc=this.audio.createOscillator();

    const gain=this.audio.createGain();

    osc.type=APP_CONFIG.AUDIO.waveform;

    osc.frequency.value=frequency;

    gain.gain.value=0;

    osc.connect(gain);

    gain.connect(this.filter);

    osc.start();

    return{

        osc,

        gain

    };

}

/* ======================================
    ADSR Attack
====================================== */

attack(gain){

    const now=this.audio.currentTime;

    gain.gain.cancelScheduledValues(now);

    gain.gain.setValueAtTime(0,now);

    gain.gain.linearRampToValueAtTime(

        0.25,

        now+APP_CONFIG.AUDIO.attack

    );

}

/* ======================================
    ADSR Release
====================================== */

release(gain){

    const now=this.audio.currentTime;

    gain.gain.cancelScheduledValues(now);

    gain.gain.setValueAtTime(

        gain.gain.value,

        now

    );

    gain.gain.linearRampToValueAtTime(

        0,

        now+APP_CONFIG.AUDIO.release

    );

}

/* ======================================
    Stop Voices
====================================== */

stopChord(){

    this.gains.forEach(g=>{

        this.release(g);

    });

    setTimeout(()=>{

        this.oscillators.forEach(o=>{

            try{

                o.stop();

                o.disconnect();

            }

            catch(e){}

        });

        this.oscillators=[];

        this.gains=[];

        this.activeChord=[];

    },400);

}

/* ======================================
    Play Chord
====================================== */

playChord(chordName){

    if(!this.ready) return;

    if(chordName==="Mute"){

        this.stopChord();

        return;

    }

    if(this.activeChord.join(",")===chordName)

        return;

    this.stopChord();

    const notes=

        this.theory.build(chordName);

    this.activeChord=[chordName];

    notes.forEach(note=>{

        const freq=

            this.theory.frequency(note);

        const voice=

            this.createVoice(freq);

        this.oscillators.push(

            voice.osc

        );

        this.gains.push(

            voice.gain

        );

        this.attack(

            voice.gain

        );

    });

}

/* ======================================
    Glide
====================================== */

setDetune(value){

    this.oscillators.forEach(osc=>{

        osc.detune.linearRampToValueAtTime(

            value,

            this.audio.currentTime+.05

        );

    });

}

/* ======================================
    Panic
====================================== */

panic(){

    this.stopChord();

}